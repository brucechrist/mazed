const { contextBridge, ipcRenderer } = require('electron');

/* ================================
   Existing electronAPI (unchanged)
   ================================ */
contextBridge.exposeInMainWorld('electronAPI', {
  onGoHome: (callback) => ipcRenderer.on('go-home', callback),
  onDisconnect: (callback) => ipcRenderer.on('disconnect', callback),
  onActivity: (callback) => ipcRenderer.on('activity', callback),
  setWindowSize: (width, height) => ipcRenderer.invoke('set-window-size', { width, height }),
  toggleWindow: () => ipcRenderer.invoke('toggle-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  readPalette: () => ipcRenderer.invoke('read-palette'),
  writePalette: (colors) => ipcRenderer.invoke('write-palette', colors),
  saveLibraryImage: (id, dataUrl, mimeType) =>
    ipcRenderer.invoke('library-save-image', { id, dataUrl, mimeType }),
  loadLibraryImage: (id) => ipcRenderer.invoke('library-load-image', id),
  deleteLibraryImage: (id) => ipcRenderer.invoke('library-delete-image', id),
});

/* =================================
   Unity embed API (new, minimal)
   - expects a <div id="unity-panel"> in the page
   - reports its rect to main for true embedding
   ================================= */

function getPanelEl() {
  return document.getElementById('unity-panel');
}

function getPanelRect() {
  const el = getPanelEl();
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const scale = Number(window.devicePixelRatio) || 1;
  return {
    left: Math.round(r.left * scale),
    top: Math.round(r.top * scale),
    width: Math.max(0, Math.round(r.width * scale)),
    height: Math.max(0, Math.round(r.height * scale)),
    scale,
  };
}

/** Ensure DOM is ready and the panel exists */
async function ensurePanel() {
  if (getPanelEl()) return true;
  if (document.readyState === 'loading') {
    await new Promise((res) => window.addEventListener('DOMContentLoaded', res, { once: true }));
  }
  return !!getPanelEl();
}

let ro = null;
function startObservingPanel() {
  if (ro) return; // already observing
  const el = getPanelEl();
  if (!el) return;
  ro = new ResizeObserver(() => {
    const rect = getPanelRect();
    if (rect) ipcRenderer.send('unity:panel-resize', rect);
  });
  ro.observe(el);
  // If your layout can scroll, keep main in sync on scroll too
  window.addEventListener(
    'scroll',
    () => {
      const rect = getPanelRect();
      if (rect) ipcRenderer.send('unity:panel-resize', rect);
    },
    { passive: true }
  );
}

contextBridge.exposeInMainWorld('unity', {
  /** Mount Unity into the #unity-panel (creates observer + sends initial rect) */
  mount: async () => {
    const ok = await ensurePanel();
    if (!ok) throw new Error('unity-panel not found in DOM');
    startObservingPanel();
    const rect = getPanelRect();
    if (!rect) throw new Error('Failed to measure unity-panel');
    ipcRenderer.send('unity:panel-resize', rect);
    return ipcRenderer.invoke('unity:mount', rect);
  },
  /** Hide the embedded Unity view */
  hide: () => ipcRenderer.invoke('unity:hide'),
  /** Kill the Unity process (you can relaunch later by calling mount again) */
  quit: () => ipcRenderer.invoke('unity:quit'),
});
