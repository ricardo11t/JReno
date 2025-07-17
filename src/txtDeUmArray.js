// logger.js
const winston = require('winston');

// Define o formato do log
const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = winston.createLogger({
  // Nível mínimo de log a ser registrado. 
  // 'info' significa que 'info', 'warn' e 'error' serão registrados. 'debug' não será.
  level: 'info',
  
  // Define o formato geral
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),

  // "Transports" são os destinos dos logs (neste caso, arquivos)
  transports: [
    // Transport para salvar logs de erro em um arquivo separado
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' // Apenas logs de nível 'error'
    }),
    
    // Transport para salvar todos os logs em outro arquivo
    new winston.transports.File({ 
      filename: 'combined.log' 
    }),

    // Opcional: Adicionar logs ao console também
    new winston.transports.Console()
  ],
});

module.exports = logger;