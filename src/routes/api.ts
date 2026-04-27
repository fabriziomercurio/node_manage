import { Router } from "express";
import conn from "../db/connection.js";
import productController from "../controllers/productController.js";

const router = Router();

// router.get('/products', async (req, res) => {
//   try {
//     const rows = await conn.query(`SELECT * FROM products`);
//     res.status(200).send(rows[0]);
//   } catch (error) {
//     res.status(500).send({ error: 'something blew up' })
//   }
// }) 
router.get('/products',productController.show)

export default router;