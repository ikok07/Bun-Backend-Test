import {DatabaseService} from "../services/database.service.ts";
import {profileInsertSchema, profilesTable, safeProfileSchema} from "../db/schemas/profiles.ts";
import {type Context} from "hono"
import {successResponse} from "../utils/responses.utils.ts";
import {HTTPException} from "hono/http-exception";
import {StatusCodes} from "http-status-codes";
import {JwtService} from "../services/jwt.service.ts";
import {PostgresError} from "pg-error-enum";
import {DrizzleQueryError, eq} from "drizzle-orm";
import {getDbErrorCode} from "../utils/database.utils.ts";
import {z} from "zod";
import {JsonWebTokenError} from "jsonwebtoken";
import {RedisClient} from "bun";
import {RedisService} from "../services/redis.service.ts";

export class ProfilesHandler {

    static async getProfile(c: Context) {
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

           const {data: safeProfile, error: safeProfileError} = safeProfileSchema.safeParse(profile);
           if (safeProfileError) throw new Error("Could not parse profile into safe profile!");

           return successResponse(c, safeProfile);
       } catch (e) {
           if (e instanceof JsonWebTokenError) {
               throw new HTTPException(StatusCodes.UNAUTHORIZED, {message: "Unauthorized!"});
           } else {
               console.error(e);
               throw e;
           }
       }
    }

    static async login(c: Context) {
        const validatedBody = z.object({email: z.email(), password: z.string()}).safeParse(await c.req.json());
        if (!validatedBody.data) throw new HTTPException(StatusCodes.BAD_REQUEST, {message: "Invalid body!", cause: validatedBody.error});

        const [profile] = await DatabaseService.instance().select().from(profilesTable).where(eq(profilesTable.email, validatedBody.data.email));
        if (!profile) throw new HTTPException(StatusCodes.BAD_REQUEST, {message: "Invalid email or password!"});

        if (!(await Bun.password.verify(validatedBody.data.password, profile.password, "bcrypt"))) {
            throw new HTTPException(StatusCodes.BAD_REQUEST, {message: "Invalid email or password!"});
        }

        return successResponse(c, {
            token: JwtService.generateToken({
                profileId: profile.id
            }, 60 * 60 * 24) // Expires in 24 hours
        });
    }

    static async signup(c: Context) {
        try {
            const validatedProfile = profileInsertSchema.omit({role: true}).safeParse(await c.req.json());
            if (!validatedProfile.data) throw new HTTPException(StatusCodes.BAD_REQUEST, {message: "Invalid body!", cause: validatedProfile.error});

            const profile = validatedProfile.data;
            profile.password = await Bun.password.hash(profile.password, "bcrypt");

            const [insertedProfile] = await DatabaseService.instance()
                .insert(profilesTable)
                .values({...profile, role: "user"})
                .returning();

            if (!insertedProfile) throw new HTTPException(StatusCodes.INTERNAL_SERVER_ERROR, {message: "Profile could not be created!"});

            return successResponse(c, {
                token: JwtService.generateToken({
                    profileId: insertedProfile.id
                }, 60 * 60 * 24) // Expires in 24 hours
            });
        } catch (e: any) {
            const code = getDbErrorCode(e);
            if (code === PostgresError.UNIQUE_VIOLATION) {
                throw new HTTPException(StatusCodes.BAD_REQUEST, {message: "There is already a profile with this email!"});
            }
            throw e;
        }
    }
}