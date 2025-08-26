# JRENO - Renomeador Automático de Comprovantes

Uma aplicação desktop para Windows, desenvolvida com Electron e React, que automatiza o processo de renomear arquivos PDF de comprovantes com base em dados extraídos do próprio PDF e cruzados com um relatório Excel.

## Funcionalidades

-   **Interface Desktop:** Interface de usuário moderna e responsiva, construída com React e estilizada com Tailwind CSS.
-   **Divisão de PDF:** Divide um arquivo PDF com múltiplas páginas em arquivos individuais de forma rápida, utilizando a biblioteca `pdf-lib`.
-   **Extração de Dados:** Extrai o valor e a data de cada comprovante usando as robustas ferramentas do Poppler (`pdftotext`).
-   **Processamento de Dados:** Utiliza `exceljs` para ler relatórios Excel e encontrar correspondências de NF e fornecedor.
-   **Renomeação Automática:** Renomeia cada comprovante seguindo um padrão customizável.
-   **Relatório de Execução:** Gera um relatório detalhado ao final do processo, informando os sucessos e as falhas.
-   **Instalador e Auto-Update:** Oferece um instalador `.exe` e um sistema de atualização automática via GitHub Releases.

## Tecnologias Utilizadas

-   **Framework Desktop:** Electron
-   **Interface de Usuário:** React, TypeScript, Tailwind CSS
-   **Lógica de Negócios:** Node.js
-   **Manipulação de PDF:** `pdf-lib` (para divisão), Poppler (para extração de texto)
-   **Manipulação de Excel:** `exceljs`

## Pré-requisitos para Desenvolvimento

Para configurar e executar o projeto em sua máquina, você precisará de:

-   **Node.js** (versão 18 ou superior) e **npm**.
-   **Git**.
-   **Binários do Poppler para Windows:** Faça o download e extraia os executáveis (`pdftotext.exe`, etc.) para a pasta `resources/poppler/win64/`.
-   **Executável do Node.js:** Adicione o arquivo `node.exe` da sua instalação do Node.js à pasta `resources/node_runtime/`.

> **Nota:** Se a pasta `resources` não existir na raiz do projeto, crie-a.

## Estrutura do Projeto


JReno/
├── frontend/             # Contém todo o código da aplicação Electron/React
│   ├── electron/         # Código principal do Electron (main.ts, preload.js)
│   ├── release/          # Pasta de saída para os builds e instaladores
│   ├── src/              # Código-fonte do React
│   └── package.json      # Dependências e scripts do frontend
├── resources/            # Binários externos necessários para a aplicação
│   ├── poppler/
│   └── node_runtime/
├── src/                  # Scripts Node.js que formam o backend
│   ├── JS/
│   │   ├── dividir_pdf.cjs
│   │   ├── excel.cjs
│   │   ├── index.cjs
│   │   └── pdf.cjs
├── .gitignore
└── README.md


## Como Começar (Ambiente de Desenvolvimento)

1.  **Clone o Repositório:**
    ```bash
    git clone [https://github.com/ricardo11t/JReno.git](https://github.com/ricardo11t/JReno.git)
    ```

2.  **Instale as Dependências do Frontend:**
    ```bash
    cd JReno/frontend
    npm install
    ```

3.  **Execute em Modo de Desenvolvimento:**
    ```bash
    npm run electron-dev
    ```
    Isso abrirá a janela do Electron com o DevTools. O Hot-Reload para o código React já está configurado.

## Build, Publicação e Auto-Update

Para gerar um instalador (`.exe`) e publicar uma nova versão que será distribuída automaticamente para os usuários, siga estes passos:

1.  **Atualize a Versão do App:**
    No arquivo `frontend/package.json`, incremente o número da `version` (ex: de `"0.0.4"` para `"0.0.5"`).

2.  **Configure o Script de Build (Apenas uma vez):**
    Para simplificar o processo, garanta que o script `electron-build` no seu `frontend/package.json` já inclua a flag de publicação:
    ```json
    "scripts": {
      // ... outros scripts
      "electron-build": "npm run build && npm run compile-electron && electron-builder --publish always"
    }
    ```

3.  **Defina o Token de Acesso do GitHub:**
    Para que o `electron-builder` possa fazer o upload para o seu repositório, ele precisa de um [Personal Access Token](https://github.com/settings/tokens) com a permissão `repo`. Defina este token como uma variável de ambiente **antes** de executar o build.

    -   **No PowerShell (Recomendado):**
        ```powershell
        $env:GH_TOKEN = "SEU_TOKEN_AQUI"
        ```
    -   **No CMD:**
        ```cmd
        set GH_TOKEN=SEU_TOKEN_AQUI
        ```
    > **Atenção:** A variável só vale para a sessão atual do terminal. Se você fechar e abrir o terminal, precisará defini-la novamente.

4.  **Execute o Build e a Publicação:**
    Agora, basta executar o comando. Ele irá compilar o app e fazer o upload para o GitHub.
    ```bash
    npm run electron-build
    ```

5.  **Publique o Release no GitHub:**
    O `electron-builder` criará um novo *release* no seu repositório, mas ele começará como um **Rascunho (Draft)**.
    -   Vá para a seção de **Releases** do seu repositório no GitHub.
    -   Encontre a nova versão que você acabou de enviar (ex: `0.0.5`).
    -   Clique em "Edit" (Editar).
    -   Role para baixo e clique no botão verde **"Publish release"**.

Pronto! Na próxima vez que um usuário com uma versão antiga abrir o aplicativo, ele será notificado e a atualização será baixada automaticamente.

## Dicas de Depuração

-   **Tela Branca no `.exe`**: Use `npm run electron-debug-pack` para gerar a versão "desempacotada" em `frontend/release/win-unpacked/`. Execute `JRENO.exe` a partir de um terminal para ver os logs de erro.
-   **Erro `EBUSY`**: Certifique-se de que todas as instâncias do aplicativo, VS Code e terminais relacionados ao projeto estejam fechados antes de rodar `npm install` ou `electron-build`.
