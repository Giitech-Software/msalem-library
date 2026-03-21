const { app, BrowserWindow } = require('electron');
const path = require('path');
// Add this inside your main.js file
const { ipcMain } = require('electron');

ipcMain.on('focus-fix', (event) => {
  const win = event.sender.getOwnerBrowserWindow();
  if (win) {
    win.blur();
    win.focus();
  }
});
// 1. FORCE SOFTWARE RENDERING
// This is the most common fix for inputs that freeze in Electron but work in Chrome.
// It stops the GPU from "hanging" the UI during React state updates.
app.disableHardwareAcceleration();

// 2. DISABLE WINDOW OCCLUSION & GPU COMPOSITING
// Prevents the OS from "sleeping" the renderer process when it thinks the window is static.
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Hidden until ready to prevent flickering
    autoHideMenuBar: true,
    backgroundColor: '#ffffff', 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      // 3. CRITICAL: Ensures the renderer stays active during form processing
      backgroundThrottling: false, 
      spellcheck: false,
    },
  });

  win.loadURL('http://localhost:5173');

  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
    win.focus();

    // 4. THE "AUTO-REPAINT" FIX
    // Every time the user interacts (clicks or types), force the window to redraw.
    // This automates the "minimize/maximize" fix you were doing manually.
    win.webContents.on('before-input-event', () => {
      if (win.isFocused()) {
        win.webContents.invalidate();
      }
    });

    // Initial resize hack for a clean start
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

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});