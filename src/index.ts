import express from "express";
import validUrl from "valid-url";
import pg, { Pool } from "pg";

require("dotenv").config();

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

// Create a new express app instance
const app: express.Application = express();
app.use(express.json());
app.get("/", function (req, res) {
  res.send(
    `url shortener. post me with a slug you'd like (url.nog.sh/%slug_here%) with a json like this to create a new shortened link: {"url": "https://yourcoolurl.com"}`
  );
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

app.get("/:slug", async function (req, res) {
  const slug = req.params.slug;

  // url exists?
  const result = await query("SELECT * FROM urls WHERE slug = $1", [slug]);

  if (result[1].length === 0) {
    res.status(404).redirect("/");
    return;
  }

  const redirect = result[1][0].redirect;
  res.status(200).redirect(redirect);
});

app.post("/:slug", async function (req, res) {
  const slug = req.params.slug;
  const redirect = req.body.url;

  // redirect ok?
  if (!validUrl.isUri(redirect)) {
    res.status(400).send("Improper redirect");
    return;
  }

  // url exists?
  const result = await query("SELECT * FROM urls WHERE slug = $1", [slug]);

  if (result[1].length > 0) {
    res.status(402).send("Already in use");
    return;
  }

  const insert = await query(
    "INSERT INTO urls(slug, redirect) VALUES ($1, $2)",
    [slug, redirect]
  );

  res.status(201).send(`${slug} => ${redirect}`);
});

app.listen(3000, function () {
  console.log("app listening on port 3000");
});
