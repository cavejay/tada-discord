const config = require("./config.json");
const p = require("./lib/loggerFactory")("index");

const db = require("./lib/db");

const soundManager = require("./lib/soundManager");
const userManager = require("./lib/userManager");
const fileManager = require("./lib/fileManager");

const AddCommands = require("./lib/addCommands");

function Main() {
  const Bot = require("./lib/bot/bot.main.js")({ db, config });

  fileManager.init({ config });
  soundManager.init({ db, config, Bot, fileManager });
  userManager.init({ db, config, Bot });

  Bot.soundManager = soundManager;
  Bot.userManager = userManager;

  // Add Commands to Bot
  AddCommands(Bot);

  // Log our bot in using the token from https://discordapp.com/developers/applications/me
  Bot.login(config.auth.bot.token);
}

try {
  Main();
} catch (err) {
  p.error(`MAIN ERROR: ${err}`);
}
