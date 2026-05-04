
import { Request, Response } from 'express'; 
import conn from '../db/connection.js'; 
import fs from 'node:fs'; 
import {withTransaction}  from '../db/wrappers/transaction.js';

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

    async store(req: Request, res: Response) {

        const filename = req.file?.filename;
        const file = req.file;

        try {
            const { title } = req.body;
            await withTransaction(async (db: any) => { 

                if (filename) await db.query(`INSERT INTO product_images (name) VALUES (?)`, [filename]);

                await db.query(`INSERT INTO products (title) VALUES (?)`, [title]);
            });

            res.send(JSON.stringify({ message: "record insert with success" })); 
        } catch (err: any) {
            if (file) fs.unlinkSync(file.path);
            return res.status(500).json({
                error: err.message
            });
        }
    }
} 

export default productController; 