const p = require("../loggerFactory")("api");

const { Cottage } = require("cottage");
const bodyParser = require("koa-bodyparser");
const mount = require("koa-mount");
const nodeCleanup = require("node-cleanup");

module.exports = function ApiComponent({ cfg }) {
  p.info("App Start");

  const host = cfg.api.address || process.env.HOST || "127.0.0.1";
  const port = cfg.api.port || process.env.PORT || 3001;

  // Create the webserver
  var app = new Cottage();
  app.use(bodyParser());

  // Set up a logging middleware for /api
  async function logger(ctx, next) {
    p.info(`Caught request for: ${ctx.originalUrl} from ${ctx.ip}`);
    await next();
  }
  app.use(mount("/api", logger));

  // API
  app.get("/api/user/:uid", () => {});
  app.post("/api/user/:uid", () => {});
  app.put("/api/user/:uid", () => {});
  app.delete("/api/user/:uid", () => {});
  app.get("/api/user/:uid/guild/:gid", () => {});
  app.post("/api/user/:uid/guild/:gid", () => {});
  app.put("/api/user/:uid/guild/:gid", () => {});
  app.delete("/api/user/:uid/guild/:gid", () => {});

  app.get("/api/intro/:id", () => {});
  app.post("/api/intro/:id", () => {});
  app.put("/api/intro/:id", () => {});
  app.delete("/api/intro/:id", () => {});

  app.get("/api/guild/::gid", () => {});
  app.post("/api/guild/::gid", () => {});
  app.put("/api/guild/::gid", () => {});
  app.delete("/api/guild::gid", () => {});

  p.info("API Hooks configured");

  //
  ////// Crash handler (an attempt)
  function exitHandler(exitCode, signal) {
    if (signal) {
      p.info("Process has been cancelled. Will attempt to close connection with Discord gracefully");
      app.close();
      nodeCleanup.uninstall(); // don't call cleanup handler again
      return false;
    }
  }
  nodeCleanup(exitHandler);

  p.info(`Server listening on ${host}:${port}`);
  app.listen(port, host);
};
