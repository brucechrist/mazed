const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  setWindowSize: (width, height) => ipcRenderer.invoke('set-window-size', width, height),
  getSavedWindowSize: () => ipcRenderer.invoke('get-saved-window-size'),
});
