import { Request, Response } from "express"; 
import { AuthService } from "../services/AuthService.js";
import { JwtTokenProvider } from "../providers/JwtTokenProvider.js";
import fs from "fs"; 
import path from "path";
import { LoginPayload, ValidateTokenPayload } from "../types/Payload.js";
import bcrypt from 'bcrypt';
import LoginService from "../services/LoginService.js";
import LoginRepository from "../repositories/LoginRepository.js";
import { UserSchema } from "../validations/schemas/UserSchema.js";
import { errorResponse } from "../helpers/Response.js";

const privateKey = fs.readFileSync(path.join(process.cwd(), "private.key"), "utf-8"); 

const tokenService = new AuthService<LoginPayload,ValidateTokenPayload>(new JwtTokenProvider(privateKey)); 

const loginService = new LoginService(new LoginRepository); 

const loginController = { 

    async login(req:Request,res:Response) 
    {  
       try { 

           const {email, password} = req.body; 

           const validation = UserSchema.safeParse(req.body); 
        
           if (!validation.success) {  
                return res.status(404).json({message:validation.error?.issues}); 
            }   
       
           const [result]:any = await loginService.checkIfEmailExist(email)
          
           if(result.length === 0) return res.status(404).json({message:"User not found"}); 

           if(!bcrypt.compareSync(password, result[0].password)) return res.status(404).json({message:"Credentials are not correct"});

           const payload = {id:result[0].id,email:result[0].email,exp:Math.floor(Date.now() / 1000) + 600}; 

           const token = tokenService.create(payload);  

           return res.status(200).json({"message":"you're logged","JWT":token}); 

       } catch (err) {
          return res.status(500).json({
                message: err instanceof Error ? err.message : "Unknown error"
            });
       }
    }
} 

export default loginController; 
