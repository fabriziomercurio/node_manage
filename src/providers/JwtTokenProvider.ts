import { Base64URL } from "../helpers/Base64URL.js";
import { TokenProvider } from "../interfaces/TokenProvider.js";
import { LoginPayload, ValidateTokenPayload } from "../types/Payload.js";
import crypto from "crypto";

export class JwtTokenProvider implements TokenProvider<LoginPayload,ValidateTokenPayload> 
{     
   private header:object = {alg: 'RS256', typ: 'JWT'};

    constructor(private privateKey:string){
      try {
        crypto.createPrivateKey({
            key: privateKey,
            format: "pem",
        });
      } catch {
         throw new Error("Private key isn't valid");
      }
    }

   public create(payload:LoginPayload) : string 
   { 

    try {

    const base64UrlHeader = Base64URL(this.header); 
    const base64UrlPayload = Base64URL(payload); 

    const data = `${base64UrlHeader}.${base64UrlPayload}`;  

    const signature = crypto.createSign(`RSA-SHA256`).update(data).sign(this.privateKey, "base64");

    return `${base64UrlHeader}.${base64UrlPayload}.${signature}`;
      
    } catch (error) {
       throw new Error(`Error: ${error}`);
    }
   } 

   public validate(dataload:ValidateTokenPayload) : boolean 
   { 
      const parts = dataload.token.split('.'); 

      if (parts.length !== 3)  throw new Error("Token is invalid"); 

      const [header, payload, signature] = parts; 

      if (!header || !payload || !signature) throw new Error("Token is invalid");

      const data = `${header}.${payload}`;

      return crypto.verify(
         "RSA-SHA256",
         Buffer.from(data),
         crypto.createPublicKey(dataload.publicKey),
         Buffer.from(signature, "base64url")
      );
   }
} 

 