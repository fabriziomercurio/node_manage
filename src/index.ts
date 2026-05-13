import http from "node:http";  
import mysql from "mysql2/promise"; 
import express from 'express';
import apiRoute from './routes/api.js';
import cors from 'cors';

const pool = mysql.createPool({
  host: 'db',
  user: 'root',
  database: 'manage',
  port: 3306,
  password: 'root',
}); 

const app = express() 
app.use(cors({
  origin: 'http://localhost:5000'
}));
app.use(express.json())
app.use(express.static('uploads'))
app.use('/api/',apiRoute)

const server = http.createServer(async (req,res) => { 

    const url = req.url;  

    if (req.url?.startsWith('/api/')) {
       app(req, res);
       return; // stop here
    }

    if(req.method === 'DELETE' && url?.startsWith('/products/')) 
    {    
        const id = url.split('/')[2];
        await pool.query("DELETE FROM products WHERE id = ?",[id]);
        res.end("delete record with id: " + id);
    } 

    if(req.method === 'PATCH' && url?.startsWith('/products/')) 
    {    
        let data = ""; 
        const id = url.split('/')[2];
        req.on("data", chunk => data += chunk);
        req.on("end", async () => {
            const  {title} = JSON.parse(data); 
            await pool.query("UPDATE products SET title = ? WHERE id = ?",[title,id]);
            res.end("record with id: " + id + " updated");
        })       
    }       
    

    if (req.method === 'POST' && req.url === '/users') {
    let data = ""; 

    req.on("data", chunk => data += chunk);

    req.on("end", async () => {
        try {
            const { email, password } = JSON.parse(data);

            await pool.query(
                "INSERT INTO users (email, password) VALUES (?,?)",
                [email,password]
            );

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "record insert with success" })); 
            return;
        } catch (err) {
            console.error(err);
            res.writeHead(500);
            res.end(JSON.stringify(err));
        }
      });
     } else {
        res.writeHead(404);
        res.end("Not found");
    }  

}) 

app.listen(3000);



