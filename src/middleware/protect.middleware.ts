import type {Context, Next} from "hono";
import {HTTPException} from "hono/http-exception";
import {StatusCodes} from "http-status-codes";
import {z} from "zod";
import {JwtService} from "../services/jwt.service.ts";
import {RedisService} from "../services/redis.service.ts";
import {DatabaseService} from "../services/database.service.ts";
import {profilesTable} from "../db/schemas/profiles.ts";
import {eq} from "drizzle-orm";
import {JsonWebTokenError} from "jsonwebtoken";

export async function protectMiddleware(c: Context, next: Next) {
    try {
        const token = c.req.header()["authorization"]?.split(' ')[1];
        if (!token) throw new HTTPException(StatusCodes.UNAUTHORIZED, {message: "Unauthorized!"});
        const {data: verifiedToken, error} = z.object({profileId: z.string()}).safeParse(JwtService.verifyToken(token));
        if (error) throw new HTTPException(StatusCodes.UNAUTHORIZED, {message: "Unauthorized!"});

        let profile: object | null = null
        const cacheKey = `profile:${verifiedToken.profileId}`
        const cachedProfile = await RedisService.instance().get(cacheKey);

        if (cachedProfile) profile = JSON.parse(cachedProfile);
        else {
            const [dbProfile] = await DatabaseService.instance().select().from(profilesTable).where(eq(profilesTable.id, verifiedToken.profileId))
            if (!dbProfile) throw new HTTPException(StatusCodes.NOT_FOUND, {message: "Profile not found!"});
            profile = dbProfile;
            await RedisService.instance().set(cacheKey, JSON.stringify(profile), "EX", 3600);
        }

        c.set("profile", profile);

        await next();
    } catch (e) {
        if (e instanceof JsonWebTokenError) {
            throw new HTTPException(StatusCodes.UNAUTHORIZED, {message: "Unauthorized!"});
        }
        throw e;
    }
}