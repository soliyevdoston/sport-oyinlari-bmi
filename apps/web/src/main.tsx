import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import "@/styles/globals.css";

const CHUNK_RELOAD_GUARD_KEY = "scoreai:chunk-reload-ts";

const isChunkLoadError = (message: string) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk/i.test(
    message
  );

const reloadOnceForChunkError = () => {
  try {
    const now = Date.now();
    const previous = Number(sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY) ?? "0");
    if (!Number.isFinite(previous) || now - previous > 10_000) {
      sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, String(now));
      window.location.reload();
      return true;
    }
  } catch {
    // ignore storage access issues
  }
  return false;
};

window.addEventListener("error", (event) => {
  const message = String(event.error?.message ?? event.message ?? "");
  if (isChunkLoadError(message)) {
    reloadOnceForChunkError();
  }
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const message = String(typeof reason === "string" ? reason : reason?.message ?? "");
  if (isChunkLoadError(message)) {
    const reloading = reloadOnceForChunkError();
    if (reloading) {
      event.preventDefault();
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
