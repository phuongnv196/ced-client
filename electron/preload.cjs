const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    invoke: (channel, data) => ipcRenderer.invoke(channel, data)
});

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
});
