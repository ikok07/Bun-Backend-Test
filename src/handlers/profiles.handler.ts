import {DatabaseService} from "../services/database.service.ts";
import {type Profile, profileInsertSchema, profilesTable, safeProfileSchema} from "../db/schemas/profiles.ts";
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
        const profile: Profile = c.get("profile");

        const {data: safeProfile, error: safeProfileError} = safeProfileSchema.safeParse(profile);
        if (safeProfileError) throw new Error("Could not parse profile into safe profile!");

        return successResponse(c, safeProfile);
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