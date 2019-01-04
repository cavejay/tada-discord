const config = require("./config.json");

const db = require("./lib/db");
const soundManager = require("./lib/soundManager");
const p = require("./lib/loggerFactory")("index");

async function Main() {
  soundManager.init({ db, config });
  const Bot = require("./lib/bot/bot.main.js")({ db, config, soundManager });

  // Log our bot in using the token from https://discordapp.com/developers/applications/me
  Bot.login(config.auth.bot.token);
}

try {
  Main();
} catch (err) {
  p.error(err);
}
