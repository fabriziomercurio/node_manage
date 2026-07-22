import { createClient } from "redis";
import { ConnectionInterface } from "../interfaces/ConnectionInterface.js";

export class Redis implements ConnectionInterface {

    private client = createClient({
        url: "redis://redis:6379"
    });

    constructor() {
        this.client.on("error", console.error);
    }

    async connection() {
        if (!this.client.isOpen) {
            await this.client.connect();
        }

        return this.client;
    }
}