// main/main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

// 1. VARIABLE DECLARATIONS
let backendProcess;
const isDev = !app.isPackaged;


// --- 2. BACKEND PROCESS MANAGEMENT ---
function startBackend() {
  let backendPath;
  let nodeModulesPath;
  let backendCwd;

  if (isDev) {
    backendPath    = path.join(__dirname, '..', 'backend', 'server.js');
    nodeModulesPath = path.join(__dirname, '..', 'backend', 'node_modules');
    backendCwd     = path.join(__dirname, '..', 'backend');
  } else {
    // In production, extraResources copies "backend/" into resources/backend/
    const resourcesBackend = path.join(process.resourcesPath, 'backend');
    backendPath    = path.join(resourcesBackend, 'server.js');
    // node_modules is copied as-is (no renaming needed anymore)
    nodeModulesPath = path.join(resourcesBackend, 'node_modules');
    backendCwd     = resourcesBackend;
  }

  // --- DIAGNOSTIC CHECKS ---
  if (!fs.existsSync(backendPath)) {
    dialog.showErrorBox(
      'Backend Error: File Not Found',
      `Server file missing at:\n${backendPath}`
    );
    return;
  }

  if (!fs.existsSync(nodeModulesPath)) {
    dialog.showErrorBox(
      'Backend Error: Modules Missing',
      `node_modules folder missing at:\n${nodeModulesPath}\n\nThe backend cannot start without its dependencies.`
    );
    return;
  }

  backendProcess = fork(backendPath, [], {
    env: {
      ...process.env,
      NODE_ENV: isDev ? 'development' : 'production',
      // NODE_PATH lets Node resolve modules from this folder
      NODE_PATH: nodeModulesPath,
      MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/msalem_library',
    },
    cwd: backendCwd,
    stdio: 'inherit',
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend process:', err);
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

// --- 3. ELECTRON OPTIMIZATIONS ---
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

function createWindow() {
  // Resolve icon safely for both dev and production
  const iconPath = isDev
    ? path.join(__dirname, '..', 'app', 'public', 'icon.png')
    : path.join(process.resourcesPath, 'app.asar.unpacked', 'app', 'dist', 'icon.png');

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    // app/dist is bundled inside asar under app/dist/
    win.loadFile(path.join(__dirname, '..', 'app', 'dist', 'index.html'));
  }

  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
    win.focus();

    setTimeout(() => {
      if (!win.isDestroyed()) {
        const [w, h] = win.getSize();
        win.setSize(w, h - 1);
        win.setSize(w, h);
      }
    }, 200);
  });
}

// --- 4. APP LIFECYCLE ---
app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});

// Focus fix IPC
ipcMain.on('focus-fix', (event) => {
  const win = event.sender.getOwnerBrowserWindow();
  if (win) {
    win.blur();
    win.focus();
  }
});
