const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSpeedDial: () => ipcRenderer.invoke('get-speed-dial'),
  saveContent: (tags) => ipcRenderer.invoke('save-content', tags),
  hide: () => ipcRenderer.invoke('save-hide'),
  openSettingsWindow: () => ipcRenderer.invoke('open-settings-window'),
});
