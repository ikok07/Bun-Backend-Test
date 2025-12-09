import {Hono} from "hono";
import {GraphqlHandler} from "../../handlers/graphql.handler.ts";
const graphqlRouter = new Hono();

graphqlRouter.all("/", GraphqlHandler.graphql);

export default graphqlRouter;