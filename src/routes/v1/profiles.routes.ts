import {Hono} from "hono";
import {ProfilesHandler} from "../../handlers/profiles.handler.ts";

const profilesRouter = new Hono();

profilesRouter.get("/", ProfilesHandler.getProfile);
profilesRouter.post("/login", ProfilesHandler.login);
profilesRouter.post("/signup", ProfilesHandler.signup);

export default profilesRouter;