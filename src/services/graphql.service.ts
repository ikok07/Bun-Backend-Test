import {createInMemoryCache, useResponseCache} from "@graphql-yoga/plugin-response-cache";
import {createSchema, createYoga, useExecutionCancellation} from "graphql-yoga";

export class GraphqlService {
    private static cache = createInMemoryCache()
    private static client = createYoga({
        schema: createSchema({
            typeDefs: `
            type Query {
                greetings: String
            }
        `,
            resolvers: {
                Query: {
                    greetings: () => "Hello, World"
                }
            }
        }),
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

    static instance() {
        return this.client;
    }

    static cacheInstance() {
        return this.cache;
    }
}