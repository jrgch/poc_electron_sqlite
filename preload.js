const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getPersonas: () => ipcRenderer.invoke('get-personas'),
    addPersona: (persona) => ipcRenderer.invoke('add-persona', persona),
});