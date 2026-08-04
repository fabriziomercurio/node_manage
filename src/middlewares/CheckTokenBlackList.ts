import { Request, Response, NextFunction } from "express"; 
import Connected from '../db/connected.js';
import { Redis } from '../classes/Redis.js';
import { LoginPayload, ValidateTokenPayload } from '../types/Payload.js';
import { AuthService } from "../services/AuthService.js";
import { JwtTokenProvider } from "../providers/JwtTokenProvider.js";
import fs from 'node:fs'; 
import path from "path";
import RedisService from "../services/RedisService.js";

const connected = new Connected(new Redis);
const privateKey = fs.readFileSync(path.join(process.cwd(), "private.key"), "utf-8"); 
const tokenService = new AuthService<LoginPayload,ValidateTokenPayload>(new JwtTokenProvider(privateKey)); 
const publicKey = fs.readFileSync(path.join(process.cwd(),"public.key"), "utf-8");
const redisService = new RedisService; 

const CheckTokenBlackList = async (req:Request,res:Response, next:NextFunction) => {
    try { 

        const redis = await connected.connection();

        const token = req.headers['authorization']!;   

        const accessPayload = tokenService.getPayloadEncoded({
            token: token,
            publicKey: publicKey
        });

        const storedToken = await redisService.checkAccessOnBlackList(accessPayload.jti); 

        if (storedToken) return res.status(403).json({"message":"Access Token Revoked"});         

        next(); 
        
    } catch (error) {
        return res.status(401).json({
                message: error instanceof Error ? error.message : "Unknown error"
            });
    }
}

export default CheckTokenBlackList; 