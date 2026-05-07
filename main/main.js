const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');
const http = require('http');

// 1. VARIABLE DECLARATIONS
let backendProcess;
let mainWindow;
let backendLogPath;
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
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.focus();
}

// --- 2. BACKEND PROCESS MANAGEMENT ---
function getBackendPaths() {
  let backendPath;
  let nodeModulesPaths;
  let backendCwd;

  if (isDev) {
    backendPath     = path.join(__dirname, '..', 'backend', 'server.js');
    nodeModulesPaths = [
      path.join(__dirname, '..', 'backend', 'node_modules'),
      path.join(__dirname, '..', 'node_modules'),
    ];
    backendCwd      = path.join(__dirname, '..', 'backend');
  } else {
    const resourcesBackend = path.join(process.resourcesPath, 'backend');
    backendPath     = path.join(resourcesBackend, 'server.js');
    nodeModulesPaths = [
      path.join(process.resourcesPath, 'app.asar', 'node_modules'),
      path.join(resourcesBackend, 'node_modules'),
    ];
    backendCwd      = resourcesBackend;
  }

  return {
    backendPath,
    nodePath: nodeModulesPaths.join(path.delimiter),
    backendCwd,
    envPath: path.join(backendCwd, '.env'),
  };
}

function parseEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return {};
  return fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return env;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) return env;
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key) env[key] = value;
      return env;
    }, {});
}

function writeBackendLog(message) {
  const line = typeof message === 'string' ? message : String(message);
  if (isDev) console.log(line.trimEnd());
  if (!backendLogPath) return;
  fs.appendFile(backendLogPath, line, (err) => {
    if (err) console.error('Failed to write backend log:', err);
  });
}

function waitForBackend(timeoutMs = 30000) {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const req = http.get('http://127.0.0.1:5000/api/health', (res) => {
        if (res.statusCode === 200) {
          resolve(true);
          return;
        }
        if (Date.now() - startedAt >= timeoutMs) {
          resolve(false);
          return;
        }
        setTimeout(check, 1000);
      });
      req.on('error', () => {
        if (Date.now() - startedAt >= timeoutMs) {
          resolve(false);
          return;
        }
        setTimeout(check, 1000);
      });
      req.setTimeout(1500, () => req.destroy());
    };
    check();
  });
}

function startBackend() {
  const { backendPath, nodePath, backendCwd, envPath } = getBackendPaths();

  if (!fs.existsSync(backendPath)) {
    dialog.showErrorBox('Backend Error', `Server file missing at: ${backendPath}`);
    return false;
  }

  const envFromFile = parseEnvFile(envPath);

  // CRITICAL: Define the persistent data directory
  const dataDir = path.join(app.getPath('userData'), 'database');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  backendProcess = fork(backendPath, [], {
    env: {
      ...envFromFile,
      ...process.env,
      NODE_ENV: isDev ? 'development' : 'production',
      ELECTRON_RUN_AS_NODE: '1',
      NODE_PATH: nodePath,
      PORT: '5000',
      DATA_DIR: dataDir, // Standalone DB Location
      // Removed MONGO_URI as it is no longer needed
      JWT_SECRET: process.env.JWT_SECRET || envFromFile.JWT_SECRET || 'msalem_secret_key_2024',
      EMAIL_USER: process.env.EMAIL_USER || envFromFile.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS || envFromFile.EMAIL_PASS,
    },
    cwd: backendCwd,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });

  backendProcess.stdout.on('data', (data) => writeBackendLog(`[backend] ${data}`));
  backendProcess.stderr.on('data', (data) => writeBackendLog(`[backend:error] ${data}`));

  return true;
}

// --- 3. ELECTRON OPTIMIZATIONS ---
app.disableHardwareAcceleration();

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
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'app', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// --- 4. APP LIFECYCLE ---
app.on('second-instance', () => focusMainWindow());

if (gotSingleInstanceLock) {
  app.whenReady().then(async () => {
    backendLogPath = path.join(app.getPath('userData'), 'backend.log');
    if (startBackend()) {
      const backendReady = await waitForBackend();
      if (!backendReady) {
        dialog.showErrorBox('Backend Timeout', 'The library server is taking too long to start.');
      }
    }
    createWindow();
  });
}

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});
