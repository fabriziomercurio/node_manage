import http from "node:http"; 

const server = http.createServer((req,res) => {
    if(req.method === 'GET') 
    {
       console.log("Metodo:", req.method);
       console.log("Url:", req.url);
       res.write(req.method);
    }
    res.write("server is running!");
    res.end(); 
    
}) 
server.listen(3000);
    
