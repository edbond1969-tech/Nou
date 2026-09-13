import { useState } from 'react';
import { Equipment, EquipmentStatus } from '../types';
import {
  Search,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  ArrowRightLeft,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface EquipmentViewProps {
  equipment: Equipment[];
  onOpenAddModal: () => void;
  onEditEquipment: (item: Equipment) => void;
  onDeleteEquipment: (id: number) => void;
  onDeleteAllEquipment: () => void;
  onOpenImportModal: () => void;
  onOpenExportModal: () => void;
  onQuickIssue: (item: Equipment) => void;
  onUpdateQuantity: (id: number, delta: number) => void;
}

export default function EquipmentView({
  equipment,
  onOpenAddModal,
  onEditEquipment,
  onDeleteEquipment,
  onDeleteAllEquipment,
  onOpenImportModal,
  onOpenExportModal,
  onQuickIssue,
  onUpdateQuantity,
}: EquipmentViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'issued' | 'consumable'>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredItems = equipment.filter((item) => {
    // Status filter
    if (statusFilter === 'available' && item.quantity <= 0) return false;
    if (statusFilter === 'issued' && item.quantity > 0) return false;
    if (statusFilter === 'consumable' && !item.isConsumable) return false;

    // Search filter
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.inventoryNumber.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.model.toLowerCase().includes(q) ||
      item.serialNumber.toLowerCase().includes(q)
    );
  });

  const availableCount = equipment.filter((e) => e.quantity > 0).length;
  const issuedCount = equipment.filter((e) => e.quantity === 0).length;
  const consumableCount = equipment.filter((e) => e.isConsumable).length;

  return (
    <div className="space-y-5">
      {/* Action & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Каталог оборудования и материалов
            </h2>
            <p className="text-xs text-slate-500">
              Полный перечень материальных ценностей, приборов, инструментов и расходников
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              id="btn-add-equipment-catalog"
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Добавить
            </button>

            <button
              id="btn-import-equipment-catalog"
              type="button"
              onClick={onOpenImportModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Импорт CSV
            </button>

            <button
              id="btn-export-equipment-catalog"
              type="button"
              onClick={onOpenExportModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Экспорт CSV
            </button>

            <button
              id="btn-clear-all-equipment"
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer ml-auto"
              title="Очистить все оборудование из базы"
            >
              <Trash2 className="w-4 h-4" />
              Очистить базу
            </button>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по инв. номеру, названию, модели или S/N..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Все ({equipment.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('available')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'available'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              В наличии ({availableCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('issued')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'issued'
                  ? 'bg-amber-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Выдано ({issuedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('consumable')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'consumable'
                  ? 'bg-purple-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Расходники ({consumableCount})
            </button>
          </div>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-red-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Удалить всё оборудование?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Все {equipment.length} записей будут безвозвратно удалены из базы данных, чтобы вы могли загрузить новые данные.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAllEquipment();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
              >
                Да, удалить всё
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-semibold text-slate-800">Оборудование не найдено</p>
            <p className="text-xs text-slate-400 mt-1">
              Попробуйте изменить поисковый запрос или фильтры
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Инв. номер</th>
                  <th className="py-3 px-4">Наименование</th>
                  <th className="py-3 px-4">Модель</th>
                  <th className="py-3 px-4">Серийный номер</th>
                  <th className="py-3 px-4">Остаток</th>
                  <th className="py-3 px-4">Статус</th>
                  <th className="py-3 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* ТЕМНО-СИНИЙ цвет инв. номера по ТЗ DeepSeek chat (message 31) */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-blue-900 tracking-wide text-xs bg-blue-50/80 border border-blue-200 px-2.5 py-1 rounded">
                        {item.inventoryNumber}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-sm">
                        {item.name}
                      </div>
                      {item.isConsumable && (
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                          Расходный материал
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-xs text-slate-700 truncate" title={item.model}>
                        {item.model || <span className="text-slate-300 italic">не указана</span>}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-600 text-xs">
                        {item.serialNumber || <span className="text-slate-300 italic">б/н</span>}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold text-sm ${
                            item.quantity > 0 ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {item.quantity}
                        </span>
                        <span className="text-slate-500 text-xs">{item.unit}</span>

                        {/* Quick adjust buttons */}
                        <div className="flex items-center ml-2 border border-slate-200 rounded">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            disabled={item.quantity <= 0}
                            className="px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            title="Уменьшить остаток на 1"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                            title="Увеличить остаток на 1"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.quantity > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.quantity > 0 ? 'В наличии' : 'Выдано'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.quantity > 0 && (
                          <button
                            type="button"
                            onClick={() => onQuickIssue(item)}
                            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Выдать сотруднику"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditEquipment(item)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Редактировать"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEquipment(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Удалить из каталога"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
