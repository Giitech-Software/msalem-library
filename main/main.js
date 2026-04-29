// main/main.js
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
function getBackendPaths() {
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

  return {
    backendPath,
    nodeModulesPath,
    backendCwd,
    envPath: path.join(backendCwd, '.env'),
  };
}

function parseEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  return fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        return env;
      }

      const separatorIndex = trimmed.indexOf('=');

      if (separatorIndex === -1) {
        return env;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

      if (key) {
        env[key] = value;
      }

      return env;
    }, {});
}

function writeBackendLog(message) {
  const line = typeof message === 'string' ? message : String(message);

  if (isDev) {
    console.log(line.trimEnd());
  }

  if (!backendLogPath) {
    return;
  }

  fs.appendFile(backendLogPath, line, (err) => {
    if (err) {
      console.error('Failed to write backend log:', err);
    }
  });
}

function waitForBackend(timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve) => {
    const check = () => {
      const req = http.get('http://127.0.0.1:5000/api/health', (res) => {
        let body = '';

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(true);
            return;
          }

          if (Date.now() - startedAt >= timeoutMs) {
            writeBackendLog(`Backend health check timed out with status ${res.statusCode}: ${body}\n`);
            resolve(false);
            return;
          }

          setTimeout(check, 1000);
        });
      });

      req.on('error', (err) => {
        if (Date.now() - startedAt >= timeoutMs) {
          writeBackendLog(`Backend health check failed: ${err.message}\n`);
          resolve(false);
          return;
        }

        setTimeout(check, 1000);
      });

      req.setTimeout(1500, () => {
        req.destroy(new Error('Backend health check timed out'));
      });
    };

    check();
  });
}

function startBackend() {
  const { backendPath, nodeModulesPath, backendCwd, envPath } = getBackendPaths();

  // --- DIAGNOSTIC CHECKS ---
  if (!fs.existsSync(backendPath)) {
    dialog.showErrorBox(
      'Backend Error: File Not Found',
      `Server file missing at:\n${backendPath}`
    );
    return false;
  }

  if (!fs.existsSync(nodeModulesPath)) {
    dialog.showErrorBox(
      'Backend Error: Modules Missing',
      `node_modules folder missing at:\n${nodeModulesPath}\n\nThe backend cannot start without its dependencies.`
    );
    return false;
  }

  const envFromFile = parseEnvFile(envPath);

  backendProcess = fork(backendPath, [], {
    env: {
      ...envFromFile,
      ...process.env,
      NODE_ENV: isDev ? 'development' : 'production',
      ELECTRON_RUN_AS_NODE: '1',
      // NODE_PATH lets Node resolve modules from this folder
      NODE_PATH: nodeModulesPath,
      PORT: process.env.PORT || envFromFile.PORT || '5000',
      DATA_DIR: process.env.DATA_DIR || path.join(app.getPath('userData'), 'backend-data'),
      MONGO_URI: process.env.MONGO_URI || envFromFile.MONGO_URI || 'mongodb://127.0.0.1:27017/msalem_library',
      JWT_SECRET: process.env.JWT_SECRET || envFromFile.JWT_SECRET,
      EMAIL_USER: process.env.EMAIL_USER || envFromFile.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS || envFromFile.EMAIL_PASS,
    },
    cwd: backendCwd,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });

  backendProcess.stdout.on('data', (data) => {
    writeBackendLog(`[backend] ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    writeBackendLog(`[backend:error] ${data}`);
  });

  backendProcess.on('error', (err) => {
    writeBackendLog(`Failed to start backend process: ${err.stack || err.message}\n`);
    console.error('Failed to start backend process:', err);
  });

  backendProcess.on('exit', (code, signal) => {
    writeBackendLog(`Backend process exited with code ${code} signal ${signal || 'none'}\n`);
    backendProcess = null;
  });

  return true;
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
  app.whenReady().then(async () => {
    backendLogPath = path.join(app.getPath('userData'), 'backend.log');
    writeBackendLog(`\n--- App started ${new Date().toISOString()} ---\n`);

    const backendStarted = startBackend();

    if (backendStarted) {
      const backendReady = await waitForBackend();

      if (!backendReady) {
        dialog.showErrorBox(
          'Backend Startup Warning',
          `The local server did not become ready in time.\n\nOpen this log for details:\n${backendLogPath}`
        );
      }
    }

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
