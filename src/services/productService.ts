import ProductRepository from "../repositories/productRepository.js";
import { withTransaction } from '../db/wrappers/transaction.js';
import { MongoClient } from "mongodb";
import fs from 'node:fs';
import sharp from "sharp";
import path from 'node:path';
import { randomUUID } from "crypto";
import test from "fs/promises";

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

class ProductService {
    constructor(private repo: ProductRepository) { }

    async show() {
        return this.repo.show();
    }

    async store(title: string, file?: Express.Multer.File, writtenFiles: string[] = []) {

        const result = await withTransaction(async (db: any) => {

            if (!file) {
                await this.repo.storeProduct(title);
                return {
                    productId: 'testing'
                };
            }

            const image = await this.loadImage(file, writtenFiles);

            const [img] = await this.repo.storeProductImages(image.filename);

            const imageId = (img as any).insertId;

            await this.repo.storeProduct(title, imageId);

            return {
                imageId,
                productId: 'testing'
            };
        });

        const mongoDb = await getMongo();

        const auditLog = {
            action: "PRODUCT_CREATED",
            title,
            imageId: result.imageId,
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

    async edit(id: string | string[] | undefined) {
        const sizes: string[] = ['original', 'medium', 'min'];
        const [record]: any = await this.repo.findIdProduct(id);

        if (!record || record.length === 0) throw new Error(`Record not found`);

        if (record[0].imageId == null) return { result: record[0] };

        const [result]: any = await this.repo.joinProductAndImageProduct(id);

        const created = result[0]?.created_at;

        if (created) result[0].created_at = new Date(created).toISOString().split("T")[0]; //overwritten created_at field  

        return { result: result[0], sizes };
    }

    async update(id: string | string[] | undefined, removeImage: string, title: string, file?: Express.Multer.File, writtenFiles: string[] = []) {
        let date: string | undefined;
        let name: string | undefined;

        const result = await withTransaction(async (db: any) => {

            const [row]: any = await this.repo.findIdProduct(id);

            if (!row || row.length === 0) throw new Error(`Record not found`);

            if (removeImage === 'true') {
                const [record]: any = await this.repo.findIdProductImage(row[0].imageId);
                date = record[0].created_at.toISOString().split("T")[0];
                name = record[0].name;

                let index: number = 0;
                let newName: string = '';
                await this.moveNext(index, date, name, newName);

                await this.repo.setImageIdNull(id);
                await this.repo.removeRecordProductImageById(row[0].imageId);

                return { deleteImage: true, date: date }
            }

            if (!file && row[0].imageId === null) { 
                await this.repo.updateRecord(title, id);
                return { message: `Record Updated` };
            } 

            if (!file && row[0].imageId !== null) { 
                await this.repo.updateRecord(title, id,row[0].imageId);
                return { message: `Record Updated` };
            }

            if (file && row[0].imageId === null) {

                const image = await this.loadImage(file, writtenFiles);

                const [img] = await this.repo.storeProductImages(image.filename);

                const imageId = (img as any).insertId;

                await this.repo.updateRecord(title, id, imageId);

                return { imageId, productId: 'testing' };
            }

            if (file && row[0].imageId != null) { 
                console.log('entro adesso',row[0].imageId);
                const [record] = await db.query("SELECT * FROM product_images WHERE id = ?", [row[0].imageId]);
                date = record[0].created_at.toISOString().split("T")[0];
                name = record[0].name;
                const image = await this.loadImage(file, writtenFiles);
                let newName: string = '';
                newName = image.filename;

                await this.repo.updateRecord(title, id, row[0].imageId);
                await this.repo.updateProductImageRecord(image.filename, row[0].imageId);

                const index: number = 0;
                await this.moveNext(index, date, name, newName);

                return { message: `Record Updateds` };

            }

        });

        if (result.deleteImage) {

            await this.removeEmptyFolders("uploads", result.date);
            return { message: `Image deleted` }
        }
    }

    async delete(id: string | string[] | undefined) {
        let date: string | undefined;
        let name: string | undefined;

        const result = await withTransaction(async (db: any) => {

            const [row]: any = await this.repo.findIdProduct(id);

            if (!row || row.length === 0) throw new Error(`Record not found`);

            if (row[0].imageId) {
                const [record]: any = await this.repo.selectProductImageById(row[0].imageId);
                date = record[0].created_at.toISOString().split("T")[0];
                name = record[0].name;
                await this.repo.setImageIdNull(id);
                await this.repo.removeRecordProductImageById(row[0].imageId);

                let index: number = 0;
                const newName = '';
                await this.moveNext(index, date, name, newName);
            }

            await this.repo.removeRecordProductById(id);
            return { deleteImage: true, date: date }
        });

        if (result.deleteImage && result.date) {
            await this.removeEmptyFolders("uploads", result.date);
        }
    }


    async moveNext(index: number, date: string | undefined, name: string | undefined, newName: string) {
        const sizeImg: string[] = ['original', 'medium', 'min'];
        if (index >= sizeImg.length) {

            console.log('tutti i file spostati');

            fs.rm(`tmp/${date}`, { recursive: true, force: true }, (err) => {
                if (err) console.error(err);
            });

            return;
        }

        const size = sizeImg[index];

        const oldPath = `uploads/${date}/${size}/${name}`;
        let newPath: string = ``;

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
                this.moveNext(index, date, name, newName);
            });
        });
    }

    async removeEmptyFolders(main: string, date: string) {

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


    async loadImage(file: Express.Multer.File, writtenFiles: string[]) {
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

            const dir = path.join("uploads", formatted, e.name);
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