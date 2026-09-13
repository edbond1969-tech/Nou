export type EquipmentStatus = 'available' | 'issued' | 'maintenance' | 'written_off';

export interface Equipment {
  id: number;
  inventoryNumber: string; // Инвентарный номер (темно-синий цвет по ТЗ)
  name: string;            // Наименование
  model: string;           // Модель
  serialNumber: string;    // Серийный номер
  status: EquipmentStatus; // Статус (available, issued, etc.)
  quantity: number;        // Текущий остаток
  unit: string;            // Единица измерения (шт, компл, м)
  isConsumable: boolean;   // Расходный материал
}

export interface Employee {
  id: number;
  name: string;            // ФИО
  position: string;        // Должность
  department: string;      // Отдел
  phone: string;           // Телефон
  email: string;           // Email
}

export type HistoryAction = 'Выдача' | 'Возврат' | 'Списание' | 'Поступление' | 'Инвентаризация';

export interface HistoryRecord {
  id: number;
  equipmentId?: number;
  inventoryNumber: string;
  equipmentName: string;
  employeeName: string;
  action: HistoryAction;
  date: string;            // YYYY-MM-DD HH:mm:ss
  quantity: number;
  note?: string;
}

export interface IssuedItemTracking {
  equipmentId: number;
  inventoryNumber: string;
  equipmentName: string;
  model: string;
  serialNumber: string;
  employeeName: string;
  issuedQuantity: number;
  lastIssuedDate: string;
}

export type ActiveTab = 'main' | 'equipment' | 'employees' | 'history' | 'settings';
