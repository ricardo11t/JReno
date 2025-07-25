import ExcelJS from 'exceljs';

const JANELA_TOLERANCIA_DIAS = 2;

function normalizarTextoCabecalho(cellValue) { if (!cellValue) return ''; let texto = ''; if (typeof cellValue === 'object' && cellValue.richText) { texto = cellValue.richText.map(rt => rt.text).join(''); } else { texto = String(cellValue); } return texto.toLowerCase().replace(/\s+/g, ' ').trim(); }
function parseValorParaNumero(valor) { if (valor === null || valor === undefined) return null; if (typeof valor === 'object' && valor.richText) { valor = valor.richText.map(rt => rt.text).join(''); } if (typeof valor === 'number') { return valor; } const strValue = String(valor).trim(); const valorNormalizado = strValue.replace(/\./g, '').replace(',', '.'); const num = parseFloat(valorNormalizado); return isNaN(num) ? null : num; }

export async function encontrarNFeFORNECEDOR(result, caminho, memoriaNFsUtilizadas) {
    if (!result || result.valor === null || result.valor === undefined) return { status: 'error', message: 'Valor buscado do PDF é nulo ou inválido.' };
    if (result.data === null || result.data === undefined) return { status: 'error', message: 'Data buscada do PDF é nula ou inválida.' };

    const dataPdfFormatada = String(result.data).replace(/\//g, '');
    const valorPdfArredondado = parseFloat(result.valor.toFixed(2));
    const NOMES_CABECALHOS = { nf: "No. Titulo", fornecedor: "Dados cli/forn", dataBaixa: "DT Baixa", valor: "Valor Baixa" };
    const colunas = {};
    const workbook = new ExcelJS.Workbook();

    try {
        await workbook.xlsx.readFile(caminho);
        const worksheet = workbook.getWorksheet(1);
        const primeiraLinha = worksheet.getRow(1);

        if (!primeiraLinha.hasValues) return { status: 'error', message: 'A planilha está vazia.' };

        primeiraLinha.eachCell((cell) => {
            const nomeCabecalhoNormalizado = normalizarTextoCabecalho(cell.value);
            for (const [key, value] of Object.entries(NOMES_CABECALHOS)) {
                if (nomeCabecalhoNormalizado === value.toLowerCase()) colunas[key] = cell.address.replace(/\d+$/, '');
            }
        });

        const colunasNaoEncontradas = Object.keys(NOMES_CABECALHOS).filter(key => !colunas[key]);
        if (colunasNaoEncontradas.length > 0) return { status: 'error', message: `Cabeçalhos não encontrados: ${colunasNaoEncontradas.map(key => `"${NOMES_CABECALHOS[key]}"`).join(', ')}.` };

        console.log(`Buscando por valor: ${valorPdfArredondado} e data exata: ${dataPdfFormatada}`);

        const correspondenciasDeValor = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const valorCelulaNumerico = parseValorParaNumero(row.getCell(colunas.valor).value);
            if (valorCelulaNumerico !== null && parseFloat(valorCelulaNumerico.toFixed(2)) === valorPdfArredondado) {
                correspondenciasDeValor.push({ linha: row.number, fornecedor: String(row.getCell(colunas.fornecedor).value).trim(), nf: String(row.getCell(colunas.nf).value).replace(/^0+/, '').trim(), dataRaw: row.getCell(colunas.dataBaixa).value });
            }
        });

        if (correspondenciasDeValor.length === 0) return { status: 'not_found', message: `Valor '${valorPdfArredondado}' não foi encontrado na planilha.` };

        const correspondenciasExatas = correspondenciasDeValor.filter(c => {
            if (c.dataRaw instanceof Date) return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(c.dataRaw).replace(/\//g, '') === dataPdfFormatada;
            if (typeof c.dataRaw === 'string') return c.dataRaw.replace(/\//g, '') === dataPdfFormatada;
            if (typeof c.dataRaw === 'number') { const dataUTC = new Date(Date.UTC(1900, 0, c.dataRaw - 1)); return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(dataUTC).replace(/\//g, '') === dataPdfFormatada; }
            return false;
        });

        if (correspondenciasExatas.length === 1) return { status: 'success', data: correspondenciasExatas[0] };

        if (correspondenciasExatas.length === 0 && correspondenciasDeValor.length > 0) {
            // =================================================================
            //                 INÍCIO DO BLOCO DE SUPER DEPURAÇÃO
            // =================================================================
            console.log(`[DEPURAÇÃO AVANÇADA] Nenhuma data exata encontrada. Ativando busca flexível com janela de ${JANELA_TOLERANCIA_DIAS} dia(s).`);
            const dia = parseInt(dataPdfFormatada.substring(0, 2), 10), mes = parseInt(dataPdfFormatada.substring(2, 4), 10) - 1, ano = parseInt(dataPdfFormatada.substring(4, 8), 10);
            const dataPdfObjeto = new Date(Date.UTC(ano, mes, dia));

            const correspondenciasFlexiveis = correspondenciasDeValor.filter(c => {
                let dataExcelObjeto = null;
                if (c.dataRaw instanceof Date) dataExcelObjeto = new Date(Date.UTC(c.dataRaw.getUTCFullYear(), c.dataRaw.getUTCMonth(), c.dataRaw.getUTCDate()));
                else if (typeof c.dataRaw === 'number') dataExcelObjeto = new Date(Date.UTC(1900, 0, c.dataRaw - 1));
                
                if (dataExcelObjeto) {
                    const diffEmMs = Math.abs(dataExcelObjeto.getTime() - dataPdfObjeto.getTime());
                    const diffEmDias = diffEmMs / (1000 * 60 * 60 * 24);
                    return diffEmDias <= JANELA_TOLERANCIA_DIAS;
                }
                return false;
            });

            console.log(`[DEPURAÇÃO AVANÇADA] Foram encontradas ${correspondenciasFlexiveis.length} correspondências na janela de tolerância.`);
            if (correspondenciasFlexiveis.length > 1) {
                console.log('[DEPURAÇÃO AVANÇADA] Detalhes das correspondências flexíveis ambíguas:');
                correspondenciasFlexiveis.forEach(match => { console.log(`  -> Linha ${match.linha}: (NF=${match.nf}, Data na Planilha=${match.dataRaw.toString()})`); });
            }
             console.log('-------------------------------------------------------------------');
            // =================================================================
            //                   FIM DO BLOCO DE SUPER DEPURAÇÃO
            // =================================================================

            if (correspondenciasFlexiveis.length === 1) return { status: 'success', data: correspondenciasFlexiveis[0] };
            if (correspondenciasFlexiveis.length > 1) return { status: 'not_found', message: 'Múltiplos valores encontrados dentro da janela de tolerância. Requer verificação manual.' };
        }
        
         if (correspondenciasExatas.length > 1) {
            const primeiroFornecedor = correspondenciasExatas[0].fornecedor;
            if (!correspondenciasExatas.every(c => c.fornecedor === primeiroFornecedor)) return { status: 'duplicate', value: valorPdfArredondado, duplicates: correspondenciasExatas };
            const chaveMemoria = `${valorPdfArredondado}-${dataPdfFormatada}-${primeiroFornecedor}`;
            if (!memoriaNFsUtilizadas.has(chaveMemoria)) memoriaNFsUtilizadas.set(chaveMemoria, { correspondencias: correspondenciasExatas, proximoIndice: 0 });
            const estado = memoriaNFsUtilizadas.get(chaveMemoria);
            if (estado.proximoIndice < estado.correspondencias.length) {
                const proximaCorrespondencia = estado.correspondencias[estado.proximoIndice];
                estado.proximoIndice++;
                return { status: 'success', data: proximaCorrespondencia };
            } else {
                return { status: 'error', message: `Todas as NFs para o valor ${valorPdfArredondado} e data ${dataPdfFormatada} já foram utilizadas.` };
            }
        }

        return { status: 'not_found', message: `Nenhuma correspondência encontrada para o valor ${valorPdfArredondado}.` };

    } catch (err) {
        console.error('Erro fatal ao ler ou processar o arquivo Excel:', err.message);
        return { status: 'error', message: err.message };
    }
}