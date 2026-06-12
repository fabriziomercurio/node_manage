import { Request, Response } from 'express'; 
import { successResponse, errorResponse } from '../helpers/Response.js';
import Connected from '../db/connected.js';
import { Mysql } from '../classes/MySql.js';

const connected = new Connected(new Mysql);
const conn = await connected.connection();  

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