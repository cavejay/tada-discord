const p = require("./lib/loggerFactory")("index");
const env = process.env.NODE_ENV || "development";
const cfg = require("./config." + env);

const TadaBot = require("./lib/bot");

const TadaDBConnection = require("./lib/api/database.main");

const Api = require("./lib/api");

async function Main() {
  // Initialise the API Component
  // let apiComponent = await Api({ cfg });

  // db
  global.db = new TadaDBConnection({ cfg });
  await global.db.init();

  //
  const Bot = new TadaBot({ cfg });
  Bot.start();
}

try {
  Main();
} catch (err) {
  p.error(err);
}
