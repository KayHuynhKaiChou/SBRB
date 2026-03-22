import { app, BrowserWindow, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import { registerIpcHandlers } from './ipc-handlers';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // security: renderer cannot access Node
      nodeIntegration: false,   // security: no direct Node in renderer
      sandbox: false,           // needed for preload to use ipcRenderer
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false, // show after 'ready-to-show' to avoid white flash
  });

  // Load renderer
  if (isDev) {
    win.loadURL('http://localhost:3001');
    win.webContents.openDevTools({ mode: 'undocked' });
  } else {
    win.loadFile(
      path.join(__dirname, '..', 'renderer', 'index.html'),
    );
  }

  // Show only when fully rendered
  win.once('ready-to-show', () => win.show());

  // Open external links in system browser instead of Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return win;
}

// App lifecycle
app.whenReady().then(async () => {
  mainWindow = createWindow();

  // Register all IPC handlers (must be before window loads)
  registerIpcHandlers();

  // Setup auto-updater (production only)
  if (!isDev) {
    setupAutoUpdater();
  }

  // macOS: re-create window on dock icon click if closed
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep app running in dock unless cmd+Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function setupAutoUpdater(): void {
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    mainWindow?.webContents.send('update-available');
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-downloaded');
  });
}
