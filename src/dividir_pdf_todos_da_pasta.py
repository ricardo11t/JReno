import os
from pypdf import PdfWriter, PdfReader

# --- CONFIGURAÇÃO ---
# Defina a pasta onde estão os seus arquivos PDF.
# Usar '.' significa que o script procurará os PDFs na mesma pasta onde ele for executado.
# Você pode alterar para um caminho específico, por exemplo: 'C:/Users/SeuUsuario/Documentos'
PASTA_ENTRADA = 'C:/Users/ricardo.hl/Desktop/teste'

def dividir_pdfs():
    """
    Encontra todos os arquivos PDF na PASTA_ENTRADA,
    e para cada PDF, cria uma nova pasta e salva cada página como um arquivo PDF separado.
    """
    # Verifica se o caminho de entrada realmente existe
    if not os.path.isdir(PASTA_ENTRADA):
        print(f"Erro: O caminho de entrada '{PASTA_ENTRADA}' não existe ou não é um diretório.")
        return
    
    # Lista todos os itens na pasta de entrada
    try:
        todos_os_itens = os.listdir(PASTA_ENTRADA)
    except OSError as e:
        print(f"Erro ao acessar a pasta de entrada: {e}")
        return

    # Filtra para pegar apenas os arquivos que terminam com .pdf
    arquivos_pdf = [arquivo for arquivo in todos_os_itens if arquivo.lower().endswith('.pdf')]

    if not arquivos_pdf:
        print(f"Nenhum arquivo PDF encontrado na pasta '{PASTA_ENTRADA}'.")
        return

    print(f"Encontrados {len(arquivos_pdf)} arquivo(s) PDF. Iniciando processo...\n")

    # Itera sobre cada arquivo PDF encontrado
    for nome_arquivo_pdf in arquivos_pdf:
        # Constrói o caminho completo para o arquivo de entrada
        caminho_completo_pdf = os.path.join(PASTA_ENTRADA, nome_arquivo_pdf)
        print(f"Processando arquivo: '{caminho_completo_pdf}'")

        try:
            reader = PdfReader(caminho_completo_pdf)
            total_paginas = len(reader.pages)

            # Cria um nome para a pasta de saída baseado no nome do arquivo original
            nome_base_arquivo = os.path.splitext(nome_arquivo_pdf)[0]
            pasta_saida = os.path.join(PASTA_ENTRADA, f'{nome_base_arquivo}_dividido')

            # Cria a pasta de saída se ela não existir
            # O argumento exist_ok=True evita erros se a pasta já existir
            os.makedirs(pasta_saida, exist_ok=True)
            print(f"  -> Pasta de saída: '{pasta_saida}'")

            # Itera sobre cada página do PDF
            for numero_pagina in range(total_paginas):
                # Cria um novo objeto PdfWriter para cada página
                writer = PdfWriter()
                
                # Adiciona a página específica ao writer
                # Acessamos a página pelo índice: reader.pages[numero_pagina]
                writer.add_page(reader.pages[numero_pagina])

                # Define o nome do arquivo de saída para a página atual
                nome_arquivo_saida = os.path.join(pasta_saida, f'pagina_{numero_pagina + 1}.pdf')

                # Salva o novo arquivo PDF com uma única página
                with open(nome_arquivo_saida, 'wb') as f:
                    writer.write(f)
                
                print(f"    - Página {numero_pagina + 1} salva como '{nome_arquivo_saida}'")

            print(f"Divisão do arquivo '{nome_arquivo_pdf}' concluída com sucesso.\n")

        except Exception as e:
            print(f"Ocorreu um erro ao processar o arquivo '{nome_arquivo_pdf}': {e}\n")

if __name__ == '__main__':
    dividir_pdfs()
