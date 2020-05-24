const p = require("./lib/loggerFactory")("index");
const env = process.env.NODE_ENV || "development";
const cfg = require("./config." + env);

const Commando = require("discord.js-commando");
const nodeCleanup = require("node-cleanup");

const { EventRouter } = require("koala-event");

p.info("Starting Tada!");
const client = new Commando.Client({
  owners: cfg.owner,
});

const botEvents = new EventRouter();

botEvents.on("ready", () => {
  p.info("We're online!");

  // Set the client user's presence
  client.user
    .setPresence({
      activity: {
        name: cfg.playing,
      },
      status: "online",
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
////// Actual Bot Logic

botEvents.use(async (c, next) => {
  if (c.event != "raw" && c.event != "debug") p.info(`Processing event: ${c.event}`);
  return await next();
});

botEvents.use(async (ctx, next) => {
  ctx.client = client;
  return await next();
});

function lonelyInAChannelCheck(channel) {
  // If user leaves a voice channel and we're still in it
  if (channel.members.keyArray().length === 1) {
    let msg = `T_T Lonely in ${channel.name}/${channel.guild.name} - will leave now`;
    p.info(msg);
    p.debug({ msg, guild: channel.guild.id, channel: channel.id });
    channel.leave();
  }
}

// 'voiceStateUpdate' event chain
// Process out the enter/leave voiceChannels
botEvents.on("voiceStateUpdate", async (ctx, next) => {
  ctx.oldState = ctx.data[0];
  ctx.newState = ctx.data[1];
  return await next();
});
// Joining or leaving?
botEvents.on("voiceStateUpdate", async (ctx, next) => {
  // If the user is joining a channel and it passes the filter
  if (!ctx.oldState.channel && ctx.newState.channel) {
    let msg = `${ctx.newState.member.user.username} joined channel ${ctx.newState.channel.name} in ${ctx.newState.guild.name}`;
    p.debug({
      msg,
      guild: ctx.newState.guild.id,
      user: ctx.newState.member.user.id,
      channelJoined: ctx.newState.channel.id,
    });
    return client.emit("tada_userJoinEvent", ctx.data);
  } else if (!ctx.newState.channel) {
    let msg = `${ctx.oldState.member.user.username} left channel ${ctx.oldState.channel.name} in ${ctx.oldState.guild.name}`;
    p.debug({
      msg,
      guild: ctx.oldState.guild.id,
      user: ctx.oldState.member.user.id,
      channelLeft: ctx.oldState.channel.id,
    });
    return client.emit("tada_userLeaveEvent", ctx.data);
  } else {
    p.info("user just changed channel - default is to not play anything here");
    let msg = `${ctx.oldState.member.user.username} moved channel from ${ctx.oldState.channel.name} in ${ctx.oldState.guild.name} to ${ctx.newState.channel.name} in ${ctx.newState.guild.name}`;
    p.info(msg);
    p.debug({
      msg,
      user: ctx.oldState.member.user.id,
      fromGuild: ctx.oldState.guild.id,
      fromChannel: ctx.oldState.channel.id,
      toGuild: ctx.newState.guild.id,
      toChannel: ctx.newState.channel.id,
    });
    return lonelyInAChannelCheck(ctx.oldState.channel);
  }
});

// Setup the tada_userJoinEvent event
botEvents.on("tada_userJoinEvent", async (ctx, next) => {
  ctx.oldState = ctx.data[0];
  ctx.newState = ctx.data[1];
  return await next();
});
// Filter this event
botEvents.on("tada_userJoinEvent", async (ctx, next) => {
  // If it's me (the bot) I don't care. plz check
  if (ctx.newState.member.id === ctx.client.user.id) return;

  // If it's another bot then also don't join. That would be bad
  if (ctx.newState.member.user.bot) return;

  // If we can't resolve the userchannel lets just skip
  if (!ctx.newState.channel) return;

  // Implement intro debounce here //todo

  return await next();
});
// handle a new vc user joining
botEvents.on("tada_userJoinEvent", async (ctx, next) => {
  let msg = `${ctx.newState.member.user.username} joined channel ${ctx.newState.channel.name} in ${ctx.newState.guild.name}`;
  p.info(msg);

  ctx.newState.channel
    .join()
    .then((connection) => p.info("Connected!"))
    .catch((e) => p.error(e.message));
});

// Setup the tada_userLeaveEvent event
botEvents.on("tada_userLeaveEvent", async (ctx, next) => {
  ctx.oldState = ctx.data[0];
  ctx.newState = ctx.data[1];
  return await next();
});
// handle a vc user leaving
botEvents.on("tada_userLeaveEvent", async (ctx, next) => {
  let msg = `${ctx.oldState.member.user.username} left channel ${ctx.oldState.channel.name} in ${ctx.oldState.guild.name}`;
  p.info(msg);
  lonelyInAChannelCheck(ctx.oldState.channel);
  return await next();
});

// 'message' event chain
// Don't process things by this bot
botEvents.on("message", async (ctx, next) => {
  const message = ctx.data;
  // If it's not this bot continue - else just print
  if (message.author.id !== message.client.user.id) {
    return await next();
  }
  p.debug(`Text Channel message '${message}' was filtered as not unnecessary`);
});
// Log all other messages
botEvents.on("message", async (ctx, next) => {
  const message = ctx.data;
  p.info(`Text Channel message '${message.content.slice(0, 20)}' was seen in ${message.channel.name}`);
  return await next();
});
// Handle Direct messages
botEvents.on("message", async (ctx, next) => {
  const message = ctx.data;
  if (message.channel.type == "dm") {
    p.info(`We were messaged directly '${message}' from ${message.author.username}`);
  }
  return await next();
});

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

//
///// Start the bot
client.emit = botEvents.newEmitter(client); // update the emitter to our new one
client.login(cfg.auth.bot.token);
