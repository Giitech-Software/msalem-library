// main/preload.js

window.addEventListener('DOMContentLoaded', () => {
  // 1. THE "CLICK-TO-WAKE" FIX
  // Fixes the "ghost window" bug where Electron stops responding to the first click.
  document.addEventListener('mousedown', () => {
    if (!document.hasFocus()) {
      window.focus();
    }
  }, true);

  // 2. THE "AUTO-FOCUS" & INTERACTION RECOVERY
  // Watches for React route changes to ensure inputs remain interactive.
  const observer = new MutationObserver(() => {
    const activeInput = document.activeElement;
    
    // If focus is lost during a React re-render, ensure the UI is still "hittable"
    if (!activeInput || activeInput === document.body) {
      const inputs = document.querySelectorAll('input, textarea, select, button');
      inputs.forEach(el => {
        if (el.style.pointerEvents === 'none') {
          el.style.pointerEvents = 'auto';
        }
      });
    }
  });

  // Start watching the React 'root'
  // Using a retry interval in case 'root' hasn't mounted the exact millisecond DOMContentLoaded fires
  const startObserving = () => {
    const root = document.getElementById('root');
    if (root) {
      observer.observe(root, { childList: true, subtree: true });
      console.log('✅ Preload: MutationObserver active on #root');
    } else {
      setTimeout(startObserving, 100);
    }
  };

  startObserving();
});

// 3. GLOBAL INPUT RECOVERY
// Fixes focus loss after form submissions or 'Enter' key searches
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    // Small delay to allow React state updates to finish
    setTimeout(() => {
      const activeInput = document.activeElement;
      // If focus was lost after pressing Enter, try to put it back on the first available input
      if (!activeInput || activeInput === document.body) {
        const nextInput = document.querySelector('input:not([type="hidden"])');
        if (nextInput) nextInput.focus();
      }
    }, 100);
  }
});

// 4. (Optional) EXPOSE IPC TO RENDERER
// Even though you have nodeIntegration: true, using a Bridge is cleaner for IPC
const { ipcRenderer } = require('electron');
window.electronAPI = {
  focusFix: () => ipcRenderer.send('focus-fix'),
};