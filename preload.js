// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  getSavedContent: (params) => ipcRenderer.invoke('get-saved-content', params),
  deleteContent: (id) => ipcRenderer.invoke('delete-content', id),
  getTags: () => ipcRenderer.invoke('get-tags'),
});
