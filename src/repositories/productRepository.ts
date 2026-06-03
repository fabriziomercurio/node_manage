import conn from '../db/connection.js';  

class ProductRepository 
{
   async show(){
     return conn.query(`SELECT id,title FROM products`); 
   }
} 

export default ProductRepository; 

