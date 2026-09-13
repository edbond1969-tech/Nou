import { useState } from 'react';
import { HistoryRecord, HistoryAction } from '../types';
import {
  Search,
  Download,
  Archive,
  Filter,
  Calendar,
  ArrowRightLeft,
  CheckCircle2,
  PackagePlus,
  Trash2,
} from 'lucide-react';

interface HistoryViewProps {
  history: HistoryRecord[];
  onOpenExportModal: () => void;
  onOpenArchiveModal: () => void;
}

export default function HistoryView({
  history,
  onOpenExportModal,
  onOpenArchiveModal,
}: HistoryViewProps) {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredHistory = history
    .filter((rec) => {
      if (actionFilter !== 'all' && rec.action !== actionFilter) return false;

      const recDate = rec.date.split(' ')[0];
      if (startDate && recDate < startDate) return false;
      if (endDate && recDate > endDate) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        rec.inventoryNumber.toLowerCase().includes(q) ||
        rec.equipmentName.toLowerCase().includes(q) ||
        rec.employeeName.toLowerCase().includes(q) ||
        (rec.note && rec.note.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              История операций и движения оборудования
            </h2>
            <p className="text-xs text-slate-500">
              Полный аудит выдачи, приёмки, списания и поступления мат. ценностей
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              id="btn-export-history-csv"
              type="button"
              onClick={onOpenExportModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Экспорт истории в CSV
            </button>

            <button
              id="btn-archive-history"
              type="button"
              onClick={onOpenArchiveModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              <Archive className="w-4 h-4" />
              Архивировать и очистить
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по инв. №, ФИО, прибору..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-hidden"
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-hidden"
            >
              <option value="all">Все действия</option>
              <option value="Выдача">Только Выдача</option>
              <option value="Возврат">Только Возврат</option>
              <option value="Поступление">Только Поступление</option>
              <option value="Списание">Только Списание</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 shrink-0">C:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 shrink-0">По:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <p className="text-sm font-semibold text-slate-800">Записи не найдены</p>
            <p className="text-xs text-slate-400 mt-1">
              Нет записей, соответствующих выбранным критериям фильтрации
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Дата и время</th>
                  <th className="py-3 px-4">Действие</th>
                  <th className="py-3 px-4">Инв. номер</th>
                  <th className="py-3 px-4">Оборудование</th>
                  <th className="py-3 px-4">Сотрудник</th>
                  <th className="py-3 px-4">Кол-во</th>
                  <th className="py-3 px-4">Примечание</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {rec.date}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
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
                    </td>

                    {/* ТЕМНО-СИНИЙ инвентарный номер по ТЗ */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-blue-900 tracking-wide text-xs bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {rec.inventoryNumber}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-xs">
                        {rec.equipmentName}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        {rec.employeeName}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      {rec.quantity} шт.
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={rec.note}>
                      {rec.note || <span className="text-slate-300 italic">—</span>}
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
