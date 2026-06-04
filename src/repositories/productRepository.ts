import conn from '../db/connection.js';  

class ProductRepository 
{
   async show(){
     return conn.query(`SELECT id,title FROM products`); 
   } 

   async storeProduct(title:string, imageId?:number|null){
     return conn.query(`INSERT INTO products (title, imageId) VALUES (?,?)`,[title,imageId]); 
   } 

   async storeProductImages(filename:string)
   {
     return conn.query(`INSERT INTO product_images (name) VALUES (?)`,[filename]);
   }
} 

export default ProductRepository; 

