import conn from '../connection.js'; 

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
