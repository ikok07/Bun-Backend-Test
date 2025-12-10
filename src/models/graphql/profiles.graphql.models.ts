import {GraphqlService} from "../../services/graphql.service.ts";
import {type Profile, profileInsertSchema, profileSchema} from "../../db/schemas/profiles.ts";

export const ProfileGraphQL = (await GraphqlService.schemaBuilderInstance()).objectRef<Profile>("Profile");
ProfileGraphQL.implement({
    fields: (t) => ({
        id: t.exposeID("id"),
        name: t.exposeString("name"),
        email: t.exposeString("email"),
        phone: t.exposeString("phone"),
        role: t.exposeString("role")
    }),
});

export const SignUpProfileGraphQL = (await GraphqlService.schemaBuilderInstance()).inputType("SignUp", {
    fields: (t) => ({
        name: t.string({required: true}),
        email: t.string({required: true}),
        phone: t.string({required: true}),
        password: t.string({required: true})
    }),
    validate: profileInsertSchema.omit({role: true})
});

export const LoginProfileGraphQL = (await GraphqlService.schemaBuilderInstance()).inputType("Login", {
    fields: t => ({
        email: t.string({required: true}),
        password: t.string({required: true})
    }),
    validate: profileInsertSchema.omit({name: true, phone: true, role: true})
});

export const LoginProfileResponseGraphQL = (await GraphqlService.schemaBuilderInstance())
    .objectRef<{
        profile: Profile,
        token: string
    }>("SignUpProfileResponse")
    .implement({
        fields: (t) => ({
            profile: t.field({
                type: ProfileGraphQL,
                resolve: (parent) => parent.profile
            }),
            token: t.field({
                type: "String",
                resolve: (parent) => parent.token
            })
        })
    });

export const UpdateProfileGraphQL = (await GraphqlService.schemaBuilderInstance()).inputType("UpdateProfile", {
    fields: (t) => ({
        name: t.string({required: false}),
        email: t.string({required: false}),
        phone: t.string({required: false}),
        role: t.string({required: false})
    }),
    validate: profileSchema.partial()
});