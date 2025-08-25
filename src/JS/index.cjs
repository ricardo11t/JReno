const { encontrarNFeFORNECEDOR } = require("./excel.cjs");
const { encontrarValorDoComprovante } = require("./pdf.cjs");
const fs = require('fs');
const path = require('path');
const pLimit = require('p-limit').default;

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

function formatarDataParaNomeArquivo(dataRaw) {
    let dataObj;

    if (dataRaw instanceof Date) {
        dataObj = dataRaw;
    } else if (typeof dataRaw === 'number') {
        dataObj = new Date(Date.UTC(1900, 0, dataRaw - 1));
    } else {
        return 'DATA_INVALIDA';
    }

    const ano = dataObj.getUTCFullYear();
    const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0'); // Adiciona +1 porque os meses começam do 0
    const dia = String(dataObj.getUTCDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
}


async function main(pastaDosComprovantes, caminhoDoRelatorio, prefixo, popplerBinPath) {
    const arquivosComFalha = [];
    const memoriaNFsUtilizadas = new Map();

    try {
        if (!fs.existsSync(pastaDosComprovantes)) {
            console.error(`Erro: A pasta dos comprovantes não existe: ${pastaDosComprovantes}`);
            return `Erro: Pasta dos comprovantes não encontrada: ${pastaDosComprovantes}`;
        }
        if (!fs.existsSync(caminhoDoRelatorio)) {
            console.error(`Erro: O arquivo do relatório Excel não existe: ${caminhoDoRelatorio}`);
            return `Erro: Relatório Excel não encontrado: ${caminhoDoRelatorio}`;
        }

        const arquivos = await fs.promises.readdir(pastaDosComprovantes);
        const pdfArquivos = arquivos.filter(a => path.extname(a).toLowerCase() === '.pdf');
        const totalArquivos = pdfArquivos.length;
        let arquivosProcessados = 0;

        const limit = pLimit(5);

        const tasks = pdfArquivos.map(arquivo => limit(async () => {
            const caminhoAntigo = path.join(pastaDosComprovantes, arquivo);

            arquivosProcessados++;
            console.error(`\nProcessando ${arquivosProcessados}/${totalArquivos}: ${arquivo}`);

            let result;
            try {
                result = await encontrarValorDoComprovante(caminhoAntigo, popplerBinPath);
            } catch (e) {
                console.error(`[${arquivo}] Erro CRÍTICO ao processar PDF: ${e.message}`);
                arquivosComFalha.push({ arquivo, motivo: 'Erro crítico na leitura do PDF.' });
                return;
            }

            if (result === null) {
                console.error(`[PULANDO] Motivo: Não foi possível extrair os dados do PDF.`);
                arquivosComFalha.push({ arquivo, motivo: 'Não foi possível ler os dados do PDF (layout desconhecido).' });
                return;
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

                const dataFormatada = formatarDataParaNomeArquivo(dataExcel.dataRaw);
                const nomeBase = `${dataFormatada} ${nomeFornecedor} NF_${nomeNf}`;

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
                console.error(`[PULANDO] Motivo: ${motivo}`);
                arquivosComFalha.push({ arquivo, motivo, detalhes: resultadoExcel });
            }
        }));

        await Promise.all(tasks);

        let relatorioFinal = '\n\n===================================================================\n';
        relatorioFinal += '                           RELATÓRIO FINAL DE EXECUÇÃO\n';
        relatorioFinal += '===================================================================\n';
        const arquivosRenomeados = totalArquivos - arquivosComFalha.length;
        relatorioFinal += `\nTotal de Comprovantes: ${totalArquivos}\n`;
        relatorioFinal += `Arquivos Renomeados com Sucesso: ${arquivosRenomeados}\n`;
        relatorioFinal += `Arquivos Não Renomeados: ${arquivosComFalha.length}\n`;

        if (arquivosComFalha.length > 0) {
            relatorioFinal += '\n--- DIAGNÓSTICO DAS FALHAS ---\n';

            const falhasAgrupadas = arquivosComFalha.reduce((acc, falha) => {
                const motivo = falha.motivo;
                if (!acc[motivo]) acc[motivo] = [];
                acc[motivo].push(falha);
                return acc;
            }, {});

            for (const [motivo, falhas] of Object.entries(falhasAgrupadas)) {
                relatorioFinal += `\n[MOTIVO]: ${motivo} (${falhas.length} arquivos)\n`;

                if (motivo.includes('Duplicidade')) {
                    for (const falha of falhas) {
                        relatorioFinal += `  -> ${falha.arquivo} (Valor: ${falha.detalhes.value})\n`;
                        for (const ocorrencia of falha.detalhes.duplicates) {
                            relatorioFinal += `     - Linha ${ocorrencia.linha}: NF = ${ocorrencia.nf}, Fornecedor = ${ocorrencia.fornecedor}\n`;
                        }
                    }
                } else {
                    for (const falha of falhas) {
                        relatorioFinal += `  -> ${falha.arquivo}\n`;
                    }
                }
            }
        }
        relatorioFinal += '\n===================================================================\n';
        console.log(relatorioFinal);
        return relatorioFinal;
    } catch (err) {
        console.error('Erro GERAL e fatal ao processar a pasta:', err);
        return `Erro GERAL e fatal: ${err.message}`;
    }
}

const pastaDosComprovantes = process.argv[2];
const caminhoDoRelatorio = process.argv[3];
const popplerBinPath = process.argv[4];

if (!pastaDosComprovantes || !caminhoDoRelatorio || !popplerBinPath) {
    console.error('Uso: node index.js <pasta_dos_comprovantes> <caminho_do_relatorio_excel> <caminho_para_poppler_bin>');
    process.exit(1);
}

main(pastaDosComprovantes, caminhoDoRelatorio, prefixoNovoNome, popplerBinPath)
    .then(result => {
        // O resultado já é impresso dentro da função main, não precisa imprimir de novo.
        process.exit(0);
    })
    .catch(error => {
        console.error(`Erro inesperado na execução principal: ${error.message}`);
        process.exit(1);
    });