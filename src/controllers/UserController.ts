import { Request, Response } from 'express'; 
import conn from '../db/connection.js'; 
import { successResponse, errorResponse } from '../helpers/Response.js';

const UserController = {
   
    async store(req:Request,res:Response) 
    {
        try { 
            const {email, password} = req.body; 
            conn.query(`INSERT INTO users (email, password) VALUES (?,?)`,[email,password]); 
            successResponse(res,null,'record insert with success');
        } catch (err) {
            errorResponse(res, err instanceof Error ? err.message : "Unknown error")   
        }
    }
}

export default UserController; 