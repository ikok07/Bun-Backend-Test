import {pgEnum, pgTable, text} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";
import {createInsertSchema, createSelectSchema} from "drizzle-zod";
import {z} from "zod";

export const profileRoles = pgEnum("profile_roles_enum", ["user", "admin"]);

export const profilesTable = pgTable("profiles", {
    id: text("id").notNull().primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone").notNull(),
    password: text("password").notNull(),
    role: profileRoles().notNull()
});

export const profileSchema = createSelectSchema(profilesTable);
export type Profile = z.infer<typeof profileSchema>;

export const safeProfileSchema = profileSchema.omit({password: true});
export type SafeProfile = z.infer<typeof safeProfileSchema>;

export const profileInsertSchema = createInsertSchema(profilesTable);
export type ProfileInsert = z.infer<typeof profileInsertSchema>;