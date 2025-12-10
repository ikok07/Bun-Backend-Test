import type {Context} from "hono";
import {cloneRawRequest} from "hono/request";
import {GraphqlService} from "../services/graphql.service.ts";

export class GraphqlHandler {
    static async graphql(c: Context) {
        const rawRequest = await cloneRawRequest(c.req);
        return (await GraphqlService.instance()).handle(rawRequest);
    }
}