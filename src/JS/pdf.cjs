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

        console.error(`Processando '${path.basename(caminho)}' para extração de texto.`);

        const child = spawn(pdftotextExecutable, ['-raw', '-nopgbrk', caminho, '-']);
        let textoPDF = '';
        let errorOutput = '';

        child.stdout.on('data', (data) => {
            textoPDF += data.toString();
        });
        child.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

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
