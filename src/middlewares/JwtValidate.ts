import { Request, Response, NextFunction } from "express";
import { JwtTokenProvider } from "../providers/JwtTokenProvider.js";
import { AuthService } from "../services/AuthService.js";
import { LoginPayload, ValidateTokenPayload } from "../types/Payload.js";
import fs from "fs";
import path from "node:path";

const privateKey = fs.readFileSync(path.join(process.cwd(), "private.key"), "utf-8"); 
const publicKey = fs.readFileSync(path.join(process.cwd(),"public.key"), "utf-8"); 
const tokenService = new AuthService<LoginPayload,ValidateTokenPayload>(new JwtTokenProvider(privateKey)); 

const JwtValidate = (req:Request,res:Response, next:NextFunction) => {

    try { 

        const token = req.headers['authorization']!; 

        tokenService.validateToken({
          token:token,
              publicKey:publicKey
               } )               
           next()          
            
        } catch (error) {
             return res.status(500).json({
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
} 

export default JwtValidate; 