import mysql, {Pool} from 'mysql2/promise'; 
import { env } from '../config/database.js';

export const MySqlPool:Pool =  

    mysql.createPool({
        host: env.database.host,
        user: env.database.user,
        database: env.database.name,
        port: env.database.port,
        password: env.database.password,
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 100
     });
