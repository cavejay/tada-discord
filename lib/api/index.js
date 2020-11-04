const p = require("../loggerFactory")("api");

const { Cottage, Response } = require("cottage");
const bodyParser = require("koa-bodyparser");
const mount = require("koa-mount");
const nodeCleanup = require("node-cleanup");

const TadaDBConnection = require("./database.main");

const guildUserFunctions = require("./api.guildUserHandler");
const guildFunctions = require("./api.guildHandler");
const introFunctions = require("./api.introHandler")

module.exports = async function ApiComponent({ cfg }) {
  p.info("App Start");

  const host = cfg.api.listeningAddr || process.env.HOST || "127.0.0.1";
  const port = cfg.api.listeningPort || process.env.PORT || 10001;

  // Connect to the database
  const db = await TadaDBConnection.build({ cfg });

  // Create the webserver
  let app = new Cottage();
  app.use(bodyParser());

  // Set up a logging middleware for /api
  async function logger(ctx, next) {
    p.info(`Caught request for: ${ctx.originalUrl} from ${ctx.ip}`);
    await next();
  }
  app.use(mount("/api", logger));

  // Log responses delivered by the server
  app.use(async (ctx, next) => {
    await next();
    p.info({ msg: `Served a response`, Response: ctx.response.body });
  });

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (e) {
      p.error({ msg: "Fatal Server Error", error: e });
      return new Response(500, "Fatal Server Error");
    }
  });

  //www.npmjs.com/package/node-cache
  //https://medium.com/@danielsternlicht/caching-like-a-boss-in-nodejs-9bccbbc71b9b

  // Only for dev/debugging
  if ((cfg.env = "development")) {
    app.get("/api/deleteeverything", async () => {
      await db.wipeDB();
      return new Response(203, "Completed db wipe");
    });
  }

  // Create the handling functions
  const { getGuildUser, newGuildUser, deleteGuildUser, updateGuildUser } = guildUserFunctions(db);
  const { getGuild, newGuild, deleteGuild, updateGuild } = guildFunctions(db);
  const {getIntro, newIntro, deleteIntro, updateIntro } = introFunctions(db);

  // API
  app.get("/api/user/:uid", () => {});
  app.put("/api/user/:uid", () => {});
  app.delete("/api/user/:uid", () => {});

  app.get("/api/user/:uid/guild/:gid", getGuildUser);
  app.post("/api/user/:uid/guild/:gid", newGuildUser);
  app.put("/api/user/:uid/guild/:gid", updateGuildUser);
  app.delete("/api/user/:uid/guild/:gid", deleteGuildUser);

  app.get("/api/intro/:id", () => {});
  app.post("/api/intro/:id", () => {});
  app.put("/api/intro/:id", () => {});
  app.delete("/api/intro/:id", () => {});

  app.get("/api/guild/:gid", getGuild);
  app.post("/api/guild/:gid", newGuild);
  app.put("/api/guild/:gid", updateGuild);
  app.delete("/api/guild:gid", deleteGuild);

  p.info("API Hooks configured");

  //
  ////// Crash handler (an attempt)
  const exitHandler = (exitCode, signal) => {
    p.warn("Process has been cancelled. Attempting to close API Server gracefully");
    try {
      app.close();
    } catch (err) {
      p.error(err);
    }
    // if (signal) {
    //   nodeCleanup.uninstall(); // don't call cleanup handler again
    //   return false;
    // }
  };

  p.info(`API Server listening on ${host}:${port}`);
  try {
    app.listen(port, host);
    nodeCleanup(exitHandler);
  } catch (e) {
    p.error("Unable to start the API server");
  }
};
