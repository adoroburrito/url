import pg, { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const connectionString = process.env.DB_CONNECTION_STRING;

const pool = new Pool({
  connectionString,
});

// checking connection health
pool
.connect()
.then((client: pg.PoolClient) => {
  return client
  .query("SELECT now()")
  .then((res) => {
    client.release();
    console.log(res.rows[0]);
  })
  .catch((err) => {
    client.release();
    console.log(err.stack);
  });
})
.catch((connectionError) => {
  console.error(connectionError);
  process.exit();
});

const query = async (queryString: string, queryArguments: string[]) => {
  return await pool.connect().then((client: pg.PoolClient) => {
    return client
      .query(queryString, queryArguments)
      .then((res) => {
        client.release();
        return [true, res.rows];
      })
      .catch((err) => {
        client.release();
        console.log(err.stack);
        return [false, err.stack];
      });
  });
};

export default { 
  query
};
