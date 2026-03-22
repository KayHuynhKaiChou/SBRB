/**
 * Preload script — runs in renderer context but has access to ipcRenderer.
 * Uses contextBridge to safely expose a whitelisted API to the renderer.
 * Never expose the full ipcRenderer — only specific named methods.
 */
import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  /** Check if the app has internet connectivity */
  isOnline: () => Promise<boolean>;
  /** Execute a GraphQL operation against the local embedded NestJS API (offline mode) */
  queryOffline: (operation: string, variables?: Record<string, unknown>) => Promise<unknown>;
  /** Trigger a manual sync of SQLite data to the cloud API */
  syncToCloud: () => Promise<{ synced: number; errors: number }>;
  /** Get the current app version */
  getAppVersion: () => Promise<string>;
  /** Listen for update events from main process */
  onUpdateAvailable: (callback: () => void) => void;
  onUpdateDownloaded: (callback: () => void) => void;
  /** Install downloaded update and restart */
  installUpdate: () => void;
}

const api: ElectronAPI = {
  isOnline: () => ipcRenderer.invoke('check-network'),
  queryOffline: (operation, variables) =>
    ipcRenderer.invoke('gql-offline', { operation, variables }),
  syncToCloud: () => ipcRenderer.invoke('sync-data'),
  getAppVersion: () => ipcRenderer.invoke('get-version'),
  onUpdateAvailable: (cb) => {
    ipcRenderer.on('update-available', cb);
  },
  onUpdateDownloaded: (cb) => {
    ipcRenderer.on('update-downloaded', cb);
  },
  installUpdate: () => ipcRenderer.send('install-update'),
};

contextBridge.exposeInMainWorld('electronAPI', api);
