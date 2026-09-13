import { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { Equipment, Employee, HistoryRecord } from '../types';
import {
  listGoogleDriveFiles,
  uploadFileToGoogleDrive,
  uploadBinaryToGoogleDrive,
  downloadGoogleDriveFile,
  deleteGoogleDriveFile,
  GoogleDriveFile,
} from '../utils/googleDrive';
import { parseCsv, mapEquipmentHeaders } from '../utils/csvParser';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  ExternalLink,
  Trash2,
  RefreshCw,
  FileText,
  Check,
  AlertCircle,
  X,
  FileSpreadsheet,
  Database,
  Lock,
  Smartphone,
} from 'lucide-react';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  equipment: Equipment[];
  employees: Employee[];
  history: HistoryRecord[];
  onRestoreBackup: (data: { equipment: Equipment[]; employees: Employee[]; history: HistoryRecord[] }) => void;
  onImportEquipment: (items: Equipment[], replace: boolean) => void;
}

export default function GoogleDriveModal({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  equipment,
  employees,
  history,
  onRestoreBackup,
  onImportEquipment,
}: GoogleDriveModalProps) {
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Confirmation state for destructive actions (Workspace skill requirement)
  const [fileToDelete, setFileToDelete] = useState<GoogleDriveFile | null>(null);
  const [fileToRestore, setFileToRestore] = useState<GoogleDriveFile | null>(null);
  const [fileToImport, setFileToImport] = useState<GoogleDriveFile | null>(null);

  const fetchFiles = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const files = await listGoogleDriveFiles();
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Ошибка загрузки файлов с Google Диска' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchFiles();
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // 1. Upload Full Database Backup to Drive
  const handleBackupToDrive = async () => {
    setIsUploading(true);
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        version: 3,
        app: 'Equipment Inventory Manager',
        equipment,
        employees,
        history,
      };
      const jsonContent = JSON.stringify(backupData, null, 2);
      const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `inventory_db_backup_${nowStr}.json`;

      await uploadFileToGoogleDrive(fileName, jsonContent, 'application/json');
      showStatus('success', `Резервная копия «${fileName}» успешно сохранена на Google Диск`);
      await fetchFiles();
    } catch (err: any) {
      showStatus('error', err.message || 'Не удалось сохранить резервную копию');
    } finally {
      setIsUploading(false);
    }
  };

  // 2. Upload Equipment Catalog CSV to Drive
  const handleExportCsvToDrive = async () => {
    setIsUploading(true);
    try {
      const headers = ['Инвентарный номер', 'Наименование', 'Модель', 'Серийный номер', 'Количество', 'Ед. изм.'];
      const rows = equipment.map((item) => [
        `"${item.inventoryNumber.replace(/"/g, '""')}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${(item.model || '').replace(/"/g, '""')}"`,
        `"${(item.serialNumber || '').replace(/"/g, '""')}"`,
        item.quantity,
        `"${(item.unit || 'шт').replace(/"/g, '""')}"`,
      ]);

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
      const nowStr = new Date().toISOString().slice(0, 10);
      const fileName = `equipment_catalog_${nowStr}.csv`;

      await uploadFileToGoogleDrive(fileName, csvContent, 'text/csv');
      showStatus('success', `Каталог «${fileName}» успешно сохранен на Google Диск`);
      await fetchFiles();
    } catch (err: any) {
      showStatus('error', err.message || 'Не удалось выгрузить CSV на Google Диск');
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Upload Android Studio ZIP project archive to Drive
  const handleUploadAndroidZipToDrive = async () => {
    setIsUploading(true);
    try {
      const response = await fetch('/android-project.zip');
      if (!response.ok) {
        throw new Error('Архив android-project.zip не найден на сервере');
      }
      const blob = await response.blob();
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `android_studio_project_${dateStr}.zip`;

      await uploadBinaryToGoogleDrive(fileName, blob, 'application/zip');
      showStatus('success', `Архив «${fileName}» успешно загружен на ваш Google Диск!`);
      await fetchFiles();
    } catch (err: any) {
      showStatus('error', err.message || 'Не удалось выгрузить архив на Google Диск');
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Restore database from selected JSON backup file
  const handleConfirmRestore = async () => {
    if (!fileToRestore) return;
    setIsLoading(true);
    try {
      const text = await downloadGoogleDriveFile(fileToRestore.id);
      const parsed = JSON.parse(text);

      if (parsed && Array.isArray(parsed.equipment) && Array.isArray(parsed.employees)) {
        onRestoreBackup({
          equipment: parsed.equipment,
          employees: parsed.employees,
          history: parsed.history || [],
        });
        showStatus('success', `База данных успешно восстановлена из «${fileToRestore.name}»`);
        setFileToRestore(null);
      } else {
        throw new Error('Файл не содержит корректной структуры резервной копии базы данных');
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Ошибка восстановления из файла');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Import CSV file from Drive
  const handleConfirmImport = async () => {
    if (!fileToImport) return;
    setIsLoading(true);
    try {
      const text = await downloadGoogleDriveFile(fileToImport.id);
      const allRows = parseCsv(text);
      if (allRows.length < 2) {
        throw new Error('CSV файл пуст или содержит только строку заголовков');
      }

      const headers = allRows[0];
      const dataRows = allRows.slice(1);
      const mapping = mapEquipmentHeaders(headers);

      if (mapping.inventoryCol === -1 || mapping.nameCol === -1) {
        throw new Error('В CSV файле не найдены обязательные столбцы «Инвентарный номер» и «Наименование»');
      }

      const importedItems: Equipment[] = [];
      dataRows.forEach((row, idx) => {
        const inv = (row[mapping.inventoryCol] || '').trim();
        const nm = (row[mapping.nameCol] || '').trim();
        if (!inv || !nm) return;

        const model = mapping.modelCol !== -1 ? (row[mapping.modelCol] || '').trim() : '';
        const serial = mapping.serialCol !== -1 ? (row[mapping.serialCol] || '').trim() : '';
        const qty = mapping.quantityCol !== -1 ? parseInt(row[mapping.quantityCol] || '1', 10) || 1 : 1;
        const unit = mapping.unitCol !== -1 && row[mapping.unitCol] ? row[mapping.unitCol].trim() : 'шт';
        const isConsumable = mapping.isConsumableCol !== -1 ? (row[mapping.isConsumableCol] || '').toLowerCase().includes('да') : false;

        importedItems.push({
          id: Date.now() + idx,
          inventoryNumber: inv,
          name: nm,
          model: model,
          serialNumber: serial,
          quantity: qty,
          unit: unit,
          isConsumable: isConsumable,
          status: qty > 0 ? 'available' : 'issued',
        });
      });

      if (importedItems.length === 0) {
        throw new Error('В файле не найдено строк с оборудованием');
      }

      onImportEquipment(importedItems, false);
      showStatus('success', `Успешно импортировано ${importedItems.length} позиций из Google Диска`);
      setFileToImport(null);
    } catch (err: any) {
      showStatus('error', err.message || 'Ошибка импорта CSV с Google Диска');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Delete file from Drive (with user confirmation)
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsLoading(true);
    try {
      await deleteGoogleDriveFile(fileToDelete.id);
      showStatus('success', `Файл «${fileToDelete.name}» удалён с Google Диска`);
      setFileToDelete(null);
      await fetchFiles();
    } catch (err: any) {
      showStatus('error', err.message || 'Ошибка удаления файла');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return '—';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Синхронизация с Google Диском
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                  Google Drive
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Резервные копии базы данных, облачный экспорт и импорт файлов
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Account Status / Sign In */}
          {!currentUser ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="text-sm font-bold text-slate-900">
                  Подключите ваш Google Аккаунт
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Для сохранения резервных копий и выгрузки каталога на ваш личный Google Диск необходимо выполнить безопасный вход через Google.
                </p>
              </div>

              {/* Official Google Sign-In Button */}
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={onLogin}
                  className="inline-flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>Войти с аккаунтом Google</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Profile Card */}
              <div className="flex items-center justify-between p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Google User'}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border border-blue-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm">
                      {(currentUser.displayName || currentUser.email || 'G')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {currentUser.displayName || 'Google Пользователь'}
                    </div>
                    <div className="text-[11px] text-slate-600">{currentUser.email}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Выйти
                </button>
              </div>

              {/* Quick Actions Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleBackupToDrive}
                  disabled={isUploading}
                  className="flex items-center justify-center gap-2 p-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer text-center"
                >
                  <Database className="w-4 h-4 shrink-0" />
                  <span>{isUploading ? 'Сохранение...' : 'Бэкап БД'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsvToDrive}
                  disabled={isUploading}
                  className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 disabled:opacity-50 text-slate-800 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer text-center"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{isUploading ? 'Выгрузка...' : 'Каталог CSV'}</span>
                </button>

                <button
                  type="button"
                  id="btn-drive-upload-android"
                  onClick={handleUploadAndroidZipToDrive}
                  disabled={isUploading}
                  className="flex items-center justify-center gap-2 p-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer text-center"
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>{isUploading ? 'Загрузка...' : 'Архив Android (.ZIP)'}</span>
                </button>
              </div>

              {/* Drive Files List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    Файлы на вашем Google Диске
                    <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded text-[10px]">
                      {driveFiles.length}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={fetchFiles}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 font-medium disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    Обновить
                  </button>
                </div>

                {isLoading && driveFiles.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Загрузка списка файлов с Google Диска...
                  </div>
                ) : driveFiles.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    На вашем Google Диске пока нет резервных копий или файлов каталога.
                    <br />
                    Нажмите «Создать бэкап на Диске», чтобы сохранить данные в облако.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {driveFiles.map((file) => {
                      const isJsonBackup = file.name.endsWith('.json');
                      const isCsvFile = file.name.endsWith('.csv');
                      const isZipFile = file.name.endsWith('.zip');

                      return (
                        <div
                          key={file.id}
                          className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {isJsonBackup ? (
                              <Database className="w-4 h-4 text-blue-600 shrink-0" />
                            ) : isCsvFile ? (
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : isZipFile ? (
                              <Smartphone className="w-4 h-4 text-purple-600 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-800 truncate flex items-center gap-1.5" title={file.name}>
                                <span>{file.name}</span>
                                {isZipFile && (
                                  <span className="text-[10px] bg-purple-100 text-purple-700 font-semibold px-1.5 py-0.2 rounded-full">
                                    Android ZIP
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                <span>{formatFileSize(file.size)}</span>
                                <span>•</span>
                                <span>{formatDate(file.modifiedTime)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Open on Google Drive */}
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                title="Открыть в Google Drive"
                                className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {/* Restore if JSON */}
                            {isJsonBackup && (
                              <button
                                type="button"
                                onClick={() => setFileToRestore(file)}
                                title="Восстановить эту копию базы данных"
                                className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <CloudDownload className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Import if CSV */}
                            {isCsvFile && (
                              <button
                                type="button"
                                onClick={() => setFileToImport(file)}
                                title="Импортировать этот CSV в каталог"
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <CloudUpload className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete File (with mandatory confirmation) */}
                            <button
                              type="button"
                              onClick={() => setFileToDelete(file)}
                              title="Удалить файл с Google Диска"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Данные передаются напрямую между вашим браузером и Google Drive API
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for File Deletion (Workspace Mandatory Rule) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-red-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-bold text-slate-900">
                Удалить файл с Google Диска?
              </h4>
              <p className="text-xs text-slate-500 mt-1 break-all">
                Вы действительно хотите безвозвратно удалить файл <strong>{fileToDelete.name}</strong> с вашего Google Диска?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
              >
                Удалить с Диска
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Restore from Drive */}
      {fileToRestore && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-blue-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
              <CloudDownload className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-bold text-slate-900">
                Восстановить базу данных?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Текущие данные будут заменены записями из файла <strong>{fileToRestore.name}</strong> с вашего Google Диска.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToRestore(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-3.5 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg cursor-pointer"
              >
                Восстановить БД
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for CSV Import from Drive */}
      {fileToImport && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-emerald-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CloudUpload className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-bold text-slate-900">
                Импортировать оборудование?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Загрузить и добавить позиции оборудования из CSV-файла <strong>{fileToImport.name}</strong> в каталог?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToImport(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
              >
                Импортировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
