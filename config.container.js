let config = (module.exports = {});

config.env = process.env.NODE_ENV || "development";
// config.hostname = 'dev.example.com';

// Bot
config.bot = {};
config.bot.prefix = process.env.TADA_BOT_PREFIX || "!tada ";
config.bot.playing = process.env.TADA_BOT_PLAYING || "intros for all!";
config.bot.defaultSound =
  process.env.TADA_BOT_DEFAULTSOUND || "./sounds/tada.mp3";
config.bot.maxIntroTime = process.env.TADA_BOT_MAXINTROTIME || 5000;
config.bot.maxIntroSize = process.env.TADA_BOT_MAXINTROSIZE || 512000;
config.bot.introDebounce = process.env.TADA_BOT_INTRODEBOUNCE || 1500;

// Api
config.api = {};
config.api.listeningAddr = process.env.TADA_API_LISTENINGADDR || "0.0.0.0";
config.api.listeningPort = process.env.TADA_API_LISTENINGPORT || 8080;
config.api.databaseAddr = process.env.TADA_API_DATABASEADDR || "0.0.0.0";
config.api.databasePort = process.env.TADA_API_DATABASEPORT || "28015";
config.api.databaseName = process.env.TADA_API_DATABASENAME || "TadaDB_v1";

// Discord
config.discord = {};
config.discord.owner = process.env.TADA_DISCORD_OWNER;
config.discord.auth = {};
config.discord.auth.client = {};
config.discord.auth.client.id = process.env.TADA_DISCORD_AUTH_CLIENT_ID;
config.discord.auth.client.secret = process.env.TADA_DISCORD_AUTH_CLIENT_SECRET;
config.discord.auth.bot = {};
config.discord.auth.bot.token = process.env.TADA_DISCORD_AUTH_BOT_TOKEN;
config.discord.auth.bot.permissions =
  process.env.TADA_DISCORD_AUTH_BOT_PERMISSIONS || "53677376";
