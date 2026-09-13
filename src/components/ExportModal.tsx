import { useState } from 'react';
import { Equipment, Employee, HistoryRecord } from '../types';
import {
  exportEquipmentToCsv,
  exportEmployeesToCsv,
  exportHistoryToCsv,
  downloadCsvFile,
} from '../utils/csvParser';
import { X, Download, Calendar, Package, Users, History } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment[];
  employees: Employee[];
  history: HistoryRecord[];
  initialType?: 'equipment' | 'employees' | 'history' | 'history_period';
}

export default function ExportModal({
  isOpen,
  onClose,
  equipment,
  employees,
  history,
  initialType = 'equipment',
}: ExportModalProps) {
  const [exportType, setExportType] = useState<'equipment' | 'employees' | 'history'>(
    initialType === 'history_period' ? 'history' : initialType
  );
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  if (!isOpen) return null;

  const handleExport = () => {
    const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (exportType === 'equipment') {
      const csv = exportEquipmentToCsv(equipment);
      downloadCsvFile(csv, `equipment_export_${nowStr}.csv`);
    } else if (exportType === 'employees') {
      const csv = exportEmployeesToCsv(employees);
      downloadCsvFile(csv, `employees_export_${nowStr}.csv`);
    } else if (exportType === 'history') {
      const filtered = history.filter((rec) => {
        const recDate = rec.date.split(' ')[0];
        if (startDate && recDate < startDate) return false;
        if (endDate && recDate > endDate) return false;
        return true;
      });
      const csv = exportHistoryToCsv(filtered);
      downloadCsvFile(
        csv,
        `history_export_${startDate || 'all'}_to_${endDate || 'all'}_${nowStr}.csv`
      );
    }
    onClose();
  };

  const filteredHistoryCount = history.filter((rec) => {
    const recDate = rec.date.split(' ')[0];
    if (startDate && recDate < startDate) return false;
    if (endDate && recDate > endDate) return false;
    return true;
  }).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Экспорт данных в CSV / Excel
            </h2>
            <p className="text-xs text-slate-500">
              Выгрузка с поддержкой UTF-8 BOM для корректного открытия в Excel
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Export Type Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Что выгружать:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExportType('equipment')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-colors cursor-pointer ${
                  exportType === 'equipment'
                    ? 'border-blue-700 bg-blue-50/70 ring-1 ring-blue-700'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Package className="w-5 h-5 text-blue-700" />
                <span className="text-xs font-bold text-slate-900">Оборудование</span>
                <span className="text-[11px] text-slate-500">{equipment.length} записей</span>
              </button>

              <button
                type="button"
                onClick={() => setExportType('employees')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-colors cursor-pointer ${
                  exportType === 'employees'
                    ? 'border-blue-700 bg-blue-50/70 ring-1 ring-blue-700'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Users className="w-5 h-5 text-blue-700" />
                <span className="text-xs font-bold text-slate-900">Сотрудники</span>
                <span className="text-[11px] text-slate-500">{employees.length} записей</span>
              </button>

              <button
                type="button"
                onClick={() => setExportType('history')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-colors cursor-pointer ${
                  exportType === 'history'
                    ? 'border-blue-700 bg-blue-50/70 ring-1 ring-blue-700'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <History className="w-5 h-5 text-blue-700" />
                <span className="text-xs font-bold text-slate-900">История</span>
                <span className="text-[11px] text-slate-500">{history.length} записей</span>
              </button>
            </div>
          </div>

          {/* Period Filter for History */}
          {exportType === 'history' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <Calendar className="w-4 h-4 text-blue-700" />
                Выбор периода истории операций
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="history-start-date" className="block text-[11px] font-medium text-slate-600 mb-1">
                    С даты:
                  </label>
                  <input
                    id="history-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="history-end-date" className="block text-[11px] font-medium text-slate-600 mb-1">
                    По дату:
                  </label>
                  <input
                    id="history-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="text-xs text-slate-600 flex items-center justify-between pt-1">
                <span>Будет выгружено записей:</span>
                <span className="font-bold text-blue-800">{filteredHistoryCount}</span>
              </div>
            </div>
          )}

          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-blue-900">Формат файла:</div>
            <div>• Разделитель: точка с запятой «;»</div>
            <div>• Кодировка: UTF-8 с BOM (без кракозябр в Excel)</div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            id="btn-download-csv"
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Скачать CSV файл
          </button>
        </div>
      </div>
    </div>
  );
}
