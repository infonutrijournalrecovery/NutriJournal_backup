"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
const redis_1 = require("redis");
const logging_1 = require("../../middleware/logging");
class CacheService {
    constructor() {
        this.isConnected = false;
        this.client = (0, redis_1.createClient)({
            url: process.env['REDIS_URL'] || 'redis://localhost:6379'
        });
        this.client.on('error', (err) => {
            logging_1.logger.error('Redis Client Error', { error: err.message });
            this.isConnected = false;
        });
        this.client.on('connect', () => {
            logging_1.logger.info('Redis Client Connected');
            this.isConnected = true;
        });
        this.connect();
    }
    async connect() {
        try {
            await this.client.connect();
        }
        catch (error) {
            logging_1.logger.error('Redis Connection Error', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async get(key) {
        try {
            if (!this.isConnected)
                return null;
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            logging_1.logger.error('Cache Get Error', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return null;
        }
    }
    async set(key, value, expirationInSeconds = 3600) {
        try {
            if (!this.isConnected)
                return;
            await this.client.set(key, JSON.stringify(value), {
                EX: expirationInSeconds
            });
        }
        catch (error) {
            logging_1.logger.error('Cache Set Error', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async del(key) {
        try {
            if (!this.isConnected)
                return;
            await this.client.del(key);
        }
        catch (error) {
            logging_1.logger.error('Cache Delete Error', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.cacheService = new CacheService();
