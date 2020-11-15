import sqlite3 = require("sqlite3");

export class urlDatabase {
  db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database("urls.db", (err) => {
      if (err) {
        console.error("Failed to connect to local database");
      }

      console.log("Connected to db");
    });

    // Create urls table
    this.db.run("CREATE TABLE IF NOT EXISTS urls(slug text, redirect text)");
  }

  insertUrl(slug: string, url: string) {
    return this.db.run(
      `INSERT INTO urls(slug, redirect) VALUES(?)`,
      [slug, url],
      (err) => {
        if (err) {
          return [false, err];
        }

        return [true, null];
      }
    );
  }

  getUrl(slug: string) {
    let result = this.db.get(
      `SELECT * FROM urls WHERE slug = ?`,
      [slug],
      (err, row) => {
        if (err) {
          return [false, err, null];
        }

        console.log(row);
        return [true, null, row ? row : null];
      }
    );

    return result;
  }

  closeConnection() {
    this.db.close();
  }
}
