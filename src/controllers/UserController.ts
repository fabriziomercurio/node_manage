import { Request, Response } from 'express'; 
import { successResponse, errorResponse } from '../helpers/Response.js';
import bcrypt from 'bcrypt';
import UserService from '../services/UserService.js';
import UserRepository from '../repositories/UserRepository.js';
import { UserSchema } from '../validations/schemas/UserSchema.js';
import LoginService from '../services/LoginService.js';
import LoginRepository from '../repositories/LoginRepository.js';

const userService = new UserService(new UserRepository); 

const loginService = new LoginService(new LoginRepository); 

const UserController = {
   
    async store(req:Request,res:Response) 
    {
        try { 
            const validation = UserSchema.safeParse(req.body); 

            if (!validation.success) {  
                return res.status(404).json({message:validation.error?.issues}); 
            }  

            const [result]:any = await loginService.checkIfEmailExist(req.body.email)
          
            if(result.length !== 0) return res.status(404).json({message:"Email already exists"}); 
            
            const {email, password} = req.body;  
            const hashPassword = await bcrypt.hash(password,10); 
            userService.store(email,hashPassword);  
            successResponse(res,null,'user registered with success');
        } catch (err) {
            errorResponse(res, err instanceof Error ? err.message : "Unknown error")   
        }
    }
}

export default UserController; 