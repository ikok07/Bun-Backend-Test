import {GraphqlService} from "../services/graphql.service.ts";
import {
    type Profile,
    profilesTable,
} from "../db/schemas/profiles.ts";
import {
    ProfileGraphQL,
    SignUpProfileGraphQL,
    SignUpProfileResponseGraphQL, UpdateProfileGraphQL
} from "../models/graphql/profiles.graphql.models.ts";
import {DatabaseService} from "../services/database.service.ts";
import {DrizzleQueryError, eq, inArray, SQL} from "drizzle-orm";
import {HTTPException} from "hono/http-exception";
import {StatusCodes} from "http-status-codes";
import {JwtService} from "../services/jwt.service.ts";
import {getDbErrorCode} from "../utils/database.utils.ts";
import {PostgresError} from "pg-error-enum";
import {GraphQLError} from "graphql/error";

(await GraphqlService.schemaBuilderInstance()).queryFields((t) => (
    {
        currentProfile: t.field({
           type: ProfileGraphQL,
           resolve: async (_, args, ctx) => {
               if (!ctx.profile) throw new Error("Not signed in!");
               return ctx.profile;
           }
        }),
        profiles: t.field({
            type: [ProfileGraphQL],
            args: {
                ids: t.arg.stringList({required: false})
            },
            resolve: async (_, {ids}, ctx) => {
                let conditions: SQL | null = null;
                if (ids) conditions = inArray(profilesTable.id, ids);

                const profilesQuery = DatabaseService.instance().select().from(profilesTable);
                let results: Profile[];
                if (!conditions) results = await profilesQuery;
                else results = await profilesQuery.where(conditions);

                return results;
            }
        }),
        profile: t.field({
            type: ProfileGraphQL,
            args: {
                profileId: t.arg.string({required: true})
            },
            resolve: async (_, {profileId}, ctx) => {
                if (ctx.profile && ctx.profile.id === profileId) return ctx.profile;

                const [profile] = await DatabaseService.instance().select().from(profilesTable).where(eq(profilesTable.id, profileId));
                if (!profile) throw new Error("Profile not found!");

                return profile;
            }
        })
    }
));

(await GraphqlService.schemaBuilderInstance()).mutationFields((t) => ({
    signup: t.field({
        type: SignUpProfileResponseGraphQL,
        args: {
            insertData: t.arg({
                type: SignUpProfileGraphQL,
                required: true
            })
        },
        resolve: async (_, {insertData}, ctx) => {
            const hashedPassword = await Bun.password.hash(insertData.password, "bcrypt");
            const [insertedProfile] = await DatabaseService.instance()
                .insert(profilesTable)
                .values({...insertData, password: hashedPassword, role: "user"})
                .returning();

            if (!insertedProfile) throw new HTTPException(StatusCodes.INTERNAL_SERVER_ERROR, {message: "Profile could not be created!"});

            return {profile: insertedProfile, token: JwtService.generateToken({profileId: insertedProfile.id}, 60 * 60 * 24)};
        }
    }),
    updateProfile: t.field({
        type: ProfileGraphQL,
        args: {
            profileId: t.arg.string({required: true}),
            updateData: t.arg({type: UpdateProfileGraphQL, required: true})
        },
        resolve: async (_, {profileId, updateData}, ctx) => {
            try {
                const [updatedProfile] = await DatabaseService
                    .instance()
                    .update(profilesTable)
                    .set(Object.fromEntries(Object.entries(updateData).filter(([_, value]) => !!value)))
                    .where(eq(profilesTable.id, profileId))
                    .returning();

                return updatedProfile || null;
            } catch (e) {
                if (e instanceof DrizzleQueryError) {
                    if (getDbErrorCode(e) === PostgresError.UNIQUE_VIOLATION) {
                        throw new GraphQLError("Email already in use!");
                    }
                }
            }
        }
    })
}))