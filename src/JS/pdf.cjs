const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function encontrarValorDoComprovante(caminho, popplerBinPath) {
    try {
        if (!fs.existsSync(caminho)) {
            console.error(`Erro: Arquivo PDF não encontrado: ${caminho}`);
            return null;
        }

        const pdftotextExecutable = path.join(popplerBinPath, 'pdftotext.exe');

        if (!fs.existsSync(pdftotextExecutable)) {
            console.error(`Erro: Executável pdftotext não encontrado em: ${pdftotextExecutable}`);
            return null;
        }

        const pdfinfoExecutable = path.join(popplerBinPath, 'pdfinfo.exe');
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
            return null;
        }

        console.error(`Processando '${path.basename(caminho)}' - Total de páginas: ${totalPages}`);

        for (let i = 1; i <= totalPages; i++) {
            const args = ['-f', i.toString(), '-l', i.toString(), '-pdf', caminho, path.join(path.dirname(caminho), `pagina_${i}.pdf`)];
            const child = spawn(pdftotextExecutable, args);
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
        const pdftotextExtractorExecutable = path.join(popplerBinPath, 'pdftotext.exe'); // <-- pdftotext para EXTRAÇÃO
        if (!fs.existsSync(pdftotextExtractorExecutable)) {
            console.error(`Erro: Executável pdftotext não encontrado em: ${pdftotextExtractorExecutable}`);
            return null;
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