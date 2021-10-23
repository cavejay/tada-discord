const TadaCommand = require("../TadaCommand");

module.exports = class getUserIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "create-server-report",
      group: "tada-guild-admin",
      memberName: "create-server-report",
      description: "DMs you a report of a Discord Server's use of Tada!",
      userPermissions: ["MANAGE_GUILD"],
      args: [],
      examples: ["!tada create-server-report"],
      guildOnly: true,
    });
  }

  async run(message, args) {
    this.log.info({
      msg: `Handling 'create server report' command for '${message.content}' from '${message.author.id}'`,
      action: "command",
      text: message.content,
      user: message.author.id,
      guild: message.guild.id,
    });
  }
};
