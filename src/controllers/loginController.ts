import { Request, Response } from "express"; 
import conn from "../db/connection.js";

const loginController = { 

    async login(req:Request,res:Response) 
    {
       try { 

           const email = req.body.email; 
           const [result]:any = await conn.query("SELECT email,password from users WHERE email = ? ", [email]); 
           
           if(result.length === 0) res.status(404).json({message:"User not found"}); 

           if (result[0].password !== req.body.password) res.status(404).json({message:"Password Incorrect"}); 

           res.status(200).json({"message":"you're logged","fake-token":"fake-token0123456789"}); 

       } catch (err) {
          return res.status(500).json({
                message: err instanceof Error ? err.message : "Unknown error"
            });
       }
    }

} 

export default loginController; 