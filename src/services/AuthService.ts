import { TokenProvider } from "../interfaces/TokenProvider.js";
import { LoginPayload } from "../types/Payload.js";

export class AuthService<TCreate,TValidate> 
{
    constructor(private tokenProvider:TokenProvider<TCreate,TValidate>){} 

    create(payload:TCreate){
        return this.tokenProvider.create(payload);
    } 

    validateToken(payload:TValidate) : boolean
    {
       return this.tokenProvider.validate(payload); 
    } 

    getPayloadEncoded(payload:TValidate) : LoginPayload
    {
      return this.tokenProvider.getPayloadEncoded(payload)
    }
} 

