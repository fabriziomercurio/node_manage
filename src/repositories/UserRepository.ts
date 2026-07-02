import Connected from '../db/connected.js'; 
import { Mysql } from '../classes/MySql.js'; 

const connected = new Connected(new Mysql);
const conn = await connected.connection();

class UserRepository {

    async store(email:string,hash:string) 
    {
        return conn.query(`INSERT INTO users (email, password) VALUES (?,?)`,[email,hash]); 
    }
}

export default UserRepository;