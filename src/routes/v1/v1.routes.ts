import {Hono} from "hono";
import profilesRouter from "./profiles.routes.ts";

const v1Router = new Hono();

v1Router.route("/profiles", profilesRouter)

export default v1Router;