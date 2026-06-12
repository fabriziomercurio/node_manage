import { TokenProvider } from "../interfaces/TokenProvider.js";

export class AuthService<TCreate,TValidate> 
{
    constructor(private tokenProvider:TokenProvider<TCreate,TValidate>){} 

    create(payload:TCreate){
        return this.tokenProvider.create(payload)
    } 

    validateToken(payload:TValidate) : boolean
    {
       return this.tokenProvider.validate(payload); 
    }


} 

