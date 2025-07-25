import os
from pypdf import PdfWriter, PdfReader

PASTA_ENTRADA = 'C:/Users/ricardo.hl/Desktop/comprovantes/comprovantes armazem junho 2025'

def dividir_pdfs():
    """
    Encontra todos os arquivos PDF na PASTA_ENTRADA,
    e para cada PDF, cria uma nova pasta e salva cada página como um arquivo PDF separado.
    """
    if not os.path.isdir(PASTA_ENTRADA):
        print(f"Erro: O caminho de entrada '{PASTA_ENTRADA}' não existe ou não é um diretório.")
        return
    try:
        todos_os_itens = os.listdir(PASTA_ENTRADA)
    except OSError as e:
        print(f"Erro ao acessar a pasta de entrada: {e}")
        return
    arquivos_pdf = [arquivo for arquivo in todos_os_itens if arquivo.lower().endswith('.pdf')]
    if not arquivos_pdf:
        print(f"Nenhum arquivo PDF encontrado na pasta '{PASTA_ENTRADA}'.")
        return

    print(f"Encontrados {len(arquivos_pdf)} arquivo(s) PDF. Iniciando processo...\n")

    for nome_arquivo_pdf in arquivos_pdf:
        caminho_completo_pdf = os.path.join(PASTA_ENTRADA, nome_arquivo_pdf)
        print(f"Processando arquivo: '{caminho_completo_pdf}'")

        try:
            reader = PdfReader(caminho_completo_pdf)
            total_paginas = len(reader.pages)

            nome_base_arquivo = os.path.splitext(nome_arquivo_pdf)[0]
            pasta_saida = os.path.join(PASTA_ENTRADA, f'{nome_base_arquivo}_dividido')

            os.makedirs(pasta_saida, exist_ok=True)
            print(f"  -> Pasta de saída: '{pasta_saida}'")

            for numero_pagina in range(total_paginas):
                writer = PdfWriter()
                
                writer.add_page(reader.pages[numero_pagina])

                nome_arquivo_saida = os.path.join(pasta_saida, f'pagina_{numero_pagina + 1}.pdf')

                with open(nome_arquivo_saida, 'wb') as f:
                    writer.write(f)
                
                print(f"    - Página {numero_pagina + 1} salva como '{nome_arquivo_saida}'")

            print(f"Divisão do arquivo '{nome_arquivo_pdf}' concluída com sucesso.\n")

        except Exception as e:
            print(f"Ocorreu um erro ao processar o arquivo '{nome_arquivo_pdf}': {e}\n")

if __name__ == '__main__':
    dividir_pdfs()
