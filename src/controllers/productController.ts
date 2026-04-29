
import { Request, Response } from 'express'; 
import conn from '../db/connection.js';  

const productController = {
    async show(req:Request,res:Response) 
    {
      try {
            const rows = await conn.query(`SELECT * FROM products`)             
            res.status(200).send(rows[0]);
         } catch (err) {
            res.status(500).send({ error: err })
         }
    }, 

    async store(req:Request,res:Response) 
    {           
      try {        
          const {title} = req.body; 
          await conn.query(`INSERT INTO products (title) VALUES (?)`, [title]); 
          res.send(JSON.stringify(req.body))
       } catch (err) {
           return res.status(500).json({
               error: err 
           });
       }
    }
} 

export default productController; 