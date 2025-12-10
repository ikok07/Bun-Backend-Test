import { readdirSync } from "node:fs";
import type {Profile} from "../db/schemas/profiles.ts";

export type GraphQLContext = {
    profile: Profile | null,
    token: string | undefined,
    isAuthenticated: boolean
}

export async function loadGraphQLFields() {
    const files = readdirSync(import.meta.dir);
    for (const file of files.filter(file => file.endsWith(".ts") && file !== import.meta.file)) {
        await import(`./${file}`);
    }
}