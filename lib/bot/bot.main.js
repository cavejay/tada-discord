const p = require("../loggerFactory")("Bot");
const nodeCleanup = require("node-cleanup");
const config = require("../../config.json");

// const Discord = require("discord.js"); // Import the discord.js module
// const client = new Discord.Client(); // Create an instance of a Discord client
const Commando = require("discord.js-commando");
const client = new Commando.Client({
  owner: config.owner
});

const { directMessageUser } = require("./bot.shared.js");
const { handleVoiceChannel } = require("./bot.voicechannels.js");
const { handleTextChannel } = require("./bot.textchannels.js");

// Configure node to logout before closing
nodeCleanup(function(exitCode, signal) {
  if (signal) {
    p.info("Process has been cancelled. Will attempt to close connection with Discord gracefully");
    client.destroy().then(() => {
      // calling process.exit() won't inform parent process of signal
      p.info("Exiting now...");
      process.kill(process.pid, signal);
    });
    nodeCleanup.uninstall(); // don't call cleanup handler again
    return false;
  }
});

// Bot main thing
module.exports = function bot({ db, config }) {
  /**
   * The ready event is vital, it means that only _after_ this will your bot start reacting to information
   * received from Discord
   */
  client.on("ready", () => {
    p.info("We're online!");

    // Set the client user's presence
    client.user
      .setPresence({ game: { name: config.playing } })
      .then(() => p.info(`Set bot's 'playing' status to '${config.playing}'`))
      .catch(e => p.error(e));

    // Message any users that had their intro reset during startup (because the file was missing)
  });

  // let us know about errors
  client
    .on("error", e => p.error(`Client ERROR: ${e}`))
    .on("warn", w => p.warn(`Client WARNING: ${w}`))
    // .on("debug", p.info)
    .on("disconnect", () => {
      p.warn("Disconnected!");
    })
    .on("reconnecting", () => {
      p.warn("Reconnecting...");
    });

  client.on("voiceStateUpdate", handleVoiceChannel(arguments[0]));
  client.on("message", handleTextChannel(arguments[0]));

  return client;
};
