const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let backendProcess;
const isDev = !app.isPackaged;

// --- 1. BACKEND PROCESS MANAGEMENT ---
function startBackend() {
  // Points to your backend entry point
  const backendPath = path.join(__dirname, '../backend/server.js');
  
  backendProcess = fork(backendPath, [], {
    env: { ...process.env, NODE_ENV: 'production' }
  });

  backendProcess.on('error', (err) => console.error('Backend Process Error:', err));
}

// --- 2. ELECTRON OPTIMIZATIONS (The Freeze Fixes) ---
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    // ✅ ICON PATH
    icon: path.join(__dirname, '../app/public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });

  // --- 3. DYNAMIC LOADING (Dev vs Prod) ---
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    // In production, we load the built React index.html
    win.loadFile(path.join(__dirname, '../app/dist/index.html'));
  }

  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
    win.focus();

    // Redraw fix for inputs
    win.webContents.on('before-input-event', () => {
      if (win.isFocused()) {
        win.webContents.invalidate();
      }
    });

    // Initial resize hack
    setTimeout(() => {
      if (!win.isDestroyed()) {
        const [width, height] = win.getSize();
        win.setSize(width, height - 1);
        win.setSize(width, height);
      }
    }, 150);
  });

  win.setMenuBarVisibility(false);
}

// --- 4. APP LIFECYCLE ---
app.whenReady().then(() => {
  if (!isDev) startBackend(); // Only start backend via Electron in production
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill(); // Kill backend when app closes
  if (process.platform !== 'darwin') app.quit();
});

// Focus fix IPC
ipcMain.on('focus-fix', (event) => {
  const win = event.sender.getOwnerBrowserWindow();
  if (win) {
    win.blur();
    win.focus();
  }
});