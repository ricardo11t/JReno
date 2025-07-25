import os
import re
import pytesseract
from PIL import Image
from pdf2image import convert_from_path

# --- CONFIGURAÇÕES ---
PASTA_DOS_PDFS = "C:/Users/ricardo.hl/Desktop/renomear"
CAMINHO_TESSERACT_EXE = r'C:\Users\ricardo.hl\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'
CAMINHO_POPPLER_BIN = r"C:\Users\ricardo.hl\Documents\Ferramentas\poppler-24.08.0\Library\bin"
pytesseract.pytesseract.tesseract_cmd = CAMINHO_TESSERACT_EXE
# --- FIM DAS CONFIGURAÇÕES ---

def limpar_nome_arquivo(texto):
    """Remove caracteres inválidos para nomes de arquivo"""
    texto = texto.replace('\n', ' ')
    return re.sub(r'[\\/*?:"<>|]', '', texto).strip()

def extrair_info(texto, label, padrao_regex):
    """Extrai uma informação do texto usando regex, limpando o resultado."""
    match = re.search(padrao_regex, texto, re.IGNORECASE | re.MULTILINE)
    if match:
        valor = next((g for g in match.groups() if g), None)
        if valor:
            valor_limpo = re.sub(r'\s+', ' ', valor.replace('|', '')).strip()
            print(f"✅ {label}: {valor_limpo}")
            return valor_limpo
    print(f"❌ Não foi possível encontrar '{label}'.")
    return None

def gerar_nome_unico(caminho_pasta, nome_base):
    nome, ext = os.path.splitext(nome_base)
    contador = 1
    novo_nome = nome_base
    while os.path.exists(os.path.join(caminho_pasta, novo_nome)):
        novo_nome = f"{nome} ({contador}){ext}"
        contador += 1
    return novo_nome

def processar_pdfs_na_pasta(caminho_pasta):
    print(f"--- Iniciando processamento na pasta: {caminho_pasta} ---\n")
    for nome_arquivo in os.listdir(caminho_pasta):
        if nome_arquivo.lower().endswith(".pdf"):
            caminho_completo_pdf = os.path.join(caminho_pasta, nome_arquivo)
            print(f"📄 Processando arquivo: {nome_arquivo}")

            try:
                imagens = convert_from_path(caminho_completo_pdf, poppler_path=CAMINHO_POPPLER_BIN)
                memorando_processado = False

                for i, page_image in enumerate(imagens):
                    if memorando_processado:
                        break

                    print(f"  -> Verificando página {i + 1}...")
                    texto_pagina = pytesseract.image_to_string(page_image, lang='por')

                    if "UNIDADE" in texto_pagina.upper() and "TIPO DE PAGAMENTO" in texto_pagina.upper():
                        print(f"  -> memorando válido encontrado na página {i + 1}. Extraindo dados...")

                        tipo_regex = r"TIPO DE PAGAMENTO\s*[:\n]*\s*(.+)"
                        unidade_regex = r"UNIDADE\s*[:\n]*\s*(.+)"
                        data_regex = r"(?:DATA DE PAGAMENTO|DATA DO PGTO|PAGAMENTO)\s*[:\n]*\s*([0-9]{1,2}/[0-9]{1,2}/[0-9]{2,4})"

                        tipo = extrair_info(texto_pagina, "Tipo de Pagamento", tipo_regex)
                        unidade = extrair_info(texto_pagina, "Unidade", unidade_regex)
                        data = extrair_info(texto_pagina, "Data de Pagamento", data_regex)

                        if tipo and unidade:
                            tipo_limpo = limpar_nome_arquivo(tipo)
                            unidade_limpa = limpar_nome_arquivo(unidade)

                            nome_final = f"{tipo_limpo} {unidade_limpa}"

                            if data:
                                data_formatada = data.replace('/', '')
                                nome_final += f" {data_formatada}"

                            nome_base = f"{nome_final}.pdf"
                            novo_nome = gerar_nome_unico(caminho_pasta, nome_base)

                            novo_caminho_completo = os.path.join(caminho_pasta, novo_nome)

                            if os.path.abspath(caminho_completo_pdf) != os.path.abspath(novo_caminho_completo):
                                os.rename(caminho_completo_pdf, novo_caminho_completo)
                                print(f"  -> ✅ Arquivo renomeado para: {novo_nome}\n")
                            else:
                                print(f"  -> ℹ️ Nomes de arquivo de origem e destino são idênticos.\n")

                            memorando_processado = True
                        else:
                            print("  -> ⚠️ Tipo ou Unidade ausentes. Arquivo NÃO renomeado.\n")
                    else:
                        print(f"  -> Página {i + 1} não parece ser um memorando, ignorando.")

                if not memorando_processado:
                    print(f"  -> ⚠️ Nenhum memorando válido encontrado no arquivo '{nome_arquivo}'.\n")

            except Exception as e:
                print(f"  -> 🚨 Erro ao processar '{nome_arquivo}': {e}\n")

if __name__ == "__main__":
    processar_pdfs_na_pasta(PASTA_DOS_PDFS)
