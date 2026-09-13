import { useState, useRef, type ChangeEvent } from 'react';
import { type User } from 'firebase/auth';
import { Equipment, Employee, HistoryRecord } from '../types';
import {
  History,
  Download,
  Upload,
  UserPlus,
  Package,
  HardDriveDownload,
  HardDriveUpload,
  Archive,
  Trash2,
  RefreshCw,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  Cloud,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { uploadBinaryToGoogleDrive, googleSignIn } from '../utils/googleDrive';

interface SettingsViewProps {
  equipment: Equipment[];
  employees: Employee[];
  history: HistoryRecord[];
  onNavigateToTab: (tab: 'equipment' | 'employees' | 'history') => void;
  onOpenAddEmployee: () => void;
  onOpenImportModal: () => void;
  onOpenExportModal: (type: 'equipment' | 'employees' | 'history' | 'history_period') => void;
  onOpenArchiveModal: () => void;
  onDeleteAllEquipment: () => void;
  onRestoreBackup: (data: { equipment: Equipment[]; employees: Employee[]; history: HistoryRecord[] }) => void;
  onResetToDefaults: () => void;
  currentUser?: User | null;
  onOpenGoogleDriveModal?: () => void;
}

export default function SettingsView({
  equipment,
  employees,
  history,
  onNavigateToTab,
  onOpenAddEmployee,
  onOpenImportModal,
  onOpenExportModal,
  onOpenArchiveModal,
  onDeleteAllEquipment,
  onRestoreBackup,
  onResetToDefaults,
  currentUser,
  onOpenGoogleDriveModal,
}: SettingsViewProps) {
  const [notification, setNotification] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [driveUploadResult, setDriveUploadResult] = useState<{ name: string; url?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDownloadZipDirectly = async () => {
    setIsDownloadingZip(true);
    try {
      notify('Подготовка архива к скачиванию...');
      const response = await fetch('/android-project.zip');
      if (!response.ok) {
        throw new Error('Архив не найден на сервере');
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = 'android-studio-project.zip';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }, 3000);
      notify('Архив успешно скачан на устройство');
    } catch (err: any) {
      console.error(err);
      notify(err.message || 'Ошибка скачивания архива');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleUploadAndroidToDrive = async () => {
    setIsUploadingToDrive(true);
    try {
      if (!currentUser) {
        notify('Требуется авторизация в Google...');
        const res = await googleSignIn();
        if (!res) {
          throw new Error('Авторизация в Google отменена');
        }
      }
      notify('Подготовка и отправка архива на Google Диск...');
      const response = await fetch('/android-project.zip');
      if (!response.ok) {
        throw new Error('Файл архива не найден');
      }
      const blob = await response.blob();
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `android_studio_project_${dateStr}.zip`;
      const uploaded = await uploadBinaryToGoogleDrive(fileName, blob, 'application/zip');
      setDriveUploadResult({ name: uploaded.name, url: uploaded.webViewLink });
      notify(`Архив «${uploaded.name}» успешно выгружен на Google Диск!`);
    } catch (err: any) {
      console.error(err);
      notify(err.message || 'Не удалось выгрузить архив на Google Диск');
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  // 1. Create JSON Backup
  const handleBackupDownload = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: 3,
      equipment,
      employees,
      history,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `inventory_db_backup_${nowStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('Резервная копия базы данных успешно сохранена');
  };

  // 2. Restore JSON Backup
  const handleRestoreFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse((evt.target?.result as string) || '{}');
        if (json && Array.isArray(json.equipment) && Array.isArray(json.employees)) {
          onRestoreBackup({
            equipment: json.equipment,
            employees: json.employees,
            history: json.history || [],
          });
          notify('База данных успешно восстановлена из резервной копии');
        } else {
          alert('Файл резервной копии имеет неверный формат');
        }
      } catch (err) {
        alert('Ошибка при чтении файла резервной копии');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          {notification}
        </div>
      )}

      {/* Hidden file input for restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleRestoreFile}
        accept=".json"
        className="hidden"
      />

      {/* Card Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="text-center max-w-lg mx-auto mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            Настройки системы
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Управление данными, архивацией, импортом и экспортом оборудования
          </p>
        </div>

        {/* 
          Кнопочная сетка в строгом соответствии со структурой layout 
          из чата DeepSeek (сообщения 28, 29, 30, 33):
          
          1. История | Экспорт истории за период — вверху рядом
          2. Экспорт | Импорт — рядом друг с другом
          3. Добавить сотрудника — во всю ширину
          4. Управление оборудованием — во всю ширину
          5. Резервная копия | Восстановить БД — рядом
          6. Архивировать и очистить историю — во всю ширину
          7. Очистить оборудование — отдельная кнопка сброса
        */}
        <div className="space-y-3">
          {/* 1. История | Экспорт истории за период */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              id="btn-settings-history"
              type="button"
              onClick={() => onNavigateToTab('history')}
              className="flex items-center justify-center gap-2.5 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-slate-900 font-semibold text-sm transition-all shadow-2xs cursor-pointer"
            >
              <History className="w-4 h-4 text-blue-700" />
              История
            </button>

            <button
              id="btn-settings-archive-period"
              type="button"
              onClick={() => onOpenExportModal('history_period')}
              className="flex items-center justify-center gap-2.5 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-slate-900 font-semibold text-sm transition-all shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-700" />
              Экспорт истории за период
            </button>
          </div>

          {/* 2. Экспорт | Импорт */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              id="btn-settings-export"
              type="button"
              onClick={() => onOpenExportModal('equipment')}
              className="flex items-center justify-center gap-2.5 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-slate-900 font-semibold text-sm transition-all shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-700" />
              Экспорт
            </button>

            <button
              id="btn-settings-import"
              type="button"
              onClick={onOpenImportModal}
              className="flex items-center justify-center gap-2.5 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-slate-900 font-semibold text-sm transition-all shadow-2xs cursor-pointer"
            >
              <Upload className="w-4 h-4 text-blue-700" />
              Импорт
            </button>
          </div>

          {/* 3. Добавить сотрудника — во всю ширину */}
          <button
            id="btn-settings-add-employee"
            type="button"
            onClick={onOpenAddEmployee}
            className="w-full flex items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Добавить сотрудника
          </button>

          {/* 4. Управление оборудованием — во всю ширину */}
          <button
            id="btn-settings-manage-equipment"
            type="button"
            onClick={() => onNavigateToTab('equipment')}
            className="w-full flex items-center justify-center gap-2.5 p-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
          >
            <Package className="w-4 h-4" />
            Управление оборудованием
          </button>

          {/* 5. Резервная копия | Восстановить БД */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              id="btn-settings-backup"
              type="button"
              onClick={handleBackupDownload}
              className="flex items-center justify-center gap-2.5 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-all shadow-2xs cursor-pointer"
            >
              <HardDriveDownload className="w-4 h-4 text-slate-600" />
              Резервная копия
            </button>

            <button
              id="btn-settings-restore"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2.5 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-all shadow-2xs cursor-pointer"
            >
              <HardDriveUpload className="w-4 h-4 text-slate-600" />
              Восстановить БД
            </button>
          </div>

          {/* 6. Архивировать и очистить историю — во всю ширину */}
          <button
            id="btn-settings-cleanup-history"
            type="button"
            onClick={onOpenArchiveModal}
            className="w-full flex items-center justify-center gap-2.5 p-4 rounded-xl border border-amber-300 bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-semibold text-sm transition-all shadow-2xs cursor-pointer"
          >
            <Archive className="w-4 h-4 text-amber-700" />
            Архивировать и очистить историю
          </button>

          {/* 7. Очистить оборудование (message 33/47) */}
          <div className="pt-2">
            <button
              id="btn-settings-delete-all-equipment"
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center justify-center gap-2 p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Очистить оборудование (удалить всё из каталога)
            </button>
          </div>
        </div>

        {/* Google Drive Cloud Sync Section */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/80 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-xs shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Синхронизация с Google Диском
                  {currentUser && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Подключен
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {currentUser
                    ? `Аккаунт: ${currentUser.email || currentUser.displayName}`
                    : 'Сохраняйте резервные копии и экспортируйте файлы прямо в ваш Google Drive'}
                </div>
              </div>
            </div>

            {onOpenGoogleDriveModal && (
              <button
                id="btn-settings-open-google-drive"
                type="button"
                onClick={onOpenGoogleDriveModal}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer text-center"
              >
                {currentUser ? 'Управление Google Диском' : 'Подключить Google Диск'}
              </button>
            )}
          </div>
        </div>

        {/* Android Studio Export Section */}
        <div className="mt-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Проект для Android Studio
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    .ZIP готов
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Готовый архив (Gradle, AndroidManifest, ресурсы, MainActivity). Распакуйте и откройте в Android Studio для сборки .APK.
                </div>
                {driveUploadResult && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Архив загружен на Google Диск ({driveUploadResult.name})</span>
                    {driveUploadResult.url && (
                      <a
                        href={driveUploadResult.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-700 hover:underline font-semibold ml-1"
                      >
                        Открыть на Диске
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                id="btn-upload-android-to-drive"
                type="button"
                onClick={handleUploadAndroidToDrive}
                disabled={isUploadingToDrive}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer text-center"
              >
                <Cloud className="w-4 h-4" />
                {isUploadingToDrive ? 'Выгрузка на Диск...' : 'Выгрузить в мой Google Диск'}
              </button>

              <button
                id="btn-download-android-zip"
                type="button"
                onClick={handleDownloadZipDirectly}
                disabled={isDownloadingZip}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer text-center"
              >
                <Download className="w-4 h-4" />
                {isDownloadingZip ? 'Скачивание...' : 'Скачать на устройство (.ZIP)'}
              </button>
            </div>
          </div>
        </div>

        {/* Danger zone / Reset to defaults */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            База данных: <strong>Локальная (SQLite / Indexed Storage)</strong>
            <div className="text-[11px] text-slate-400">
              {equipment.length} поз. оборудования • {employees.length} сотр. • {history.length} записей истории
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Сброс к исходным демо-данным
          </button>
        </div>
      </div>

      {/* Clear All Equipment Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-red-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Очистить всё оборудование?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Все позиции оборудования будут удалены из базы, чтобы вы могли загрузить новый CSV-файл.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAllEquipment();
                  setShowClearConfirm(false);
                  notify('Все позиции оборудования успешно удалены');
                }}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
              >
                Удалить оборудование
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset To Defaults Confirm Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Сбросить базу к исходным данным?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Будут восстановлены заводские демонстрационные записи оборудования (Faro Focus, Sokkia, аккумуляторы DeWalt/Hilti) и сотрудники из ТЗ.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetToDefaults();
                  setShowResetConfirm(false);
                  notify('Данные успешно сброшены к демонстрационным');
                }}
                className="px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg cursor-pointer"
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
