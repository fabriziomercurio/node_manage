export type LoginPayload =  {
   id:number,
   email:string,
   exp:number
} 

export type ValidateTokenPayload =  {
   token:string,
   publicKey:string
} 
