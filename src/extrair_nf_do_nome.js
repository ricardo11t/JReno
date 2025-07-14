import fs from 'fs';
import path from 'path';

const pastaAlvo = 'C:\\Users\\ricardo.hl\\Desktop\\teste';
const pastaAlvo2 = 'C:\\Users\\ricardo.hl\\Desktop\\teste 2';
const data = '28-05-2025';

function extrairNfDoNome(pastaAlvo) {
    try {
        const arquivos = fs.readdirSync(pastaAlvo);
        const arrayDeNFS = [];

        arquivos.forEach(arquivo => {
            // Extrai a parte 'NF...'
            const nfPart = arquivo.split(' ')[1];
            if (nfPart) {
                // Extrai apenas o número e o converte para um tipo numérico
                const numeroNF = parseInt(nfPart.split('NF')[1], 10);
                if (!isNaN(numeroNF)) {
                    arrayDeNFS.push(numeroNF);
                }
            }
        });

        // --- Bubble Sort Corrigido ---
        let trocou;
        do {
            trocou = false;
            // O laço deve ir até o penúltimo elemento
            for (let i = 0; i < arrayDeNFS.length - 1; i++) {
                // A comparação agora é numérica
                if (arrayDeNFS[i+1] < arrayDeNFS[i]) {
                    let aux = arrayDeNFS[i];
                    arrayDeNFS[i] = arrayDeNFS[i+1];
                    arrayDeNFS[i+1] = aux;
                    trocou = true;
                }
            }
        } while (trocou);

        console.log(arrayDeNFS)
        return arrayDeNFS;
    } catch (err) {
        console.error("Erro ao tentar ler o diretório:", err);
    }
}

function extrairNfPeloNomeEData(pastaAlvo, data) {
    try {
        const arquivos = fs.readdirSync(pastaAlvo);
        const arrayDeNFS = [];
        arquivos.forEach(arquivo => {
            if(arquivo.includes(data)){
                const nf = arquivo.split('_')[1];
                const numeroNF = parseInt(nf.split('NF')[1]);
                arrayDeNFS.push(numeroNF)
            }
        })
        let trocou = true;
        do {
            trocou = false;
            for (let i = 0; i < arrayDeNFS.length - 1; i++) {
                // A comparação agora é numérica
                if (arrayDeNFS[i+1] < arrayDeNFS[i]) {
                    let aux = arrayDeNFS[i];
                    arrayDeNFS[i] = arrayDeNFS[i+1];
                    arrayDeNFS[i+1] = aux;
                    trocou = true;
                }
            }
        } while (trocou);
        console.log(arrayDeNFS)
        return arrayDeNFS;
    } catch (err) {
        console.error("Erro ao tentar ler o diretório:", err);
    }
}

const arrayDeNFSOrdenadas = extrairNfDoNome(pastaAlvo);
const arrayDeNFSOrdenadas2 = extrairNfPeloNomeEData(pastaAlvo2, data);

function compararNFS(array1, array2) {
    let arrayResultante = [];
    for(let i=0; i<array1.length; i++){
        if(!array2.includes(array1[i])) {
            arrayResultante.push(array1[i]);
        }
    }
    if(arrayResultante.length === 0) {
        console.log("Todas nfs foram encontradas ou houve algum erro.");
        return;
    }
    else {
        return arrayResultante;
    }
}

const result = compararNFS(arrayDeNFSOrdenadas, arrayDeNFSOrdenadas2);

console.log(result);