import ExcelJS from 'exceljs';

/**
 * Converte um valor (string, número ou objeto) para um número (float).
 * @param {*} valor O valor da célula do Excel.
 * @returns {number|null} O valor como número ou null se a conversão falhar.
 */
function parseValorParaNumero(valor) {
    if (valor === null || valor === undefined) return null;
    if (typeof valor === 'object' && valor.richText) {
        valor = valor.richText.map(rt => rt.text).join('');
    }
    if (typeof valor === 'number') {
        return valor;
    }
    const strValue = String(valor).trim();
    const valorNormalizado = strValue.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(valorNormalizado);
    return isNaN(num) ? null : num;
}


export async function encontrarNFeFORNECEDOR(valorBuscadoDoPdf, caminho) {
    if (valorBuscadoDoPdf === null || valorBuscadoDoPdf === undefined) {
        return null;
    }

    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(caminho);
        const worksheet = workbook.getWorksheet(1);

        const valorPdfArredondado = parseFloat(valorBuscadoDoPdf.toFixed(2));
        console.log(`Buscando por valor: ${valorPdfArredondado}`);

        // Array para armazenar TODOS os resultados encontrados
        const resultadosEncontrados = [];

        worksheet.eachRow({ includeEmpty: true }, (row) => {
            row.eachCell({ includeEmpty: true }, (cell) => {
                let valorDaCelula = cell.value;

                if (valorDaCelula === null && cell.isMerged) {
                    const masterCell = worksheet.getCell(cell.master);
                    valorDaCelula = masterCell.value;
                }

                const valorCelulaNumerico = parseValorParaNumero(valorDaCelula);

                if (valorCelulaNumerico !== null) {
                    const valorCelulaArredondado = parseFloat(valorCelulaNumerico.toFixed(2));

                    if (valorCelulaArredondado === valorPdfArredondado) {
                        const celulaNF = row.getCell('B').value;
                        const celulaFornecedor = row.getCell('C').value;

                        if (celulaNF && celulaFornecedor) {
                            // Adiciona o resultado encontrado à lista
                            resultadosEncontrados.push({
                                linha: row.number,
                                nf: String(celulaNF).trim(),
                                fornecedor: String(celulaFornecedor).trim()
                            });
                        }
                    }
                }
            });
        });

        // --- ANÁLISE DOS RESULTADOS APÓS PERCORRER TODO O ARQUIVO ---

        // Caso 1: Nenhuma correspondência encontrada
        if (resultadosEncontrados.length === 0) {
            console.log(`Valor '${valorPdfArredondado}' não foi encontrado na planilha.`);
            return null;
        }

        // Caso 2: Exatamente uma correspondência (seguro para continuar)
        if (resultadosEncontrados.length === 1) {
            console.log(`>>> Correspondência ÚNICA encontrada na Linha ${resultadosEncontrados[0].linha}!`);
            return resultadosEncontrados[0];
        }

        // Caso 3: Múltiplas correspondências (duplicatas encontradas)
        if (resultadosEncontrados.length > 1) {
            console.error('\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            console.error(`!!! ERRO CRÍTICO: MÚLTIPLAS CORRESPONDÊNCIAS ENCONTRADAS !!!`);
            console.error(`O valor '${valorPdfArredondado}' foi encontrado em ${resultadosEncontrados.length} locais diferentes:`);

            for (const resultado of resultadosEncontrados) {
                console.error(`  - Linha ${resultado.linha}: NF=${resultado.nf}, Fornecedor=${resultado.fornecedor}`);
            }

            console.error('O SCRIPT SERÁ ENCERRADO PARA EVITAR RENOMEAÇÃO INCORRETA.');
            console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n');
            console.error('Por favor, renomeie manualmente. Após renomear, vá no relatório e mude o valor dos comprovantes identificados como iguais para um valor aleatório, para dar sequencia ao script.')

            // "Quebra" o código, encerrando o processo completamente.
            process.exit(1);
        }

    } catch (err) {
        console.error('Erro fatal ao ler o arquivo Excel:', err.message);
        return null;
    }
}