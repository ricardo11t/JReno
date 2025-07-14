import fs from 'fs';
import path from 'path';

async function verificarSePossuiOk(pastaAlvo) {
    try {
        const arquivos = fs.readdirSync(pastaAlvo);
        arquivos.forEach((arquivo) => {
            const ext = path.extname(arquivo);
            
            
            if(arquivo.includes('OK')){
                const origem = path.join(pastaAlvo, arquivo);
                const destino = path.join(pastaAlvo, 'OK', arquivo);
                if(!destino) {
                    fs.mkdir(pastaAlvo, 'OK');
                }
                fs.rename(origem, destino, (err) => {
                    if(err){
                        console.error(`Erro ao mover o arquivo: ${arquivo}`, err);
                        return;
                    }
                    console.log(`Arquivo ${arquivo} renomeado com sucesso!`);
                });
            }
        })
    } catch (err) {
        console.error('Erro ao executar função.', err);
    }
}

const pastaAlvo = 'C:\\Users\\ricardo.hl\\Desktop\\teste 3';

verificarSePossuiOk(pastaAlvo);