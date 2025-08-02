# JRENO - Renomeador Automático de Comprovantes

Uma aplicação desktop híbrida para Windows, desenvolvida com Electron e React, que automatiza o processo de renomear arquivos PDF de comprovantes com base em dados extraídos do PDF e referenciados em um relatório Excel.

## Funcionalidades

-   **Interface Desktop:** Uma interface de usuário moderna e responsiva, construída com React e estilizada com Tailwind CSS.
-   **Divisão de PDF:** Divide um arquivo PDF grande em páginas individuais de forma extremamente rápida, utilizando a biblioteca `pdf-lib`.
-   **Extração de Dados:** Extrai valor e data de cada página de comprovante usando as robustas ferramentas `pdftotext` (do Poppler).
-   **Processamento de Dados:** Utiliza as bibliotecas `exceljs` para ler um relatório e encontrar correspondências de NF e fornecedor com base nos dados do PDF.
-   **Renomeação Automática:** Renomeia cada comprovante de acordo com o padrão `COMP. NF<Número do NF> <Nome do Fornecedor>`.
-   **Relatório de Execução:** Gera um relatório detalhado das renomeações bem-sucedidas e falhas.
-   **Instalador e Auto-updates:** Oferece um instalador `.exe` e um sistema de auto-atualização para que os usuários estejam sempre com a versão mais recente.

## Tecnologias Utilizadas

**Frontend (Desktop App):**
-   **Electron:** Para o framework do aplicativo desktop.
-   **React:** Para a interface de usuário.
-   **TypeScript:** Para o desenvolvimento com tipagem segura.
-   **Tailwind CSS:** Para a estilização rápida e eficiente da interface.

**Backend (Lógica de Negócios):**
-   **Node.js:** Para a orquestração e execução dos scripts de backend.
-   **`pdf-lib`:** Para divisão rápida de PDFs.
-   **`pdf-poppler`:** Para a extração robusta de texto de PDFs.
-   **`exceljs` e `xlsx`:** Para a leitura e processamento do relatório Excel.

## Pré-requisitos para Desenvolvimento

Para configurar e executar o projeto em sua máquina de desenvolvimento, você precisará de:
-   **Node.js** (versão 18 ou superior) e **npm**
-   **Git**
-   **Python 3.x** (O projeto não utiliza Python na sua lógica principal, mas pode ser necessário para a execução de outros scripts e ferramentas em seu ambiente de desenvolvimento).
-   **Binários do Poppler para Windows:** Faça o download de uma versão compatível e extraia os executáveis (`pdftotext.exe`, `pdftocairo.exe`, etc.) para a pasta `resources/poppler/win64/` na raiz do projeto (`C:\projetos\renomear`).

## Estrutura do Projeto

JReno/
├── frontend/
│   ├── dist/
│   ├── electron/
│   ├── node_modules/
│   ├── package.json
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── index.css
│       └── main.tsx
├── resources/
│   ├── poppler/
│   └── node_runtime/
├── src/
│   ├── JS/
│   │   ├── dividir_pdf.cjs
│   │   ├── excel.cjs
│   │   ├── index.cjs
│   │   └── pdf.cjs
│   └── PYTHON/
├── .gitignore
├── package.json
└── README.md

## Como Começar (Ambiente de Desenvolvimento)

Siga estes passos para configurar e executar o projeto:

1.  **Clone o Repositório:**
    ```bash
    git clone [https://github.com/ricardo11t/renomear-arquivos.git](https://github.com/ricardo11t/renomear-arquivos.git)
    cd renomear/frontend
    ```
2.  **Instale as Dependências do Frontend:**
    ```bash
    npm install
    ```
3.  **Execute em Modo de Desenvolvimento:**
    ```bash
    npm run electron-dev
    ```
    Isso abrirá a janela do Electron e o DevTools. Qualquer alteração no código React será atualizada automaticamente.

## Build e Distribuição (Criação do `.exe`)

Para criar a versão de produção do aplicativo, use o seguinte comando:

1.  **Execute o Build Completo:**
    ```bash
    npm run electron-build
    ```
2.  **Localize o Aplicativo:** O instalador estará na pasta `frontend/release/`.
3.  **Distribua o `JRENO Setup 0.0.1.exe`** para os usuários.
    * Para testar rapidamente sem instalar: Execute `JRENO.exe` que está em `frontend/release/win-unpacked/JRENO.exe`.

## Ciclo de Atualização e Publicação

Para lançar uma nova versão com auto-atualização:

1.  **Altere o número da versão** em `frontend/package.json` (ex: `0.0.1` para `0.0.2`).
2.  **Execute o build com o comando de publicação:**
    ```bash
    npm run electron-build -- --publish always
    ```
3.  O `electron-builder` criará uma nova release no seu repositório do GitHub.
4.  O aplicativo instalado em qualquer computador fará o download e a instalação automática na próxima vez que for iniciado.

## Dicas de Depuração

-   **`ERR_CONNECTION_REFUSED`**: Verifique se o `main.ts` está usando o `app.isPackaged` para carregar o URL correto.
-   **Tela Branca no `.exe`**: Use `npm run electron-debug-pack` para gerar a versão não instalada e execute-a pelo terminal para ver os logs do `main.js`.
-   **`EBUSY`**: Feche o VS Code, terminais e o aplicativo antes de rodar qualquer comando `npm install` ou `electron-build`. Use o Process Explorer se necessário.
