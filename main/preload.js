const { ipcRenderer } = require('electron');

// 1. EXPOSE API IMMEDIATELY
// This ensures your React components can call window.electronAPI 
// as soon as they mount without waiting for DOMContentLoaded.
window.electronAPI = {
  focusFix: () => ipcRenderer.send('focus-fix'),
};

window.addEventListener('DOMContentLoaded', () => {
  // 2. THE "CLICK-TO-WAKE" FIX
  document.addEventListener('mousedown', () => {
    if (!document.hasFocus()) {
      // Trigger the IPC fix we added in main.js
      ipcRenderer.send('focus-fix');
    }
  }, true);

  // 3. THE "AUTO-FOCUS" & INTERACTION RECOVERY
  const observer = new MutationObserver(() => {
    const activeInput = document.activeElement;
    
    if (!activeInput || activeInput === document.body) {
      const inputs = document.querySelectorAll('input, textarea, select, button');
      inputs.forEach(el => {
        if (el.style.pointerEvents === 'none') {
          el.style.pointerEvents = 'auto';
        }
      });
    }
  });

  const startObserving = () => {
    const root = document.getElementById('root');
    if (root) {
      observer.observe(root, { childList: true, subtree: true });
    } else {
      setTimeout(startObserving, 100);
    }
  };

  startObserving();
});

// 4. GLOBAL INPUT RECOVERY
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    // Small delay to let React state updates complete
    setTimeout(() => {
      const activeInput = document.activeElement;
      if (!activeInput || activeInput === document.body) {
        const nextInput = document.querySelector('input:not([type="hidden"])');
        if (nextInput) nextInput.focus();
      }
    }, 100);
  }
});