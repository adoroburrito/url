import pg, { Pool, QueryResult } from "pg";
import dotenv from "dotenv";
import path from "path";
import { snakeCase } from "change-object-case";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export default class DBSingleton {
  private static singleton: DBSingleton;
  private pool: pg.Pool;

  private constructor() { 
    const connectionString = process.env.DATABASE_URL;

    this.pool = new Pool({
      connectionString,
    });

    this.checkConnection();
  }

  public static getInstance(): DBSingleton {
    if(!DBSingleton.singleton){
      DBSingleton.singleton = new DBSingleton();
    }

    return DBSingleton.singleton;
  }

  public async checkConnection(): Promise<Boolean> {
    console.log('Testing db connection...');

    // creates a client in the pool and tries to query the time from the db memory
    const client: pg.PoolClient = await this.pool.connect();
    
    try {
      const response = await client.query("SELECT now()");
      console.log("Connection to database OK:", response.rows[0].now);
      return true;
    } catch (err) {
      console.error('Error whilte trying to connect to databse:', err.stack);
      return false;
    } finally {
      client.release();
    }
  }

  public async closeConnection(): Promise<Boolean> {
    console.log('Closing DB connection pool...');
    try{
      await this.pool.end();
      console.log('DB connection pool closed.');
      return true;
    }catch(error){
      console.error('Faield to close connection pool:', {error});
      return false;
    }
  }


  public async select(table: String, whereParams: Object): Promise<QueryResult | false> {
    const query = `SELECT * FROM ${table} WHERE ${this.generateWhere(whereParams)}`;

    const client = await this.pool.connect();
    try {
      return client.query(query);
    } catch (error) {
      console.log(error);
      return false;
    } finally {
      client.release();
    }
  }
  
  public async generateWhere(whereParams: any) {
    whereParams = snakeCase(whereParams);

    let whereString = "";

    for(const property in whereParams){
      whereString += `${property} = ${whereParams[property]}, `
    }

    whereString = whereString.slice(0, -2);

    return whereString;
  }

  public async insert(table: String, insertParams: Object): Promise<QueryResult | false>{
    const query = `INSERT INTO ${table} (${this.generateInsertColumns(insertParams)}) VALUES (${this.generateInsertValues(insertParams)})`;

    const client = await this.pool.connect();
    try {
      return client.query(query);
    } catch (error) {
      console.log(error);
      return false;
    } finally {
      client.release();
    }
  }

  public async nextVal(sequenceName: String): Promise<QueryResult | false> {
    const query = `SELECT nextval('${sequenceName}');`;

    console.log('db->nextVal', {query});

    const client = await this.pool.connect();
    try {
      return client.query(query);
    } catch (error) {
      console.log(error);
      return false;
    } finally {
      client.release();
    }
  }

  public generateInsertColumns(insertParams: Object): String {
    insertParams = snakeCase(insertParams);
    let columns = "";

    for(const property in insertParams){
      columns += `${property}, `;
    }

    return columns.slice(0, -2);
  }

  public generateInsertValues(insertParams: any): String {
    insertParams = snakeCase(insertParams);
    let values = "";
    for(const property in insertParams){
      values += `${insertParams[property]}, `;
    }

    return values.slice(0, -2);
  }
}
