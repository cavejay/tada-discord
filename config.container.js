let config = (module.exports = {});

config.env = "production";
// config.hostname = 'dev.example.com';

// Bot
config.bot = {};
config.bot.prefix = "!tada " || process.env.TADA_BOT_PREFIX;
config.bot.playing = "intros for all!" || process.env.TADA_BOT_PLAYING;
config.bot.defaultSound =
  "./sounds/tada.mp3" || process.env.TADA_BOT_DEFAULTSOUND;
config.bot.maxIntroTime = 5000 || process.env.TADA_BOT_MAXINTROTIME;
config.bot.maxIntroSize = 512000 || process.env.TADA_BOT_MAXINTROSIZE;
config.bot.introDebounce = 1500 || process.env.TADA_BOT_INTRODEBOUNCE;

// Api
config.api = {};
config.api.listeningAddr = "0.0.0.0" || process.env.TADA_API_LISTENINGADDR;
config.api.listeningPort = 8080 || process.env.TADA_API_LISTENINGPORT;
config.api.databaseAddr = "0.0.0.0" || process.env.TADA_API_DATABASEADDR;
config.api.databasePort = "28015" || process.env.TADA_API_DATABASEPORT;

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
  "53677376" || process.env.TADA_DISCORD_AUTH_BOT_PERMISSIONS;
