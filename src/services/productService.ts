import ProductRepository from "../repositories/productRepository.js"; 
import {withTransaction}  from '../db/wrappers/transaction.js'; 
import { MongoClient } from "mongodb";
import fs from 'node:fs';
import sharp from "sharp";
import path from 'node:path';
import { randomUUID } from "crypto";

const client = new MongoClient("mongodb://mongo:27017");

let mongoDb: any;

export async function getMongo() {
    if (!mongoDb) {
        await client.connect();
        mongoDb = client.db("app_logs");
        console.log("Mongo connected");
    }
    return mongoDb;
}

class ProductService 
{
    constructor(private repo:ProductRepository){} 

    async show() 
    {
        return this.repo.show();  
    }

    async store(title:string ,file?:Express.Multer.File, writtenFiles:string[] = []) 
    {    

        const result = await withTransaction(async (db: any) => {
        
            if (!file) { 
                await this.repo.storeProduct(title); 
                return {
                productId: 'testing'
              };
            }
            
            const image = await this.loadImage(file,writtenFiles); 
        
            const [img] = await this.repo.storeProductImages(image.filename); 
        
            const imageId = (img as any).insertId;
        
            await this.repo.storeProduct(title,imageId); 
        
            return {
                imageId,
                productId: 'testing'
            }; 
        }); 
        
        const mongoDb = await getMongo();
        
            const auditLog = {
                action: "PRODUCT_CREATED",
                title,
                imageId:result.imageId,
                createdAt: new Date()
            }; 
        
            await mongoDb.collection("audit_logs").insertOne(auditLog);
        
            if (!fs.existsSync('./logs')) {
              fs.mkdirSync('./logs', { recursive: true });
            }
        
            fs.appendFile(`./logs/audit.log`, JSON.stringify(auditLog) + '\n', 
            (err) => {
                if (err) {
                    console.error(err)
                };
            }
        );
    } 

    async loadImage(file: Express.Multer.File, writtenFiles:string[]){
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
       }
}

export default ProductService; 