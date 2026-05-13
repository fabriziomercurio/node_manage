
import { Request, Response } from 'express'; 
import conn from '../db/connection.js'; 
import fs from 'node:fs'; 
import {withTransaction}  from '../db/wrappers/transaction.js'; 
import sharp from "sharp";
import path from 'node:path'; 
import { MongoClient } from "mongodb";

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

const sizeImg:string[] = ['original', 'medium', 'min'];

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
    
    async edit(req:Request,res:Response) 
    {       
        try { 
            const id = req.params.productId; 
            const [result]:any = 
            await conn.query(`SELECT title,name,imageId,product_images.created FROM products 
                INNER JOIN product_images ON product_images.id = products.imageId WHERE products.id = ?`, [id]);  

            if (!result || result.length === 0) res.status(404).json({message:`Record not found`});
            
            
            const created = result[0]?.created; 
            
            result[0].created = new Date(created).toISOString().split("T")[0]; //overwritten created field 

                res.status(200).json({
                    result: result[0],
                    sizes:sizeImg
                });

        } catch (err) {
            return res.status(500).json({
                message: err instanceof Error ? err.message : "Unknown error"
            });
        }       
    },

    async store(req: Request, res: Response) {   

    const file = req.file;

    try {
        const { title } = req.body;

        const result = await withTransaction(async (db: any) => {

            if (!file) { await db.query(`INSERT INTO products (title) VALUES (?)`,[title]);
                return {
                productId: 'testing'
              };
            }

            const input = file.buffer;
            const filename = file.originalname;
            const extension = path.extname(filename).toLowerCase();

            const base = Date.now() + "_" + Math.random().toString(36).substring(2);

            const ensureDir = (dir: string) => {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
            };

            const d = new Date();

            const formatted:any = d.toISOString().split('T')[0];

            const originalDir = path.join("uploads", formatted, "original");
            ensureDir(originalDir);

            const pipeline = sharp(input)
                .resize({ width: 1600 }) 
                if (extension === '.jpeg' || extension === '.jpg') { 
                    await pipeline
                        .jpeg({ quality: 70 })
                        .toFile(path.join(originalDir, `${base}.jpg`));
                    
                } else if (extension === ".png") {

                    await pipeline
                        .webp({ quality: 75 })
                        .toFile(path.join(originalDir, `${base}.webp`));
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

                    await pipeline
                        .jpeg({ quality: 70 })
                        .toFile(path.join(dir, `${base}.jpg`));

                } else if (extension === ".png") {

                    await pipeline
                        .webp({ quality: 75 })
                        .toFile(path.join(dir, `${base}.webp`));

                } else {

                    throw new Error("format not valid");
                }

            }


            //check if image ending with png and convert in webp and save it in table
            const isPng = file.mimetype === 'image/png';
            const ext = isPng ? 'webp' : 'jpg'; 

            const [img] = await db.query(
                `INSERT INTO product_images (name) VALUES (?)`,
                [`${base}.${ext}`]
            );

            const imageId = (img as any).insertId;

            const [result] = await db.query(
                `INSERT INTO products (title, imageId) VALUES (?,?)`,
                [title,imageId]
            ); 

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
              fs.mkdirSync('./logs');
            }

            fs.appendFile(`./logs/audit.log`, JSON.stringify(auditLog) + '\n', (err) => {
                if (err) throw err;
                console.log('The "data to append" was appended to file!');
            });

        console.log("MONGO INSERT RESULT:", auditLog);


        res.send({ message: "record insert with success" });

    } catch (err: any) {

        return res.status(500).json({
            error: err.message
        });
    }
  }, 

  ////////////// update 
  //verificare se id esiste 
  // invio immagine da zero => verifico se immagine è stata inviata e se il campo 
     // + foreign key è null 

  // se l'immagine è sempre la stessa non modifico nulla 
  // l'immagine è diversa, modifico la tabella e sostituisco l'immagine nel filesystem 
    // la ricerca dell'immagine avverrà per data e stringa univoca 
  // eliminazione immagine 
  // se le cartelle sono vuote vanno automaticamente eliminate 
  // audit log insert e update

  async update(req: Request, res: Response) 
  {
    const id = req.params.productId; 
    const title = req.body.title; 
    res.status(200).json(id);
  }

} 

export default productController; 