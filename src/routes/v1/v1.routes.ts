import {Hono} from "hono";
import profilesRouter from "./profiles.routes.ts";
import graphqlRouter from "./graphql.routes.ts";

const v1Router = new Hono();

v1Router.route("/profiles", profilesRouter);
v1Router.route("/graphql", graphqlRouter);

export default v1Router;