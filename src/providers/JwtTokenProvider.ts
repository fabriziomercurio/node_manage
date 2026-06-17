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

    const base64UrlHeader = Base64URL(JSON.stringify(this.header)); 
    const base64UrlPayload = Base64URL(JSON.stringify(payload)); 

    const data = `${base64UrlHeader}.${base64UrlPayload}`;  

    const signature = crypto.createSign(`RSA-SHA256`).update(data).sign(this.privateKey, "base64url");

    return `${base64UrlHeader}.${base64UrlPayload}.${signature}`;
      
    } catch (error) {
       throw new Error(`Error: ${error}`);
    }
   } 

   public validate(dataload:ValidateTokenPayload) : boolean 
   { 
      if (!dataload.token) throw new Error("Token is missing"); 

      const replaceToken = dataload.token.replace(/^Bearer\s+/, ''); // ^ means "start of string"

      const parts = replaceToken.split('.'); 

      if (parts.length !== 3) throw new Error("Token is invalid"); 

      const [header, payload, signature] = parts; 

      if (!header || !payload || !signature) throw new Error("Token is invalid");

      const data = `${header}.${payload}`;

      const verify = crypto.createVerify("RSA-SHA256");

      verify.update(data);
      
      const isValid = verify.verify(dataload.publicKey, signature, "base64url"); 

      if (!isValid) throw new Error("Token is invalid"); 

      const decodedPayload = this.decodePayload(payload);

      this.validateExpiration(decodedPayload.exp) 

      return true; 
   } 

   private validateExpiration(exp:number) :void
   {
      if (exp < Date.now() / 1000) {
           throw new Error("Token expired");
      } 
   } 

   private decodePayload(payload:string) : LoginPayload
   {
      const raw = Buffer.from(payload, "base64url").toString();

      const parsed = JSON.parse(raw);

      const decodedPayload =
      typeof parsed === "string" ? JSON.parse(parsed) : parsed;  

      return decodedPayload; 
   }
} 

 