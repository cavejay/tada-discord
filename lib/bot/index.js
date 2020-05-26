const p = require("../loggerFactory")("bot");
const Commando = require("discord.js-commando");
const nodeCleanup = require("node-cleanup");

const { EventRouter } = require("koala-event");

function lonelyInAChannelCheck(channel) {
  // If user leaves a voice channel and we're still in it
  if (channel.members.keyArray().length === 1) {
    let msg = `T_T Lonely in ${channel.name}/${channel.guild.name} - will leave now`;
    p.info(msg);
    p.debug({ msg, guild: channel.guild.id, channel: channel.id });
    channel.leave();
  }
}

async function playTadaNoise(channel, maxIntroTime) {
  if (channel.connection) {
    // We're already in this channel
    p.info(`Bot is already in ${channel.name}`);
    return;
  }

  soundFile = "./sounds/tada.mp3";

  // Cover our butts incase we're already intro'ing
  let connection = await channel.join();
  let msg = `Bot has joined channel ${channel.name} to 'tada' someone`;
  p.info({ msg });

  // create the dispatcher to play the tada noise
  const dispatcher = await connection.play(soundFile);

  p.info(`Playing from ${soundFile}`);
  dispatcher.on("start", (s) => {
    setTimeout(() => {
      // If the dispatcher hasn't ended then end it
      if (!dispatcher.destroyed) {
        p.info(`Ending dispatcher at ${maxIntroTime}ms`);
        dispatcher.end("Max video time reached");
      }
    }, maxIntroTime);
  });

  // when it ends let us know
  dispatcher.on("speaking", (isSpeaking) => {
    if (!isSpeaking) {
      let msg = `Bot has finished 'tadaing' in channel ${channel.name}`;
      p.info({ msg });

      // leave the channel
      channel.leave();
    }
  });

  dispatcher.on("error", (err) => {
    p.error("dispatcher error:", err);
  });
}

class TadaBot {
  constructor({ cfg }) {
    this.cfg = cfg;
    this.p = require("../loggerFactory")("botClass");
    this.botEvents = new EventRouter();
    const client = (this.client = new Commando.Client({
      owners: cfg.owner,
    }));

    this.botEvents.use(async (ctx, next) => {
      ctx.client = client;
      ctx.cfg = cfg.bot;
      return await next();
    });

    const ignoreFrequentBotEmits = async (ctx, next) => {
      if (ctx.event != "raw" && ctx.event != "debug") this.p.info(`Processing event: ${ctx.event}`);
      return await next();
    };
    this.botEvents.use(ignoreFrequentBotEmits);
  }

  // Logging Events
  watchLoggingEvents(bot) {
    // let us know about errors
    bot.on("error", (ctx) => this.p.error(`Client ERROR: ${ctx.data}`));
    bot.on("warn", (ctx) => this.p.warn(`Client WARNING: ${ctx.data}`));
    bot.on("disconnect", () => this.p.warn("Disconnected!"));
    bot.on("invalidated", () => this.p.error("Discord Client session was invalidated? Unsure please attend"));
    bot.on("reconnecting", () => this.p.warn("Reconnecting..."));
    bot.on("debug", (ctx) => this.p.trace(`Client Debug: ${ctx.data}`));
  }

