const p = require("./lib/loggerFactory")("index");
const env = process.env.NODE_ENV || "development";
const cfg = require("./config." + env);

const TadaBot = require("./lib/bot");

const Bot = new TadaBot({ cfg });
Bot.start();

const Api = require("./lib/api")({ cfg });
