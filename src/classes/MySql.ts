import { ConnectionInterface } from "../interfaces/ConnectionInterface.js";
import mysql from 'mysql2/promise'; 

export class Mysql implements ConnectionInterface 
{
    private pool; 

    constructor() 
    {
        this.pool = mysql.createPool({
        host: 'db',
        user: 'root',
        database: 'manage',
        port: 3306,
        password: 'root',
      });
    } 

   async connection() 
   {
      return this.pool     
   }
} 

