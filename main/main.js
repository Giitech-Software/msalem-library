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
    // Development: Use standard node_modules
    backendPath = path.join(__dirname, '..', 'backend', 'server.js');
    nodeModulesPath = path.join(__dirname, '..', 'backend', 'node_modules');
  } else {
    // PRODUCTION: Look in the "resources" folder
    const resourcesBackend = path.join(process.resourcesPath, 'backend');
    backendPath = path.join(resourcesBackend, 'server.js');
    
    // CRITICAL: We look for 'modules_prod' because we renamed it in package.json
    // to bypass the electron-builder ignore/signing hang.
    nodeModulesPath = path.join(resourcesBackend, 'modules_prod');
  }

  // --- CRITICAL DIAGNOSTIC CHECK ---
  if (!fs.existsSync(backendPath)) {
    if (!isDev) {
      dialog.showErrorBox(
        "Backend Error: File Not Found",
        `Server file missing at: ${backendPath}`
      );
    }
    return;
  }

  // Check if our renamed dependency folder exists
  if (!fs.existsSync(nodeModulesPath)) {
    if (!isDev) {
      dialog.showErrorBox(
        "Backend Error: Modules Missing",
        `Dependency folder missing at: ${nodeModulesPath}\n\nEnsure 'modules_prod' exists in the resources/backend folder.`
      );
    }
    return;
  }

  backendProcess = fork(backendPath, [], {
    env: { 
      ...process.env, 
      NODE_ENV: isDev ? 'development' : 'production',
      NODE_PATH: nodeModulesPath, // Essential for finding renamed dependencies
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

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
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