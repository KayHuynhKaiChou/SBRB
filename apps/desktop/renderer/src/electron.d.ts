/**
 * Global type augmentation for window.electronAPI exposed by preload.ts.
 * Available in renderer process only.
 */
interface ElectronAPI {
  isOnline: () => Promise<boolean>;
  queryOffline: (operation: string, variables?: Record<string, unknown>) => Promise<unknown>;
  syncToCloud: () => Promise<{ synced: number; errors: number }>;
  getAppVersion: () => Promise<string>;
  onUpdateAvailable: (callback: () => void) => void;
  onUpdateDownloaded: (callback: () => void) => void;
  installUpdate: () => void;
}

interface Window {
  electronAPI?: ElectronAPI;
}
