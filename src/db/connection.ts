import mysql from 'mysql2/promise'; 

const conn = mysql.createPool({
  host: 'db',
  user: 'root',
  database: 'manage',
  port: 3306,
  password: 'root',
}); 

export default conn; 