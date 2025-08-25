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
        console.error(`Processando '${nomeArquivoPdf}' - Total de páginas: ${numberOfPages}`);

        for (let i = 0; i < numberOfPages; i++) {
            const newPdfDoc = await PDFDocument.create();
            const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
            newPdfDoc.addPage(copiedPage);

            const pdfBytes = await newPdfDoc.save();
            const pageOutputPath = path.join(pastaSaida, `pagina_${i + 1}.pdf`);
            fs.writeFileSync(pageOutputPath, pdfBytes);

            console.error(`  - Página ${i + 1} salva.`);
        }

        console.error(`Divisão de '${nomeArquivoPdf}' concluída com sucesso.`);

        return pastaSaida;
    } catch (e) {
        console.error(`Erro ao dividir o PDF '${pdfInputPath}': ${e.message || e}`);
        process.exit(1);
    }
}

if (require.main === module) {
    const pdfInputPath = process.argv[2];
    
    const popplerBinPath = process.argv[3];
    if (!pdfInputPath) {
        console.error('Uso: node dividir_pdf.cjs <caminho_do_arquivo_pdf>');
        process.exit(1);
    }

    dividirPdfERetornarPasta(pdfInputPath)
        .then(resultPath => {
            process.stdout.write(resultPath.trim());
            process.exit(0);
        })
        .catch(error => {
            console.error(`Erro inesperado na execução principal (dividir_pdf.cjs): ${error.message || error}`);
            process.exit(1);
        });
}