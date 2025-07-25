import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export async function encontrarValorDoComprovante(caminho) {
    try {
        if (!fs.existsSync(caminho)) {
            console.error(`Arquivo PDF não encontrado: ${caminho}`);
            return null;
        }

        const dataBuffer = fs.readFileSync(caminho);
        const data = await pdf(dataBuffer);
        const textoPDF = data.text;

        const regexesParaTentar = [
            /VALOR COBRADO\s+([\d.,]+)/i,
            /VALOR:\s+([\d.,]+)/i,
            /VALOR:\s+R\$\s+([\d.,]+)/i,
            /VALOR TOTAL\s+([\d.,]+)/i
        ];

        // --- CORREÇÃO APLICADA AQUI ---
        // A regex agora é específica para o formato DD/MM/YYYY, evitando capturar texto extra.
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
            if (match) {
                break;
            }
        }

        let matchData = null;
        for (const regex of regexesParaTentarData) {
            matchData = textoPDF.match(regex);
            if (matchData) {
                break;
            }
        }

        if (match && match[1] && matchData && matchData[1]) {
            let valorEncontrado = match[1];
            let dataEncontrada = matchData[1];

            valorEncontrado = valorEncontrado.replace(/\./g, '').replace(',', '.');
            const valorNumerico = parseFloat(valorEncontrado);
            const dataFormatada = dataEncontrada.replace(/\//g, '').trim();

            return {
                valor: valorNumerico,
                data: dataFormatada
            };
            
        } else {
            console.log(`Nenhum padrão de valor e data conhecido foi encontrado no PDF: ${caminho}.`);
            return null;
        }
    } catch (err) {
        console.error(`Erro ao extrair valor do PDF '${caminho}':`, err.message);
        return null;
    }
}