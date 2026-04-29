import { Router } from "express";
import conn from "../db/connection.js";
import productController from "../controllers/productController.js";
import multer from "multer";


const router = Router();
const upload = multer();

router.get('/products',productController.show); 
router.post('/products', upload.none(), productController.store);

export default router;