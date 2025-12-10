import {GRPC} from "@cerbos/grpc";
import type {CheckResourcesRequest} from "@cerbos/core";

export class CerbosService {
    static client = new GRPC("localhost:3593", {tls: false})

    static instance() {
        return this.client;
    }

    static async checkMultiple(request: CheckResourcesRequest) {
        return !(await CerbosService.instance().checkResources(request))
            .results
            .some(result =>
                Object.values(result.actions).some(value => value === "EFFECT_DENY")
            );
    }

    static async healthcheck() {
        try {
            const result = await this.client.checkHealth();
            return result.status === "SERVING";
        } catch (e) {
            console.error(e);
            return false;
        }
    }
}