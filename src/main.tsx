import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { applyThemeToDocument, readStoredTheme } from "./theme/theme";
import { ThemeProvider } from "./theme/ThemeProvider";
import "./index.css";

applyThemeToDocument(readStoredTheme());
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
