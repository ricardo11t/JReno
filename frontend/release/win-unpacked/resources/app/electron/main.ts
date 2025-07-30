import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent, dialog } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';
// REMOVIDO: import * as log from 'electron-log'; // electron-log foi removido para evitar problemas de inicialização

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

    let appUrl: string;
    // NOVO: Use app.isPackaged para determinar o ambiente
    if (!app.isPackaged) { // Se NÃO estiver empacotado (estiver em desenvolvimento)
        appUrl = 'http://localhost:5173';
    } else { // Se estiver empacotado (produção)
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

    if (!app.isPackaged) { // NOVO: Use !app.isPackaged para abrir DevTools em desenvolvimento
        win.webContents.openDevTools();
    }
}


app.whenReady().then(createWindow).catch(console.error); // Usando console.error

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

// =========================================================================================
// IPC Main Handlers - Comunicação entre o processo de Renderização (React) e o Principal (Electron)
// =========================================================================================

ipcMain.handle('process-files', async (event: IpcMainInvokeEvent, pdfPath: string, excelPath: string) => {
    let baseForBackendScripts: string; // Variável que armazenará o caminho base para os scripts de backend
    let pathToPopplerBin: string;    // Variável para o caminho dos binários do Poppler

    if (!app.isPackaged) {
        baseForBackendScripts = path.join(__dirname, '..', '..', 'src');
        pathToPopplerBin = path.join(__dirname, '..', '..', 'resources', 'poppler', 'win64');
    } else {
        baseForBackendScripts = path.join(app.getAppPath(), 'src');
        pathToPopplerBin = path.join(app.getAppPath(), 'poppler', 'win64');
    }

    console.log('Base For Backend Scripts Calculado:', baseForBackendScripts);
    console.log('Path to Poppler Bin Calculado:', pathToPopplerBin);

    let dividirPdfResult = '';
    let nodeJsResult = '';

    try {
        const dividirPdfScriptPath = path.join(baseForBackendScripts, 'JS', 'dividir_pdf.cjs');
        console.log("Chamando Node.js (dividir_pdf.cjs):", dividirPdfScriptPath, "com PDF:", pdfPath);
        const nodePdfProcess = spawn('node', [dividirPdfScriptPath, pdfPath]);

        await new Promise<void>((resolve, reject) => {
            nodePdfProcess.stdout.on('data', (data: Buffer) => {
                dividirPdfResult += data.toString();
            });
            nodePdfProcess.stderr.on('data', (data: Buffer) => {
                console.error(`Erro no Node.js (dividir_pdf.cjs stderr): ${data}`);
            });
            nodePdfProcess.on('close', (code: number) => {
                if (code !== 0) {
                    reject(new Error(`Script Node.js (dividir_pdf.cjs) falhou com código ${code}. Output: ${dividirPdfResult || 'Nenhum output.'}`));
                } else {
                    resolve();
                }
            });
        });
        dividirPdfResult = dividirPdfResult.trim();
        console.log("Resultado da Divisão de PDF (stdout):", dividirPdfResult);
        console.log("Valor de dividirPdfResult antes de chamar index.cjs:", dividirPdfResult);

        // 2. Chamando o script Node.js principal (index.cjs)
        // Passando o resultado da divisão do PDF (pasta) e o caminho do Excel
        const nodeJsScriptPath = path.join(baseForBackendScripts, 'JS', 'index.cjs');
        console.log("Chamando Node.js (index.cjs):", nodeJsScriptPath, "com resultado da divisão:", dividirPdfResult, "e Excel:", excelPath, "e Poppler Bin:", pathToPopplerBin);
        const nodeJsProcess = spawn('node', [nodeJsScriptPath, dividirPdfResult, excelPath, pathToPopplerBin]);

        await new Promise<void>((resolve, reject) => {
            nodeJsProcess.stdout.on('data', (data: Buffer) => {
                nodeJsResult += data.toString();
            });
            nodeJsProcess.stderr.on('data', (data: Buffer) => {
                console.error(`Erro no Node.js (index.cjs stderr): ${data}`);
            });
            nodeJsProcess.on('close', (code: number) => {
                if (code !== 0) {
                    reject(new Error(`Script Node.js (index.cjs) falhou com código ${code}. Output: ${nodeJsResult || 'Nenhum output.'}`));
                } else {
                    resolve();
                }
            });
        });
        nodeJsResult = nodeJsResult.trim();
        console.log("Resultado Final do Node.js (stdout):", nodeJsResult);

        return { success: true, message: nodeJsResult };
    } catch (error: unknown) {
        const err = error as Error;
        console.error("Erro na orquestração:", err);
        return { success: false, message: `Erro na orquestração: ${err.message}` };
    }
});

// Handler para abrir o diálogo de seleção de arquivo
ipcMain.handle('dialog:openFile', async (event: IpcMainInvokeEvent, filters: Electron.FileFilter[]) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'], // Apenas permite selecionar arquivos
        filters: filters           // Aplica os filtros de tipo de arquivo
    });

    if (!canceled && filePaths.length > 0) {
        return filePaths[0]; // Retorna o caminho completo do arquivo selecionado
    }
    return null; // Retorna null se a seleção for cancelada
});