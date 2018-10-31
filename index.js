const Discord = require("discord.js"); // Import the discord.js module
const client = new Discord.Client(); // Create an instance of a Discord client
const config = require("./config.json");

const db = require('./lib/db')
const p = require("./lib/loggerFactory")("index");

const Bot = require('./lib/bot')(db, config);

// Log our bot in using the token from https://discordapp.com/developers/applications/me
Bot.login(config.auth.bot.token);