import { useState, type FormEvent } from 'react';
import { Equipment, Employee } from '../types';
import { X, Search, Check, AlertTriangle, UserCheck } from 'lucide-react';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment[];
  employees: Employee[];
  onIssue: (equipmentId: number, employeeName: string, quantity: number, note: string) => void;
  onOpenAddEmployee: () => void;
}

export default function IssueModal({
  isOpen,
  onClose,
  equipment,
  employees,
  onIssue,
  onOpenAddEmployee,
}: IssueModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Available equipment with stock > 0
  const availableItems = equipment.filter((item) => {
    const isAvailable = item.quantity > 0;
    const matchesSearch =
      item.inventoryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return isAvailable && matchesSearch;
  });

  const selectedEquipment = equipment.find((e) => e.id === selectedEquipmentId);
  const selectedEmployee = employees.find((e) => e.id === Number(selectedEmployeeId));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      setError('Пожалуйста, выберите сотрудника');
      return;
    }
    if (!selectedEquipment) {
      setError('Пожалуйста, выберите оборудование');
      return;
    }
    if (quantity <= 0) {
      setError('Количество для выдачи должно быть больше 0');
      return;
    }
    if (quantity > selectedEquipment.quantity) {
      setError(`Нельзя выдать больше текущего остатка (${selectedEquipment.quantity} ${selectedEquipment.unit})`);
      return;
    }

    onIssue(selectedEquipment.id, selectedEmployee.name, quantity, note.trim());
    onClose();
    // Reset form
    setSelectedEquipmentId(null);
    setQuantity(1);
    setNote('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Выдача оборудования сотруднику
            </h2>
            <p className="text-xs text-slate-500">
              Выберите сотрудника, позицию со склада и укажите количество
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Employee Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="select-employee" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                1. Выберите сотрудника <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={onOpenAddEmployee}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
              >
                + Новый сотрудник
              </button>
            </div>
            <select
              id="select-employee"
              value={selectedEmployeeId}
              onChange={(e) => {
                setSelectedEmployeeId(e.target.value ? Number(e.target.value) : '');
                setError('');
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white outline-hidden"
              required
            >
              <option value="">-- Выберите получателя --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.position} ({emp.department})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Equipment Picker with Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Выберите оборудование со склада <span className="text-red-500">*</span>
            </label>

            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по инв. номеру, названию, модели или s/n..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white outline-hidden"
              />
            </div>

            {/* List of items */}
            <div className="border border-slate-200 rounded-xl max-h-52 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
              {availableItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  {equipment.filter((e) => e.quantity > 0).length === 0
                    ? 'На складе нет доступного оборудования'
                    : 'Ничего не найдено по поисковому запросу'}
                </div>
              ) : (
                availableItems.map((item) => {
                  const isSelected = selectedEquipmentId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedEquipmentId(item.id);
                        setError('');
                        if (quantity > item.quantity) {
                          setQuantity(item.quantity);
                        }
                      }}
                      className={`p-3 cursor-pointer transition-colors flex items-center justify-between gap-3 text-left ${
                        isSelected
                          ? 'bg-blue-50/90 border-l-4 border-blue-800'
                          : 'hover:bg-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {/* Инвентарный номер ТЕМНО-СИНИЙ по ТЗ чата DeepSeek */}
                          <span className="font-bold text-blue-900 text-sm tracking-wide bg-blue-100/70 px-2 py-0.5 rounded">
                            {item.inventoryNumber}
                          </span>
                          <span className="font-medium text-slate-900 text-sm truncate">
                            {item.name}
                          </span>
                          {item.isConsumable && (
                            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              Расходник
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {item.model ? `Модель: ${item.model}` : 'Без модели'}
                          {item.serialNumber ? ` | S/N: ${item.serialNumber}` : ''}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block text-xs px-2 py-1 bg-slate-100 text-slate-700 font-semibold rounded">
                          Остаток: {item.quantity} {item.unit}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. Selected Item Details with "Остаток" and "Количество" in two columns (ТЗ message 8) */}
          {selectedEquipment && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Параметры выдачи
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Колонка 1: Остаток */}
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="block text-xs text-slate-500 mb-1">Доступный остаток:</span>
                  <div className="text-lg font-bold text-emerald-700">
                    {selectedEquipment.quantity} <span className="text-sm font-normal text-slate-600">{selectedEquipment.unit}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Инв. №: <span className="text-blue-900 font-bold">{selectedEquipment.inventoryNumber}</span>
                  </div>
                </div>

                {/* Колонка 2: Количество к выдаче */}
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <label htmlFor="issue-quantity-input" className="block text-xs font-medium text-slate-700 mb-1">
                    Количество к выдаче:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="issue-quantity-input"
                      type="number"
                      min={1}
                      max={selectedEquipment.quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(selectedEquipment.quantity, Number(e.target.value) || 1)))}
                      className="w-24 px-3 py-1.5 text-base font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                      required
                    />
                    <span className="text-xs text-slate-500 font-medium">
                      {selectedEquipment.unit}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Останется: {Math.max(0, selectedEquipment.quantity - quantity)} {selectedEquipment.unit}
                  </div>
                </div>
              </div>

              {/* Примечание */}
              <div>
                <label htmlFor="issue-note-input" className="block text-xs font-medium text-slate-700 mb-1">
                  Примечание / Цель выдачи (необязательно):
                </label>
                <input
                  id="issue-note-input"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Например: Полевые работы на объекте Южный, командировка до 20.09"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              id="btn-confirm-issue"
              type="submit"
              disabled={!selectedEmployeeId || !selectedEquipmentId}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Оформить выдачу
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
