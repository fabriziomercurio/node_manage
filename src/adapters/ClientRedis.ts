import { createClient, RedisClient, RedisClientType } from "redis";
import { env } from "../config/database.js";

export const clientRedis:RedisClientType =  

    createClient({
      url: `redis://${env.redis.host}:${env.redis.port}`
    });