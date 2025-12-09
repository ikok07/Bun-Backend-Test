import type {Context} from "hono";

export function successResponse(c: Context, data?: object) {
    const object: any = {
        status: "success"
    };
    if (data) object["data"] = data;

    return c.json(object);
}

export function errorResponse(c: Context, status: number, message?: string, cause?: any) {
    const object: any = {
        status: "error"
    }

    if (message) object["message"] = message;
    if (cause) object["cause"] = cause;

    // @ts-ignore
    return c.json(object, status);
}