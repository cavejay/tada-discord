const p = require("../loggerFactory")("bot");

const path = require("path");

const Commando = require("discord.js-commando");
const nodeCleanup = require("node-cleanup");
const compose = require("koa-compose");

const { EventRouter } = require("koala-event");
const {
  launchJoinOrLeaveTadaEvent,
  actionTadaJoinEvent,
  actionTadaLeaveEvent,
  parseOutChannelInfo,
  logTadaJoinEvent,
  filterTadaJoinEvent_global,
  filterTadaJoinEvent_guild,
  filterTadaJoinEvent_user,
} = require("./voiceEventHandlers");
const {
  filterMessageEvent,
  logMessageEvent,
  launchDirectorChannelMessageEvent,
  actionDirectMessageEvent,
  actionDirectMessageAttachment,
} = require("./textEventHandlers");
const { newGuildEvent, updateGuilds } = require("./customEventHandlers");
const { setMetaProp } = require("./dataInterface");

class TadaBot {
  constructor({ cfg }) {
    this.cfg = cfg;
    this.p = require("../loggerFactory")("botClass");
    this.botEvents = new EventRouter();

    // Initialise the commando/discordjs bot api
    this.client = new Commando.Client({
      owners: cfg.discord.owner,
      commandPrefix: cfg.bot.prefix,
    });
    const client = this.client;

    // Skip events we won't do anything with todo - dont do this when process.env.environment == debug
    const ignoreFrequentBotEmits = async (ctx, next) => {
      if (ctx.event != "raw" && ctx.event != "debug")
        this.p.info(`Processing event: ${ctx.event}`);
      return await next();
    };
    if (process.env.NODE_ENV == "production")
      this.botEvents.use(ignoreFrequentBotEmits);

    // there are some basic things we need to be available to events
    const setupEventContext = async (ctx, next) => {
      ctx.client = client;
      ctx.cfg = cfg.bot; // Bot related config
      ctx.cfg.backendAPI = cfg.api;
      return await next();
    };
    this.botEvents.use(setupEventContext);

    // Load all the commands
    this.addCommandOptions(this.client);
  }

  // Logging Events
  watchLoggingEvents(bot) {
    // let us know about errors
    bot.on("error", (ctx) => this.p.error(`Client ERROR: ${ctx.data}`));
    bot.on("warn", (ctx) => this.p.warn(`Client WARNING: ${ctx.data}`));
    bot.on("disconnect", () => this.p.warn("Disconnected!"));
    bot.on("invalidated", () =>
      this.p.error(
        "Discord Client session was invalidated? Unsure please attend"
      )
    );
    bot.on("reconnecting", () => this.p.warn("Reconnecting..."));
    bot.on("debug", (ctx) => this.p.trace(`Client Debug: ${ctx.data}`));
  }

  watchUserEvents(bot) {
    const setBotPresentation = async (ctx, next) => {
      this.p.info("We're online!");

      // Set the client user's presence
      try {
        await ctx.client.user.setPresence({
          activity: { name: ctx.cfg.playing },
          status: "online",
        });
        this.p.info(`Set bot's 'playing' status to '${ctx.cfg.playing}'`);
      } catch (e) {
        this.p.error(e);
      }
      await next();
    };
    bot.on("ready", setBotPresentation);

    // Ensure that the db holds all the guilds we currently have
    bot.on("ready", updateGuilds);

    bot.on("ready", (ctx, next) => {
      p.info("Startup process complete");
    });

    // 'voiceStateUpdate' event chain
    // Process out the enter/leave voiceChannels
    bot.on("voiceStateUpdate", parseOutChannelInfo);
    // Joining or leaving?
    bot.on("voiceStateUpdate", launchJoinOrLeaveTadaEvent);

    // Setup the tada_userJoinEvent event
    bot.on("tada_userJoinEvent", parseOutChannelInfo);
    // Filter this event
    bot.on(
      "tada_userJoinEvent",
      compose([
        filterTadaJoinEvent_global,
        filterTadaJoinEvent_guild,
        filterTadaJoinEvent_user,
      ])
    );
    // Log
    bot.on("tada_userJoinEvent", logTadaJoinEvent);
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
    // split message event stream now
    bot.on("message", launchDirectorChannelMessageEvent);

    // Handle Direct messages
    bot.on("tada_directMessage", actionDirectMessageEvent);
    // Handle Direct messages that have an attachment
    bot.on("tada_directMessage", actionDirectMessageAttachment);
  }

