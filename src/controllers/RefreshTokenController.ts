import { Request, Response } from 'express'; 
import { AuthService } from '../services/AuthService.js';
import { LoginPayload, ValidateTokenPayload } from '../types/Payload.js';
import { JwtTokenProvider } from '../providers/JwtTokenProvider.js';
import fs from "fs";
import path from 'node:path';

const privateKey = fs.readFileSync(path.join(process.cwd(), "private.key"), "utf-8");
const publicKey = fs.readFileSync(path.join(process.cwd(),"public.key"), "utf-8"); 
const tokenService = new AuthService<LoginPayload,ValidateTokenPayload>(new JwtTokenProvider(privateKey));  
const RefreshTokenController = {
      
    async refresh(req:Request,res:Response) 
    {                
        try {
        const {token} = req.body; 
        const refreshPayload = tokenService.getPayloadEncoded({
         token:token,
         publicKey:publicKey
        }); 

        const refreshToken:string = tokenService.create(refreshPayload); 
        refreshPayload.exp = Math.floor(Date.now() / 1000) + 16; 

        const accessPayload = refreshPayload; 
      
        const accessToken:string = tokenService.create(accessPayload);  
        return res.status(200).json({"message":"new access token is done","accessToken":accessToken,"refreshToken":refreshToken}); 
               
        } catch (error) {
            return res.status(401).json({
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }
} 

export default RefreshTokenController; 

