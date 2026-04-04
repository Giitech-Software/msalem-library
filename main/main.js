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

  if (isDev) {
    // Development: Step out of /main to find /backend
    backendPath = path.join(__dirname, '..', 'backend', 'server.js');
    nodeModulesPath = path.join(__dirname, '..', 'backend', 'node_modules');
  } else {
    // PRODUCTION: Look in the "resources" folder (outside the ASAR)
    const resourcesBackend = path.join(process.resourcesPath, 'backend');
    backendPath = path.join(resourcesBackend, 'server.js');
    nodeModulesPath = path.join(resourcesBackend, 'node_modules');
  }

  // --- CRITICAL DIAGNOSTIC CHECK ---
  if (!fs.existsSync(backendPath)) {
    if (!isDev) {
      dialog.showErrorBox(
        "Backend Error: File Not Found",
        `Server file missing at: ${backendPath}\n\nPlease ensure 'backend' was included in extraResources.`
      );
    }
    return;
  }

  // Check if node_modules exists specifically
  if (!fs.existsSync(nodeModulesPath)) {
    if (!isDev) {
      dialog.showErrorBox(
        "Backend Error: Modules Missing",
        `The 'node_modules' folder is missing at: ${nodeModulesPath}\n\nThe backend cannot start without its dependencies.`
      );
    }
    return;
  }

  backendProcess = fork(backendPath, [], {
    env: { 
      ...process.env, 
      NODE_ENV: isDev ? 'development' : 'production',
      NODE_PATH: nodeModulesPath, // Required for the backend to find its dependencies
      MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/msalem_library'
    },
    cwd: path.dirname(backendPath),
    stdio: 'inherit'
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
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    // Dynamic icon path logic
    icon: isDev 
      ? path.join(__dirname, '..', 'app', 'public', 'icon.png') 
      : path.join(__dirname, '..', 'app', 'dist', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), 
      nodeIntegration: true, 
      contextIsolation: false,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });

  // --- 4. DYNAMIC LOADING ---
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    // Production: Step out of /main to find /app/dist/index.html
    win.loadFile(path.join(__dirname, '..', 'app', 'dist', 'index.html'));
  }

  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
    win.focus();

    // Redraw fix for white screen on some Windows configurations
    setTimeout(() => {
      if (!win.isDestroyed()) {
        const [w, h] = win.getSize();
        win.setSize(w, h - 1);
        win.setSize(w, h);
      }
    }, 200);
  });
}

// --- 5. APP LIFECYCLE ---
app.whenReady().then(() => {
  startBackend(); 
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

// Focus fix IPC
ipcMain.on('focus-fix', (event) => {
  const win = event.sender.getOwnerBrowserWindow();
  if (win) {
    win.blur();
    win.focus();
  }
});