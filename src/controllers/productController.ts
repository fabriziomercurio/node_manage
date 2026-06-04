
import { Request, Response } from 'express'; 
import conn from '../db/connection.js'; 
import fs from 'node:fs'; 
import {withTransaction}  from '../db/wrappers/transaction.js'; 
import sharp from "sharp";
import path from 'node:path'; 
import { randomUUID } from "crypto";
import test from "fs/promises";
import ProductService from '../services/productService.js';
import ProductRepository from '../repositories/productRepository.js';
import { successResponse, errorResponse } from '../helpers/Response.js';

const sizeImg:string[] = ['original', 'medium', 'min'];

const serviceProduct = new ProductService(new ProductRepository); 

const productController = {     

    async show(req:Request,res:Response) 
    {
      try {  
            const [rows] = await serviceProduct.show(); 
            successResponse(res,rows);
         } catch (err) { 
            errorResponse(res, err instanceof Error ? err.message : "Unknown error")
         }
    },  

    async edit(req:Request,res:Response) 
    {       
        try { 
            const id = req.params.productId; 
            
            const [record]:any = await conn.query(`SELECT id,title,imageId FROM products WHERE products.id = ?`, [id]); 

            if (!record || record.length === 0) return res.status(404).json({message:`Record not found`});  

            if (record[0].imageId == null) return res.status(200).json({result: record[0]});
        
            const [result]:any = await conn.query(`SELECT title,name,imageId,product_images.created_at FROM products 
                INNER JOIN product_images ON product_images.id = products.imageId WHERE products.id = ?`, [id]); 

            const created = result[0]?.created_at; 
            
            if (created) result[0].created_at = new Date(created).toISOString().split("T")[0]; //overwritten created_at field                     

            return res.status(200).json({result: result[0], sizes:sizeImg});

        } catch (err) {
            return res.status(500).json({
                message: err instanceof Error ? err.message : "Unknown error"
            });
        }       
    }, 

    async store(req: Request, res: Response) {   

    const writtenFiles: string[] = [];

    try {
        
        serviceProduct.store(req.body.title,req.file,writtenFiles);

        successResponse(res,null,'record insert with success');

    } catch (err: any) {
        for (const f of writtenFiles) {
            fs.unlinkSync(f);
        }
        errorResponse(res, err instanceof Error ? err.message : "Unknown error")       
    }
  },

  async update(req: Request, res: Response) 
  {
    let name:string | undefined; 
    let date:string | undefined; 
    let newName:string|undefined;

    const writtenFiles: string[] = [];
    try { 
     
     const id = req.params.productId;
     const title = req.body.title; 

     const file = req.file; 

     const result = await withTransaction(async (db: any) => {

     const [row]:any = await db.query("SELECT id,imageId FROM products WHERE id = ?", [id]); 
      
     if (!row || row.length === 0) return res.status(404).json({error:`Record not found`}); 
     

    if (req.body.removeImage === 'true') { 
        const [record] = await db.query("SELECT * FROM product_images WHERE id = ?",[row[0].imageId]); 
        date = record[0].created_at.toISOString().split("T")[0]; 
        name = record[0].name;  
            
    let index:number = 0;
    let newName:string = '';  
    productController.moveNext(index,date,name,newName); 

    await db.query("UPDATE products SET imageId = NULL WHERE id = ?",[id]);
    await db.query("DELETE FROM product_images WHERE id = ?",[row[0].imageId]);
     
    return { deleteImage:true, date:date}
    } 

     if (!file) {
        await db.query("UPDATE products SET title = ? WHERE id = ?", [title,id]); 
        return res.status(200).json({message:`Record Updated`}); 
     } 

     if (file && row[0].imageId === null) { 

        const image = await productController.loadImage(file,writtenFiles);

        const [img] = await db.query(
                `INSERT INTO product_images (name) VALUES (?)`,
                [image.filename]
            ); 

         const imageId = (img as any).insertId; 

         await db.query(
                `UPDATE products SET title = ?, imageId = ? WHERE id = ?`,
                [title,imageId,id]
            );

            return {
                imageId,
                productId: 'testing'
            }; 
       } 

        if (file && row[0].imageId != null) { 
            const [record] = await db.query("SELECT * FROM product_images WHERE id = ?",[row[0].imageId]); 
            date = record[0].created_at.toISOString().split("T")[0]; 
            name = record[0].name; 
        const image = await productController.loadImage(file,writtenFiles); 
        newName = image.filename; 

        await db.query(
             `UPDATE products SET title = ? WHERE id = ?`,
             [title,id]);
        await db.query(
             `UPDATE product_images SET name = ? WHERE id = ?`,
             [image.filename,row[0].imageId]);

            const index:number = 0;
            productController.moveNext(index,date,name,newName); 

            return res.status(200).json({message:`Record Updateds`}); 

       } 

    }); 

    if (result.deleteImage) { 
    
    productController.removeEmptyFolders("uploads", result.date); 

    return res.status(200).json({
        message: "Image Deleted"
    });
}

     } catch (error) { 
       if (writtenFiles?.length > 0) {
        for (const f of writtenFiles) {
            try {
                fs.unlinkSync(f);
            } catch (e) {
                console.error('unlink failed:', e);
            }
         }
       }

        let index:number = 0;
        productController.rollbackNext(index,error,date,name,newName,res);
     }
  },

   loadImage: async (file: Express.Multer.File, writtenFiles:string[]) => {
    const input = file.buffer;
            const filename = file.originalname;
            const extension = path.extname(filename).toLowerCase();

            const base = `${Date.now()}_${randomUUID()}`;

            const ensureDir = (dir: string) => {
                fs.mkdirSync(dir, { recursive: true });
            };

            const d = new Date();

            const formatted = d.toISOString().split('T')[0]!;  //! it means that is not "undefined"

            const originalDir = path.join("uploads", formatted, "original");
            ensureDir(originalDir);

            const pipeline = sharp(input).resize({ width: 1600 }); 

                if (extension === '.jpeg' || extension === '.jpg') { 
                    const filePath = path.join(originalDir, `${base}.jpg`);
                    await pipeline
                        .jpeg({ quality: 70 })
                        .toFile(filePath);
                        writtenFiles.push(filePath);
                    
                } else if (extension === ".png") {
                    const filePath = path.join(originalDir, `${base}.webp`)
                    await pipeline
                        .webp({ quality: 75 })
                        .toFile(filePath);
                        writtenFiles.push(filePath);
                } else {

                    throw new Error("format not valid");
                }

            const sizes = [
                { name: "min", size: 400 },
                { name: "medium", size: 800 }
            ];

            for (const e of sizes) {

                const dir = path.join("uploads", formatted ,e.name);
                ensureDir(dir);

                const pipeline = sharp(input).resize({
                    height: e.size,
                    withoutEnlargement: true
                });

                if (extension === ".jpg" || extension === ".jpeg") {
                    const filePath = path.join(dir, `${base}.jpg`);
                    await pipeline
                        .jpeg({ quality: 70 })
                        .toFile(filePath);
                        writtenFiles.push(filePath);

                } else if (extension === ".png") {
                    const filePath = path.join(dir, `${base}.webp`);
                    await pipeline
                        .webp({ quality: 75 })
                        .toFile(filePath);
                        writtenFiles.push(filePath);

                } else {

                    throw new Error("format not valid");
                }
            }

            const ext = extension === '.png' ? 'webp' : 'jpg'; 

            return {
                filename: `${base}.${ext}`
            }
   }, 
   
  async delete(req: Request, res:Response) 
   {     
      let date: string | undefined;
      let name: string | undefined; 

      try {
        const id = req.params.productId; 

        const result = await withTransaction(async (db: any) => {  

        const [row]:any = await db.query("SELECT id,imageId FROM products WHERE id = ?", [id]); 
      
        if (!row || row.length === 0) return res.status(404).json({error:`Record not found`}); 

        if (row[0].imageId) { 
            const [record] = await db.query("SELECT * FROM product_images WHERE id = ?",[row[0].imageId]); 
            date = record[0].created_at.toISOString().split("T")[0]; 
            name = record[0].name; 
            await db.query("UPDATE products SET imageId = NULL WHERE id = ?",[id]);
            await db.query("DELETE FROM product_images WHERE id = ?",[row[0].imageId]);  

            let index:number = 0;
            const newName = ''; 
            await productController.moveNext(index,date,name,newName);
        }

           await db.query("DELETE FROM products WHERE id = ?",[id]); 
           return {deleteImage:true, date:date}
        }); 

        if (result.deleteImage) {
            await productController.removeEmptyFolders("uploads",result.date); 
        }

        return res.status(200).json({
            message: "record deleted"
        });
        
      } catch (error) { 

        let index:number = 0; 
        productController.rollbackNext(index,error,date,name,undefined,res);

        return res.status(500).json({
                 error: error instanceof Error ? error.message : "Unknown error"
             });
        }
    }, 


async moveNext(index:number,date:string|undefined,name:string|undefined,newName:string){ 

    if (index >= sizeImg.length) {

        console.log('tutti i file spostati');

        fs.rm(`tmp/${date}`, { recursive: true, force: true }, (err) => {
            if (err) console.error(err);
        });

        return;
    }

    const size = sizeImg[index];

    const oldPath = `uploads/${date}/${size}/${name}`;
    let newPath:string = ``; 
    
    if (newName != '') {
        newPath = `tmp/${date}/${size}/${newName}`;
    } else {
        newPath = `tmp/${date}/${size}/${name}`;
    }

    fs.mkdir(`tmp/${date}/${size}`, { recursive: true }, (err) => {

        if (err) {
            console.error(err);
            return;
        }

        fs.rename(oldPath, newPath, (err) => {

            if (err) {
                console.error('rename error:', err);
                return;
            }

            console.log('file spostato:', size);

            index++;
            productController.moveNext(index,date,name,newName);
        });
    });
  }, 

  async rollbackNext(index:number,error:any,date:string|undefined,name:string|undefined,newName:string|undefined,res:Response){

            if (index >= sizeImg.length) {

                return res.status(500).json({
                     message: error instanceof Error ? error.message : "Unknown error"
                });
            }

            const size = sizeImg[index];
              
            const sourceName = newName ?? name;

            if (!sourceName) {
               console.error("Impossible state: missing filename");
               return;
            }

            fs.rename(
                `tmp/${date}/${size}/${sourceName}`,
                `uploads/${date}/${size}/${name}`,
                (err) => {

                    if (err) {
                        console.error('Rollback failed:', err);
                        return;
                    }

                    index++;
                    productController.rollbackNext(index,error,date,name,newName,res);
                }
            );
        },

    async removeEmptyFolders(main:string, date:string)
    {

    const originalDir = path.join(main, date);

    const entries = await test.readdir(originalDir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(originalDir, entry.name);

        if (entry.isDirectory()) {
            const subEntries = await test.readdir(fullPath);

            if (subEntries.length === 0) {
                await test.rmdir(fullPath);
            }
        }
    }

    const remaining = await test.readdir(originalDir);

    if (remaining.length === 0) {
        await test.rmdir(originalDir);
     }
    }
   
}

export default productController; 


