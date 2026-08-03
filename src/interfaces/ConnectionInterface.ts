export interface ConnectionInterface<T>
{
    getClient():Promise<T>; 
}