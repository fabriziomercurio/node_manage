import { Mysql } from '../../classes/MySql.js';
import Connected from '../connected.js';

const connected = new Connected(new Mysql);
const conn = await connected.connection();

export async function withTransaction(fn:any) {
  const connection = await conn.getConnection();

  try {
    await connection.beginTransaction();

    const result = await fn(connection);

    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
