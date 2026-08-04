import fs from "fs";
import path from "path"; 

export function loadPublicKey() 
{
    const keyPath = path.join(process.cwd(), "public.key");  

    if (!fs.existsSync(keyPath)) {
         throw new Error("Public key not found");
    } 

    return fs.readFileSync(keyPath, "utf-8");
}   