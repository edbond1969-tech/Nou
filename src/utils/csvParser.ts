import { Equipment, Employee, HistoryRecord } from '../types';

/**
 * Detect delimiter based on the first non-empty lines:
 * Checks semicolon ';', comma ',', or tab '\t'
 */
export function detectDelimiter(csvText: string): string {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return ';';

  const firstLine = lines[0];
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;

  if (semicolons >= commas && semicolons >= tabs) return ';';
  if (commas >= tabs) return ',';
  return '\t';
}

/**
 * Parses a single CSV line adhering to RFC 4180 quote rules and custom separators
 */
export function parseCsvLine(line: string, separator: string = ';'): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
      continue;
    }

    if (!inQuotes && line.startsWith(separator, i)) {
      result.push(current.trim());
      current = '';
      i += separator.length;
      continue;
    }

    current += char;
    i++;
  }

  result.push(current.trim());
  return result;
}

/**
 * Parses full CSV string into rows of string arrays
 */
export function parseCsv(csvText: string, separator?: string): string[][] {
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  const sep = separator || detectDelimiter(cleanText);
  const rawLines = cleanText.split(/\r?\n/);
  const rows: string[][] = [];

  let accumulatedLine = '';
  let inQuotes = false;

  for (const line of rawLines) {
    if (!accumulatedLine && !line.trim()) continue;

    for (let j = 0; j < line.length; j++) {
      if (line[j] === '"') {
        if (j + 1 < line.length && line[j + 1] === '"') {
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      }
    }

    if (accumulatedLine) {
      accumulatedLine += '\n' + line;
    } else {
      accumulatedLine = line;
    }

    if (!inQuotes) {
      const parsed = parseCsvLine(accumulatedLine, sep);
      // Strip trailing empty column if line ended with delimiter
      if (parsed.length > 1 && parsed[parsed.length - 1] === '' && line.trim().endsWith(sep)) {
        parsed.pop();
      }
      if (parsed.some((col) => col.length > 0)) {
        rows.push(parsed);
      }
      accumulatedLine = '';
    }
  }

  return rows;
}

export interface DetectedColumns {
  inventoryCol: number;
  nameCol: number;
  modelCol: number;
  serialCol: number;
  quantityCol: number;
  unitCol: number;
  isConsumableCol: number;
}

/**
 * Analyzes headers and maps them to equipment fields
 */
export function mapEquipmentHeaders(headers: string[]): DetectedColumns {
  const norm = headers.map((h) => h.toLowerCase().trim());

  let inventoryCol = norm.findIndex((h) =>
    h.includes('инв') || h.includes('код') || h.includes('номер') || h.includes('inv')
  );
  let nameCol = norm.findIndex((h) =>
    h.includes('наименов') || h.includes('назван') || h.includes('имя') || h.includes('оборудов') || h.includes('name')
  );
  let modelCol = norm.findIndex((h) =>
    h.includes('модел') || h.includes('тип') || h.includes('марк') || h.includes('model')
  );
  let serialCol = norm.findIndex((h) =>
    h.includes('серийн') || h.includes('сер.ном') || h.includes('s/n') || h.includes('serial')
  );
  let quantityCol = norm.findIndex((h) =>
    h.includes('колич') || h.includes('остат') || h.includes('кол-во') || h.includes('qty')
  );
  let unitCol = norm.findIndex((h) =>
    h.includes('един') || h.includes('ед.изм') || h.includes('unit')
  );
  let isConsumableCol = norm.findIndex((h) =>
    h.includes('расход') || h.includes('материал') || h.includes('consumable')
  );

  // Fallbacks if positional format without clear labels:
  if (inventoryCol === -1 && headers.length > 0) inventoryCol = 0;
  if (nameCol === -1 && headers.length > 1) nameCol = 1;
  if (modelCol === -1 && headers.length > 2) modelCol = 2;
  if (serialCol === -1 && headers.length > 3) serialCol = 3;

  return {
    inventoryCol,
    nameCol,
    modelCol,
    serialCol,
    quantityCol,
    unitCol,
    isConsumableCol,
  };
}

/**
 * Converts equipment to CSV with UTF-8 BOM
 */
export function exportEquipmentToCsv(items: Equipment[]): string {
  const headers = ['Инвентарный номер', 'Наименование', 'Модель', 'Серийный номер', 'Статус', 'Количество', 'Ед.изм', 'Расходник'];
  const rows = items.map((item) => [
    escapeCsvCell(item.inventoryNumber),
    escapeCsvCell(item.name),
    escapeCsvCell(item.model),
    escapeCsvCell(item.serialNumber),
    escapeCsvCell(item.status === 'available' ? 'В наличии' : item.status === 'issued' ? 'Выдано' : item.status === 'maintenance' ? 'В ремонте' : 'Списано'),
    item.quantity.toString(),
    escapeCsvCell(item.unit),
    item.isConsumable ? 'Да' : 'Нет',
  ]);

  return '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
}

/**
 * Converts employees to CSV with UTF-8 BOM
 */
export function exportEmployeesToCsv(employees: Employee[]): string {
  const headers = ['ID', 'ФИО', 'Должность', 'Отдел', 'Телефон', 'Email'];
  const rows = employees.map((emp) => [
    emp.id.toString(),
    escapeCsvCell(emp.name),
    escapeCsvCell(emp.position),
    escapeCsvCell(emp.department),
    escapeCsvCell(emp.phone),
    escapeCsvCell(emp.email),
  ]);

  return '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
}

/**
 * Converts history records to CSV with UTF-8 BOM
 */
export function exportHistoryToCsv(records: HistoryRecord[]): string {
  const headers = ['ID', 'Дата', 'Инвентарный номер', 'Оборудование', 'Сотрудник', 'Действие', 'Количество', 'Примечание'];
  const rows = records.map((rec) => [
    rec.id.toString(),
    rec.date,
    escapeCsvCell(rec.inventoryNumber),
    escapeCsvCell(rec.equipmentName),
    escapeCsvCell(rec.employeeName),
    escapeCsvCell(rec.action),
    rec.quantity.toString(),
    escapeCsvCell(rec.note || ''),
  ]);

  return '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
}

function escapeCsvCell(val: string): string {
  if (!val) return '';
  if (val.includes(';') || val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function downloadCsvFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const SAMPLE_CSV_4_COLUMNS = `Инвентарный номер;Наименование;Модель;Серийный номер
БП-000091;Сканер;Сканер лазерный Faro Focus Premium (70);LLS 092230262
БП-000038;Сканер;Сканер лазерный Faro Focus 3D S150;SN-3D-8821
00-00000194;Спектр;Спектр-4.32 прибор для диагностики свай;SP-432-09
БП-00000778;Спектрометр;Спектрометр лазерный портативный ЛИС-01;LIS-01-2022
БП-000001;Тахеометр;Тахеометр электронный Sokkia CX101;CX101-5541
БП-000041;Тахеометр;Тахеометр электронный iM-105, поверенный;IM105-9921
БП-00003241;Аккумулятор;Батарея аккумуляторная Faro серия M/S;FARO-MS-441
БП-00003071;Аккумулятор;"(18В, 5.0 А*ч; Li-ion) DeWalt DCB 184";DW-184-01
БП-00003880;Аккумулятор;DeWalt DCB547 (18V, 9.0 А/ч Li-ion);DW-547-09
БП-00003866;Аккумулятор;Hilti B 36/5.2 Li-ion (б/н);HILTI-B36`;
