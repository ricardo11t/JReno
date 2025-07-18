import os
from pypdf import PdfReader, PdfWriter

# --- CONFIGURAÇÃO ---
# Coloque o nome do seu arquivo PDF grande aqui
ARQUIVO_ENTRADA = 'C:/Users/ricardo.hl/Desktop/teste/FEVEREIRO -  CONTABILIDADE PAGAMENTOS - B. BRASIL 5.pdf'

# Nome da pasta onde os arquivos divididos serão salvos
PASTA_SAIDA = 'C:/Users/ricardo.hl/Desktop/teste/comprovantes_divididos3'
# --- FIM DA CONFIGURAÇÃO ---

def dividir_pdf():
    # Verifica se o arquivo de entrada existe
    if not os.path.exists(ARQUIVO_ENTRADA):
        print(f"Erro: Arquivo de entrada '{ARQUIVO_ENTRADA}' não encontrado!")
        return

    # Cria a pasta de saída se ela não existir
    if not os.path.exists(PASTA_SAIDA):
        os.makedirs(PASTA_SAIDA)
        print(f"Pasta '{PASTA_SAIDA}' criada.")

    print(f"Lendo o arquivo '{ARQUIVO_ENTRADA}'...")
    reader = PdfReader(ARQUIVO_ENTRADA)

    total_paginas = len(reader.pages)
    print(f"O arquivo tem {total_paginas} páginas. Iniciando a divisão...")

    for i in range(total_paginas):
        writer = PdfWriter()
        writer.add_page(reader.pages[i])

        # Define o nome do arquivo de saída, ex: "pagina_01.pdf", "pagina_02.pdf"
        nome_arquivo_saida = os.path.join(PASTA_SAIDA, f'pagina_{i+1:03d}.pdf')

        # Salva o novo arquivo PDF de uma página
        with open(nome_arquivo_saida, 'wb') as f:
            writer.write(f)

        print(f" -> Página {i+1} salva como '{nome_arquivo_saida}'")

    print("\nDivisão concluída com sucesso!")

if __name__ == '__main__':
    dividir_pdf()
