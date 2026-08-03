import { ConnectionInterface } from "../interfaces/ConnectionInterface.js";
import { Db } from "mongodb"; 
import { clientMongo } from "../adapters/ClientMongo.js";

export class MongoDB implements ConnectionInterface<Db>
{ 
    private mongoDB!:Db; // ! => definite assignment assertion 

    async getClient() : Promise<Db>
    {
        if (!this.mongoDB)
        {
            await clientMongo.connect();
            this.mongoDB = clientMongo.db("app_logs");
        }

        return this.mongoDB;
    }
} 
