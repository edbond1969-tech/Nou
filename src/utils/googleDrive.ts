import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Google Auth Provider configured with Google Drive scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// Scopes declaration for compliance
export const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.readonly',
];

let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initialize auth listener
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Perform Google Sign-In with popup
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Не удалось получить токен доступа Google Drive');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve current cached access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Sign out user and clear token cache
 */
export const logoutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * Upload a file (JSON or CSV) to Google Drive using multipart upload
 */
export const uploadFileToGoogleDrive = async (
  fileName: string,
  content: string,
  mimeType: string = 'application/json'
): Promise<GoogleDriveFile> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Требуется авторизация в Google аккаунте');
  }

  const metadata = {
    name: fileName,
    mimeType: mimeType,
    description: 'Создано приложением «Управление оборудованием»',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    content +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Ошибка сохранения на Google Диск: ${response.statusText}`
    );
  }

  return await response.json();
};

/**
 * Upload a binary file (such as a ZIP archive) to Google Drive using multipart upload
 */
export const uploadBinaryToGoogleDrive = async (
  fileName: string,
  blobOrBuffer: Blob | ArrayBuffer,
  mimeType: string = 'application/zip'
): Promise<GoogleDriveFile> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Требуется авторизация в Google аккаунте');
  }

  const metadata = {
    name: fileName,
    mimeType: mimeType,
    description: 'Архив проекта Android Studio («Управление оборудованием»)',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n`;

  const fileBlob = blobOrBuffer instanceof Blob ? blobOrBuffer : new Blob([blobOrBuffer], { type: mimeType });

  const multipartBlob = new Blob([metadataPart, fileBlob, closeDelimiter], {
    type: `multipart/related; boundary=${boundary}`,
  });

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: multipartBlob,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Ошибка сохранения архива на Google Диск: ${response.statusText}`
    );
  }

  return await response.json();
};

/**
 * List files from Google Drive related to equipment / backups / android
 */
export const listGoogleDriveFiles = async (): Promise<GoogleDriveFile[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Требуется авторизация в Google');
  }

  // Find files that are either json backups, csv files, zip archives, or have equipment/inventory/android in name
  const query = encodeURIComponent(
    "trashed = false and (name contains 'inventory' or name contains 'equipment' or name contains 'оборудование' or name contains 'android' or mimeType = 'application/json' or mimeType = 'text/csv' or mimeType = 'application/zip')"
  );

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=40`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Не удалось получить список файлов с Google Диска');
  }

  const data = await response.json();
  return data.files || [];
};

/**
 * Download file content from Google Drive by file ID
 */
export const downloadGoogleDriveFile = async (fileId: string): Promise<string> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Требуется авторизация в Google');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Ошибка загрузки содержимого файла: ${response.statusText}`);
  }

  return await response.text();
};

/**
 * Delete a file from Google Drive
 * (Note: Caller MUST ensure user confirmation before invoking this destructive method)
 */
export const deleteGoogleDriveFile = async (fileId: string): Promise<void> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Требуется авторизация в Google');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(`Ошибка удаления файла с Google Диска: ${response.statusText}`);
  }
};
