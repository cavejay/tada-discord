const p = require("./loggerFactory")("addCommands");
const path = require("path");

const DisableCommand = require("./commands/disable.js");

module.exports = function AddCommands(bot) {
  bot
    .on("commandError", (cmd, err) => {
      if (err instanceof commando.FriendlyError) return;
      p.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
    })
    .on("commandBlocked", (msg, reason) => {
      p.info(`Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ""}
        blocked; ${reason}`);
    })
    .on("commandPrefixChange", (guild, prefix) => {
      p.info(`Prefix ${prefix === "" ? "removed" : `changed to ${prefix || "the default"}`}
        ${guild ? `in guild ${guild.name} (${guild.id})` : "globally"}.`);
    })
    .on("commandStatusChange", (guild, command, enabled) => {
      p.info(`Command ${command.groupID}:${command.memberName}
        ${enabled ? "enabled" : "disabled"}
        ${guild ? `in guild ${guild.name} (${guild.id})` : "globally"}.`);
    })
    .on("groupStatusChange", (guild, group, enabled) => {
      p.info(`Group ${group.id}
        ${enabled ? "enabled" : "disabled"}
        ${guild ? `in guild ${guild.name} (${guild.id})` : "globally"}.`);
    });

  // bot
  //   .setProvider(sqlite.open(path.join(__dirname, "database.sqlite3")).then(db => new commando.SQLiteProvider(db)))
  //   .catch(console.error);

  bot.registry
    .registerGroup("tada")
    .registerDefaults()
    // Registers all of your commands in the ./commands/ directory
    // .registerCommandsIn(path.join(__dirname, "commands"));
    .registerCommand(DisableCommand);
};
