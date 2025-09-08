import { RedisClientType, createClient } from 'redis';
import { logger } from '../../middleware/logging';

class CacheService {
    private client: RedisClientType;
    private isConnected: boolean = false;

    constructor() {
        this.client = createClient({
            url: process.env['REDIS_URL'] || 'redis://localhost:6379'
        });

        this.client.on('error', (err) => {
            logger.error('Redis Client Error', { error: err.message });
            this.isConnected = false;
        });

        this.client.on('connect', () => {
            logger.info('Redis Client Connected');
            this.isConnected = true;
        });

        this.connect();
    }

    private async connect() {
        try {
            await this.client.connect();
        } catch (error) {
            logger.error('Redis Connection Error', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            if (!this.isConnected) return null;

            const data = await this.client.get(key);
            return data ? JSON.parse(data as string) : null;
        } catch (error) {
            logger.error('Cache Get Error', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return null;
        }
    }

    async set(key: string, value: any, expirationInSeconds: number = 3600): Promise<void> {
        try {
            if (!this.isConnected) return;

            await this.client.set(key, JSON.stringify(value), {
                EX: expirationInSeconds
            });
        } catch (error) {
            logger.error('Cache Set Error', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async del(key: string): Promise<void> {
        try {
            if (!this.isConnected) return;

            await this.client.del(key);
        } catch (error) {
            logger.error('Cache Delete Error', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}

export const cacheService = new CacheService();
