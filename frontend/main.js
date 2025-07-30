import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function createWindow() {
    const win = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        }
    });
    let appUrl;
    if (isDev) {
        appUrl = 'http://localhost:5173';
    }
    else {
        appUrl = `file://${path.join(__dirname, 'dist', 'index.html')}`;
    }
    console.log('DEBUG (BUILD): Attempting to load URL:', appUrl); // Mantenha este log
    win.loadURL(appUrl);
    if (isDev) {
        win.webContents.openDevTools();
    }
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
ipcMain.handle('process-files', async (event, pdfPath, excelPath) => {
    const rootBackendPath = path.join(__dirname, '..', '..');
    console.log('Root Backend Path:', rootBackendPath);
    let pythonResult = '';
    let nodeJsResult = '';
    try {
        const pythonScriptPath = path.join(rootBackendPath, 'src', 'PYTHON', 'dividir_pdf_todos_da_pasta.py');
        console.log("Chamando Python:", pythonScriptPath, "com PDF:", pdfPath);
        const pythonProcess = spawn('python', [pythonScriptPath, pdfPath]);
        await new Promise((resolve, reject) => {
            pythonProcess.stdout.on('data', (data) => {
                pythonResult += data.toString();
            });
            pythonProcess.stderr.on('data', (data) => {
                console.error(`Erro no Python: ${data}`);
            });
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Script Python falhou com código ${code}`));
                }
                else {
                    resolve(null);
                }
            });
        });
        pythonResult = pythonResult.trim();
        console.log("Resultado do Python:", pythonResult);
        const nodeJsScriptPath = path.join(rootBackendPath, 'src', 'JS', 'index.cjs');
        console.log("Chamando Node.js:", nodeJsScriptPath, "com resultado Python:", pythonResult, "e Excel:", excelPath);
        const nodeJsProcess = spawn('node', [nodeJsScriptPath, pythonResult, excelPath]);
        await new Promise((resolve, reject) => {
            nodeJsProcess.stdout.on('data', (data) => {
                nodeJsResult += data.toString();
            });
            nodeJsProcess.stderr.on('data', (data) => {
                console.error(`Node.js stderr: ${data}`);
            });
            nodeJsProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Script Node.js falhou com código ${code}`));
                }
                else {
                    resolve(null);
                }
            });
        });
        nodeJsResult = nodeJsResult.trim();
        console.log("Resultado do Node.js:", nodeJsResult);
        return { success: true, message: nodeJsResult };
    }
    catch (error) {
        const err = error;
        console.error("Erro na orquestração:", err);
        return { success: false, message: `Erro: ${err.message}` };
    }
});
ipcMain.handle('dialog:openFile', async (event, filters) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: filters
    });
    if (!canceled && filePaths.length > 0) {
        return filePaths[0];
    }
    return null;
});
