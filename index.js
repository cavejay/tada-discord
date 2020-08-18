const p = require("./lib/loggerFactory")("index");
const env = process.env.NODE_ENV || "development";
const cfg = require("./config." + env);

const TadaBot = require("./lib/bot");

const Api = require("./lib/api");

const TBDatabase = require("./lib/api/database.main");

async function Main() {
  // Initialise the API Component
  // let apiComponent = await Api({ cfg });

  //
  const Bot = new TadaBot({ cfg });
  Bot.start();
}

try {
  Main();
} catch (err) {
  p.error(err);
}
