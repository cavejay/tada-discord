const p = require("../loggerFactory")("bot");
const Commando = require("discord.js-commando");
const nodeCleanup = require("node-cleanup");

const { EventRouter } = require("koala-event");
const {
  launchJoinOrLeaveTadaEvent,
  filterTadaJoinEvent,
  actionTadaJoinEvent,
  actionTadaLeaveEvent,
  parseOutChannelInfo,
} = require("./voiceEventHandlers");
const { filterMessageEvent, logMessageEvent, actionDirectMessageEvent } = require("./textEventHandlers");

class TadaBot {
  constructor({ cfg }) {
    this.cfg = cfg;
    this.p = require("../loggerFactory")("botClass");
    this.botEvents = new EventRouter();
    const client = (this.client = new Commando.Client({
      owners: cfg.owner,
    }));

    const setupEventContext = async (ctx, next) => {
      ctx.client = client;
      ctx.cfg = cfg.bot; // Bot related config
      return await next();
    };
    this.botEvents.use(setupEventContext);

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
    const setBotPresentation = async (ctx, next) => {
      this.p.info("We're online!");

      // Set the client user's presence
      try {
        await ctx.client.user.setPresence({ activity: { name: ctx.cfg.playing }, status: "online" });
        this.p.info(`Set bot's 'playing' status to '${ctx.cfg.playing}'`);
      } catch (e) {
        this.p.error(e);
      }
      await next();
    };
    bot.on("ready", setBotPresentation);

    // 'voiceStateUpdate' event chain
    // Process out the enter/leave voiceChannels
    bot.on("voiceStateUpdate", parseOutChannelInfo);
    // Joining or leaving?
    bot.on("voiceStateUpdate", launchJoinOrLeaveTadaEvent);

    // Setup the tada_userJoinEvent event
    bot.on("tada_userJoinEvent", parseOutChannelInfo);
    // Filter this event
    bot.on("tada_userJoinEvent", filterTadaJoinEvent);
    // handle a new vc user joining
    bot.on("tada_userJoinEvent", actionTadaJoinEvent);

    // Setup the tada_userLeaveEvent event
    bot.on("tada_userLeaveEvent", parseOutChannelInfo);
    // handle a vc user leaving
    bot.on("tada_userLeaveEvent", actionTadaLeaveEvent);

    // 'message' event chain
    // Don't process things by this bot
    bot.on("message", filterMessageEvent);
    // Log all other messages
    bot.on("message", logMessageEvent);
    // Handle Direct messages
    bot.on("message", actionDirectMessageEvent);
  }

  // Start the bot
  start() {
    this.p.info("Starting Tada!");

    this.watchLoggingEvents(this.botEvents);
    this.watchUserEvents(this.botEvents);

    ////// Crash handler (an attempt)
    const exitHandler = (exitCode, signal) => {
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
    };
    nodeCleanup(exitHandler);

    //
    ///// Start the bot
    this.client.emit = this.botEvents.newEmitter(this.client); // update the emitter to our new one
    this.client.login(this.cfg.discord.auth.bot.token);
  }
}

module.exports = TadaBot;
