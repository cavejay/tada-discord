const p = require("./loggerFactory")("addCommands");
const path = require("path");

const commando = require("discord.js-commando");

const DisableCommand = require("./commands/disable.js");
const SetIntroCommand = require("./commands/set/intro.js");

module.exports = function AddCommands(bot) {
  bot
    .on("commandError", (cmd, err) => {
      if (err instanceof commando.FriendlyError) return;
      p.error({ msg: `Error in command ${cmd.groupID}:${cmd.memberName}`, error: err });
    })
    .on("commandBlocked", (msg, reason) => {
      p.info({
        msg: `Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ""}
        blocked; ${reason}`,
        error: err
      });
    })
    .on("commandPrefixChange", (guild, prefix) => {
      p.info({
        msg: `Prefix ${prefix === "" ? "removed" : `changed to ${prefix || "the default"}`}
        ${guild ? `in guild ${guild.name} (${guild.id})` : "globally"}.`
      });
    })
    .on("commandStatusChange", (guild, command, enabled) => {
      p.info({
        msg: `Command ${command.groupID}:${command.memberName}
        ${enabled ? "enabled" : "disabled"}
        ${guild ? `in guild ${guild.name} (${guild.id})` : "globally"}.`
      });
    })
    .on("groupStatusChange", (guild, group, enabled) => {
      p.info({
        msg: `Group ${group.id}
        ${enabled ? "enabled" : "disabled"}
        ${guild ? `in guild ${guild.name} (${guild.id})` : "globally"}.`
      });
    });

  // bot
  //   .setProvider(sqlite.open(path.join(__dirname, "database.sqlite3")).then(db => new commando.SQLiteProvider(db)))
  //   .catch(console.error);

  bot.registry
    .registerGroup("tada")
    .registerDefaults()
    // Registers all of your commands in the ./commands/ directory
    // .registerCommandsIn(path.join(__dirname, "commands"));
    .registerCommand(DisableCommand)
    .registerCommand(SetIntroCommand);
};
