import { Request, Response } from 'express'; 
import { AuthService } from '../services/AuthService.js';
import { LoginPayload, ValidateTokenPayload } from '../types/Payload.js';
import { JwtTokenProvider } from '../providers/JwtTokenProvider.js';
import fs from "fs";
import path from 'node:path';
import Connected from '../db/connected.js';
import { Redis } from '../classes/Redis.js';

const connected = new Connected(new Redis); 
const privateKey = fs.readFileSync(path.join(process.cwd(), "private.key"), "utf-8");
const publicKey = fs.readFileSync(path.join(process.cwd(),"public.key"), "utf-8"); 
const tokenService = new AuthService<LoginPayload,ValidateTokenPayload>(new JwtTokenProvider(privateKey));  

const RefreshTokenController = {

    /**
     * @method get check if token exists in Redis    
     * @method del revoke old refresh token 
     * @method create generate a new refresh token
     * @method set save new refresh token in Redis
     */
    async refresh(req: Request, res: Response) {
        try {
            const { token } = req.body;

            const redis = await connected.connection();

            const refreshPayload = tokenService.getPayloadEncoded({
                token: token,
                publicKey: publicKey
            });

            const storedToken = await redis.get(`refreshToken:${refreshPayload.jti}`);      

            if (!storedToken) {
                throw new Error("Refresh token revoked");
            }

            if (storedToken !== token) {
                throw new Error("Invalid refresh token");
            }

            await redis.del(`refreshToken:${refreshPayload.jti}`); 

            refreshPayload.jti = crypto.randomUUID();

            const refreshToken: string = tokenService.create(refreshPayload);

            await redis.set(`refreshToken:${refreshPayload.jti}`, refreshToken, { EX: 60 * 60 * 24 * 30 }); 

            const accessPayload = {
                ...refreshPayload,
                jti: crypto.randomUUID(),
                exp: Math.floor(Date.now() / 1000) + 16
            }

            const accessToken: string = tokenService.create(accessPayload);

            return res.status(200).json({ "message": "new access token is done", "accessToken": accessToken, "refreshToken": refreshToken });

        } catch (error) {
            return res.status(401).json({
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }
} 

export default RefreshTokenController; 

