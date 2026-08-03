import { createClient, RedisClient, RedisClientType } from "redis";
import { ConnectionInterface } from "../interfaces/ConnectionInterface.js";
import { clientRedis } from "../adapters/ClientRedis.js";

export class Redis implements ConnectionInterface<RedisClientType>{

    constructor() {
        clientRedis.on("error", console.error);
    }

    async getClient() : Promise<RedisClientType> {
        
        if (!clientRedis.isOpen) {
            await clientRedis.connect();
        }

        return clientRedis;
    }
}