  watchCustomEvents(bot) {
    bot.on("guildCreate", newGuildEvent);
  }

  // Add Commands
  addCommandOptions(client) {
    client
      .on("commandError", (cmd, err) => {
        p.error({
          msg: `Error in command ${cmd.groupID}:${cmd.memberName}`,
          error: err,
        });
      })
      .on("commandBlocked", (msg, reason) => {
        p.info({
          msg: `Command ${
            msg.command
              ? `${msg.command.groupID}:${msg.command.memberName}`
              : ""
          }
        blocked; ${reason}`,
          error: err,
        });
      })
      .on("commandPrefixChange", (guild, prefix) => {
        p.info({
          msg: `Prefix ${
            prefix === "" ? "removed" : `changed to ${prefix || "the default"}`
          }
        ${guild ? `in guild ${guild.name} (${guild.id})` : "globally"}.`,
        });
      })
      .on("commandStatusChange", (guild, command, enabled) => {
        p.info({
          msg: `Command ${command.groupID}:${command.memberName}
        ${enabled ? "enabled" : "disabled"}
        ${guild ? `in guild ${guild.name} (${guild.id})` : "globally"}.`,
        });
      })
      .on("groupStatusChange", (guild, group, enabled) => {
        p.info({
          msg: `Group ${group.id}
        ${enabled ? "enabled" : "disabled"}
        ${guild ? `in guild ${guild.name} (${guild.id})` : "globally"}.`,
        });
      })
      .on("groupRegister", (group) => {
        p.info({ msg: "just registered a group: " + group.name });
        p.trace({ msg: "just registered a group", group: group });
      })
      .on("commandRegister", (cmd) => {
        p.info({
          msg: `registered a command: ${cmd.name} (${cmd.group.name})`,
        });
        p.trace({ msg: "registered a command", name: cmd });
      })
      .on("debug", (log) => {
        p.trace(`TRACE: ${log}`);
      });

    client.registry
      .registerDefaultTypes()
      .registerDefaultGroups()
      .registerDefaultCommands({ help: true, prefix: false, ping: false });

    // Registers all of your commands in the ./commands/ directory
    client.registry.registerGroups([
      ["tada-user", "Tada Commands"],
      ["tada-guild-admin", "Tada Admin Commands"],
      ["tada-owner", "Tada SysAdmin Commands"],
    ]);
    client.registry.registerCommandsIn(path.join(__dirname, "commands"));
  }

  // Start the bot
  start() {
    this.p.info("Starting Tada!");

    this.watchLoggingEvents(this.botEvents);
    this.watchUserEvents(this.botEvents);
    this.watchCustomEvents(this.botEvents);

    ////// Crash handler (an attempt)
    const exitHandler = (exitCode, signal) => {
      if (signal) {
        this.p.info(
          `Process has been cancelled (${signal}). Will attempt to close connection with Discord gracefully`
        );
        this.client.destroy().then(() => {
          // calling process.exit() won't inform parent process of signal
          this.p.info("Exiting now...");
          // process.kill(process.pid, signal);
        });
        nodeCleanup.uninstall(); // don't call cleanup handler again
        return true;
      }
    };
    nodeCleanup(exitHandler);

    //
    ///// Start the bot
    this.client.emit = this.botEvents.newEmitter(this.client); // update the emitter to our new one
    this.client.login(this.cfg.discord.auth.bot.token);

    // Set the owner of the bot based on the config file for now // make this not this?
    p.info(`Set the owner record in the db to: ${this.cfg.discord.owner}`);
    setMetaProp("owner", this.cfg.discord.owner);
  }
}

module.exports = TadaBot;
