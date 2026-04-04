import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter as Router, useLocation } from "react-router-dom";
import App from "./App";
import "./index.css";

// --- ELECTRON STABILITY FIX ---
function ElectronFocusFix() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const timer = setTimeout(() => {
      const firstInput = document.querySelector('input, textarea, [contenteditable="true"]');
      if (firstInput) firstInput.focus();
      else window.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [pathname]);
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <ElectronFocusFix />
      <App />
    </Router>
  </React.StrictMode>
);