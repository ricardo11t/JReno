const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

async function dividirPdfERetornarPasta(pdfInputPath) {
    if (!fs.existsSync(pdfInputPath)) {
        console.error(`Erro: Arquivo PDF não encontrado: '${pdfInputPath}'`);
        process.exit(1);
    }
    if (!pdfInputPath.toLowerCase().endsWith('.pdf')) {
        console.error(`Erro: O arquivo de entrada não é um PDF válido: '${pdfInputPath}'`);
        process.exit(1);
    }

    const diretorioPdfEntrada = path.dirname(pdfInputPath);
    const nomeArquivoPdf = path.basename(pdfInputPath);
    const nomeBaseArquivo = path.parse(nomeArquivoPdf).name;

    const pastaSaida = path.join(diretorioPdfEntrada, `${nomeBaseArquivo}_dividido`);

    try {
        if (!fs.existsSync(pastaSaida)) {
            fs.mkdirSync(pastaSaida, { recursive: true });
        }
        console.error(`Criando pasta de saída: '${pastaSaida}'`);

        const existingPdfBytes = fs.readFileSync(pdfInputPath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        const numberOfPages = pdfDoc.getPages().length;
        console.error(`Processando '${nomeArquivoPdf}' - Total de páginas: ${numberOfPages}`); // Log para stderr

        for (let i = 0; i < numberOfPages; i++) {
            const newPdfDoc = await PDFDocument.create(); // Cria um novo documento PDF para cada página
            const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]); // Copia a página do documento original
            newPdfDoc.addPage(copiedPage); // Adiciona a página ao novo documento

            const pdfBytes = await newPdfDoc.save(); // Salva o novo documento como bytes
            const pageOutputPath = path.join(pastaSaida, `pagina_${i + 1}.pdf`);
            fs.writeFileSync(pageOutputPath, pdfBytes); // Escreve os bytes no arquivo

            console.error(`  - Página ${i + 1} salva.`); // Log para stderr
        }

        console.error(`Divisão de '${nomeArquivoPdf}' concluída com sucesso.`); // Log para stderr

        // --- IMPRIMA APENAS O CAMINHO FINAL PARA STDOUT ---
        return pastaSaida; // Retorne a string para ser impressa no if (require.main === module)

    } catch (e) {
        console.error(`Erro ao dividir o PDF '${pdfInputPath}': ${e.message || e}`);
        process.exit(1); // Sai com código de erro
    }
}

// ===========================================================================
// Nova seção para lidar com os argumentos da linha de comando
// ===========================================================================
if (require.main === module) {
    const pdfInputPath = process.argv[2]; // O primeiro argumento é o caminho do PDF
    // O popplerBinPath ainda é passado para o script, mas NÃO é usado por esta função (divisão)
    // Ele será usado pela função encontrarValorDoComprovante no pdf.cjs, que é chamada por index.cjs.
    // Manter o argumento aqui garante a consistência da chamada do main.ts.
    const popplerBinPath = process.argv[3]; // Recebe o caminho do Poppler Bin, mas não usa para divisão

    if (!pdfInputPath) { // A verificação de popplerBinPath foi removida daqui, pois não é usada por esta função
        console.error('Uso: node dividir_pdf.cjs <caminho_do_arquivo_pdf>');
        process.exit(1);
    }

    dividirPdfERetornarPasta(pdfInputPath) // popplerBinPath não é passado para esta função
        .then(resultPath => {
            // ESTA É A ÚNICA LINHA QUE DEVE IMPRIMIR APENAS O CAMINHO FINAL PARA STDOUT
            process.stdout.write(resultPath.trim()); // Use process.stdout.write com trim()
            process.exit(0);
        })
        .catch(error => {
            console.error(`Erro inesperado na execução principal (dividir_pdf.cjs): ${error.message || error}`);
            process.exit(1);
        });
}