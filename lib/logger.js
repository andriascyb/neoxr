/**
 * lib/logger.js
 * File logging system + console override
 */

const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function fileLog(level, message, ...args) {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const formattedArgs = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message} ${formattedArgs}\n`;

  fs.appendFileSync(path.join(logDir, 'combined.log'), logLine);

  if (level.toLowerCase() === 'error') {
    fs.appendFileSync(path.join(logDir, 'error.log'), logLine);
  }
}

// Override console methods to also log to file
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  originalLog(...args);
  fileLog('info', args[0], ...args.slice(1));
};

console.error = (...args) => {
  originalError(...args);
  fileLog('error', args[0], ...args.slice(1));
};

module.exports = { fileLog, logDir };
