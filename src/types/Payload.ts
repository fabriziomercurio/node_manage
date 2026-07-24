export type LoginPayload =  { 
   jti:string,
   id:number,
   email:string,
   exp:number
} 

export type ValidateTokenPayload =  {
   token:string,
   publicKey:string
} 
