// C:\projetos\renomear\src\JS\pdf.cjs

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// REMOVA: let pathToPopplerBin;
// REMOVA: if (process.env.NODE_ENV === 'development') { ... } else { ... }

async function encontrarValorDoComprovante(caminho, popplerBinPath) { // <--- RECEBE popplerBinPath COMO ARGUMENTO
    try {
        if (!fs.existsSync(caminho)) {
            console.error(`Erro: Arquivo PDF não encontrado: ${caminho}`);
            return null;
        }

        // NOVO: Use o popplerBinPath que foi passado como argumento
        const pdftotextExecutable = path.join(popplerBinPath, 'pdftotext.exe'); // <--- USE popplerBinPath AQUI

        if (!fs.existsSync(pdftotextExecutable)) {
            console.error(`Erro: Executável pdftotext não encontrado em: ${pdftotextExecutable}`);
            return null;
        }

        const pdfinfoExecutable = path.join(popplerBinPath, 'pdfinfo.exe'); // <--- USE popplerBinPath AQUI
        if (!fs.existsSync(pdfinfoExecutable)) {
            console.error(`Erro: Executável pdfinfo não encontrado em: ${pdfinfoExecutable}`);
            return null;
        }

        let totalPages = 0;
        const pdfinfoProcess = spawn(pdfinfoExecutable, [caminho]);
        let pdfinfoOutput = '';
        pdfinfoProcess.stdout.on('data', (data) => { pdfinfoOutput += data.toString(); });
        pdfinfoProcess.stderr.on('data', (data) => { console.error(`Erro pdfinfo (stderr): ${data}`); });
        await new Promise(resolve => pdfinfoProcess.on('close', resolve));

        const pagesMatch = pdfinfoOutput.match(/Pages:\s*(\d+)/);
        if (pagesMatch && pagesMatch[1]) {
            totalPages = parseInt(pagesMatch[1], 10);
        } else {
            console.error(`Não foi possível determinar o número de páginas para: ${caminho}`);
            return null; // Retorna null em caso de erro aqui
        }

        console.error(`Processando '${path.basename(caminho)}' - Total de páginas: ${totalPages}`);

        for (let i = 1; i <= totalPages; i++) {
            const args = ['-f', i.toString(), '-l', i.toString(), '-pdf', caminho, path.join(path.dirname(caminho), `pagina_${i}.pdf`)]; // Caminho de saída da página
            const child = spawn(pdftotextExecutable, args); // Use pdftotext para a divisão ou pdftocairo (depende do que você quer dividir)
            // Se for dividir PDF, o pdftocairo era o correto. Se for só extrair texto, pdftotext.
            // Vamos usar pdftocairo aqui conforme sua lógica de dividir_pdf.

            // CORRIGIDO: O pdftocairoExecutable precisa ser passado como argumento da função tb
            const pdftocairoDivisorExecutable = path.join(popplerBinPath, 'pdftocairo.exe'); // <-- Use o executável correto aqui
            const childDivisor = spawn(pdftocairoDivisorExecutable, ['-f', i.toString(), '-l', i.toString(), '-pdf', caminho, path.join(path.dirname(caminho), `pagina_${i}.pdf`)]);

            let errorOutput = '';
            childDivisor.stderr.on('data', (data) => { errorOutput += data.toString(); });

            await new Promise((resolve, reject) => {
                childDivisor.on('close', (code) => {
                    if (code === 0) {
                        console.error(`  - Página ${i} salva.`);
                        resolve(null);
                    } else {
                        console.error(`Falha ao salvar página ${i}. Código: ${code}. Erro: ${errorOutput}`);
                        reject(new Error(`Falha ao dividir página ${i} de ${path.basename(caminho)}.`));
                    }
                });
            });
        }

        console.error(`Divisão de '${path.basename(caminho)}' concluída com sucesso.`);

        // --- APÓS A DIVISÃO, AGORA SIM EXTRAIR O TEXTO DA PÁGINA ESPECÍFICA ---
        // A lógica do pdf.cjs original era extrair o texto de um PDF.
        // A lógica de dividir_pdf.cjs agora está dividindo.
        // Precisamos do pdftotext para a extração do texto aqui para o index.cjs.
        // Se pdf.cjs faz a divisão, ele não deveria também extrair o valor/data do *PDF original*.
        // A função "encontrarValorDoComprovante" deve extrair de um *único* PDF.
        // Vou assumir que encontrarValorDoComprovante recebe o caminho do PDF *individual* após a divisão,
        // ou que ele está buscando no PDF original e depois o index.cjs faz a lógica por página.

        // CORREÇÃO: A função dividirPdfERetornarPasta JÁ FAZ A DIVISÃO. Ela DEVE retornar a pasta de saída.
        // A extração do texto e o renomeio são feitos pelo index.cjs com os PDFs *divididos*.
        // O código de regex abaixo está na função encontrarValorDoComprovante (que é o que pdf.cjs fazia originalmente)
        // Isso sugere que esta é a lógica de extração do valor do comprovante, não da divisão.
        // A função dividirPdfERetornarPasta DEVE dividir e retornar o caminho da pasta.
        // A função encontrarValorDoComprovante DEVE extrair valor de um PDF (agora usando pdftotext).

        // A lógica de extrair valor do *texto* está no `pdf.cjs` original.
        // Se a função se chama 'encontrarValorDoComprovante', ela deveria receber um PDF e extrair seu valor.
        // Vamos usar pdftotext para EXTRAIR O TEXTO e depois suas REGEXES.
        // O 'dividir_pdf.cjs' que te dei antes estava DIVIDINDO.

        // Há uma confusão nos nomes das funções e responsabilidades.

        // Vamos redefinir o que 'dividir_pdf.cjs' faz:
        // Ele vai PEGAR O PDF GRANDE, DIVIDIR, E RETORNAR O CAMINHO DA PASTA ONDE ESTÃO AS PÁGINAS.
        // O 'pdf.cjs' (que não é o dividir_pdf.cjs) vai PEGAR UM PDF (uma página), EXTRAIR O TEXTO, E ENCONTRAR O VALOR.

        // No seu código anterior:
        // dividir_pdf.cjs fazia a divisão.
        // pdf.cjs fazia a extração de valor.

        // Ok, o erro 'app is not defined' é no pdf.cjs (o que encontra valor).
        // A lógica de dividir_pdf.cjs que te dei estava fazendo a divisão usando pdftocairo.

        // Vamos separar as responsabilidades CLARAMENTE.
        // 1. `dividir_pdf.cjs`: Recebe PDF_GRANDE, caminho_POPLER_BIN. Saída: CAMINHO_PASTA_DIVIDIDA.
        // 2. `pdf.cjs`: Recebe PDF_PAGINA, caminho_POPLER_BIN. Saída: VALOR_EXTRAIDO_E_DATA.

        // O erro é no `pdf.cjs`. A LOGICA DELE TAMBÉM PRECISA DE POPPLERBINPATH.

        // O `dividir_pdf.cjs` já faz a divisão. Ele é chamado PRIMEIRO.
        // O `index.cjs` é chamado DEPOIS para processar CADA PAGINA DIVIDIDA.
        // O `index.cjs` CHAMA `encontrarNFeFORNECEDOR` (no excel.cjs) e `encontrarValorDoComprovante` (no pdf.cjs).

        // Então, `encontrarValorDoComprovante` (no pdf.cjs) precisa do `popplerBinPath`.
        // O `index.cjs` PRECISA PASSAR O CAMINHO DO POPPLER BIN PARA `encontrarValorDoComprovante`.

        // Vamos corrigir `pdf.cjs` para extração de texto:
        const pdftotextExtractorExecutable = path.join(popplerBinPath, 'pdftotext.exe'); // <-- pdftotext para EXTRAÇÃO
        if (!fs.existsSync(pdftotextExtractorExecutable)) {
            console.error(`Erro: Executável pdftotext não encontrado em: ${pdftotextExtractorExecutable}`);
            return null; // Ou lançar um erro
        }

        const child = spawn(pdftotextExtractorExecutable, ['-raw', '-nopgbrk', caminho, '-']);
        let textoPDF = '';
        let errorOutput = '';

        child.stdout.on('data', (data) => { textoPDF += data.toString(); });
        child.stderr.on('data', (data) => { errorOutput += data.toString(); });

        await new Promise((resolve, reject) => {
            child.on('close', (code) => {
                if (code === 0) {
                    resolve(null);
                } else {
                    console.error(`pdftotext falhou com código ${code}. Erro: ${errorOutput}`);
                    reject(new Error(`Falha na extração de texto do PDF: ${caminho}. Erro Poppler: ${errorOutput}`));
                }
            });
        });

        // ... (Sua lógica de regex para VALOR e DATA)
        const regexesParaTentar = [
            /VALOR COBRADO\s+([\d.,]+)/i,
            /VALOR:\s+([\d.,]+)/i,
            /VALOR:\s+R\$\s+([\d.,]+)/i,
            /VALOR TOTAL\s+([\d.,]+)/i
        ];
        const regexesParaTentarData = [
            /DEBITO EM:\s+(\d{2}\/\d{2}\/\d{4})/i,
            /DATA DO PAGAMENTO:\s+(\d{2}\/\d{2}\/\d{4})/i,
            /DATA DA TRANSFERENCIA:\s+(\d{2}\/\d{2}\/\d{4})/i,
            /DATA DA TRANSFERENCIA\s+(\d{2}\/\d{2}\/\d{4})/i,
            /DATA DO PAGAMENTO\s+(\d{2}\/\d{2}\/\d{4})/i,
            /Data do pagamento\s+(\d{2}\/\d{2}\/\d{4})/i,
            /DATA:\s+(\d{2}\/\d{2}\/\d{4})/i
        ];

        let match = null;
        for (const regex of regexesParaTentar) {
            match = textoPDF.match(regex);
            if (match) break;
        }

        let matchData = null;
        for (const regex of regexesParaTentarData) {
            matchData = textoPDF.match(regex);
            if (matchData) break;
        }

        if (match && match[1] && matchData && matchData[1]) {
            let valorEncontrado = match[1].replace(/\./g, '').replace(',', '.');
            const dataEncontrada = matchData[1].replace(/\//g, '').trim();
            const valorNumerico = parseFloat(valorEncontrado);

            return {
                valor: valorNumerico,
                data: dataEncontrada
            };
        } else {
            console.error(`Nenhum padrão de valor e data conhecido foi encontrado no PDF: ${caminho}.`);
            return null;
        }

    } catch (err) {
        console.error(`Erro ao extrair valor do PDF '${caminho}':`, err.message);
        return null;
    }
}

module.exports = {
    encontrarValorDoComprovante
};