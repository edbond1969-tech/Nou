import { Equipment, Employee, HistoryRecord, IssuedItemTracking } from '../types';
import {
  ArrowRightLeft,
  CheckCircle2,
  PackagePlus,
  Upload,
  UserPlus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  RotateCcw,
  Edit2,
} from 'lucide-react';
import { useState } from 'react';

interface MainViewProps {
  equipment: Equipment[];
  employees: Employee[];
  history: HistoryRecord[];
  issuedItems: IssuedItemTracking[];
  onOpenIssueModal: () => void;
  onOpenReturnModal: (item?: IssuedItemTracking) => void;
  onOpenImportModal: () => void;
  onOpenAddEquipment: () => void;
  onOpenAddEmployee: () => void;
  onNavigateToTab: (tab: 'equipment' | 'employees' | 'history' | 'settings') => void;
  onEditEquipment?: (item: Equipment) => void;
}

export default function MainView({
  equipment,
  employees,
  history,
  issuedItems,
  onOpenIssueModal,
  onOpenReturnModal,
  onOpenImportModal,
  onOpenAddEquipment,
  onOpenAddEmployee,
  onNavigateToTab,
  onEditEquipment,
}: MainViewProps) {
  const [issuedSearch, setIssuedSearch] = useState('');

  const filteredIssued = issuedItems.filter(
    (item) =>
      item.inventoryNumber.toLowerCase().includes(issuedSearch.toLowerCase()) ||
      item.equipmentName.toLowerCase().includes(issuedSearch.toLowerCase()) ||
      item.employeeName.toLowerCase().includes(issuedSearch.toLowerCase()) ||
      item.model.toLowerCase().includes(issuedSearch.toLowerCase())
  );

  const recentHistory = [...history]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Fast Action Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          id="tile-issue"
          type="button"
          onClick={onOpenIssueModal}
          className="group p-5 bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer border border-blue-600"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-base">Выдать оборудование</h3>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Оформить выдачу сотруднику под роспись
            </p>
          </div>
        </button>

        <button
          id="tile-return"
          type="button"
          onClick={() => onOpenReturnModal()}
          className="group p-5 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer border border-emerald-500"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <ArrowDownLeft className="w-4 h-4 text-emerald-200 group-hover:-translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-base">Принять на склад</h3>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              Возврат инструмента от сотрудника
            </p>
          </div>
        </button>

        <button
          id="tile-import"
          type="button"
          onClick={onOpenImportModal}
          className="group p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-blue-400 hover:shadow-sm transition-all text-left flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-slate-900 text-base">Импорт из CSV</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Загрузка каталога с автоматическим парсером
            </p>
          </div>
        </button>

        <button
          id="tile-add-equipment"
          type="button"
          onClick={onOpenAddEquipment}
          className="group p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-blue-400 hover:shadow-sm transition-all text-left flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <PackagePlus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-slate-900 text-base">+ Новая единица</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Добавить прибор, сканер или инструмент
            </p>
          </div>
        </button>
      </div>

      {/* Currently Issued Items Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Оборудование на руках у сотрудников
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                {issuedItems.length} поз.
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Актуальный список выданного инструмента и техники с возможностью быстрого возврата
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={issuedSearch}
              onChange={(e) => setIssuedSearch(e.target.value)}
              placeholder="Поиск по инв. №, ФИО..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-hidden"
            />
          </div>
        </div>

        {issuedItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-800">Все приборы на складе</p>
            <p className="text-xs text-slate-400 mt-1">
              На данный момент за сотрудниками не числится выданного оборудования
            </p>
          </div>
        ) : filteredIssued.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Ничего не найдено по запросу «{issuedSearch}»
          </div>
        ) : (
          <>
            {/* Mobile View: Issued Cards (Screens < 768px) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredIssued.map((item, idx) => {
                const eqItem = equipment.find(
                  (e) => e.inventoryNumber === item.inventoryNumber || e.id === item.equipmentId
                );
                return (
                  <div key={idx} className="p-4 space-y-2.5 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center justify-between">
                      {eqItem && onEditEquipment ? (
                        <button
                          type="button"
                          onClick={() => onEditEquipment(eqItem)}
                          className="font-bold text-blue-900 tracking-wide text-xs bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                          title="Редактировать карточку оборудования"
                        >
                          {item.inventoryNumber}
                        </button>
                      ) : (
                        <span className="font-bold text-blue-900 tracking-wide text-xs bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                          {item.inventoryNumber}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                        {item.issuedQuantity} шт.
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <div
                          onClick={() => eqItem && onEditEquipment && onEditEquipment(eqItem)}
                          className={`font-semibold text-slate-900 text-sm ${
                            eqItem && onEditEquipment ? 'hover:text-blue-700 cursor-pointer' : ''
                          }`}
                        >
                          {item.equipmentName}
                        </div>
                        {eqItem && onEditEquipment && (
                          <button
                            type="button"
                            onClick={() => onEditEquipment(eqItem)}
                            className="p-1 text-slate-400 hover:text-blue-700 rounded transition-colors cursor-pointer"
                            title="Редактировать карточку оборудования"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.model || 'Модель не указана'}
                        {item.serialNumber ? ` • S/N: ${item.serialNumber}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400">У сотрудника: </span>
                        <span className="font-semibold text-slate-800">{item.employeeName}</span>
                      </div>
                      <div className="text-slate-400">{item.lastIssuedDate}</div>
                    </div>

                    <div className="pt-1 flex items-center justify-end gap-2">
                      {eqItem && onEditEquipment && (
                        <button
                          type="button"
                          onClick={() => onEditEquipment(eqItem)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Карточка
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenReturnModal(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Принять возврат
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Table (Screens >= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Инв. номер</th>
                    <th className="py-3 px-4">Оборудование / Модель</th>
                    <th className="py-3 px-4">Сотрудник</th>
                    <th className="py-3 px-4">Выдано</th>
                    <th className="py-3 px-4">Дата выдачи</th>
                    <th className="py-3 px-4 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredIssued.map((item, idx) => {
                    const eqItem = equipment.find(
                      (e) => e.inventoryNumber === item.inventoryNumber || e.id === item.equipmentId
                    );
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          {/* ТЕМНО-СИНИЙ цвет инвентарного номера по ТЗ */}
                          {eqItem && onEditEquipment ? (
                            <button
                              type="button"
                              onClick={() => onEditEquipment(eqItem)}
                              className="font-bold text-blue-900 tracking-wide text-xs bg-blue-50 border border-blue-200 px-2 py-1 rounded hover:bg-blue-100 transition-colors cursor-pointer text-left"
                              title="Редактировать карточку оборудования"
                            >
                              {item.inventoryNumber}
                            </button>
                          ) : (
                            <span className="font-bold text-blue-900 tracking-wide text-xs bg-blue-50 border border-blue-200 px-2 py-1 rounded">
                              {item.inventoryNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div
                            onClick={() => eqItem && onEditEquipment && onEditEquipment(eqItem)}
                            className={`font-semibold text-slate-900 text-sm ${
                              eqItem && onEditEquipment ? 'hover:text-blue-700 cursor-pointer' : ''
                            }`}
                            title={eqItem && onEditEquipment ? 'Редактировать карточку' : undefined}
                          >
                            {item.equipmentName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {item.model || 'Модель не указана'}
                            {item.serialNumber ? ` • S/N: ${item.serialNumber}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {item.employeeName}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                            {item.issuedQuantity} шт.
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {item.lastIssuedDate}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {eqItem && onEditEquipment && (
                              <button
                                type="button"
                                onClick={() => onEditEquipment(eqItem)}
                                className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Редактировать карточку оборудования"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onOpenReturnModal(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg border border-emerald-300 text-xs transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Принять
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Recent Activity Log Preview */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Последние операции
            </h2>
            <p className="text-xs text-slate-500">
              Журнал приёмки, выдачи и движения материальных ценностей
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab('history')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
          >
            Вся история →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentHistory.map((rec) => (
            <div
              key={rec.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60 transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                    rec.action === 'Выдача'
                      ? 'bg-blue-100 text-blue-900'
                      : rec.action === 'Возврат'
                      ? 'bg-emerald-100 text-emerald-900'
                      : rec.action === 'Поступление'
                      ? 'bg-purple-100 text-purple-900'
                      : 'bg-red-100 text-red-900'
                  }`}
                >
                  {rec.action}
                </span>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-blue-900 text-xs">
                      {rec.inventoryNumber}
                    </span>
                    <span className="text-xs text-slate-900 font-semibold">
                      {rec.equipmentName}
                    </span>
                    <span className="text-xs text-slate-500">
                      • {rec.quantity} шт.
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Сотрудник: <strong className="text-slate-700">{rec.employeeName}</strong>
                    {rec.note ? ` — «${rec.note}»` : ''}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 sm:text-right shrink-0">
                {rec.date}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
