"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
class Logger {
    constructor() {
        this.logsDir = path_1.default.join(__dirname, '../../logs');
        this.logFile = path_1.default.join(this.logsDir, 'app.log');
        this.maxLogSize = 5 * 1024 * 1024; // 5MB
        this.initialize();
    }
    async initialize() {
        try {
            await fs_1.promises.mkdir(this.logsDir, { recursive: true });
        }
        catch (error) {
            console.error('Errore creazione directory logs:', error instanceof Error ? error.message : String(error));
        }
    }
    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        let logMessage = `${timestamp} [${level}] ${message}`;
        if (data) {
            if (data instanceof Error) {
                logMessage += `\nError: ${data.message}`;
                if (data.stack)
                    logMessage += `\nStack: ${data.stack}`;
            }
            else {
                try {
                    logMessage += ' ' + JSON.stringify(data);
                }
                catch (e) {
                    logMessage += ' ' + String(data);
                }
            }
        }
        return logMessage + '\n';
    }
    async rotateLogFile() {
        try {
            const stats = await fs_1.promises.stat(this.logFile);
            if (stats.size >= this.maxLogSize) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupFile = `${this.logFile}.${timestamp}`;
                await fs_1.promises.rename(this.logFile, backupFile);
                // Mantieni solo gli ultimi 5 file di backup
                const files = await fs_1.promises.readdir(this.logsDir);
                const backups = files
                    .filter(f => f.startsWith('app.log.'))
                    .sort()
                    .reverse();
                for (let i = 5; i < backups.length; i++) {
                    await fs_1.promises.unlink(path_1.default.join(this.logsDir, backups[i]));
                }
            }
        }
        catch (error) {
            console.error('Errore rotazione log:', error instanceof Error ? error.message : String(error));
        }
    }
    async writeLog(entry) {
        try {
            const logMessage = this.formatMessage(entry.level, entry.message, entry.data);
            await this.rotateLogFile();
            await fs_1.promises.appendFile(this.logFile, logMessage, 'utf8');
            // Stampa anche su console se non in produzione
            if (process.env.NODE_ENV !== 'production') {
                console.log(logMessage.trim());
            }
        }
        catch (error) {
            console.error('Errore scrittura log:', error instanceof Error ? error.message : String(error));
        }
    }
    async info(message, data) {
        await this.writeLog({ timestamp: new Date().toISOString(), level: 'info', message, data });
    }
    async warn(message, data) {
        await this.writeLog({ timestamp: new Date().toISOString(), level: 'warn', message, data });
    }
    async error(message, data) {
        await this.writeLog({ timestamp: new Date().toISOString(), level: 'error', message, data });
    }
    async debug(message, data) {
        if (process.env.NODE_ENV === 'development') {
            await this.writeLog({ timestamp: new Date().toISOString(), level: 'debug', message, data });
        }
    }
}
exports.logger = new Logger();
