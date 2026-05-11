import { Router } from "express";
import productController from "../controllers/productController.js";
import multer from "multer"; 
import path from "node:path"; 
import fs from 'node:fs'; 


const router = Router(); 

const folderPath = "uploads/original/";

if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
}

const upload = multer({ storage: multer.memoryStorage() });

router.get('/products',productController.show); 
router.post('/products', upload.single('image'), productController.store);

export default router;