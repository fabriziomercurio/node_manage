import { Request, Response } from "express"; 
import conn from "../db/connection.js";
import { AuthService } from "../services/AuthService.js";
import { JwtTokenProvider } from "../services/JwtTokenProvider.js";
import fs from "fs"; 
import path from "path";
import { LoginPayload, ValidateTokenPayload } from "../types/Payload.js";

const privateKey = fs.readFileSync(path.join(process.cwd(), "private.key"), "utf-8"); 

const tokenService = new AuthService<LoginPayload,ValidateTokenPayload>(new JwtTokenProvider(privateKey)); 

const loginController = { 

    async login(req:Request,res:Response) 
    {  
       try { 

           const email = req.body.email; 
           const [result]:any = await conn.query("SELECT id,email,password from users WHERE email = ? ", [email]); 
          
           if(result.length === 0) return res.status(404).json({message:"User not found"}); 

           if (result[0].password !== req.body.password) return res.status(404).json({message:"Password Incorrect"}); 
           
           const payload = {id:result[0].id,email:result[0].email,exp:Math.floor(Date.now() / 1000) + 3600}; 

           const token = tokenService.create(payload); 
             
           const publicKey = fs.readFileSync(path.join(process.cwd(), "public.key"), "utf-8");

           tokenService.validateToken({token:token,publicKey:publicKey}); 

           res.status(200).json({"message":"you're logged","fake-token":token}); 

       } catch (err) {
          return res.status(500).json({
                message: err instanceof Error ? err.message : "Unknown error"
            });
       }
    }

} 

export default loginController; 
