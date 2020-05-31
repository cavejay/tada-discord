const p = require("../loggerFactory")("api");

const { Cottage } = require("cottage");
const bodyParser = require("koa-bodyparser");
const mount = require("koa-mount");
const nodeCleanup = require("node-cleanup");

module.exports = function ApiComponent({ cfg }) {
  p.info("App Start");

  const host = cfg.api.listeningAddr || process.env.HOST || "127.0.0.1";
  const port = cfg.api.listeningPort || process.env.PORT || 29809;

  // Create the webserver
  let app = new Cottage();
  app.use(bodyParser());

  // Set up a logging middleware for /api
  async function logger(ctx, next) {
    p.info(`Caught request for: ${ctx.originalUrl} from ${ctx.ip}`);
    await next();
  }
  app.use(mount("/api", logger));

  //www.npmjs.com/package/node-cache
  //https://medium.com/@danielsternlicht/caching-like-a-boss-in-nodejs-9bccbbc71b9b

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
    p.warn("Process has been cancelled. Attempting to close API Server gracefully");
    app.close();
    if (signal) {
      Cleanup.uninstall(); // don't call cleanup handler again
      return false;
    }
  }
  nodeCleanup(exitHandler);

  p.info(`API Server listening on ${host}:${port}`);
  app.listen(port, host);
};
