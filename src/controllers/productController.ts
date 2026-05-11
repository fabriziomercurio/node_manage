
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

        try {
            const { title } = req.body; 

             await withTransaction(async (db: any) => { 

                if (filename) { 
                    
                    await sharp(`uploads/${filename}`)
                    .resize({ height: 100 })
                    .toFile(`uploads/min/${filename}`); 

                    const [result] = await db.query(`INSERT INTO product_images (name) VALUES (?)`, [filename]); 

                    const imageId = result.insertId;

                    await db.query(`INSERT INTO products (title,imageId) VALUES (?,?)`, [title,imageId]);
                }else{
                    await db.query(`INSERT INTO products (title) VALUES (?)`, [title]);
                }                      
            });  

            res.send({ message: "record insert with success" }); 
        } catch (err: any) {
            if (req.file?.path) fs.unlinkSync(req.file.path);
            return res.status(500).json({
                error: err.message
            });
        }
    }
} 

export default productController; 