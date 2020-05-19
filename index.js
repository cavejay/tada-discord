const p = require("./lib/loggerFactory")("index");
const env = process.env.NODE_ENV || "development";
const cfg = require("./config." + env);

// const Discord = require("discord.js");
const Commando = require("discord.js-commando");
const nodeCleanup = require("node-cleanup");

// const AddCommands = require("./lib/addCommands");

p.info("Starting Tada!");

const client = new Commando.Client({
  owners: cfg.owner,
});

client.on("ready", () => {
  p.info("I am ready");
});

client.on("message", (message) => {
  if (message.content === "ping") {
    message.channel.send("pong");
  }
});

client.on("ready", async () => {
  p.info("We're online!");

  // Set the client user's presence
  try {
    const presenceOutput = await client.user.setPresence({
      activity: {
        name: "with discord.js",
      },
      status: "idle",
    });
    p.info(presenceOutput);
  } catch (e) {
    p.error(e);
  }
});

// let us know about errors
client.on("error", (e) => p.error(`Client ERROR: ${e}`));
client.on("warn", (w) => p.warn(`Client WARNING: ${w}`));
// .on("debug", p.info)
client.on("disconnect", () => {
  p.warn("Disconnected!");
});
client.on("reconnecting", () => {
  p.warn("Reconnecting...");
});
client.on("debug", (d) => p.trace(`Client Debug: ${d}`));

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

client.login(cfg.auth.bot.token);
