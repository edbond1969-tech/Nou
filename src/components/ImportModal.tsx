import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import { Equipment } from '../types';
import { parseCsv, mapEquipmentHeaders, SAMPLE_CSV_4_COLUMNS, detectDelimiter } from '../utils/csvParser';
import { X, Upload, FileText, Check, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportEquipment: (items: Equipment[], replace: boolean) => void;
}

export default function ImportModal({
  isOpen,
  onClose,
  onImportEquipment,
}: ImportModalProps) {
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [delimiter, setDelimiter] = useState<string>('auto');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const actualDelimiter = delimiter === 'auto' ? detectDelimiter(csvText) : delimiter;
  const parsedRows = parseCsv(csvText, actualDelimiter);

  // Headers and data rows
  const hasHeaders = parsedRows.length > 0;
  const headers = hasHeaders ? parsedRows[0] : [];
  const dataRows = hasHeaders ? parsedRows.slice(1) : [];

  const detectedCols = mapEquipmentHeaders(headers);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = (evt.target?.result as string) || '';
      setCsvText(text);
    };
    reader.onerror = () => {
      setError('Не удалось прочитать файл');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      setError('');
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = (evt.target?.result as string) || '';
        setCsvText(text);
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  const loadSample = () => {
    setCsvText(SAMPLE_CSV_4_COLUMNS);
    setFileName('sample_equipment_4_columns.csv');
    setError('');
  };

  const executeImport = () => {
    if (dataRows.length === 0) {
      setError('Нет данных для импорта. Проверьте содержимое CSV.');
      return;
    }

    const { inventoryCol, nameCol, modelCol, serialCol, quantityCol, unitCol } = detectedCols;

    const importedEquipment: Equipment[] = dataRows
      .filter((row) => row.some((c) => c.trim().length > 0))
      .map((row, index) => {
        const invNum = (row[inventoryCol] || '').trim() || `БП-${String(index + 1).padStart(6, '0')}`;
        const name = (row[nameCol] || '').trim() || 'Оборудование';
        const model = modelCol >= 0 && row[modelCol] ? row[modelCol].trim() : '';
        const serial = serialCol >= 0 && row[serialCol] ? row[serialCol].trim() : '';
        const qty = quantityCol >= 0 && !isNaN(Number(row[quantityCol])) ? Math.max(0, Number(row[quantityCol])) : 1;
        const unit = unitCol >= 0 && row[unitCol] ? row[unitCol].trim() : 'шт';

        return {
          id: Date.now() + index,
          inventoryNumber: invNum,
          name,
          model,
          serialNumber: serial,
          status: qty > 0 ? 'available' : 'issued',
          quantity: qty,
          unit,
          isConsumable: false,
        };
      });

    onImportEquipment(importedEquipment, replaceExisting);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Импорт оборудования из CSV
            </h2>
            <p className="text-xs text-slate-500">
              Поддержка разделителей «;» и «,», кавычек и русских колонок Excel
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/30 rounded-2xl p-6 text-center cursor-pointer transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.txt"
              className="hidden"
            />
            <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-800">
              {fileName ? (
                <span className="text-blue-700 font-bold">Выбран файл: {fileName}</span>
              ) : (
                'Нажмите для выбора CSV файла или перетащите его сюда'
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Поддерживаются форматы с 2, 3 или 4 столбцами: Инвентарный номер, Наименование, Модель, Серийный номер
            </p>
          </div>

          {/* Options & Sample Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 font-medium">Разделитель:</span>
                <select
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="auto">Авто (определять автоматически)</option>
                  <option value=";">Точка с запятой «;» (Excel РФ)</option>
                  <option value=",">Запятая «,»</option>
                  <option value="	">Табуляция</option>
                </select>
              </div>

              <span className="text-slate-400">|</span>
              <span className="text-slate-500">
                Определён: <strong className="text-blue-700">{actualDelimiter === ';' ? 'Точка с запятой (;)' : actualDelimiter === ',' ? 'Запятая (,)' : 'Табуляция'}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={loadSample}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Загрузить пример из ТЗ (Faro, Sokkia, DeWalt)
            </button>
          </div>

          {/* Direct CSV text editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Содержимое CSV (можно вставить или отредактировать):
              </label>
              <span className="text-[11px] text-slate-400">
                {parsedRows.length > 0 ? `Всего строк: ${parsedRows.length}` : 'Пусто'}
              </span>
            </div>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Инвентарный номер;Наименование;Модель;Серийный номер&#10;БП-000091;Сканер;Сканер лазерный Faro Focus Premium (70);LLS 092230262&#10;БП-000001;Тахеометр;Тахеометр электронный Sokkia CX101;CX101-5541"
              className="w-full font-mono text-xs p-3 bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          {/* Parsing Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 uppercase tracking-wider">
                  Предпросмотр структуры данных:
                </span>
                <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Строк к импорту: {dataRows.length}
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 sticky top-0 text-slate-700 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="p-2 border-r border-slate-200 text-center w-10">#</th>
                      {headers.map((h, i) => (
                        <th key={i} className="p-2 border-r border-slate-200">
                          <div className="truncate">{h || `Колонка ${i + 1}`}</div>
                          <div className="text-[10px] text-blue-700 font-normal">
                            {i === detectedCols.inventoryCol
                              ? '→ Инв. номер'
                              : i === detectedCols.nameCol
                              ? '→ Наименование'
                              : i === detectedCols.modelCol
                              ? '→ Модель'
                              : i === detectedCols.serialCol
                              ? '→ Серийный номер'
                              : ''}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {dataRows.slice(0, 8).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        <td className="p-2 text-center text-slate-400 border-r border-slate-100 font-mono text-[11px]">
                          {rIdx + 1}
                        </td>
                        {headers.map((_, cIdx) => (
                          <td
                            key={cIdx}
                            className={`p-2 border-r border-slate-100 truncate max-w-[200px] ${
                              cIdx === detectedCols.inventoryCol ? 'font-bold text-blue-900' : ''
                            }`}
                          >
                            {row[cIdx] || <span className="text-slate-300 italic">пусто</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {dataRows.length > 8 && (
                <p className="text-[11px] text-slate-400 text-right">
                  Показаны первые 8 из {dataRows.length} записей
                </p>
              )}
            </div>
          )}

          {/* Import Mode: Append vs Replace */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800">
                Режим импорта
              </div>
              <div className="text-[11px] text-slate-500">
                {replaceExisting
                  ? 'Все текущее оборудование будет удалено и заменено новыми записями из файла'
                  : 'Новые позиции будут добавлены в существующий каталог'}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className={replaceExisting ? 'text-red-700 font-bold' : ''}>
                Перезаписать базу
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            id="btn-confirm-import-csv"
            type="button"
            disabled={dataRows.length === 0}
            onClick={executeImport}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Импортировать {dataRows.length > 0 ? `(${dataRows.length} записей)` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
