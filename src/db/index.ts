import pg, { Pool, QueryResult } from "pg";
import dotenv from "dotenv";
import path from "path";
import { camelCase, snakeCase } from "change-object-case";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const connectionString = process.env.DB_CONNECTION_STRING;

const pool = new Pool({
  connectionString,
});

// checking connection health
pool.connect().then(async (client: pg.PoolClient) => {
  try {
    const response = await client.query("SELECT now()");
    console.log("Connection to database OK:", response.rows[0].now);
  } catch (err) {
    console.error(err.stack);
    process.exit();
  } finally {
    client.release();
  }
});

const select = async (
  table: String,
  whereParams: Object
): Promise<QueryResult | false> => {
  const query = `SELECT * FROM ${table} WHERE ${generateWhere(whereParams)}`;

  const client = await pool.connect();
  try {
    return client.query(query);
  } catch (error) {
    console.log(error);
    return false;
  } finally {
    client.release();
  }
};

const insert = async (
  table: String,
  insertParams: Object
): Promise<QueryResult | false> => {
  const query = `INSERT INTO ${table} (${generateInsertColumns(insertParams)}) VALUES (${generateInsertValues(insertParams)})`;

  const client = await pool.connect();
  try {
    return client.query(query);
  } catch (error) {
    console.log(error);
    return false;
  } finally {
    client.release();
  }
};

const generateInsertColumns = (insertParams: Object) => {
  insertParams = snakeCase(insertParams);
  let columns = "";
  for(const property in insertParams){
    columns += `${property}, `;
  }

  return columns.slice(0, -2);
}

const generateInsertValues = (insertParams: any) => {
  insertParams = snakeCase(insertParams);
  let values = "";
  for(const property in insertParams){
    values += `${insertParams[property]}, `;
  }

  return values.slice(0, -2);
}

const nextVal = async (
  sequenceName: String,
): Promise<QueryResult | false> => {
  const query = `SELECT nextval(${sequenceName})`;

  const client = await pool.connect();
  try {
    return client.query(query);
  } catch (error) {
    console.log(error);
    return false;
  } finally {
    client.release();
  }
};

const generateWhere = (whereParams: any): String => {
  whereParams = snakeCase(whereParams);

  let whereString = "";

  for(const property in whereParams){
    whereString += `${property} = ${whereParams[property]}, `
  }

  whereString = whereString.slice(0, -2);

  return whereString;
};

export { select, insert, nextVal };
