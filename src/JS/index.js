import { encontrarNFeFORNECEDOR } from "./excel.js";
import { encontrarValorDoComprovante } from "./pdf.js";
import fs from 'fs';
import path from 'path';

const caminhoRelatorio = 'C:\\Users\\ricardo.hl\\Desktop\\relatorios\\relatorio armazem junho 2025\\data-grid.xlsx';
const pastaAlvo = 'C:\\Users\\ricardo.hl\\Desktop\\comprovantes\\comprovantes armazem junho 2025\\24072025 104425-Comprovantes-BB_dividido';
const prefixoNovoNome = 'COMP. NF';

async function obterCaminhoUnico(pasta, nomeBase, extensao) {
    let caminhoFinal = path.join(pasta, `${nomeBase}${extensao}`);
    let contador = 1;
    while (true) {
        try {
            await fs.promises.access(caminhoFinal);
            caminhoFinal = path.join(pasta, `${nomeBase} (${contador})${extensao}`);
            contador++;
        } catch (e) {
            return caminhoFinal;
        }
    }
}

async function main(pastaDosComprovantes, caminhoDoRelatorio, prefixo) {
    // --- LÓGICA DE RELATÓRIO APRIMORADA ---
    const arquivosComFalha = []; // Array para guardar TODOS os arquivos que falharam
    const memoriaNFsUtilizadas = new Map();

    try {
        const arquivos = await fs.promises.readdir(pastaDosComprovantes);
        const totalArquivos = arquivos.filter(a => path.extname(a).toLowerCase() === '.pdf').length;
        let arquivosProcessados = 0;

        for (const arquivo of arquivos) {
            const caminhoAntigo = path.join(pastaDosComprovantes, arquivo);

            if (path.extname(arquivo).toLowerCase() !== '.pdf') continue;
            
            arquivosProcessados++;
            console.log(`\nProcessando ${arquivosProcessados}/${totalArquivos}: ${arquivo}`);

            let result;
            try {
                result = await encontrarValorDoComprovante(caminhoAntigo);
            } catch (e) {
                console.error(`[${arquivo}] Erro CRÍTICO ao processar PDF: ${e.message}`);
                arquivosComFalha.push({ arquivo, motivo: 'Erro crítico na leitura do PDF.' });
                continue;
            }

            if (result === null) {
                console.log(`[PULANDO] Motivo: Não foi possível extrair os dados do PDF.`);
                arquivosComFalha.push({ arquivo, motivo: 'Não foi possível ler os dados do PDF (layout desconhecido).' });
                continue;
            }
            
            const resultadoExcel = await encontrarNFeFORNECEDOR(result, caminhoDoRelatorio, memoriaNFsUtilizadas);

            if (resultadoExcel.status === 'success') {
                const dataExcel = resultadoExcel.data;
                const nf = dataExcel.nf;
                let fornecedor = dataExcel.fornecedor;
                
                const fornecedorComSplit = fornecedor.split('/01-')[1];
                if (typeof fornecedorComSplit === "undefined") {
                    fornecedor = fornecedor.split('/00-')[1];
                } else {
                    fornecedor = fornecedor.split('/01-')[1];
                }
                if (!fornecedor) fornecedor = dataExcel.fornecedor;

                const extensao = path.extname(arquivo);
                const nomeNf = String(nf).replace(/[\/\\?%*:|"<>]/g, '_');
                const nomeFornecedor = String(fornecedor).replace(/[\/\\?%*:|"<>]/g, '_');
                const nomeBase = `${prefixo}${nomeNf} ${nomeFornecedor}`;
                const caminhoNovo = await obterCaminhoUnico(pastaDosComprovantes, nomeBase, extensao);
                const nomeFinal = path.basename(caminhoNovo);

                try {
                    if (caminhoAntigo !== caminhoNovo) {
                        await fs.promises.rename(caminhoAntigo, caminhoNovo);
                        console.log(`[SUCESSO] Renomeado para: ${nomeFinal}`);
                    }
                } catch (err) {
                    console.error(`[ERRO] Erro ao tentar renomear para ${nomeFinal}: ${err.message}`);
                    arquivosComFalha.push({ arquivo, motivo: `Erro no sistema ao tentar renomear.` });
                }
            } else {
                const motivo = resultadoExcel.message || 'Motivo não especificado.';
                console.log(`[PULANDO] Motivo: ${motivo}`);
                arquivosComFalha.push({ arquivo, motivo, detalhes: resultadoExcel });
            }
        }

        // --- NOVO RELATÓRIO FINAL COMPLETO ---
        console.log('\n\n===================================================================');
        console.log('               RELATÓRIO FINAL DE EXECUÇÃO');
        console.log('===================================================================');
        const arquivosRenomeados = totalArquivos - arquivosComFalha.length;
        console.log(`\nTotal de Comprovantes: ${totalArquivos}`);
        console.log(`Arquivos Renomeados com Sucesso: ${arquivosRenomeados}`);
        console.log(`Arquivos Não Renomeados: ${arquivosComFalha.length}`);

        if (arquivosComFalha.length > 0) {
            console.log('\n--- DIAGNÓSTICO DAS FALHAS ---');
            
            const falhasAgrupadas = arquivosComFalha.reduce((acc, falha) => {
                const motivo = falha.motivo;
                if (!acc[motivo]) acc[motivo] = [];
                acc[motivo].push(falha);
                return acc;
            }, {});

            for (const [motivo, falhas] of Object.entries(falhasAgrupadas)) {
                console.log(`\n[MOTIVO]: ${motivo} (${falhas.length} arquivos)`);
                
                // Caso especial para duplicatas, que têm um formato de detalhe rico
                if (motivo.includes('Duplicidade')) {
                     for (const falha of falhas) {
                        console.log(`  -> ${falha.arquivo} (Valor: ${falha.detalhes.value})`);
                        for(const ocorrencia of falha.detalhes.duplicates) {
                             console.log(`     - Linha ${ocorrencia.linha}: NF = ${ocorrencia.nf}, Fornecedor = ${ocorrencia.fornecedor}`);
                        }
                     }
                } else {
                    for (const falha of falhas) {
                        console.log(`  -> ${falha.arquivo}`);
                    }
                }
            }
        }
        console.log('\n===================================================================\n');


    } catch (err) {
        console.error('Erro GERAL e fatal ao processar a pasta:', err);
    }
}

main(pastaAlvo, caminhoRelatorio, prefixoNovoNome);