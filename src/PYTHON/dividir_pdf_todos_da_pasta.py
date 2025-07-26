import os
import sys
from pypdf import PdfWriter, PdfReader

# Nota: PASTA_ENTRADA foi removida pois o caminho do PDF agora vem como argumento.
# Se você tiver lógica que ainda dependa de PASTA_ENTRADA para outras funções,
# considere passá-la como um argumento para o script Python ou obtê-la de forma dinâmica.

def dividir_pdf_e_retornar_pasta(pdf_input_path: str) -> str:
    """
    Recebe o caminho de um arquivo PDF, divide-o em páginas separadas,
    cria uma pasta 'exemplo_dividido' na mesma localização do PDF de entrada
    e salva as páginas lá. Retorna o caminho completo da pasta criada.
    Todas as mensagens de log (exceto o resultado final) são enviadas para stderr.
    """
    if not os.path.exists(pdf_input_path):
        sys.stderr.write(f"Erro: Arquivo PDF não encontrado: '{pdf_input_path}'\n")
        sys.exit(1) # Sai com código de erro

    if not pdf_input_path.lower().endswith('.pdf'):
        sys.stderr.write(f"Erro: O arquivo de entrada não é um PDF válido: '{pdf_input_path}'\n")
        sys.exit(1)

    # Obter o diretório do arquivo PDF de entrada
    diretorio_pdf_entrada = os.path.dirname(pdf_input_path)
    nome_arquivo_pdf = os.path.basename(pdf_input_path)
    nome_base_arquivo = os.path.splitext(nome_arquivo_pdf)[0]

    # Definir o nome da pasta de saída
    pasta_saida = os.path.join(diretorio_pdf_entrada, f'{nome_base_arquivo}_dividido')

    try:
        # Criar a pasta de saída se ela não existir
        os.makedirs(pasta_saida, exist_ok=True)
        sys.stderr.write(f"Criando pasta de saída: '{pasta_saida}'\n") # Log para stderr

        reader = PdfReader(pdf_input_path)
        total_paginas = len(reader.pages)
        sys.stderr.write(f"Processando '{nome_arquivo_pdf}' - Total de páginas: {total_paginas}\n") # Log para stderr

        for numero_pagina in range(total_paginas):
            writer = PdfWriter()
            writer.add_page(reader.pages[numero_pagina])

            nome_arquivo_saida = os.path.join(pasta_saida, f'pagina_{numero_pagina + 1}.pdf')

            with open(nome_arquivo_saida, 'wb') as f:
                writer.write(f)

            # sys.stderr.write(f"  - Página {numero_pagina + 1} salva como '{nome_arquivo_saida}'\n") # Opcional: Remova para menos saída, ou envie para stderr

        sys.stderr.write(f"Divisão de '{nome_arquivo_pdf}' concluída com sucesso.\n") # Log para stderr

        # Este é o caminho que DEVE ser retornado para stdout
        return pasta_saida

    except Exception as e:
        sys.stderr.write(f"Ocorreu um erro ao processar o arquivo '{pdf_input_path}': {e}\n")
        sys.exit(1) # Sai com código de erro

if __name__ == '__main__':
    # Verifica se o argumento do caminho do PDF foi fornecido
    if len(sys.argv) < 2:
        sys.stderr.write("Uso: python dividir_pdf_todos_da_pasta.py <caminho_do_arquivo_pdf>\n")
        sys.exit(1) # Sai com código de erro

    # O primeiro argumento da linha de comando (sys.argv[0] é o nome do script)
    pdf_file_path = sys.argv[1]

    try:
        # Chama a função principal e imprime o resultado para stdout
        result_path = dividir_pdf_e_retornar_pasta(pdf_file_path)
        # Esta é a ÚNICA linha que deve imprimir para sys.stdout
        sys.stdout.write(result_path + '\n') # Adiciona quebra de linha para garantir que seja uma única linha limpa
        sys.exit(0) # Sai com código de sucesso
    except Exception as e:
        # Erros já são impressos pela função, apenas garantir a saída de erro
        sys.stderr.write(f"Erro inesperado na execução principal do Python: {e}\n") # Log adicional de erro
        sys.exit(1)