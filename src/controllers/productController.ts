
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

            const originalDir = path.join("uploads", "original");
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

                const dir = path.join("uploads", e.name);
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

            const [img] = await db.query(
                `INSERT INTO product_images (name) VALUES (?)`,
                [`${base}.jpg`]
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
  }
} 

export default productController; 