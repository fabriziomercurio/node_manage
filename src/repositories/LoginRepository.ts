import Connected from '../db/connected.js'; 
import { Mysql } from '../classes/MySql.js'; 

const connected = new Connected(new Mysql);
const conn = await connected.connection();

class LoginRepository {

    async checkIfEmailExist(email:string) 
    {  
        return conn.query("SELECT id,email,password from users WHERE email = ? ", [email]);       
    }
}

export default LoginRepository;