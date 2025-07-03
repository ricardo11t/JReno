// index.js (versão atualizada)

import { encontrarNFeFORNECEDOR } from "./excel.js";
import { encontrarValorDoComprovante } from "./pdf.js";
import fs from 'fs';
import path from 'path';

const caminhoRelatorio = 'C:\\Users\\ricardo.hl\\Desktop\\relatorio isgh maio 2025\\data-grid.xlsx';
const pastaAlvo = 'C:\\Users\\ricardo.hl\\Desktop\\teste';
const prefixoNovoNome = 'COMP. NF';

async function main(pastaDosComprovantes, caminhoDoRelatorio, prefixo) {
    // Array para guardar informações para o relatório final
    const arquivosNaoRenomeadosPorDuplicidade = [];

    try {
        const arquivos = await fs.promises.readdir(pastaDosComprovantes);

        for (const arquivo of arquivos) {
            const caminhoAntigo = path.join(pastaDosComprovantes, arquivo);

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
                continue;
            }

            if (valor === null) {
                console.log(`[${arquivo}] Pulando renomeação: Não foi possível extrair o valor do PDF.`);
                continue;
            }

            // 2. Encontrar NF e Fornecedor no Excel
            const resultadoExcel = await encontrarNFeFORNECEDOR(valor, caminhoDoRelatorio);

            // 3. Decidir o que fazer com base no resultado do Excel
            if (resultadoExcel.status === 'success') {
                const dataExcel = resultadoExcel.data;
                const nf = dataExcel.nf;
                const fornecedor = dataExcel.fornecedor;
                const extensao = path.extname(arquivo);

                const nomeNf = String(nf).replace(/[\/\\?%*:|"<>]/g, '_');
                const nomeFornecedor = String(fornecedor).replace(/[\/\\?%*:|"<>]/g, '_');

                const novoNome = `${prefixo}${nomeNf} ${nomeFornecedor}${extensao}`;
                const caminhoNovo = path.join(pastaDosComprovantes, novoNome);

                // Renomear o arquivo
                try {
                    if (caminhoAntigo !== caminhoNovo) {
                        await fs.promises.rename(caminhoAntigo, caminhoNovo);
                        console.log(`[${arquivo}] Renomeado para: ${novoNome}`);
                    } else {
                        console.log(`[${arquivo}] O arquivo já tem o nome desejado: ${novoNome}`);
                    }
                } catch (err) {
                    console.error(`[${arquivo}] Erro ao renomear para ${novoNome}: ${err.message}`);
                }

            } else if (resultadoExcel.status === 'duplicate') {
                // Adiciona os dados ao array para o relatório final
                arquivosNaoRenomeadosPorDuplicidade.push({
                    arquivo: arquivo,
                    valor: resultadoExcel.value,
                    ocorrencias: resultadoExcel.duplicates
                });
                console.log(`[${arquivo}] PULAR RENOMEAÇÃO. Motivo: Valor ${resultadoExcel.value} encontrado em múltiplas linhas.`);

            } else { // 'not_found' ou 'error'
                console.log(`[${arquivo}] PULAR RENOMEAÇÃO. Motivo: ${resultadoExcel.message || 'Dados não encontrados no Excel.'}`);
            }
        }

        console.log('\nProcessamento de todos os arquivos concluído.');

        // --- RELATÓRIO FINAL ---
        if (arquivosNaoRenomeadosPorDuplicidade.length > 0) {
            console.log('\n\n===================================================================');
            console.log('RELATÓRIO DE ARQUIVOS NÃO RENOMEADOS POR DUPLICIDADE DE VALOR');
            console.log('===================================================================');
            console.log('Os seguintes arquivos não foram renomeados porque seus valores correspondem a múltiplas entradas no arquivo Excel:');

            for (const item of arquivosNaoRenomeadosPorDuplicidade) {
                console.log(`\n-------------------------------------------------------------------`);
                console.log(` -> Arquivo Original: ${item.arquivo}`);
                console.log(` -> Valor Duplicado: ${item.valor}`);
                console.log(` -> Encontrado nas seguintes linhas do Excel:`);
                for (const ocorrencia of item.ocorrencias) {
                    console.log(`    - Linha ${ocorrencia.linha}: NF = ${ocorrencia.nf}, Fornecedor = ${ocorrencia.fornecedor}`);
                }
            }
            console.log('\n===================================================================');
        }

    } catch (err) {
        console.error('Erro geral ao ler a pasta de comprovantes:', err);
    }
}

main(pastaAlvo, caminhoRelatorio, prefixoNovoNome);