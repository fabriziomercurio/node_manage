import { ConnectionInterface } from "../interfaces/ConnectionInterface.js";

class Connected 
{   
    constructor(private conn:ConnectionInterface) { }
    
    async connection() 
    {
        return this.conn.connection(); 
    }
} 

export default Connected; 