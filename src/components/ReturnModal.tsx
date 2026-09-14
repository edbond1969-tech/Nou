import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { IssuedItemTracking, Employee } from '../types';
import {
  X,
  Check,
  AlertCircle,
  RotateCcw,
  User,
  CheckSquare,
  Square,
  Search,
  Plus,
  Minus,
  Package,
  Calendar,
} from 'lucide-react';

interface ReturnItemState {
  selected: boolean;
  quantity: number;
}

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  issuedItems: IssuedItemTracking[];
  employees: Employee[];
  onBatchReturn: (
    returns: { equipmentId: number; employeeName: string; quantity: number; note: string }[]
  ) => void;
  preselectedItem?: IssuedItemTracking | null;
  preselectedEmployeeName?: string | null;
}

export default function ReturnModal({
  isOpen,
  onClose,
  issuedItems,
  employees,
  onBatchReturn,
  preselectedItem,
  preselectedEmployeeName,
}: ReturnModalProps) {
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [returnState, setReturnState] = useState<Record<string, ReturnItemState>>({});
  const [generalNote, setGeneralNote] = useState('');
  const [error, setError] = useState('');

  // Find all distinct employees who currently hold equipment
  const employeesWithEquipment = useMemo(() => {
    const map = new Map<string, { count: number; totalQty: number }>();
    for (const item of issuedItems) {
      const cur = map.get(item.employeeName) || { count: 0, totalQty: 0 };
      map.set(item.employeeName, {
        count: cur.count + 1,
        totalQty: cur.totalQty + item.issuedQuantity,
      });
    }
    return map;
  }, [issuedItems]);

  // Sorted list of all employee names: employees who hold items appear first
  const sortedEmployeeList = useMemo(() => {
    // Unique names from registered employees + any issued records
    const allNames = new Set<string>();
    employees.forEach((e) => allNames.add(e.name));
    issuedItems.forEach((i) => allNames.add(i.employeeName));

    return Array.from(allNames).sort((a, b) => {
      const aHolds = employeesWithEquipment.has(a);
      const bHolds = employeesWithEquipment.has(b);
      if (aHolds && !bHolds) return -1;
      if (!aHolds && bHolds) return 1;
      return a.localeCompare(b);
    });
  }, [employees, issuedItems, employeesWithEquipment]);

  // Filtered employee list for search
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return sortedEmployeeList;
    const q = employeeSearch.toLowerCase();
    return sortedEmployeeList.filter((name) => name.toLowerCase().includes(q));
  }, [sortedEmployeeList, employeeSearch]);

  // When modal opens or preselected props change, initialize selected employee
  useEffect(() => {
    if (!isOpen) return;

    let targetEmployee = '';
    if (preselectedItem) {
      targetEmployee = preselectedItem.employeeName;
    } else if (preselectedEmployeeName) {
      targetEmployee = preselectedEmployeeName;
    } else if (sortedEmployeeList.length > 0) {
      // Default to first employee who has items
      const firstWithItems = sortedEmployeeList.find((name) => employeesWithEquipment.has(name));
      targetEmployee = firstWithItems || sortedEmployeeList[0] || '';
    }

    setSelectedEmployeeName(targetEmployee);
    setEmployeeSearch('');
    setGeneralNote('');
    setError('');
  }, [isOpen, preselectedItem, preselectedEmployeeName, sortedEmployeeList, employeesWithEquipment]);

  // Items currently held by the selected employee
  const employeeItems = useMemo(() => {
    if (!selectedEmployeeName) return [];
    return issuedItems.filter((item) => item.employeeName === selectedEmployeeName);
  }, [issuedItems, selectedEmployeeName]);

  // Reset or update item return states when employee or employeeItems change
  useEffect(() => {
    if (!isOpen) return;

    const nextState: Record<string, ReturnItemState> = {};
    for (const item of employeeItems) {
      const key = `${item.equipmentId}_${item.inventoryNumber}`;
      const isPreselected =
        preselectedItem &&
        preselectedItem.inventoryNumber === item.inventoryNumber &&
        preselectedItem.employeeName === item.employeeName;

      nextState[key] = {
        selected: isPreselected ? true : false,
        quantity: item.issuedQuantity,
      };
    }
    setReturnState(nextState);
    setError('');
  }, [selectedEmployeeName, employeeItems, preselectedItem, isOpen]);

  if (!isOpen) return null;

  // Toggle item selection
  const handleToggleItem = (itemKey: string, maxQuantity: number) => {
    setReturnState((prev) => {
      const current = prev[itemKey] || { selected: false, quantity: maxQuantity };
      const newSelected = !current.selected;
      return {
        ...prev,
        [itemKey]: {
          selected: newSelected,
          quantity: newSelected ? (current.quantity || maxQuantity) : current.quantity,
        },
      };
    });
    setError('');
  };

  // Change return quantity for an item
  const handleQuantityChange = (itemKey: string, newQty: number, maxQuantity: number) => {
    const clamped = Math.max(1, Math.min(maxQuantity, newQty));
    setReturnState((prev) => ({
      ...prev,
      [itemKey]: {
        selected: true, // auto-select when quantity is modified
        quantity: clamped,
      },
    }));
    setError('');
  };

  // Select all items
  const handleSelectAll = () => {
    const nextState: Record<string, ReturnItemState> = {};
    for (const item of employeeItems) {
      const key = `${item.equipmentId}_${item.inventoryNumber}`;
      nextState[key] = {
        selected: true,
        quantity: item.issuedQuantity,
      };
    }
    setReturnState(nextState);
    setError('');
  };

  // Deselect all items
  const handleDeselectAll = () => {
    const nextState: Record<string, ReturnItemState> = {};
    for (const item of employeeItems) {
      const key = `${item.equipmentId}_${item.inventoryNumber}`;
      nextState[key] = {
        selected: false,
        quantity: item.issuedQuantity,
      };
    }
    setReturnState(nextState);
    setError('');
  };

  // Calculate totals of selected items
  const selectedEntries = employeeItems.filter((item) => {
    const key = `${item.equipmentId}_${item.inventoryNumber}`;
    return returnState[key]?.selected;
  });

  const totalSelectedCount = selectedEntries.length;
  const totalSelectedUnits = selectedEntries.reduce((sum, item) => {
    const key = `${item.equipmentId}_${item.inventoryNumber}`;
    return sum + (returnState[key]?.quantity || 0);
  }, 0);

  // Submit batch return
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeName) {
      setError('Пожалуйста, выберите сотрудника');
      return;
    }

    if (selectedEntries.length === 0) {
      setError('Отметьте хотя бы одну позицию оборудования для возврата');
      return;
    }

    const payload = selectedEntries.map((item) => {
      const key = `${item.equipmentId}_${item.inventoryNumber}`;
      const state = returnState[key];
      const qty = Math.min(item.issuedQuantity, Math.max(1, state?.quantity || 1));
      return {
        equipmentId: item.equipmentId,
        employeeName: selectedEmployeeName,
        quantity: qty,
        note: generalNote.trim(),
      };
    });

    onBatchReturn(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Приём оборудования от сотрудника
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Выберите сотрудника, проверьте числящиеся позиции и отметьте сдаваемое количество
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Step: Select Employee */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="employee-select-return" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-700" />
                1. Выберите сотрудника <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {employeesWithEquipment.size} чел. с оборудованием
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative sm:col-span-2">
                <select
                  id="employee-select-return"
                  value={selectedEmployeeName}
                  onChange={(e) => {
                    setSelectedEmployeeName(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden shadow-2xs"
                >
                  <option value="" disabled>-- Выберите сотрудника из списка --</option>
                  {sortedEmployeeList.map((name) => {
                    const stats = employeesWithEquipment.get(name);
                    const empObj = employees.find((e) => e.name === name);
                    const role = empObj?.position ? ` (${empObj.position})` : '';
                    const label = stats
                      ? `🟢 ${name}${role} — на руках: ${stats.count} поз. (${stats.totalQty} шт.)`
                      : `⚪ ${name}${role} — (нет оборудования)`;
                    return (
                      <option key={name} value={name}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Quick Chips for employees holding equipment */}
            {employeesWithEquipment.size > 0 && (
              <div className="pt-1">
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                  Быстрый выбор сотрудников с оборудованием:
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {Array.from(employeesWithEquipment.entries()).map(([name, stat]) => {
                    const isSelected = selectedEmployeeName === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setSelectedEmployeeName(name);
                          setError('');
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <User className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[140px]">{name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected ? 'bg-emerald-700 text-white' : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {stat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Step: What is held by employee & checklist */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-700" />
                  2. Числится за сотрудником:
                  {selectedEmployeeName && (
                    <span className="text-blue-900 font-bold ml-1">
                      {selectedEmployeeName}
                    </span>
                  )}
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Отметьте галочкой позиции, которые сдаются, и при необходимости скорректируйте количество
                </p>
              </div>

              {employeeItems.length > 0 && (
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Выбрать всё ({employeeItems.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Снять выбор
                  </button>
                </div>
              )}
            </div>

            {/* List of items */}
            {!selectedEmployeeName ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                <User className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                <p className="text-xs font-semibold text-slate-700">Сотрудник не выбран</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Выберите сотрудника в поле выше, чтобы увидеть выданное ему оборудование
                </p>
              </div>
            ) : employeeItems.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/50 border border-emerald-200 rounded-xl text-slate-600 space-y-1">
                <Check className="w-8 h-8 mx-auto text-emerald-600 mb-1" />
                <p className="text-xs font-bold text-slate-900">
                  За сотрудником {selectedEmployeeName} оборудование не числится
                </p>
                <p className="text-[11px] text-slate-500">
                  Все позиции возвращены на склад либо ещё не выдавались
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {employeeItems.map((item) => {
                  const key = `${item.equipmentId}_${item.inventoryNumber}`;
                  const state = returnState[key] || {
                    selected: false,
                    quantity: item.issuedQuantity,
                  };
                  const isChecked = state.selected;

                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-xl border transition-all ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleItem(key, item.issuedQuantity)}
                          className="mt-0.5 text-emerald-600 focus:outline-hidden cursor-pointer shrink-0"
                          title={isChecked ? 'Снять отметку' : 'Отметить к возврату'}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                          )}
                        </button>

                        {/* Item details */}
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleToggleItem(key, item.issuedQuantity)}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-blue-900 text-xs tracking-wide bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">
                              {item.inventoryNumber}
                            </span>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {item.equipmentName}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            {item.model && (
                              <span>Модель: <strong className="text-slate-700">{item.model}</strong></span>
                            )}
                            {item.serialNumber && (
                              <span>S/N: <span className="font-mono text-slate-700">{item.serialNumber}</span></span>
                            )}
                            {item.lastIssuedDate && (
                              <span className="flex items-center gap-1 text-slate-400">
                                <Calendar className="w-3 h-3" />
                                Выдано: {item.lastIssuedDate}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Balance on hand */}
                        <div className="text-right shrink-0">
                          <span className="inline-block text-[11px] px-2 py-0.5 bg-amber-100 text-amber-900 font-bold rounded-lg">
                            На руках: {item.issuedQuantity} шт.
                          </span>
                        </div>
                      </div>

                      {/* Return quantity control (visible always, highlighted when selected) */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex flex-wrap items-center justify-between gap-2 pl-8">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700">
                            Количество к сдаче:
                          </span>

                          <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(key, state.quantity - 1, item.issuedQuantity)}
                              disabled={state.quantity <= 1}
                              className="px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white cursor-pointer transition-colors"
                              title="Уменьшить"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <input
                              type="number"
                              min={1}
                              max={item.issuedQuantity}
                              value={state.quantity}
                              onChange={(e) =>
                                handleQuantityChange(key, parseInt(e.target.value, 10) || 1, item.issuedQuantity)
                              }
                              className="w-12 text-center text-xs font-bold text-slate-900 py-1 outline-hidden border-x border-slate-200"
                            />

                            <button
                              type="button"
                              onClick={() => handleQuantityChange(key, state.quantity + 1, item.issuedQuantity)}
                              disabled={state.quantity >= item.issuedQuantity}
                              className="px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white cursor-pointer transition-colors"
                              title="Увеличить"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="text-[11px] text-slate-500">
                            из {item.issuedQuantity} шт.
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.issuedQuantity > 1 && (
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(key, item.issuedQuantity, item.issuedQuantity)}
                              className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded cursor-pointer transition-colors"
                            >
                              Сдать всё ({item.issuedQuantity})
                            </button>
                          )}
                          {!isChecked && (
                            <button
                              type="button"
                              onClick={() => handleToggleItem(key, item.issuedQuantity)}
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200 cursor-pointer transition-colors"
                            >
                              + Отметить
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Note */}
          <div className="pt-2 border-t border-slate-200">
            <label htmlFor="return-general-note" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Примечание к приёмке (состояние оборудования, комплектность)
            </label>
            <input
              id="return-general-note"
              type="text"
              value={generalNote}
              onChange={(e) => setGeneralNote(e.target.value)}
              placeholder="Например: Оборудование проверено, исправно, кабели и чехол на месте"
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-hidden"
            />
          </div>

          {/* Footer Summary & Actions */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs">
              {totalSelectedCount > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    Отмечено к возврату:
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs">
                    {totalSelectedCount} {totalSelectedCount === 1 ? 'позиция' : 'позиций'} ({totalSelectedUnits} шт.)
                  </span>
                </div>
              ) : (
                <span className="text-slate-400">
                  Позиции ещё не отмечены галочкой
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Отмена
              </button>

              <button
                id="btn-confirm-batch-return"
                type="submit"
                disabled={totalSelectedCount === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Принять на склад {totalSelectedUnits > 0 ? `(${totalSelectedUnits} шт.)` : ''}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
