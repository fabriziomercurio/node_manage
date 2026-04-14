import http from "node:http";  
import mysql from "mysql2/promise"; 

const pool = mysql.createPool({
  host: 'db',
  user: 'root',
  database: 'manage',
  port: 3306,
  password: 'root',
});

function handleCors(req:any, res:any) {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5000");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return false; // block routing
  }

  return true; // eaves to run routing
}

const server = http.createServer(async (req,res) => { 

    if(!handleCors(req,res)) return; 

    const url = req.url;    

    if(req.method === 'GET' && url === '/products') 
    {
        try {
        const [rows] = await pool.query("SELECT * FROM products");
        res.end(JSON.stringify(rows));
        return;
        } catch (err) {
            console.error("Errore DB:", err);
            res.statusCode = 500;
            res.end("Errore DB");
        }
    }

    if(req.method === 'POST' && url === '/products') 
    {   
        let data = "";

        req.on("data", chunk => data += chunk);
        req.on("end", async () => {
        const {title}  = JSON.parse(data);

        await pool.query("INSERT INTO products (title) VALUES (?)",[title]);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({"message":"ok"}));
        }); 
        return;
    }   
    
    if(req.method === 'GET' && url?.startsWith('/products/')) 
    {    
        const id = url.split('/')[2];
        const [row] = await pool.query("SELECT * FROM products WHERE id = ?",[id]);
        res.write(JSON.stringify(row));
        res.end(id);
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

server.listen(3000);



