let config = (module.exports = {});

config.env = "development";
// config.hostname = 'dev.example.com';

// Intro Details
config.maxIntroTime = 8000;
config.maxIntroSize = 512000;
config.introDebounce = 1500;
config.newUserDefault = "5ecb17ce781bc41597228f8c1032e25f18b64e46";

// Bot
config.prefix = "!tada ";
config.playing = "intros for all!";
config.soundStorageFolder = "./sounds";

// Discord
config.owner = "252615330818166108";
config.auth = {};
config.auth.client = {};
config.auth.client.id = "123456789_fillme";
config.auth.client.secret = "abcdefghijklmnop_fillme";
config.auth.bot = {};
config.auth.bot.token = "Please also fill me";
config.auth.bot.permissions = "53677376";
