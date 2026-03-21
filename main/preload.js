// app/preload.js

window.addEventListener('DOMContentLoaded', () => {
  
  // 1. THE "CLICK-TO-WAKE" FIX
  // Forces the Electron window to regain focus on any mouse interaction.
  document.addEventListener('mousedown', () => {
    if (!document.hasFocus()) {
      window.focus();
    }
  }, true);

  // 2. THE "AUTO-FOCUS" OBSERVER
  // This watches your React app. If a new input field appears (like after 
  // a search or a form reset), it ensures the field is actually "live."
  const observer = new MutationObserver(() => {
    const activeInput = document.activeElement;
    
    // If nothing is focused, or the focused element is just the 'body',
    // try to find the first available input and prime it.
    if (!activeInput || activeInput === document.body) {
      const firstInput = document.querySelector('input, textarea, select');
      if (firstInput) {
        // We don't force focus() here to avoid jumping, 
        // but we ensure it's ready for interaction.
        firstInput.style.pointerEvents = 'auto';
      }
    }
  });

  // Start watching the React 'root' for changes
  const root = document.getElementById('root');
  if (root) {
    observer.observe(root, { childList: true, subtree: true });
  }
});

// 3. GLOBAL INPUT RECOVERY
// If the user presses 'Enter' (common in search/submit), 
// ensure the next field is ready.
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    setTimeout(() => {
      const nextInput = document.querySelector('input:not([value=""])');
      if (nextInput) nextInput.focus();
    }, 50);
  }
});