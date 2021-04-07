import App from "./app";

const app = new App();
app.listen();

process.on('SIGTERM', app.startGracefulShutdown);
process.on('SIGINT', app.startGracefulShutdown);
