
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
            const data:any = await serviceProduct.edit(req.params.productId);          
            return res.status(200).json({result: data.result, sizes:data.sizes});
        } catch (err) {
            errorResponse(res, err instanceof Error ? err.message : "Unknown error")
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
     const removeImage = req.body.removeImage; 
     await serviceProduct.update(id,removeImage,title,file,writtenFiles); 
     return res.status(200).json({message:`Record Updated`}); 

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
        errorResponse(res, error instanceof Error ? error.message : "Unknown error") 
     }
  },
   
  async delete(req: Request, res:Response) 
   {     
      let date: string | undefined;
      let name: string | undefined; 

      try {
        const id = req.params.productId; 
        await serviceProduct.delete(id); 

        return res.status(200).json({
            message: "record deleted"
        });
        
      } catch (error) { 

        let index:number = 0; 
        productController.rollbackNext(index,error,date,name,undefined,res);
         errorResponse(res, error instanceof Error ? error.message : "Unknown error")
        }
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


