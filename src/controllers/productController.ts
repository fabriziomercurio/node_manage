
import { Request, Response } from "express"; 
import conn from '../db/connection.js'

const productController = {
    async show(req:Request,res:Response) 
    {
      try {
        console.log('stampa'); 
             const rows = await conn.query(`SELECT * FROM products`)             
             res.status(200).send(rows[0]);
         } catch (error) {
             res.status(500).send({ error: 'something blew up' })
         }
    }
} 

export default productController; 