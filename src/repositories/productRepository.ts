import conn from '../db/connection.js';  

class ProductRepository 
{
   async show(){
     return conn.query(`SELECT id,title FROM products`); 
   } 

   async findIdProduct(id:string|string[]|undefined) 
   {
    return conn.query("SELECT id,title,imageId FROM products WHERE id = ?", [id]);
   }

   async storeProduct(title:string, imageId?:number|null){
     return conn.query(`INSERT INTO products (title, imageId) VALUES (?,?)`,[title,imageId]); 
   }

   async selectProductImageById(imageId:number) 
   {
     return conn.query(`SELECT name,created_at FROM product_images WHERE id = ?`,[imageId]);
   } 
   
   async removeRecordProductImageById(imageId:number) 
   {
     return conn.query(`DELETE FROM product_images WHERE id = ?`,[imageId]);
   } 

   async joinProductAndImageProduct(id:string|string[]|undefined)
   {
    return conn.query(`SELECT title,name,imageId,product_images.created_at FROM products 
            INNER JOIN product_images ON product_images.id = products.imageId WHERE products.id = ?`,[id])
   }

   async removeRecordProductById(id:string|string[]|undefined) 
   {
     return conn.query(`DELETE FROM products WHERE id = ?`,[id]);
   }

   async setImageIdNull(id:string|string[]|undefined) 
   {
     return conn.query(`UPDATE products SET imageId = NULL WHERE id = ?`,[id]); 
   }

   async storeProductImages(filename:string)
   {
     return conn.query(`INSERT INTO product_images (name) VALUES (?)`,[filename]);
   }
} 

export default ProductRepository; 

