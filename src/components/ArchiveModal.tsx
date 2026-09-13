import { useState } from 'react';
import { HistoryRecord } from '../types';
import { exportHistoryToCsv, downloadCsvFile } from '../utils/csvParser';
import { X, Archive, AlertTriangle, Check } from 'lucide-react';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryRecord[];
  onArchiveConfirm: (deletedIds: number[]) => void;
}

export default function ArchiveModal({
  isOpen,
  onClose,
  history,
  onArchiveConfirm,
}: ArchiveModalProps) {
  const [olderThanDate, setOlderThanDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    return d.toISOString().split('T')[0];
  });
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const recordsToArchive = history.filter((rec) => {
    const recDate = rec.date.split(' ')[0];
    return recDate < olderThanDate;
  });

  const handleArchive = () => {
    if (recordsToArchive.length === 0) return;

    // 1. Export CSV
    const csv = exportHistoryToCsv(recordsToArchive);
    downloadCsvFile(csv, `history_archive_before_${olderThanDate}.csv`);

    // 2. Delete IDs
    const ids = recordsToArchive.map((r) => r.id);
    onArchiveConfirm(ids);

    setIsDone(true);
    setTimeout(() => {
      setIsDone(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Архивация и очистка истории
            </h2>
            <p className="text-xs text-slate-500">
              Выгрузка старых записей в архивный CSV и удаление из БД
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

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="archive-cutoff-date" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Архивировать записи старше даты:
            </label>
            <input
              id="archive-cutoff-date"
              type="date"
              value={olderThanDate}
              onChange={(e) => setOlderThanDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden"
            />
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Внимание:
            </div>
            <p>
              Будет выгружено в файл и удалено из основной базы <strong>{recordsToArchive.length}</strong> записей, созданных ранее чем <strong>{olderThanDate}</strong>.
            </p>
            <p className="text-slate-500 text-[11px]">
              Архивный CSV-файл будет автоматически скачан в папку «Загрузки».
            </p>
          </div>

          {isDone && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              Успешно архивировано и удалено!
            </div>
          )}
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
            id="btn-confirm-archive"
            type="button"
            disabled={recordsToArchive.length === 0 || isDone}
            onClick={handleArchive}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Archive className="w-4 h-4" />
            Архивировать и очистить ({recordsToArchive.length})
          </button>
        </div>
      </div>
    </div>
  );
}
