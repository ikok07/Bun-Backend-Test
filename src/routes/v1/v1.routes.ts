import {Hono} from "hono";
import graphqlRouter from "./graphql.routes.ts";

const v1Router = new Hono();

v1Router.route("/graphql", graphqlRouter);

export default v1Router;