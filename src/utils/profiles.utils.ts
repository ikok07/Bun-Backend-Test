import {z} from "zod";
import {JwtService} from "../services/jwt.service.ts";
import {HTTPException} from "hono/http-exception";
import {StatusCodes} from "http-status-codes";
import {DatabaseService} from "../services/database.service.ts";
import {type Profile, profilesTable} from "../db/schemas/profiles.ts";
import {eq} from "drizzle-orm";
import {GraphQLError} from "graphql";

export async function getSessionProfile(token: string) {
    const {data: verifiedToken, error} = z.object({profileId: z.string()}).safeParse(JwtService.verifyToken(token));
    if (error) throw new HTTPException(StatusCodes.UNAUTHORIZED, {message: "Unauthorized!"});

    let profile: Profile | null = null
    // const cacheKey = `profile:${verifiedToken.profileId}`
    // const cachedProfile = await RedisService.instance().get(cacheKey);

    // if (cachedProfile) profile = JSON.parse(cachedProfile);
    // else {
        const [dbProfile] = await DatabaseService.instance().select().from(profilesTable).where(eq(profilesTable.id, verifiedToken.profileId))
        if (!dbProfile) throw new HTTPException(StatusCodes.NOT_FOUND, {message: "Profile not found!"});
        profile = dbProfile;
        // await RedisService.instance().set(cacheKey, JSON.stringify(profile), "EX", 3600);
    // }

    return profile;
}

export function checkLoggedIn(profile: Profile | null) {
    if (!profile) throw new GraphQLError("You must be logged in!!");
}

export function throwNoAccess(allowed: boolean) {
    if (!allowed) throw new GraphQLError("You don't have access to this functionality!");
}