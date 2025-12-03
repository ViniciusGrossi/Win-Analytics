import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA
import { registerSW } from "virtual:pwa-register";

registerSW({
    onNeedRefresh() {
        console.log("Nova versão disponível. Recarregue a página para atualizar.");
    },
    onOfflineReady() {
        console.log("App pronto para funcionar offline!");
    },
});

createRoot(document.getElementById("root")!).render(<App />);
