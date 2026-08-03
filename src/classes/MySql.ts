import { Pool } from "mysql2/promise";
import { MySqlPool } from "../adapters/MySqlPool.js";
import { ConnectionInterface } from "../interfaces/ConnectionInterface.js";

export class Mysql implements ConnectionInterface<Pool>
{
   async getClient() : Promise<Pool>
   {
      return MySqlPool     
   }
} 

