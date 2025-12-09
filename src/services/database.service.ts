import { drizzle } from "drizzle-orm/postgres-js";
import {sql} from "drizzle-orm"
import postgres from "postgres"

export class DatabaseService {
    private static db: ReturnType<typeof drizzle> | null = null;
    private static sql: ReturnType<typeof postgres> | null = null;

    static async healthcheck() {
        try {
            const db = this.instance();
            if (!db) return false;
            await db.execute(sql`SELECT 1`);
            return true;
        } catch (e) {
            return false;
        }
    }

    static instance() {
        if (!process.env.DATABASE_URL) throw new Error("Missing database url!");
        if (!this.db) {
            this.sql = postgres(process.env.DATABASE_URL, {
                max: 20,
                idle_timeout: 30, // minutes
                max_lifetime: 60 * 30, // seconds
                connect_timeout: 10 // seconds
            })

            return drizzle(this.sql);
        }

        return this.db;
    }

    static async close() {
        if (this.sql) {
            await this.sql.end();
            this.db = null;
            this.sql = null;
        }
    }
}