import {Hono} from "hono";
import {ProfilesHandler} from "../../handlers/profiles.handler.ts";
import {protectMiddleware} from "../../middleware/protect.middleware.ts";

const profilesRouter = new Hono();


profilesRouter.post("/login", ProfilesHandler.login);
profilesRouter.post("/signup", ProfilesHandler.signup);

profilesRouter.use("/*", protectMiddleware);
profilesRouter.get("/", ProfilesHandler.getProfile);

export default profilesRouter;