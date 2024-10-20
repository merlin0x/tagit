const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  getSavedContent: (params) => ipcRenderer.invoke('get-saved-content', params),
  deleteContent: (id) => ipcRenderer.invoke('delete-content', id),
  getTags: () => ipcRenderer.invoke('get-tags'),
  hide: () => ipcRenderer.invoke('view-hide'),
  openSettingsWindow: () => ipcRenderer.invoke('open-settings-window'),
  updateTagState: (contentId, tag, state) => ipcRenderer.invoke('update-tag-state', contentId, tag, state),
});
