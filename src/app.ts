import express from "express";
import DBSingleton from "./db";
import { createLogger, format, transports } from "winston";
const { combine, timestamp, label, printf } = format;
import validUrl from "valid-url";

export default class App {
  port: Number;
  db: DBSingleton;
  expressApp: express.Application;
  httpServer: any; //TO-DO find type annotation for this

  constructor(port?: Number){
    this.port = port || 3000;
    this.db = DBSingleton.getInstance();
    this.expressApp = express();
    this.configureExpressApp();
  }

  private configureExpressApp(): void{
    this.expressApp.use(express.json());
    this.setupExpressMiddleware();
    this.setupExpressRoutes();
  }

  private setupExpressMiddleware(): void{
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
        label({ label: "server.express.middleware.logger" }), timestamp(),
        loggerFormat
      ),
      transports: [new transports.Console()],
    });

    // Transaction ID middleware
    this.expressApp.use(async (req: express.Request, res: express.Response, next) => {
      const queryResult = await this.db.nextVal(`transaction_id`);
      if(!queryResult){
        next();
        return;
      }
      res.locals.transaction_id = queryResult.rows[0].nextval;
      next();
    });

    // Logger middleware
    this.expressApp.use((req: express.Request, res: express.Response, done) => {
      middlewareLogger.info({
        method: req.method,
        ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
        transaction_id: res.locals.transaction_id,
        endpoint: req.path,
      });
      done();
    });
  }

  private setupExpressRoutes(db = this.db): void{
    this.expressApp.get("/", function (req: express.Request, res: express.Response) {
      const code = 200;
      const body = `This is an URL shortener. /POST me with a slug you'd like (url.nog.dev/%slug_here%) with a json like this to create a new shortened link: <pre>{"url": "https://yourcoolurl.com"}</pre>`;
        res.status(code).send(body);
    });

    this.expressApp.get("/:slug", async function (req: express.Request, res: express.Response) {
      const slug = req.params.slug;
      let code = 200;

      // url exists?
      //const result = await db.query("SELECT * FROM urls WHERE slug = $1", [slug]);
      const result = await db.select('urls', {slug});

      if (!result) {
        code = 404;
        res.status(code).redirect("/");
        return;
      }

      const redirect = result.rows[0].redirect;
      res.status(code).redirect(redirect);
    });

    this.expressApp.post("/:slug", async function (req, res) {
      const slug = req.params.slug;
      const redirect = req.body.url;
      let code = 201;
      let body: string;

      // redirect ok?
      if (!validUrl.isUri(redirect)) {
        code = 400;
        body = "Improper redirect. Please provide a valid url.";
        res.status(code).send(body);
        return;
      }

      // url exists?
      const result = await db.select('urls', {slug});

      if (result) {
        code = 402;
        body = "This is slug is already in use. Please choose another one";
        res.status(code).send(body);
        return;
      }

      await db.insert(
        'urls', 
        {slug, redirect}
      );

      body = `${slug} => ${redirect}`;
      res.status(code).send(body);
    });

  }

  listen(): void{
    this.httpServer = this.expressApp.listen(this.port, () => {
      console.log(`app listening on port ${this.port}`);
    });
  }

  startGracefulShutdown = async (signal: String) => {
    console.info(`'${signal}' signal received.`);
    console.log('Closing http server...');
    this.httpServer.close(() => {
      console.log('httpServer closed.')
    });

    await this.db.closeConnection();
  }
}

