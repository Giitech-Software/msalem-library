// main/main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

// 1. VARIABLE DECLARATIONS
let backendProcess;
let mainWindow;
const isDev = !app.isPackaged;
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
}

function getWindowIconPath() {
  const iconFileName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';

  if (isDev) {
    return path.join(__dirname, '..', 'app', 'public', iconFileName);
  }

  return path.join(process.resourcesPath, 'assets', iconFileName);
}

function focusMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }

  mainWindow.focus();
}


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
      JWT_SECRET: process.env.JWT_SECRET,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS,
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
  const iconPath = getWindowIconPath();

  mainWindow = new BrowserWindow({
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
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // app/dist is bundled inside asar under app/dist/
    mainWindow.loadFile(path.join(__dirname, '..', 'app', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
    mainWindow.focus();

    setTimeout(() => {
      if (!mainWindow.isDestroyed()) {
        const [w, h] = mainWindow.getSize();
        mainWindow.setSize(w, h - 1);
        mainWindow.setSize(w, h);
      }
    }, 200);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- 4. APP LIFECYCLE ---
app.on('second-instance', () => {
  focusMainWindow();
});

if (gotSingleInstanceLock) {
  app.whenReady().then(() => {
    startBackend();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else {
        focusMainWindow();
      }
    });
  });
}

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
