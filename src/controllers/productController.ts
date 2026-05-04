
import { Request, Response } from 'express'; 
import conn from '../db/connection.js'; 
import fs from 'node:fs'; 
import {withTransaction}  from '../db/wrappers/transaction.js'; 
import sharp from "sharp";

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

        res.send(JSON.stringify({ message: req.file })); 

        try {
            const { title } = req.body; 

            await sharp("uploads/"+req.file?.filename)
               .resize({ height: 100 })
                .toFile("uploads/min/"+req.file?.filename);


            await withTransaction(async (db: any) => { 

                if (req.file?.filename) await db.query(`INSERT INTO product_images (name) VALUES (?)`, [req.file?.filename]); 

                await db.query(`INSERT INTO products (title) VALUES (?)`, [title]);
            });  

            res.send(JSON.stringify({ message: "record insert with success" })); 
        } catch (err: any) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(500).json({
                error: err.message
            });
        }
    }
} 

export default productController; 