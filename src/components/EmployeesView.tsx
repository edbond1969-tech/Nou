import { useState } from 'react';
import { Employee, IssuedItemTracking } from '../types';
import {
  UserPlus,
  Search,
  Phone,
  Mail,
  Building,
  Package,
  ArrowRightLeft,
  Edit2,
  Trash2,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

interface EmployeesViewProps {
  employees: Employee[];
  issuedItems: IssuedItemTracking[];
  onOpenAddEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: number) => void;
  onIssueToEmployee: (employee: Employee) => void;
  onReturnFromEmployee?: (employee: Employee) => void;
}

export default function EmployeesView({
  employees,
  issuedItems,
  onOpenAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onIssueToEmployee,
  onReturnFromEmployee,
}: EmployeesViewProps) {
  const [search, setSearch] = useState('');

  const filtered = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.position.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase()) ||
      emp.phone.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Top Header & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Сотрудники предприятия
          </h2>
          <p className="text-xs text-slate-500">
            Ответственные лица, инженеры, техники и учёт числящегося за ними оборудования
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по ФИО, отделу..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-hidden"
            />
          </div>

          <button
            id="btn-add-employee-view"
            type="button"
            onClick={onOpenAddEmployee}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Добавить
          </button>
        </div>
      </div>

      {/* Employees Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <p className="text-sm font-semibold text-slate-800">Сотрудники не найдены</p>
          <p className="text-xs text-slate-400 mt-1">
            Добавьте нового сотрудника или измените поисковый фильтр
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp) => {
            const empItems = issuedItems.filter((item) => item.employeeName === emp.name);
            const totalItemsCount = empItems.reduce((sum, item) => sum + item.issuedQuantity, 0);

            return (
              <div
                key={emp.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{emp.name}</h3>
                      <div className="text-xs font-medium text-blue-700 mt-0.5">
                        {emp.position || 'Должность не указана'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditEmployee(emp)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Редактировать"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEmployee(emp.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                    {emp.department && (
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{emp.department}</span>
                      </div>
                    )}
                    {emp.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`tel:${emp.phone}`} className="hover:text-blue-700">
                          {emp.phone}
                        </a>
                      </div>
                    )}
                    {emp.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`mailto:${emp.email}`} className="hover:text-blue-700 truncate">
                          {emp.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Currently Assigned Items */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-blue-700" />
                        На руках у сотрудника:
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                          totalItemsCount > 0
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {totalItemsCount} шт.
                      </span>
                    </div>

                    {empItems.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic">
                        Оборудование не выдавалось
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {empItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-blue-900 mr-1.5">
                                {item.inventoryNumber}
                              </span>
                              <span className="text-slate-700 truncate">
                                {item.equipmentName}
                              </span>
                            </div>
                            <span className="shrink-0 font-semibold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {item.issuedQuantity} шт.
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onIssueToEmployee(emp)}
                    className="w-full flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Выдать прибор
                  </button>

                  {totalItemsCount > 0 && onReturnFromEmployee && (
                    <button
                      type="button"
                      onClick={() => onReturnFromEmployee(emp)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                      title="Принять возврат числящегося оборудования"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                      Принять возврат ({totalItemsCount})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
