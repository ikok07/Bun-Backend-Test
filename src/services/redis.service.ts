import {redis, RedisClient} from "bun"
export class RedisService {
    private static client: RedisClient | null;

    static async healthcheck() {
        try {
            const client = this.instance();
            if (!client) return false;
            await client.ping();
            return true;
        } catch (e) {
            return false;
        }
    }

    static instance() {
        if (!process.env.REDIS_URL) throw new Error("Missing redis url!")
        if (!this.client) {
            this.client = new RedisClient(process.env.REDIS_URL, {
                connectionTimeout: 1000 * 10, // ms
                idleTimeout: 1000 * 30, // ms
                autoReconnect: true,
                maxRetries: 5
            });
        }

        return this.client;
    }

    static close() {
        if (this.client) {
            this.client.close();
            this.client = null;
        }
    }
}