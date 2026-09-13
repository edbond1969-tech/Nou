import { ActiveTab, Equipment, Employee, IssuedItemTracking } from '../types';
import { type User } from 'firebase/auth';
import { Package, Users, History, Settings, CheckCircle2, ArrowRightLeft, Boxes, Cloud } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  equipment: Equipment[];
  employees: Employee[];
  issuedItems: IssuedItemTracking[];
  onOpenIssueModal: () => void;
  onOpenReturnModal: () => void;
  currentUser?: User | null;
  onOpenGoogleDriveModal?: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  equipment,
  employees,
  issuedItems,
  onOpenIssueModal,
  onOpenReturnModal,
  currentUser,
  onOpenGoogleDriveModal,
}: HeaderProps) {
  const totalStockUnits = equipment.reduce((sum, item) => sum + item.quantity, 0);
  const totalIssuedUnits = issuedItems.reduce((sum, item) => sum + item.issuedQuantity, 0);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-sm">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Управление оборудованием
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                Склад & Учёт
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Выдача сотрудникам, приёмка, инвентаризация и экспорт отчётов
            </p>
          </div>
        </div>

        {/* Quick Actions & Metric Summary */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            id="btn-header-issue"
            type="button"
            onClick={onOpenIssueModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Выдать оборудование
          </button>
          <button
            id="btn-header-return"
            type="button"
            onClick={onOpenReturnModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Принять возврат
          </button>
          {onOpenGoogleDriveModal && (
            <button
              id="btn-header-google-drive"
              type="button"
              onClick={onOpenGoogleDriveModal}
              title="Резервное копирование и синхронизация с Google Диском"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:border-blue-600 hover:bg-blue-50 text-slate-700 hover:text-blue-800 text-xs sm:text-sm font-medium rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Cloud className="w-4 h-4 text-blue-600" />
              {currentUser ? (
                <span className="flex items-center gap-1.5 max-w-[130px] truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                  <span className="truncate">{currentUser.displayName?.split(' ')[0] || 'Диск'}</span>
                </span>
              ) : (
                <span>Google Диск</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="bg-slate-50 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Позиций в каталоге:</span>
              <span className="font-semibold text-slate-900">{equipment.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">На складе (единиц):</span>
              <span className="font-semibold text-emerald-700">{totalStockUnits} шт.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">На руках у сотрудников:</span>
              <span className="font-semibold text-amber-700">{totalIssuedUnits} шт.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Сотрудников:</span>
              <span className="font-semibold text-slate-900">{employees.length} чел.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 border-b border-transparent overflow-x-auto py-1">
          <button
            id="nav-tab-main"
            type="button"
            onClick={() => setActiveTab('main')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'main'
                ? 'border-blue-700 text-blue-800'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Выдача и приём
          </button>

          <button
            id="nav-tab-equipment"
            type="button"
            onClick={() => setActiveTab('equipment')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'equipment'
                ? 'border-blue-700 text-blue-800'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Package className="w-4 h-4" />
            Оборудование
            <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded text-[11px]">
              {equipment.length}
            </span>
          </button>

          <button
            id="nav-tab-employees"
            type="button"
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'employees'
                ? 'border-blue-700 text-blue-800'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Сотрудники
            <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded text-[11px]">
              {employees.length}
            </span>
          </button>

          <button
            id="nav-tab-history"
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-blue-700 text-blue-800'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <History className="w-4 h-4" />
            История
          </button>

          <button
            id="nav-tab-settings"
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'border-blue-700 text-blue-800'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            Настройки
          </button>
        </nav>
      </div>
    </header>
  );
}
