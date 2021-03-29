import express from "express";
import validUrl from "valid-url";
import db from "./db";

import { createLogger, format, transports } from "winston";
const { combine, timestamp, label, printf } = format;


// Winston logger
const loggerFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${JSON.stringify(
    message,
    null,
    "\t"
  )}`;
});

const middlewareLogger = createLogger({
  format: combine(
    label({ label: "server.express.middleware.logger" }),
    timestamp(),
    loggerFormat
  ),
  transports: [new transports.Console()],
});

const endpointLogger = createLogger({
  format: combine(
    label({ label: "server.express.endpoint" }),
    timestamp(),
    loggerFormat
  ),
  transports: [new transports.Console()],
});

// Create a new express app instance
const app: express.Application = express();
app.use(express.json());

// Transaction ID middleware
app.use(async (req: express.Request, res: express.Response, next) => {
  const queryResult = await db.query(`select nextval('transaction_id')`, []);
  res.locals.transaction_id = queryResult[1][0].nextval;
  next();
});

// Logger middleware
app.use((req: express.Request, res: express.Response, done) => {
  middlewareLogger.info({
    method: req.method,
    ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
    transaction_id: res.locals.transaction_id,
    endpoint: req.path,
  });
  done();
});

app.get("/", function (req: express.Request, res: express.Response) {
  const code = 200;
  const body = `url shortener. post me with a slug you'd like (url.nog.sh/%slug_here%) with a json like this to create a new shortened link: {"url": "https://yourcoolurl.com"}`;
  res.status(code).send(body);

  endpointLogger.info({
    endpoint: "/",
    status: code,
    transaction_id: res.locals.transaction_id,
    info: `sent: ${body}`,
  });
});

app.get("/:slug", async function (req: express.Request, res: express.Response) {
  const slug = req.params.slug;
  let code = 200;

  // url exists?
  const result = await db.query("SELECT * FROM urls WHERE slug = $1", [slug]);

  if (result[1].length === 0) {
    code = 404;
    res.status(code).redirect("/");

    endpointLogger.info({
      endpoint: "/" + slug,
      status: code,
      transaction_id: res.locals.transaction_id,
      info: `slug not found, redirected user to '/'`,
    });

    return;
  }

  const redirect = result[1][0].redirect;
  res.status(code).redirect(redirect);

  endpointLogger.info({
    endpoint: "/" + slug,
    status: code,
    transaction_id: res.locals.transaction_id,
    info: `slug found, redirected user to '${redirect}'`,
  });
});

app.post("/:slug", async function (req, res) {
  const slug = req.params.slug;
  const redirect = req.body.url;
  let code = 201;
  let body: string;

  // redirect ok?
  if (!validUrl.isUri(redirect)) {
    code = 400;
    body = "Improper redirect. Please provide a valid url.";
    res.status(code).send(body);

    endpointLogger.info({
      endpoint: "/" + slug,
      status: code,
      transaction_id: res.locals.transaction_id,
      info: `provided redirect is malformed, sent: '${body}'`,
    });

    return;
  }

  // url exists?
  const result = await db.query("SELECT * FROM urls WHERE slug = $1", [slug]);

  if (result[1].length > 0) {
    code = 402;
    body = "This is slug is already in use. Please choose another one";
    res.status(code).send(body);

    endpointLogger.info({
      endpoint: "/" + slug,
      status: code,
      transaction_id: res.locals.transaction_id,
      info: `provided slug is already used, sent: '${body}'`,
    });

    return;
  }

  await db.query(
    "INSERT INTO urls(slug, redirect) VALUES ($1, $2)",
    [slug, redirect]
  );

  body = `${slug} => ${redirect}`;
  res.status(code).send(body);

  endpointLogger.info({
    endpoint: "/" + slug,
    status: code,
    transaction_id: res.locals.transaction_id,
    info: `created redirect successfully, sent: '${body}'`,
  });
});

const port: string = process.env.EXPRESS_PORT || "3000";

app.listen(port, function () {
  console.log(`app listening on port ${port}`);
});
