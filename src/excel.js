// excel.js (versão atualizada)

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
        // Retorna um objeto de status para consistência
        return { status: 'error', message: 'Valor buscado do PDF é nulo.' };
    }

    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(caminho);
        const worksheet = workbook.getWorksheet(1);

        const valorPdfArredondado = parseFloat(valorBuscadoDoPdf.toFixed(2));
        console.log(`Buscando por valor: ${valorPdfArredondado}`);

        const resultadosEncontrados = [];

        worksheet.eachRow({ includeEmpty: true }, (row) => {
            // Otimização: Se já encontrou o valor na coluna F, busca os dados nas outras colunas da mesma linha
            const valorCelulaF = row.getCell('F').value;
            const valorCelulaNumerico = parseValorParaNumero(valorCelulaF);

            if (valorCelulaNumerico !== null) {
                const valorCelulaArredondado = parseFloat(valorCelulaNumerico.toFixed(2));

                if (valorCelulaArredondado === valorPdfArredondado) {
                    const celulaNF = row.getCell('B').value;
                    const celulaFornecedor = row.getCell('C').value;
                    const celulaTipo = row.getCell('D').value;

                    // A condição principal
                    if (celulaNF && celulaFornecedor && celulaTipo && String(celulaTipo).trim().toLowerCase() === 'nf') {
                        resultadosEncontrados.push({
                            linha: row.number,
                            nf: String(celulaNF).trim(),
                            fornecedor: String(celulaFornecedor).trim()
                        });
                    }
                }
            }
        });

        // --- ANÁLISE DOS RESULTADOS APÓS PERCORRER TODO O ARQUIVO ---

        // Caso 1: Nenhuma correspondência encontrada
        if (resultadosEncontrados.length === 0) {
            console.log(`Valor '${valorPdfArredondado}' não foi encontrado na planilha (ou não era do tipo 'nf').`);
            return { status: 'not_found' };
        }

        // Caso 2: Exatamente uma correspondência (sucesso!)
        if (resultadosEncontrados.length === 1) {
            console.log(`>>> Correspondência ÚNICA encontrada na Linha ${resultadosEncontrados[0].linha}!`);
            return { status: 'success', data: resultadosEncontrados[0] };
        }

        // Caso 3: Múltiplas correspondências (duplicatas encontradas)
        if (resultadosEncontrados.length > 1) {
            // Apenas avisa no console, mas não encerra o script
            console.warn(`\n--- ALERTA: MÚLTIPLAS CORRESPONDÊNCIAS PARA O VALOR ${valorPdfArredondado} ---`);
            for (const resultado of resultadosEncontrados) {
                console.warn(`  - Linha ${resultado.linha}: NF=${resultado.nf}, Fornecedor=${resultado.fornecedor}`);
            }
            console.warn(`O arquivo correspondente a este valor NÃO será renomeado para evitar erros.\n`);
            
            // Retorna um status de 'duplicate' com os dados para o relatório
            return { status: 'duplicate', value: valorPdfArredondado, duplicates: resultadosEncontrados };
        }

    } catch (err) {
        console.error('Erro fatal ao ler o arquivo Excel:', err.message);
        return { status: 'error', message: err.message };
    }
}