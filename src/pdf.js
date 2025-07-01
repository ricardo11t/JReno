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

        // Lista de expressões regulares para os diferentes formatos de comprovante
        const regexesParaTentar = [
            /VALOR COBRADO\s+([\d.,]+)/i, // Formato 1: "VALOR COBRADO 10.676,03"
            /VALOR:\s+([\d.,]+)/i,         // Formato 2: "VALOR: 63.000,00"
            /VALOR:\s+R\$\s+([\d.,]+)/i, // Formato 3: "VALOR: R$ 112,00"
        ];

        let match = null;
        // Tenta cada regex da lista até encontrar uma correspondência
        for (const regex of regexesParaTentar) {
            match = textoPDF.match(regex);
            if (match) {
                break; // Se encontrou, para o loop
            }
        }

        if (match && match[1]) {
            let valorEncontrado = match[1]; // Ex: "10.676,03" ou "63.000,00"

            // Converte o valor para um formato numérico padrão (removendo pontos e trocando vírgula)
            valorEncontrado = valorEncontrado.replace(/\./g, '').replace(',', '.');

            const valorNumerico = parseFloat(valorEncontrado);

            return valorNumerico;
        } else {
            console.log(`Nenhum padrão de valor conhecido foi encontrado no PDF: ${caminho}.`);
            return null;
        }
    } catch (err) {
        console.error(`Erro ao extrair valor do PDF '${caminho}':`, err.message);
        return null;
    }
}