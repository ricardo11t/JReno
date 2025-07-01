import { encontrarNFeFORNECEDOR } from "./excel.js";
import { encontrarValorDoComprovante } from "./pdf.js";
import fs from 'fs';
import path from 'path';

const caminhoRelatorio = 'C:\\Users\\USER\\Desktop\\excel\\relatorio_limpo.xlsx';
const pastaAlvo = 'C:\\Users\\USER\\Desktop\\teste';
const prefixoNovoNome = 'COMP. NF';

async function main(pastaDosComprovantes, caminhoDoRelatorio, prefixo) {
    // fs.readdir é assíncrono. Precisamos envolvê-lo em uma Promise ou usar fs.promises.readdir
    // Usar fs.promises.readdir é mais moderno e simplifica o código com async/await.
    try {
        const arquivos = await fs.promises.readdir(pastaDosComprovantes);

        // Usar for...of para iterar sobre arquivos, pois contém operações assíncronas
        for (const arquivo of arquivos) {
            const caminhoAntigo = path.join(pastaDosComprovantes, arquivo);

            // Adicionar filtro para processar apenas PDFs (ou os arquivos que você espera)
            if (path.extname(arquivo).toLowerCase() !== '.pdf') {
                console.log(`Pulando arquivo não-PDF: ${arquivo}`);
                continue;
            }

            // 1. Encontrar valor do comprovante no PDF
            let valor;
            try {
                valor = await encontrarValorDoComprovante(caminhoAntigo);
                console.log(`[${arquivo}] Valor do comprovante extraído do PDF: ${valor}`);
            } catch (e) {
                console.error(`[${arquivo}] Erro ao processar PDF: ${e.message}`);
                continue; // Pula para o próximo arquivo se houver erro no PDF
            }

            if (valor === null) {
                console.log(`[${arquivo}] Pulando renomeação: Não foi possível extrair o valor do PDF.`);
                continue; // Pula se o valor não foi encontrado ou se o PDF estava inválido
            }

            // 2. Encontrar NF e Fornecedor no Excel
            let dataExcel;
            try {
                dataExcel = await encontrarNFeFORNECEDOR(valor, caminhoDoRelatorio);
                console.log(`[${arquivo}] Dados do Excel para valor '${valor}': NF=${dataExcel?.nf}, Fornecedor=${dataExcel?.fornecedor}`);
            } catch (e) {
                console.error(`[${arquivo}] Erro ao buscar no Excel para o valor ${valor}: ${e.message}`);
                continue; // Pula para o próximo arquivo se houver erro no Excel
            }

            if (dataExcel === null || !dataExcel.nf || !dataExcel.fornecedor) {
                console.log(`[${arquivo}] Pulando renomeação: NF ou Fornecedor ausentes/inválidos no Excel para o valor ${valor}.`);
                continue; // Pula se NF ou Fornecedor não foram encontrados ou são inválidos
            }

            const nf = dataExcel.nf;
            const fornecedor = dataExcel.fornecedor;
            const extensao = path.extname(arquivo);

            // Garante que nf e fornecedor sejam strings e escapa caracteres inválidos para nomes de arquivo
            const nomeNf = String(nf).replace(/[\/\\?%*:|"<>]/g, '_');
            const nomeFornecedor = String(fornecedor).replace(/[\/\\?%*:|"<>]/g, '_');

            const novoNome = `${prefixo}${nomeNf} ${nomeFornecedor}${extensao}`;
            const caminhoNovo = path.join(pastaDosComprovantes, novoNome);

            // 3. Renomear o arquivo
            try {
                // Verifique se o novo nome de arquivo não é o mesmo que o antigo
                // para evitar um erro se o arquivo já estiver renomeado
                if (caminhoAntigo !== caminhoNovo) {
                    await fs.promises.rename(caminhoAntigo, caminhoNovo);
                    console.log(`[${arquivo}] Renomeado para: ${novoNome}`);
                } else {
                    console.log(`[${arquivo}] O arquivo já tem o nome desejado: ${novoNome}`);
                }
            } catch (err) {
                console.error(`[${arquivo}] Erro ao renomear para ${novoNome}: ${err.message}`);
                // Adicione verificação específica para EBUSY, se for um problema recorrente
                if (err.code === 'EBUSY') {
                    console.error(`[${arquivo}] Arquivo ocupado ou bloqueado. Por favor, feche qualquer programa que esteja usando-o.`);
                }
            }
        }
        console.log('Processamento de arquivos concluído.');

    } catch (err) {
        console.error('Erro geral ao ler a pasta de comprovantes:', err);
    }
}

main(pastaAlvo, caminhoRelatorio, prefixoNovoNome);
