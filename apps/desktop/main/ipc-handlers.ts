import { app, ipcMain, net } from 'electron';
import { autoUpdater } from 'electron-updater';
import { getEmbeddedApi } from './embedded-api';

/**
 * Register all IPC handlers.
 * Called once from main.ts after app is ready.
 */
export function registerIpcHandlers(): void {
  // ─── Network check ──────────────────────────────────────
  ipcMain.handle('check-network', () => net.isOnline());

  // ─── Offline GraphQL via embedded NestJS ────────────────
  ipcMain.handle(
    'gql-offline',
    async (_event, { operation, variables }: { operation: string; variables?: Record<string, unknown> }) => {
      const api = await getEmbeddedApi();
      if (!api) {
        throw new Error('Embedded API not available');
      }
      // Delegate to the embedded NestJS GraphQL handler
      return api.handleGraphQL(operation, variables ?? {});
    },
  );

  // ─── Sync SQLite → cloud ────────────────────────────────
  ipcMain.handle('sync-data', async () => {
    const api = await getEmbeddedApi();
    if (!api) {
      return { synced: 0, errors: 0 };
    }
    return api.syncToCloud();
  });

  // ─── App version ────────────────────────────────────────
  ipcMain.handle('get-version', () => app.getVersion());

  // ─── Install update and restart ─────────────────────────
  ipcMain.on('install-update', () => autoUpdater.quitAndInstall());
}
