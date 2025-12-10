import {Hono} from "hono";
import v1Router from "./routes/v1/v1.routes.ts";
import {errorResponse} from "./utils/responses.utils.ts";
import {HTTPException} from "hono/http-exception";
import {StatusCodes} from "http-status-codes";
import {DatabaseService} from "./services/database.service.ts";
import {CerbosService} from "./services/cerbos.service.ts";

async function init() {
    if (!(await DatabaseService.healthcheck())) throw new Error("Database connection failed");
    if (!(await CerbosService.healthcheck())) throw new Error("Cerbos connection failed");
    // if (!(await RedisService.healthcheck())) throw new Error("Redis connection failed");
}

init();

const app = new Hono();

app.route("/api/v1", v1Router);

app.onError((error, c) => {
    if (error instanceof HTTPException) {
       return errorResponse(c, error.status, error.message, error.cause);
    }
    console.error(error);
    return errorResponse(c, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error!", error.cause);
});

export default {
    port: process.env.PORT,
    fetch: app.fetch
};