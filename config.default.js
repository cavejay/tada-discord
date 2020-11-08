let config = (module.exports = {});

config.env = process.env.NODE_ENV || "development";
// config.hostname = 'dev.example.com';

// Bot
config.bot = {};
config.bot.prefix = "!tada ";
config.bot.playing = "intros for all!";
config.bot.defaultSound = "./sounds/tada.mp3";
config.bot.maxIntroTime = 5000;
config.bot.maxIntroSize = 512000;
config.bot.introDebounce = 1500;

// Api
config.api = {};
config.api.listeningAddr = "0.0.0.0";
config.api.listeningPort = 8080;
config.api.databaseAddr = "0.0.0.0";
config.api.databasePort = "28015";

// Discord
config.discord = {};
config.discord.owner = "252615330818166108";
config.discord.auth = {};
config.discord.auth.client = {};
config.discord.auth.client.id = "123456789_fillme";
config.discord.auth.client.secret = "abcdefghijklmnop_fillme";
config.discord.auth.bot = {};
config.discord.auth.bot.token = "Please also fill me";
config.discord.auth.bot.permissions = "3148864";
