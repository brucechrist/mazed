const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onGoHome: (callback) => ipcRenderer.on('go-home', callback),
  onDisconnect: (callback) => ipcRenderer.on('disconnect', callback),
  onActivity: (callback) => ipcRenderer.on('activity', callback),
  setWindowSize: (width, height) => ipcRenderer.invoke('set-window-size', { width, height }),
});
