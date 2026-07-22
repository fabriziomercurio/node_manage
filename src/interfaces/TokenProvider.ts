import { LoginPayload } from "../types/Payload.js";

export interface TokenProvider<TCreate, TValidate> 
{
    create(payload:TCreate):string; 
    
    validate(payload:TValidate):boolean; 
    
    getPayloadEncoded(payload:TValidate):LoginPayload; 
}  