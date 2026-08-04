import Connected from "../db/connected.js"; 
import { Redis } from "../classes/Redis.js"; 

const connected = new Connected(new Redis);
const redis = await connected.connection(); 

class RedisService{ 

    async setWhiteList(jti:string,refreshToken:string) {
        await redis.set(
            `refresh_token:whitelist:${jti}`,
            refreshToken,
            {
                EX: 60 * 60 * 24 * 30
            }
        );
    }

    async blackList(jti:string) {
        await redis.set(
            `access_token:blacklist:${jti}`,
            'invalid',
            {
                EX: 60 * 60 * 24 * 30
            }
        );

        await redis.del(`refresh_token:whitelist:${jti}`);
    } 

    async checkAccessOnBlackList(jti:string) : Promise<string | null>
    {
       return redis.get(`access_token:blacklist:${jti}`); 
    }
}

export default RedisService; 