  watchUserEvents(bot) {
    bot.on("ready", (ctx) => {
      this.p.info("We're online!");

      // Set the client user's presence
      ctx.client.user
        .setPresence({
          activity: {
            name: ctx.cfg.playing,
          },
          status: "online",
        })
        .then(() => {
          this.p.info(`Set bot's 'playing' status to '${ctx.cfg.playing}'`);
        })
        .catch((e) => {
          this.p.error(e);
        });
    });

    // 'voiceStateUpdate' event chain
    // Process out the enter/leave voiceChannels
    bot.on("voiceStateUpdate", async (ctx, next) => {
      ctx.oldState = ctx.data[0];
      ctx.newState = ctx.data[1];
      return await next();
    });
    // Joining or leaving?
    bot.on("voiceStateUpdate", async (ctx, next) => {
      // If the user is joining a channel and it passes the filter
      if (!ctx.oldState.channel && ctx.newState.channel) {
        let msg = `${ctx.newState.member.user.username} joined channel ${ctx.newState.channel.name} in ${ctx.newState.guild.name}`;
        this.p.debug({
          msg,
          guild: ctx.newState.guild.id,
          user: ctx.newState.member.user.id,
          channelJoined: ctx.newState.channel.id,
        });
        return ctx.client.emit("tada_userJoinEvent", ctx.data);
      } else if (!ctx.newState.channel) {
        let msg = `${ctx.oldState.member.user.username} left channel ${ctx.oldState.channel.name} in ${ctx.oldState.guild.name}`;
        this.p.debug({
          msg,
          guild: ctx.oldState.guild.id,
          user: ctx.oldState.member.user.id,
          channelLeft: ctx.oldState.channel.id,
        });
        return ctx.client.emit("tada_userLeaveEvent", ctx.data);
      } else {
        this.p.info("user just changed channel - default is to not play anything here");
        let msg = `${ctx.oldState.member.user.username} moved channel from ${ctx.oldState.channel.name} in ${ctx.oldState.guild.name} to ${ctx.newState.channel.name} in ${ctx.newState.guild.name}`;
        this.p.info(msg);
        this.p.debug({
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
    bot.on("tada_userJoinEvent", async (ctx, next) => {
      ctx.oldState = ctx.data[0];
      ctx.newState = ctx.data[1];
      return await next();
    });
    // Filter this event
    bot.on("tada_userJoinEvent", async (ctx, next) => {
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
    bot.on("tada_userJoinEvent", async (ctx, next) => {
      let msg = `${ctx.newState.member.user.username} joined channel ${ctx.newState.channel.name} in ${ctx.newState.guild.name}`;
      this.p.info(msg);

      await playTadaNoise(ctx.newState.channel, ctx.cfg.maxIntroTime);
    });

    // Setup the tada_userLeaveEvent event
    bot.on("tada_userLeaveEvent", async (ctx, next) => {
      ctx.oldState = ctx.data[0];
      ctx.newState = ctx.data[1];
      return await next();
    });
    // handle a vc user leaving
    bot.on("tada_userLeaveEvent", async (ctx, next) => {
      let msg = `${ctx.oldState.member.user.username} left channel ${ctx.oldState.channel.name} in ${ctx.oldState.guild.name}`;
      this.p.info(msg);
      lonelyInAChannelCheck(ctx.oldState.channel);
      return await next();
    });

    // 'message' event chain
    // Don't process things by this bot
    bot.on("message", async (ctx, next) => {
      const message = ctx.data;
      // If it's not this bot continue - else just print
      if (message.author.id !== message.client.user.id) {
        return await next();
      }
      this.p.debug(`Text Channel message '${message}' was filtered as not unnecessary`);
    });
    // Log all other messages
    bot.on("message", async (ctx, next) => {
      const message = ctx.data;
      this.p.info(`Text Channel message '${message.content.slice(0, 20)}' was seen in ${message.channel.name}`);
      return await next();
    });
    // Handle Direct messages
    bot.on("message", async (ctx, next) => {
      const message = ctx.data;
      if (message.channel.type == "dm") {
        this.p.info(`We were messaged directly '${message}' from ${message.author.username}`);
      }
      return await next();
    });
  }

  // Start the bot
  start() {
    this.p.info("Starting Tada!");

    this.watchLoggingEvents(this.botEvents);
    this.watchUserEvents(this.botEvents);

    //
    ////// Crash handler (an attempt)
    function exitHandler(exitCode, signal) {
      if (signal) {
        this.p.info("Process has been cancelled. Will attempt to close connection with Discord gracefully");
        this.client.destroy().then(() => {
          // calling process.exit() won't inform parent process of signal
          this.p.info("Exiting now...");
          process.kill(process.pid, signal);
        });
        nodeCleanup.uninstall(); // don't call cleanup handler again
        return false;
      }
    }
    nodeCleanup(exitHandler);

    //
    ///// Start the bot
    this.client.emit = this.botEvents.newEmitter(this.client); // update the emitter to our new one
    this.client.login(this.cfg.discord.auth.bot.token);
  }
}

module.exports = TadaBot;
