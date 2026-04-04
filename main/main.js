const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs'); // Added back fs for production path checking

// 1. VARIABLE DECLARATIONS
let backendProcess;
const isDev = !app.isPackaged;

// --- 2. BACKEND PROCESS MANAGEMENT ---
function startBackend() {
  let backendPath;
  let nodeModulesPath;

  if (isDev) {
    // Development: standard folder structure
    backendPath = path.join(__dirname, '../backend/server.js');
    nodeModulesPath = path.join(__dirname, '../backend/node_modules');
  } else {
    // PRODUCTION: Look inside the resources/backend folder (from extraResources)
    const resourcesBackend = path.join(process.resourcesPath, 'backend');
    backendPath = path.join(resourcesBackend, 'server.js');
    
    // RENAMING BYPASS: 
    // We check for 'server_deps' because our package.json now renames 
    // the backend node_modules to 'server_deps' during the build 
    // to hide them from the electron-builder scanner.
    const renamedModules = path.join(resourcesBackend, 'server_deps');
    const standardModules = path.join(resourcesBackend, 'node_modules');

    if (fs.existsSync(renamedModules)) {
      nodeModulesPath = renamedModules;
    } else {
      nodeModulesPath = standardModules;
    }

    // Emergency Fallback: If ASAR unpacking was used
    const unpackedBackend = path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'server.js');
    if (!fs.existsSync(backendPath) && fs.existsSync(unpackedBackend)) {
      backendPath = unpackedBackend;
    }
  }

  backendProcess = fork(backendPath, [], {
    env: { 
      ...process.env, 
      NODE_ENV: isDev ? 'development' : 'production',
      NODE_PATH: nodeModulesPath, // CRITICAL: Tells the backend where its libraries are
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

// --- 3. ELECTRON OPTIMIZATIONS (The Freeze Fixes) ---
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
      ? path.join(__dirname, '../app/public/icon.png') 
      : path.join(__dirname, '../app/dist/icon.png'),
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
    win.loadFile(path.join(__dirname, '../app/dist/index.html'));
  }

  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
    win.focus();

    // Trigger a single redraw to prevent the "white screen" or "frozen input" bug
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