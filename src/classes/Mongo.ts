import { ConnectionInterface } from "../interfaces/ConnectionInterface.js";
import { Db, MongoClient } from "mongodb"; 

const client = new MongoClient("mongodb://mongo:27017");

export class MongoDB implements ConnectionInterface 
{
  
    private mongoDB!:Db; // ! => definite assignment assertion 

    async connection()
    {
        if (!this.mongoDB)
        {
            await client.connect();
            this.mongoDB = client.db("app_logs");
        }

        return this.mongoDB;
    }
} 
