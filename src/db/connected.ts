import { ConnectionInterface } from "../interfaces/ConnectionInterface.js";

class Connected<T> 
{   
    constructor(private conn:ConnectionInterface<T>) { }
    
    async connection() : Promise<T>
    {
        return this.conn.getClient() 
    }
} 

export default Connected; 