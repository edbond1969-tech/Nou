import { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import {
  Equipment,
  Employee,
  HistoryRecord,
  IssuedItemTracking,
  ActiveTab,
} from './types';
import {
  loadEquipment,
  saveEquipment,
  loadEmployees,
  saveEmployees,
  loadHistory,
  saveHistory,
  computeIssuedItems,
  resetToInitialData,
} from './utils/storage';
import { initAuth, googleSignIn, logoutGoogle } from './utils/googleDrive';
import Header from './components/Header';
import MainView from './components/MainView';
import EquipmentView from './components/EquipmentView';
import EmployeesView from './components/EmployeesView';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';

// Modals
import IssueModal from './components/IssueModal';
import ReturnModal from './components/ReturnModal';
import EquipmentModal from './components/EquipmentModal';
import EmployeeModal from './components/EmployeeModal';
import ImportModal from './components/ImportModal';
import ExportModal from './components/ExportModal';
import ArchiveModal from './components/ArchiveModal';
import GoogleDriveModal from './components/GoogleDriveModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('main');

  // Google Drive & Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
      }
    } catch (err: any) {
      alert(err.message || 'Ошибка входа в Google аккаунт');
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logoutGoogle();
      setCurrentUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Core Data State backed by localStorage
  const [equipment, setEquipment] = useState<Equipment[]>(() => loadEquipment());
  const [employees, setEmployees] = useState<Employee[]>(() => loadEmployees());
  const [history, setHistory] = useState<HistoryRecord[]>(() => loadHistory());

  // Derived issued items
  const issuedItems = computeIssuedItems(history);

  // Sync to storage when updated
  useEffect(() => {
    saveEquipment(equipment);
  }, [equipment]);

  useEffect(() => {
    saveEmployees(employees);
  }, [employees]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // Modal Visibility States
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [returnSelectedItem, setReturnSelectedItem] = useState<IssuedItemTracking | null>(null);

  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'equipment' | 'employees' | 'history' | 'history_period'>('equipment');

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  // Formatter for current datetime
  const getCurrentDateString = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // 1. Issue Transaction
  const handleIssue = (
    equipmentId: number,
    employeeName: string,
    issueQuantity: number,
    note: string
  ) => {
    const item = equipment.find((e) => e.id === equipmentId);
    if (!item) return;

    // Deduct warehouse quantity
    const updatedEquipment = equipment.map((e) => {
      if (e.id === equipmentId) {
        const newQty = Math.max(0, e.quantity - issueQuantity);
        return {
          ...e,
          quantity: newQty,
          status: newQty === 0 ? ('issued' as const) : e.status,
        };
      }
      return e;
    });
    setEquipment(updatedEquipment);

    // Create history record
    const newRecord: HistoryRecord = {
      id: Date.now(),
      equipmentId: item.id,
      inventoryNumber: item.inventoryNumber,
      equipmentName: item.name,
      employeeName,
      action: 'Выдача',
      quantity: issueQuantity,
      date: getCurrentDateString(),
      note: note || undefined,
    };
    setHistory((prev) => [newRecord, ...prev]);
  };

  // 2. Return Transaction
  const handleReturn = (
    equipmentId: number,
    employeeName: string,
    returnQuantity: number,
    note: string
  ) => {
    const item = equipment.find((e) => e.id === equipmentId);
    const itemName = item ? item.name : 'Оборудование';
    const invNumber = item ? item.inventoryNumber : 'Б/Н';

    // Increase warehouse quantity
    const updatedEquipment = equipment.map((e) => {
      if (e.id === equipmentId) {
        return {
          ...e,
          quantity: e.quantity + returnQuantity,
          status: 'available' as const,
        };
      }
      return e;
    });
    setEquipment(updatedEquipment);

    // Add return history record
    const newRecord: HistoryRecord = {
      id: Date.now(),
      equipmentId,
      inventoryNumber: invNumber,
      equipmentName: itemName,
      employeeName,
      action: 'Возврат',
      quantity: returnQuantity,
      date: getCurrentDateString(),
      note: note || undefined,
    };
    setHistory((prev) => [newRecord, ...prev]);
  };

  // 3. Equipment CRUD
  const handleSaveEquipment = (data: Omit<Equipment, 'id'>, id?: number) => {
    if (id) {
      setEquipment((prev) =>
        prev.map((item) => (item.id === id ? { ...data, id } : item))
      );
    } else {
      const newItem: Equipment = {
        ...data,
        id: Date.now(),
      };
      setEquipment((prev) => [newItem, ...prev]);

      // Add receipt history
      const historyRec: HistoryRecord = {
        id: Date.now(),
        equipmentId: newItem.id,
        inventoryNumber: newItem.inventoryNumber,
        equipmentName: newItem.name,
        employeeName: 'Склад (Поступление)',
        action: 'Поступление',
        quantity: newItem.quantity,
        date: getCurrentDateString(),
        note: 'Оприходование в базу данных',
      };
      setHistory((prev) => [historyRec, ...prev]);
    }
  };

  const handleDeleteEquipment = (id: number) => {
    setEquipment((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDeleteAllEquipment = () => {
    setEquipment([]);
  };

  const handleUpdateQuantity = (id: number, delta: number) => {
    setEquipment((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          return {
            ...item,
            quantity: newQty,
            status: newQty === 0 ? 'issued' : 'available',
          };
        }
        return item;
      })
    );
  };

  // 4. Employee CRUD
  const handleSaveEmployee = (data: Omit<Employee, 'id'>, id?: number) => {
    if (id) {
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? { ...data, id } : emp))
      );
    } else {
      const newEmp: Employee = {
        ...data,
        id: Date.now(),
      };
      setEmployees((prev) => [...prev, newEmp]);
    }
  };

  const handleDeleteEmployee = (id: number) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
  };

  // 5. CSV Import
  const handleImportEquipment = (items: Equipment[], replace: boolean) => {
    if (replace) {
      setEquipment(items);
    } else {
      setEquipment((prev) => [...prev, ...items]);
    }

    // Add batch history entry
    const historyRec: HistoryRecord = {
      id: Date.now(),
      equipmentId: items[0]?.id || 0,
      inventoryNumber: 'CSV-ИМПОРТ',
      equipmentName: `Пакетный импорт: ${items.length} позиций`,
      employeeName: 'Администратор системы',
      action: 'Поступление',
      quantity: items.reduce((sum, it) => sum + it.quantity, 0),
      date: getCurrentDateString(),
      note: replace ? 'Полная перезапись базы из CSV' : 'Импорт из файла CSV',
    };
    setHistory((prev) => [historyRec, ...prev]);
  };

  // 6. History Archive Cleanup
  const handleArchiveConfirm = (deletedIds: number[]) => {
    const set = new Set(deletedIds);
    setHistory((prev) => prev.filter((rec) => !set.has(rec.id)));
  };

  // 7. Backup restore & Reset
  const handleRestoreBackup = (data: {
    equipment: Equipment[];
    employees: Employee[];
    history: HistoryRecord[];
  }) => {
    setEquipment(data.equipment);
    setEmployees(data.employees);
    setHistory(data.history);
  };

  const handleResetToDefaults = () => {
    resetToInitialData();
    setEquipment(loadEquipment());
    setEmployees(loadEmployees());
    setHistory(loadHistory());
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        equipment={equipment}
        employees={employees}
        issuedItems={issuedItems}
        onOpenIssueModal={() => setIsIssueOpen(true)}
        onOpenReturnModal={() => {
          setReturnSelectedItem(null);
          setIsReturnOpen(true);
        }}
        currentUser={currentUser}
        onOpenGoogleDriveModal={() => setIsGoogleDriveModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'main' && (
          <MainView
            equipment={equipment}
            employees={employees}
            history={history}
            issuedItems={issuedItems}
            onOpenIssueModal={() => setIsIssueOpen(true)}
            onOpenReturnModal={(item) => {
              setReturnSelectedItem(item || null);
              setIsReturnOpen(true);
            }}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onOpenAddEquipment={() => {
              setEditingEquipment(null);
              setIsEquipmentModalOpen(true);
            }}
            onOpenAddEmployee={() => {
              setEditingEmployee(null);
              setIsEmployeeModalOpen(true);
            }}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'equipment' && (
          <EquipmentView
            equipment={equipment}
            onOpenAddModal={() => {
              setEditingEquipment(null);
              setIsEquipmentModalOpen(true);
            }}
            onEditEquipment={(item) => {
              setEditingEquipment(item);
              setIsEquipmentModalOpen(true);
            }}
            onDeleteEquipment={handleDeleteEquipment}
            onDeleteAllEquipment={handleDeleteAllEquipment}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onOpenExportModal={() => {
              setExportType('equipment');
              setIsExportModalOpen(true);
            }}
            onQuickIssue={(item) => {
              setIsIssueOpen(true);
            }}
            onUpdateQuantity={handleUpdateQuantity}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeesView
            employees={employees}
            issuedItems={issuedItems}
            onOpenAddEmployee={() => {
              setEditingEmployee(null);
              setIsEmployeeModalOpen(true);
            }}
            onEditEmployee={(emp) => {
              setEditingEmployee(emp);
              setIsEmployeeModalOpen(true);
            }}
            onDeleteEmployee={handleDeleteEmployee}
            onIssueToEmployee={(emp) => {
              setIsIssueOpen(true);
            }}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onOpenExportModal={() => {
              setExportType('history');
              setIsExportModalOpen(true);
            }}
            onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            equipment={equipment}
            employees={employees}
            history={history}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onOpenAddEmployee={() => {
              setEditingEmployee(null);
              setIsEmployeeModalOpen(true);
            }}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onOpenExportModal={(type) => {
              setExportType(type);
              setIsExportModalOpen(true);
            }}
            onOpenArchiveModal={() => setIsArchiveModalOpen(true)}
            onDeleteAllEquipment={handleDeleteAllEquipment}
            onRestoreBackup={handleRestoreBackup}
            onResetToDefaults={handleResetToDefaults}
            currentUser={currentUser}
            onOpenGoogleDriveModal={() => setIsGoogleDriveModalOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <IssueModal
        isOpen={isIssueOpen}
        onClose={() => setIsIssueOpen(false)}
        equipment={equipment}
        employees={employees}
        onIssue={handleIssue}
        onOpenAddEmployee={() => {
          setIsIssueOpen(false);
          setEditingEmployee(null);
          setIsEmployeeModalOpen(true);
        }}
      />

      <ReturnModal
        isOpen={isReturnOpen}
        onClose={() => {
          setIsReturnOpen(false);
          setReturnSelectedItem(null);
        }}
        issuedItems={issuedItems}
        onReturn={handleReturn}
        preselectedItem={returnSelectedItem}
      />

      <EquipmentModal
        isOpen={isEquipmentModalOpen}
        onClose={() => {
          setIsEquipmentModalOpen(false);
          setEditingEquipment(null);
        }}
        onSave={handleSaveEquipment}
        editingItem={editingEquipment}
      />

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        editingEmployee={editingEmployee}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportEquipment={handleImportEquipment}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        equipment={equipment}
        employees={employees}
        history={history}
        initialType={exportType}
      />

      <ArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        history={history}
        onArchiveConfirm={handleArchiveConfirm}
      />

      <GoogleDriveModal
        isOpen={isGoogleDriveModalOpen}
        onClose={() => setIsGoogleDriveModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
        equipment={equipment}
        employees={employees}
        history={history}
        onRestoreBackup={handleRestoreBackup}
        onImportEquipment={handleImportEquipment}
      />
    </div>
  );
}
