import express from "express";
import DBSingleton from "./db";
import { createLogger, format, transports } from "winston";
const { combine, timestamp, label, printf } = format;
import routes from "./routes"

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
    this.expressApp.use(async (_: express.Request, res: express.Response, next) => {
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

  private setupExpressRoutes(): void{
    this.expressApp.use("/", routes);
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

