import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';
import updater from 'electron-updater';
const autoUpdater = updater.autoUpdater;
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function createWindow() {
    console.log('App starting...');
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
    if (!app.isPackaged) {
        appUrl = 'http://localhost:5173';
    }
    else {
        const appRootPath = app.getAppPath();
        appUrl = `file://${path.join(appRootPath, 'dist', 'index.html')}`;
    }
    console.log('DEBUG (BUILD): Attempting to load URL:', appUrl);
    win.loadURL(appUrl)
        .then(() => {
        console.log('URL loaded successfully!');
    })
        .catch((err) => {
        console.error('Failed to load URL:', err);
    });
    if (!app.isPackaged) {
        win.webContents.openDevTools();
    }
}
app.whenReady().then(createWindow).catch(console.error);
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
autoUpdater.on('update-available', (info) => {
    console.log(`Atualização disponível! Versão: ${info.version}`);
});
autoUpdater.on('update-downloaded', () => {
    console.log('Atualização baixada. O aplicativo será reiniciado para instalar.');
    autoUpdater.quitAndInstall();
});
autoUpdater.on('error', (error) => {
    console.error('Erro no autoUpdater:', error);
});
ipcMain.handle('process-files', async (event, pdfPath, excelPath) => {
    let baseForBackendScripts;
    let pathToPopplerBin;
    let pathToNodExecutable;
    if (!app.isPackaged) {
        baseForBackendScripts = path.join(__dirname, '..', '..', 'src');
        pathToPopplerBin = path.join(__dirname, '..', '..', 'resources', 'poppler', 'win64');
        pathToNodExecutable = path.join(__dirname, '..', '..', 'resources', 'node_runtime', 'node.exe');
    }
    else {
        const appRootFolder = path.dirname(app.getPath('exe'));
        baseForBackendScripts = path.join(app.getAppPath(), 'src');
        pathToPopplerBin = path.join(appRootFolder, 'resources', 'poppler', 'win64');
        pathToNodExecutable = path.join(appRootFolder, 'resources', 'node_runtime', 'node.exe');
    }
    console.log('Base For Backend Scripts Calculado:', baseForBackendScripts);
    console.log('Path to Poppler Bin Calculado:', pathToPopplerBin);
    console.log('Path to Node Executable Calculado:', pathToNodExecutable);
    let dividirPdfResult = '';
    let nodeJsResult = '';
    try {
        const dividirPdfScriptPath = path.join(baseForBackendScripts, 'JS', 'dividir_pdf.cjs');
        console.log("Chamando Node.js (dividir_pdf.cjs):", dividirPdfScriptPath, "com PDF:", pdfPath);
        const nodePdfProcess = spawn(pathToNodExecutable, [dividirPdfScriptPath, pdfPath]);
        await new Promise((resolve, reject) => {
            nodePdfProcess.stdout.on('data', (data) => {
                dividirPdfResult += data.toString();
            });
            nodePdfProcess.stderr.on('data', (data) => {
                console.error(`Erro no Node.js (dividir_pdf.cjs stderr): ${data}`);
            });
            nodePdfProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Script Node.js (dividir_pdf.cjs) falhou com código ${code}. Output: ${dividirPdfResult || 'Nenhum output.'}`));
                }
                else {
                    resolve();
                }
            });
        });
        dividirPdfResult = dividirPdfResult.trim();
        console.log("Resultado da Divisão de PDF (stdout):", dividirPdfResult);
        console.log("Valor de dividirPdfResult antes de chamar index.cjs:", dividirPdfResult);
        const nodeJsScriptPath = path.join(baseForBackendScripts, 'JS', 'index.cjs');
        console.log("Chamando Node.js (index.cjs):", nodeJsScriptPath, "com resultado da divisão:", dividirPdfResult, "e Excel:", excelPath, "e Poppler Bin:", pathToPopplerBin);
        const nodeJsProcess = spawn(pathToNodExecutable, [nodeJsScriptPath, dividirPdfResult, excelPath, pathToPopplerBin]);
        await new Promise((resolve, reject) => {
            nodeJsProcess.stdout.on('data', (data) => {
                nodeJsResult += data.toString();
            });
            nodeJsProcess.stderr.on('data', (data) => {
                console.error(`Erro no Node.js (index.cjs stderr): ${data}`);
            });
            nodeJsProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Script Node.js (index.cjs) falhou com código ${code}. Output: ${nodeJsResult || 'Nenhum output.'}`));
                }
                else {
                    resolve();
                }
            });
        });
        nodeJsResult = nodeJsResult.trim();
        console.log("Resultado Final do Node.js (stdout):", nodeJsResult);
        return { success: true, message: nodeJsResult };
    }
    catch (error) {
        const err = error;
        console.error("Erro na orquestração:", err);
        return { success: false, message: `Erro na orquestração: ${err.message}` };
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
