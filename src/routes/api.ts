import { Router } from "express";
import productController from "../controllers/productController.js"; 
import loginController from "../controllers/loginController.js";
import multer from "multer"; 
import fs from 'node:fs'; 
import validateID from "../middlewares/validateId.js";

const router = Router(); 

const folderPath = "uploads/original/";

if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
}

const upload = multer({ storage: multer.memoryStorage() });

router.get('/products',productController.show); 
router.post('/products', upload.single('image'), productController.store); 
router.get('/products/:productId',validateID('productId'),productController.edit); 
router.put('/product/:productId',validateID('productId'), upload.single('image'),productController.update); 


router.post('/login',loginController.login);

export default router;