const p = require("./loggerFactory")("addCommands");
const path = require("path");

const commando = require("discord.js-commando");

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
    })
    .on("groupRegister", group => {
      p.info({ msg: "just registered a group: " + group.name });
      p.trace({ msg: "just registered a group", group: group });
    })
    .on("commandRegister", cmd => {
      p.info({ msg: `registered a command: ${cmd.name} (${cmd.group.name})` });
      p.trace({ msg: "registered a command", name: cmd });
    })
    .on("debug", log => {
      p.debug(`DEBUG: ${log}`);
    });

  // bot
  //   .setProvider(sqlite.open(path.join(__dirname, "database.sqlite3")).then(db => new commando.SQLiteProvider(db)))
  //   .catch(console.error);

  bot.registry.registerDefaults();

  // Registers all of your commands in the ./commands/ directory
  bot.registry.registerGroup("tada-bot", "Tada Commands");
  bot.registry.registerGroup("tada-admin", "Tada Admin Commands");
  bot.registry.registerCommandsIn(path.join(__dirname, "commands"));
};
