// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: { // <-- Adicione este bloco
        'vscode-bg': '#1e1e1e',             // Fundo principal (quase preto)
        'vscode-card': '#252526',           // Fundo de cards/painéis
        'vscode-border': '#333333',         // Bordas de elementos
        'vscode-button': '#3c3c3c',         // Fundo de botões comuns
        'vscode-button-hover': '#4c4c4c',   // Fundo de botões comuns (hover)
        'vscode-text': '#cccccc',           // Texto padrão claro
        'vscode-text-light': '#dddddd',     // Texto um pouco mais claro (para labels)
        'vscode-text-placeholder': '#888888', // Texto para placeholders/informações secundárias
        'vscode-blue': '#007acc',           // Azul de destaque (links, bordas, botões de ação)
        'vscode-blue-hover': '#0062a3',     // Azul de destaque (hover)
        // Você pode adicionar mais cores se precisar de detalhes mais finos
      },
    },
  },
  plugins: [],
};