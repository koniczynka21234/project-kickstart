import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Prevent stale-cache issues in preview/dev (can look like "changes didn't apply")
if (!import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

// Register service worker for PWA only in production
if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onRegisterError(error) {
      console.error("PWA Service Worker registration error:", error);
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
