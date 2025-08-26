import React, { useState } from 'react';
import SideBar from '../components/SideBar';
declare global {
  interface Window {
    api: {
      processFiles: (pdfPath: string, excelPath: string) => Promise<{ success: boolean; message: string }>;
      openFile: (filters: { name: string; extensions: string[] }[]) => Promise<string | null>;
    };
  }
}

export default function RenomearArquivos() {
  const [pdfPath, setPdfPath] = useState('');
  const [excelPath, setExcelPath] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!pdfPath || !excelPath) {
      setResult('Por favor, selecione ambos os arquivos.');
      return;
    }

    setLoading(true);
    setResult('Processando...');

    try {
      const response = await window.api.processFiles(pdfPath, excelPath);

      if (response.success) {
        setResult(`Sucesso: ${response.message}`);
      } else {
        setResult(`Erro: ${response.message}`);
      }
    } catch (error: any) {
      setResult(`Erro inesperado: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPdfFile = async () => {
    const filters = [{ name: 'PDFs', extensions: ['pdf'] }];
    const filePath = await window.api.openFile(filters);
    if (filePath) {
      setPdfPath(filePath);
    }
  };

  const handleOpenExcelFile = async () => {
    const filters = [{ name: 'Excel Files', extensions: ['xls', 'xlsx'] }];
    const filePath = await window.api.openFile(filters);
    if (filePath) {
      setExcelPath(filePath);
    }
  };

  return (
    <>
      <SideBar />
      <div className="bg-vscode-bg text-vscode-text flex p-4 md:pl-20">
        <div>Versão 0.0.4</div>
      </div>
      <div className="min-h-screen bg-vscode-bg text-vscode-text flex items-center justify-center p-4 md:pl-20">

        <div className="bg-vscode-card p-8 rounded-lg shadow-2xl w-full max-w-2xl border border-vscode-border">

          <div className="flex justify-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-vscode-blue text-center">
              Renomear Comprovantes para Fluig
            </h1>
          </div>

          <div className="flex flex-col md:flex-row justify-evenly gap-6 mb-8">
            <div className="flex-1 min-w-0">
              <label className="block text-lg font-medium mb-2 text-vscode-text-light">Arquivo PDF:</label>
              <button
                onClick={handleOpenPdfFile}
                className="w-full bg-vscode-button hover:bg-vscode-button-hover text-vscode-button-text font-semibold py-2 px-4 rounded-md shadow-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-vscode-blue focus:ring-offset-2 focus:ring-offset-vscode-card"
              >
                Procurar PDF
              </button>
              <p className="mt-2 text-sm text-vscode-text-placeholder truncate" title={pdfPath}>
                {pdfPath || 'Nenhum PDF selecionado'}
              </p>
            </div>

            <div className="flex-1 min-w-0">
              <label className="block text-lg font-medium mb-2 text-vscode-text-light">Arquivo Excel:</label>
              <button
                onClick={handleOpenExcelFile}
                className="w-full bg-vscode-button hover:bg-vscode-button-hover text-vscode-button-text font-semibold py-2 px-4 rounded-md shadow-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-vscode-blue focus:ring-offset-2 focus:ring-offset-vscode-card"
              >
                Procurar Excel
              </button>
              <p className="mt-2 text-sm text-vscode-text-placeholder truncate" title={excelPath}>
                {excelPath || 'Nenhum Excel selecionado'}
              </p>
            </div>
          </div>

          <div className="flex justify-center mb-8">
            <button
              onClick={handleProcess}
              disabled={loading || !pdfPath || !excelPath}
              className="w-full md:w-auto bg-vscode-blue hover:bg-vscode-blue-hover text-white font-bold py-3 px-8 rounded-lg shadow-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-vscode-blue focus:ring-offset-2 focus:ring-offset-vscode-card"
            >
              {loading ? 'Processando...' : 'Processar Arquivos'}
            </button>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-vscode-input border border-vscode-border rounded-md shadow-inner max-h-60 overflow-y-auto">
              <h3 className="text-xl font-semibold mb-2 text-vscode-blue">Resultado:</h3>
              <pre className="text-vscode-text text-sm whitespace-pre-wrap break-words">{result}</pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
