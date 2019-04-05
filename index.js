const config = require("./config.json");
const p = require("./lib/loggerFactory")("index");

const db = require("./lib/db");

const soundManager = require("./lib/manager/soundManager");
const userManager = require("./lib/manager/userManager");
const fileManager = require("./lib/manager/fileManager");
const guildManager = require("./lib/manager/guildManager");

const AddCommands = require("./lib/addCommands");

function Main() {
  const Bot = require("./lib/bot/bot.main.js")({ db, config });

  fileManager.init({ config });
  soundManager.init({ db, config, Bot, fileManager });
  guildManager.init({ db, config, Bot });
  userManager.init({ db, config, Bot, soundManager, guildManager });

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
