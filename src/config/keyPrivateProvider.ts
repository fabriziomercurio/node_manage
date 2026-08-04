import fs from "fs";
import path from "path"; 

export function loadPrivateKey() 
{
    const keyPath = path.join(process.cwd(), "private.key");  

    if (!fs.existsSync(keyPath)) {
         throw new Error("Private key not found");
    } 

    return fs.readFileSync(keyPath, "utf-8");
}   