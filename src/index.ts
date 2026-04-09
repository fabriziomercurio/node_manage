import http from "node:http"; 

const server = http.createServer((req,res) => {
    res.write("server is running!");
    res.end();
}) 

server.listen(3000);
