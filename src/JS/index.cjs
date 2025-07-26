const { encontrarNFeFORNECEDOR } = require("./excel.cjs");
const { encontrarValorDoComprovante } = require("./pdf.cjs");
const fs = require('fs');
const path = require('path');
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
    const arquivosComFalha = [];
    const memoriaNFsUtilizadas = new Map();

    try {
        // Verifica se a pasta dos comprovantes existe
        if (!fs.existsSync(pastaDosComprovantes)) {
            console.error(`Erro: A pasta dos comprovantes não existe: ${pastaDosComprovantes}`);
            return `Erro: Pasta dos comprovantes não encontrada: ${pastaDosComprovantes}`; // Retorna mensagem de erro
        }
        // Verifica se o arquivo do relatório existe
        if (!fs.existsSync(caminhoDoRelatorio)) {
            console.error(`Erro: O arquivo do relatório Excel não existe: ${caminhoDoRelatorio}`);
            return `Erro: Relatório Excel não encontrado: ${caminhoDoRelatorio}`; // Retorna mensagem de erro
        }

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

                // Sua lógica de tratamento do fornecedor
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

        // --- RELATÓRIO FINAL ---
        let relatorioFinal = '\n\n===================================================================\n';
        relatorioFinal += '                 RELATÓRIO FINAL DE EXECUÇÃO\n';
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
        console.log(relatorioFinal); // Imprime o relatório final no console do Node.js/Electron
        return relatorioFinal; // Retorna o relatório para o Electron
    } catch (err) {
        console.error('Erro GERAL e fatal ao processar a pasta:', err);
        return `Erro GERAL e fatal: ${err.message}`; // Retorna a mensagem de erro para o Electron
    }
}

// ===========================================================================
// Nova seção para lidar com os argumentos da linha de comando
// ===========================================================================
const pastaDosComprovantes = process.argv[2];
const caminhoDoRelatorio = process.argv[3];

if (!pastaDosComprovantes || !caminhoDoRelatorio) {
    console.error('Uso: node index.js <pasta_dos_comprovantes> <caminho_do_relatorio_excel>');
    process.exit(1); // Sai com erro
}

main(pastaDosComprovantes, caminhoDoRelatorio, prefixoNovoNome)
    .then(result => {
        console.log(result);
        process.exit(0);
    })
    .catch(error => {
        console.error(`Erro inesperado na execução principal: ${error.message}`);
        process.exit(1);
    });
