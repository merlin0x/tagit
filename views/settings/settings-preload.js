const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (data) => ipcRenderer.invoke('save-config', data),
  getSpeedDial: () => ipcRenderer.invoke('get-speed-dial'),
  saveSpeedDial: (data) => ipcRenderer.invoke('save-speed-dial', data),
});
