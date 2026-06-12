
import { Request, Response } from 'express'; 
import fs from 'node:fs'; 
import ProductService from '../services/ProductService.js';
import ProductRepository from '../repositories/productRepository.js';
import { successResponse, errorResponse } from '../helpers/Response.js';
import ManageImageService from '../services/ManageImageService.js';

const serviceProduct = new ProductService(new ProductRepository); 
const manageImageService = new ManageImageService;

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
            console.log('raw',data);       
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
        manageImageService.rollbackNext(index,error,date,name,newName,res);
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

        successResponse(res,null,`record deleted`);
        
      } catch (error) { 

        let index:number = 0; 
        manageImageService.rollbackNext(index,error,date,name,undefined,res);
        errorResponse(res, error instanceof Error ? error.message : "Unknown error")
        }
    }, 
   
}

export default productController; 


