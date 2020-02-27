// const mqtt = require("mqtt");
const p = require("./loggerFactory")("Database_HTTPAdd");
const cacher = require("./cache");

let userIntroCache = new cacher("User->IntroList");

async function getAccessibleIntros({ uid, db }) {
  // get guilds from user's presence
  // get intros that have a precense for that guild
  // return filenames as an array

  return (await db.find({ type: "sound" }, { soundFile: 1, _id: 0 })).map(a => a.soundFile);
}

module.exports = function dbAPIServer({ db }) {
  const Cottage = require("cottage");
  const bodyParser = require("koa-bodyparser");
  const mount = require("koa-mount");
  const Response = require("cottage").Response;

  const host = process.env.HOST || "0.0.0.0";
  const port = process.env.PORT || 3001;

  // Create the webserver
  var app = new Cottage();
  app.use(bodyParser());

  p.info(`Server listening on ${host}:${port}`);

  // Set up a logging middleware for /api
  async function apiLogger(ctx, next) {
    p.info(`Caught request for: ${ctx.originalUrl} from ${ctx.ip}`);
    await next();
  }
  app.use(mount("/", apiLogger));

  // take requests for new videos
  app.get(`/:id`, async ctx => {
    p.info("request for intro visible to user: ", ctx.request.params.id);

    let intros = userIntroCache.getOrSet(1, await getAccessibleIntros({ db }));

    return intros; // todo finish id
  });

  app.listen(port, host);
};
