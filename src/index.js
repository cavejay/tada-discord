const p = require("./loggerFactory")("index");
const env = process.env.TADA_CONFIG_ENV || "development";
p.info(
  `Loading Configuration file based on TADA_CONFIG_ENV: '${process.env.TADA_CONFIG_ENV}' from './config.${env}.js'`
);
const cfg = require("./config." + env);

const TadaBot = require("./bot");
const TadaDBConnection = require("./api/database.main");

const Api = require("./api");

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
