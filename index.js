const p = require("./lib/loggerFactory")("index");
const env = process.env.NODE_ENV || "development";
const cfg = require("./config." + env);

// const Discord = require("discord.js");
const Commando = require("discord.js-commando");
const nodeCleanup = require("node-cleanup");

const { EventGuide } = require("./lib/Eventfunnel");

// const AddCommands = require("./lib/addCommands");

p.info("Starting Tada!");

const client = new Commando.Client({
  owners: cfg.owner,
});

let botEvents = new EventGuide();

botEvents.on("message", (ctx) => {
  let message = ctx.data.message;

  if (message.content === "ping") {
    message.channel.send("pong");
  }
});

botEvents.on("ready", () => {
  p.info("We're online!");

  // Set the client user's presence
  client.user
    .setPresence({
      activity: {
        name: cfg.playing,
      },
      status: "idle",
    })
    .then(() => {
      p.info(`Set bot's 'playing' status to '${cfg.playing}'`);
    })
    .catch(p.error);
});

//
//////    Discord Logging setup

// let us know about errors
botEvents.on("error", (ctx) => p.error(`Client ERROR: ${ctx.data}`));
botEvents.on("warn", (ctx) => p.warn(`Client WARNING: ${ctx.data}`));
// .on("debug", p.info)
botEvents.on("disconnect", () => {
  p.warn("Disconnected!");
});
botEvents.on("invalidated", () => {
  p.error("Discord Client session was invalidated? Unsure please attend");
});
botEvents.on("reconnecting", () => {
  p.warn("Reconnecting...");
});
botEvents.on("debug", (ctx) => p.trace(`Client Debug: ${ctx.data}`));

//
////// Crash handler (an attempt)

function exitHandler(exitCode, signal) {
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
}
nodeCleanup(exitHandler);

// async function eventFilter(ctx) {}

// client.on("message", async (o) => {
//   let ctx = {};
//   ctx.event = "message";
//   ctx.data = o;
//   // eventFilter(ctx).catch(p.error);
// });

//
///// Start the bot
client.emit = botEvents.newEmitter(client); // update the emitter to our new one
client.login(cfg.auth.bot.token);
