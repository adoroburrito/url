import pg, { Pool, QueryResult } from "pg";
import dotenv from "dotenv";
import path from "path";
import { camelCase, snakeCase } from "change-object-case";
import { getProperty } from "../utils";

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

const generateWhere = (whereParams: Object): String => {
  whereParams = snakeCase(whereParams);
  const whereString = Object.keys(whereParams).reduce(
    (accumulator: string, currentValue: string, index: number): string => {
      if (index > 0) {
        accumulator += ", ";
      }

      accumulator += `${currentValue} = ${getProperty(
        whereParams,
        currentValue
      )}`;

      return accumulator;
    },
    ""
  );

  return whereString;
};

export { select };
