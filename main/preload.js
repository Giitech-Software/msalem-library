window.addEventListener('DOMContentLoaded', () => {
  // 1. THE "CLICK-TO-WAKE" FIX
  document.addEventListener('mousedown', () => {
    if (!document.hasFocus()) {
      window.focus();
    }
  }, true);

  // 2. THE "AUTO-FOCUS" & INTERACTION RECOVERY
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

// 3. GLOBAL INPUT RECOVERY
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    setTimeout(() => {
      const activeInput = document.activeElement;
      if (!activeInput || activeInput === document.body) {
        const nextInput = document.querySelector('input:not([type="hidden"])');
        if (nextInput) nextInput.focus();
      }
    }, 100);
  }
});

const { ipcRenderer } = require('electron');
window.electronAPI = {
  focusFix: () => ipcRenderer.send('focus-fix'),
};