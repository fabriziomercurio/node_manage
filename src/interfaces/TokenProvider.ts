export interface TokenProvider<TCreate, TValidate> 
{
    create(payload:TCreate):string; 
    
    validate(payload:TValidate):boolean; 
}  