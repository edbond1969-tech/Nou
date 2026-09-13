import { Equipment, Employee, HistoryRecord, IssuedItemTracking } from '../types';
import { INITIAL_EQUIPMENT, INITIAL_EMPLOYEES, INITIAL_HISTORY } from '../data/initialData';

const KEY_EQUIPMENT = 'inventory_equipment_v1';
const KEY_EMPLOYEES = 'inventory_employees_v1';
const KEY_HISTORY = 'inventory_history_v1';

export function getStoredEquipment(): Equipment[] {
  try {
    const raw = localStorage.getItem(KEY_EQUIPMENT);
    if (!raw) {
      localStorage.setItem(KEY_EQUIPMENT, JSON.stringify(INITIAL_EQUIPMENT));
      return INITIAL_EQUIPMENT;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load equipment from localStorage', e);
    return INITIAL_EQUIPMENT;
  }
}

export function saveEquipment(items: Equipment[]) {
  localStorage.setItem(KEY_EQUIPMENT, JSON.stringify(items));
}

export function getStoredEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(KEY_EMPLOYEES);
    if (!raw) {
      localStorage.setItem(KEY_EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
      return INITIAL_EMPLOYEES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load employees from localStorage', e);
    return INITIAL_EMPLOYEES;
  }
}

export function saveEmployees(items: Employee[]) {
  localStorage.setItem(KEY_EMPLOYEES, JSON.stringify(items));
}

export function getStoredHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    if (!raw) {
      localStorage.setItem(KEY_HISTORY, JSON.stringify(INITIAL_HISTORY));
      return INITIAL_HISTORY;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load history from localStorage', e);
    return INITIAL_HISTORY;
  }
}

export function saveHistory(records: HistoryRecord[]) {
  localStorage.setItem(KEY_HISTORY, JSON.stringify(records));
}

export function formatDateTime(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  const secs = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
}

/**
 * Calculates which items are currently issued to each employee based on history
 */
export function getCurrentlyIssuedItems(history: HistoryRecord[], equipmentList: Equipment[]): IssuedItemTracking[] {
  const balanceMap = new Map<string, {
    equipmentId: number;
    inventoryNumber: string;
    equipmentName: string;
    employeeName: string;
    balance: number;
    lastDate: string;
  }>();

  // Process history in chronological order
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));

  for (const h of sorted) {
    const key = `${h.inventoryNumber}:::${h.employeeName}`;
    const existing = balanceMap.get(key) || {
      equipmentId: h.equipmentId || 0,
      inventoryNumber: h.inventoryNumber,
      equipmentName: h.equipmentName,
      employeeName: h.employeeName,
      balance: 0,
      lastDate: h.date,
    };

    if (h.action === 'Выдача') {
      existing.balance += h.quantity;
      existing.lastDate = h.date;
    } else if (h.action === 'Возврат' || h.action === 'Списание') {
      existing.balance = Math.max(0, existing.balance - h.quantity);
    }
    balanceMap.set(key, existing);
  }

  const result: IssuedItemTracking[] = [];
  balanceMap.forEach((val) => {
    if (val.balance > 0) {
      const eq = equipmentList.find((e) => e.inventoryNumber === val.inventoryNumber);
      result.push({
        equipmentId: val.equipmentId || (eq ? eq.id : 0),
        inventoryNumber: val.inventoryNumber,
        equipmentName: eq ? eq.name : val.equipmentName,
        model: eq ? eq.model : '',
        serialNumber: eq ? eq.serialNumber : '',
        employeeName: val.employeeName,
        issuedQuantity: val.balance,
        lastIssuedDate: val.lastDate,
      });
    }
  });

  return result;
}

export function resetAllToDefaults() {
  localStorage.setItem(KEY_EQUIPMENT, JSON.stringify(INITIAL_EQUIPMENT));
  localStorage.setItem(KEY_EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
  localStorage.setItem(KEY_HISTORY, JSON.stringify(INITIAL_HISTORY));
}

export const loadEquipment = getStoredEquipment;
export const loadEmployees = getStoredEmployees;
export const loadHistory = getStoredHistory;
export const resetToInitialData = resetAllToDefaults;

export function computeIssuedItems(history: HistoryRecord[], equipmentList: Equipment[] = []): IssuedItemTracking[] {
  return getCurrentlyIssuedItems(history, equipmentList);
}
