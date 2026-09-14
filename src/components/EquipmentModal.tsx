import { useState, useEffect, type FormEvent } from 'react';
import { Equipment, EquipmentStatus } from '../types';
import { X, Check } from 'lucide-react';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Equipment, 'id'>, id?: number) => void;
  editingItem?: Equipment | null;
}

export default function EquipmentModal({
  isOpen,
  onClose,
  onSave,
  editingItem,
}: EquipmentModalProps) {
  const [inventoryNumber, setInventoryNumber] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('шт');
  const [status, setStatus] = useState<EquipmentStatus>('available');
  const [isConsumable, setIsConsumable] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setInventoryNumber(editingItem.inventoryNumber);
      setName(editingItem.name);
      setModel(editingItem.model || '');
      setSerialNumber(editingItem.serialNumber || '');
      setQuantity(editingItem.quantity);
      setUnit(editingItem.unit || 'шт');
      setStatus(editingItem.status);
      setIsConsumable(editingItem.isConsumable);
    } else {
      setInventoryNumber(`БП-${String(Math.floor(1000 + Math.random() * 90000)).padStart(6, '0')}`);
      setName('');
      setModel('');
      setSerialNumber('');
      setQuantity(1);
      setUnit('шт');
      setStatus('available');
      setIsConsumable(false);
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inventoryNumber.trim() || !name.trim()) return;

    onSave(
      {
        inventoryNumber: inventoryNumber.trim(),
        name: name.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        quantity: Number(quantity) || 0,
        unit: unit.trim() || 'шт',
        status: Number(quantity) === 0 ? 'issued' : status,
        isConsumable,
      },
      editingItem ? editingItem.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editingItem ? 'Редактирование карточки оборудования' : 'Новое оборудование'}
            </h2>
            <p className="text-xs text-slate-500">
              {editingItem
                ? `Редактирование реквизитов позиции «${editingItem.name}»`
                : 'Заполните параметры единицы учёта для добавления в каталог'}
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eq-inv-number" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Инв. номер <span className="text-red-500">*</span>
              </label>
              <input
                id="eq-inv-number"
                type="text"
                value={inventoryNumber}
                onChange={(e) => setInventoryNumber(e.target.value)}
                required
                placeholder="БП-000091"
                className="w-full px-3 py-2 text-sm font-bold text-blue-900 bg-blue-50/50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden"
              />
              <span className="text-[11px] text-slate-400">Цвет по ТЗ: тёмно-синий</span>
            </div>

            <div>
              <label htmlFor="eq-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Наименование <span className="text-red-500">*</span>
              </label>
              <input
                id="eq-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Сканер, Тахеометр, Ноутбук..."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label htmlFor="eq-model" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Модель и характеристики
            </label>
            <input
              id="eq-model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Сканер лазерный Faro Focus Premium (70), XPS 15..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="eq-serial" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Серийный номер (S/N)
            </label>
            <input
              id="eq-serial"
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="LLS 092230262, б/н..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="eq-quantity" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Количество <span className="text-red-500">*</span>
              </label>
              <input
                id="eq-quantity"
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                required
                className="w-full px-3 py-2 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="eq-unit" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Ед. изм.
              </label>
              <select
                id="eq-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden"
              >
                <option value="шт">шт</option>
                <option value="компл">компл</option>
                <option value="м">м</option>
                <option value="упак">упак</option>
              </select>
            </div>

            <div>
              <label htmlFor="eq-status" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Статус
              </label>
              <select
                id="eq-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden"
              >
                <option value="available">В наличии</option>
                <option value="issued">Выдано</option>
                <option value="maintenance">В ремонте</option>
                <option value="written_off">Списано</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isConsumable}
                onChange={(e) => setIsConsumable(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-800">
                Расходный материал (рулетки, маркеры, канцелярия)
              </span>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              id="btn-save-equipment"
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {editingItem ? 'Сохранить изменения' : 'Добавить оборудование'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
