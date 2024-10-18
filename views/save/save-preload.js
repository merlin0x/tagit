const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getTags: () => ipcRenderer.invoke('get-predefined-tags'),
  saveContent: (tags) => ipcRenderer.invoke('save-content', tags),
  hide: () => ipcRenderer.invoke('save-hide'),
  openSettingsWindow: () => ipcRenderer.invoke('open-settings-window'),
});
