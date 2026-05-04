import { Router } from "express";
import productController from "../controllers/productController.js";
import multer from "multer"; 
import path from "node:path"; 
import fs from 'node:fs'; 


const router = Router(); 

const folderPath = "uploads/";

if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
}

const storage = multer.diskStorage({ 
  destination: (req, file, cb) => { 
    cb(null, folderPath);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "_" + Math.random().toString(36).substring(2);

    cb(null, uniqueName + ext);
  }
}); 

const upload = multer({storage}); 

router.get('/products',productController.show); 
router.post('/products', upload.single('image'), productController.store);

export default router;