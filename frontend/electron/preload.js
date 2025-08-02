const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    processFiles: (pdfPath, excelPath) => ipcRenderer.invoke('process-files', pdfPath, excelPath),
    openFile: (filters) => ipcRenderer.invoke('dialog:openFile', filters)
});