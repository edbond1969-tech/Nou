import { useState, type FormEvent } from 'react';
import { IssuedItemTracking } from '../types';
import { X, Check, AlertCircle, RotateCcw } from 'lucide-react';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  issuedItems: IssuedItemTracking[];
  onReturn: (equipmentId: number, employeeName: string, quantity: number, note: string) => void;
  preselectedItem?: IssuedItemTracking | null;
}

export default function ReturnModal({
  isOpen,
  onClose,
  issuedItems,
  onReturn,
  preselectedItem,
}: ReturnModalProps) {
  const [selectedKey, setSelectedKey] = useState<string>(
    preselectedItem ? `${preselectedItem.inventoryNumber}:::${preselectedItem.employeeName}` : ''
  );
  const [returnQuantity, setReturnQuantity] = useState<number>(preselectedItem?.issuedQuantity || 1);
  const [returnNote, setReturnNote] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentItem = issuedItems.find(
    (item) => `${item.inventoryNumber}:::${item.employeeName}` === selectedKey
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!currentItem) {
      setError('Пожалуйста, выберите позицию для возврата');
      return;
    }
    if (returnQuantity <= 0 || returnQuantity > currentItem.issuedQuantity) {
      setError(`Количество должно быть от 1 до ${currentItem.issuedQuantity}`);
      return;
    }

    onReturn(currentItem.equipmentId, currentItem.employeeName, returnQuantity, returnNote.trim());
    onClose();
    setSelectedKey('');
    setReturnQuantity(1);
    setReturnNote('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Приёмка оборудования на склад
            </h2>
            <p className="text-xs text-slate-500">
              Возврат выданного оборудования от сотрудника на склад
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {issuedItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500 space-y-2">
              <RotateCcw className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-medium">Нет выданного оборудования</p>
              <p className="text-xs text-slate-400">
                Все оборудование находится на складе или списано
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Выберите выданную позицию <span className="text-red-500">*</span>
                </label>

                <div className="border border-slate-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
                  {issuedItems.map((item) => {
                    const key = `${item.inventoryNumber}:::${item.employeeName}`;
                    const isSelected = selectedKey === key;
                    return (
                      <div
                        key={key}
                        onClick={() => {
                          setSelectedKey(key);
                          setReturnQuantity(item.issuedQuantity);
                          setError('');
                        }}
                        className={`p-3 cursor-pointer transition-colors flex items-center justify-between gap-3 text-left ${
                          isSelected ? 'bg-emerald-50 border-l-4 border-emerald-600' : 'hover:bg-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-900 text-sm tracking-wide bg-blue-100/70 px-2 py-0.5 rounded">
                              {item.inventoryNumber}
                            </span>
                            <span className="font-medium text-slate-900 text-sm truncate">
                              {item.equipmentName}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <span>У сотрудника: <strong className="text-slate-700">{item.employeeName}</strong></span>
                            {item.model && <span>• {item.model}</span>}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block text-xs px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded">
                            На руках: {item.issuedQuantity} шт.
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {currentItem && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="block text-xs text-slate-500 mb-1">Сотрудник сдал:</span>
                      <div className="font-semibold text-slate-900 text-sm">{currentItem.employeeName}</div>
                      <div className="text-[11px] text-slate-400 mt-1">Инв. №: <span className="text-blue-900 font-bold">{currentItem.inventoryNumber}</span></div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <label htmlFor="return-quantity-input" className="block text-xs font-medium text-slate-700 mb-1">
                        Количество к возврату:
                      </label>
                      <input
                        id="return-quantity-input"
                        type="number"
                        min={1}
                        max={currentItem.issuedQuantity}
                        value={returnQuantity}
                        onChange={(e) => setReturnQuantity(Math.max(1, Math.min(currentItem.issuedQuantity, Number(e.target.value) || 1)))}
                        className="w-24 px-3 py-1 text-sm font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-hidden"
                        required
                      />
                      <span className="text-xs text-slate-400 ml-2">из {currentItem.issuedQuantity}</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="return-note-input" className="block text-xs font-medium text-slate-700 mb-1">
                      Состояние / Примечание при возврате:
                    </label>
                    <input
                      id="return-note-input"
                      type="text"
                      value={returnNote}
                      onChange={(e) => setReturnNote(e.target.value)}
                      placeholder="Например: Исправен, комплект полный, без повреждений"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-hidden"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              id="btn-confirm-return"
              type="submit"
              disabled={!currentItem}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Подтвердить возврат
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
