/**
 * Embedded NestJS API — runs inside Electron main process for offline mode.
 *
 * When offline: renderer → IPC → this module → NestJS (SQLite)
 * When online:  renderer → Apollo Client → cloud GraphQL API
 *
 * This is a STUB — full implementation in Phase 2 (offline feature).
 */

export interface IEmbeddedApiInstance {
  /** Execute a GraphQL operation against the local NestJS + SQLite stack */
  handleGraphQL: (operation: string, variables: Record<string, unknown>) => Promise<unknown>;
  /** Sync local SQLite changes to cloud API (last-write-wins via updated_at) */
  syncToCloud: () => Promise<{ synced: number; errors: number }>;
  /** Gracefully shutdown the embedded server */
  shutdown: () => Promise<void>;
}

let instance: IEmbeddedApiInstance | null = null;
let booting = false;

/**
 * Lazily start the embedded NestJS API.
 * Returns null if already booting or if startup fails.
 */
export async function getEmbeddedApi(): Promise<IEmbeddedApiInstance | null> {
  if (instance) return instance;
  if (booting) return null;

  booting = true;

  try {
    // TODO Phase 2: Boot NestJS with SQLite TypeORM config
    // const { NestFactory } = await import('@nestjs/core');
    // const { OfflineAppModule } = await import('./offline-app.module');
    // const nestApp = await NestFactory.createApplicationContext(OfflineAppModule);
    // await nestApp.init();

    // Stub implementation — replace in Phase 2
    instance = {
      handleGraphQL: async (_operation, _variables) => {
        throw new Error('Offline mode not yet implemented — Phase 2');
      },
      syncToCloud: async () => ({ synced: 0, errors: 0 }),
      shutdown: async () => {
        instance = null;
        booting = false;
      },
    };

    console.log('[EmbeddedApi] Stub initialized (Phase 2 pending)');
    return instance;
  } catch (err) {
    console.error('[EmbeddedApi] Failed to start:', err);
    booting = false;
    return null;
  }
}

/** Shutdown the embedded API if running */
export async function shutdownEmbeddedApi(): Promise<void> {
  if (instance) {
    await instance.shutdown();
  }
}
