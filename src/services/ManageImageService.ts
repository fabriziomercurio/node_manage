import { Response } from 'express';
import fs from 'node:fs'; 
import path from 'node:path';
import fsPromise from "fs/promises";
import { randomUUID } from "crypto";
import sharp from "sharp";

class ManageImageService 
{
    sizeImg:string[] = ['original', 'medium', 'min'];

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
    
    /**
     * 
     * move files from the main folder to a temporary folder
     */
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
    
    /**
     * reset the temporary folder and restore to the main one
     */
    async rollbackNext(index:number,error:any,date:string|undefined,name:string|undefined,newName:string|undefined,res:Response){

        if (index >= this.sizeImg.length) {

            return res.status(500).json({
                 message: error instanceof Error ? error.message : "Unknown error"
            });
        }

        const size = this.sizeImg[index];
          
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
                this.rollbackNext(index,error,date,name,newName,res);
            }
        );
    } 
    
    async removeEmptyFolders(main: string, date: string) {

        const originalDir = path.join(main, date);

        const entries = await fsPromise.readdir(originalDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(originalDir, entry.name);

            if (entry.isDirectory()) {
                const subEntries = await fsPromise.readdir(fullPath);

                if (subEntries.length === 0) {
                    await fsPromise.rmdir(fullPath);
                }
            }
        }

        const remaining = await fsPromise.readdir(originalDir);

        if (remaining.length === 0) {
            await fsPromise.rmdir(originalDir);
        }
    }
} 

export default ManageImageService; 