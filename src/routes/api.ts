import { Router } from "express";
import productController from "../controllers/ProductController.js"; 
import loginController from "../controllers/LoginController.js";
import multer from "multer"; 
import fs from 'node:fs'; 
import validateID from "../middlewares/ValidateId.js";
import UserController from "../controllers/UserController.js";
import JwtValidate from "../middlewares/JwtValidate.js";
import RefreshTokenController from "../controllers/RefreshTokenController.js";
import CheckTokenBlackList from "../middlewares/CheckTokenBlackList.js";

const router = Router();

const folderPath = "uploads/original/";

if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
}

const upload = multer({ storage: multer.memoryStorage() });

router.post('/login', loginController.login);

router.post('/users', UserController.store); 

router.post('/refresh-token', RefreshTokenController.refresh); 

router.use(JwtValidate);

router.get('/products', CheckTokenBlackList, productController.show);
router.post('/products', upload.single('image'), productController.store);
router.get('/products/:productId', validateID('productId'), productController.edit);
router.put('/product/:productId', validateID('productId'), upload.single('image'), productController.update);
router.delete('/product/:productId', validateID('productId'), productController.delete);  

router.post('/logout',loginController.logout); 


export default router;