import {createInMemoryCache, useResponseCache} from "@graphql-yoga/plugin-response-cache";
import {createYoga, useExecutionCancellation} from "graphql-yoga";
import SchemaBuilder from "@pothos/core";
import {type GraphQLContext, loadGraphQLFields} from "../graphql/fields.graphql.ts";
import {getSessionProfile} from "../utils/profiles.utils.ts";
import ValidationPlugin from "@pothos/plugin-validation";
import {GraphQLError} from "graphql";

export class GraphqlService {
    private static cache = createInMemoryCache();
    private static schemaBuilder: PothosSchemaTypes.SchemaBuilder<PothosSchemaTypes.ExtendDefaultTypes<{Context: GraphQLContext}>> | null = null;
    private static client: ReturnType<typeof createYoga<Record<string, any>, GraphQLContext>> | null = null;

    static async instance() {
        if (!this.client) {
            this.client = createYoga({
                schema: (await this.schemaBuilderInstance()).toSchema(),
                context: async ({request}) => {
                    const token = request.headers.get("authorization")?.split(' ')[1];
                    const profile = token ? await getSessionProfile(token) : null;

                    return {
                        profile,
                        token,
                        isAuthenticated: !!profile
                    }
                },
                plugins: [
                    useExecutionCancellation,
                    useResponseCache({
                        session: request => request.headers.get("authorization")?.split(' ')[1] || null,
                        cache: this.cache,
                        ttl: 5000, // 5 seconds
                        includeExtensionMetadata: true // Shows cache hit/miss in response
                    })
                ],
            });
        }
        return this.client;
    }

    static cacheInstance() {
        return this.cache;
    }

    static async schemaBuilderInstance() {
        if (!this.schemaBuilder) {
            this.schemaBuilder = new SchemaBuilder({
                plugins: [ValidationPlugin],
                validation: {
                    validationError: (zodError) => {
                        const [issue] = zodError.issues;
                        throw new GraphQLError(issue ? issue.message : `Invalid data! ${zodError}`);
                    }
                }
            });
            this.schemaBuilder.queryType({});
            this.schemaBuilder.mutationType({});
            await loadGraphQLFields();
        }
        return this.schemaBuilder;
    }
}