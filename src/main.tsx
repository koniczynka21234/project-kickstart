import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// PWA registration – only in production builds
if (import.meta.env.PROD) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onRegisterError(error: any) {
        console.error("PWA Service Worker registration error:", error);
      },
    });
  });
} else if ("serviceWorker" in navigator) {
  // Prevent stale-cache issues in preview/dev
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById("root")!).render(<App />);
