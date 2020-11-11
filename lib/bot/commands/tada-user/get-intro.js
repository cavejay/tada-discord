const TadaCommand = require("../TadaCommand");

module.exports = class getIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "get-intro",
      group: "tada-user",
      memberName: "get-intro",
      aliases: ["gi", "get"],
      description:
        "Provides the intro you currently have configured in that server",
      examples: ["!tada get-intro"],
      guildOnly: true,
    });
  }

  async run(msg) {
    this.log.info({
      msg: `Handling 'get intro' command for '${msg.content}' from '${msg.author.id}'`,
      action: "command",
      text: msg.content,
      user: msg.author.id,
      guild: msg.guild.id,
    });

    await this.ensureUser(msg.guild.id, msg.author.id);
    const { name, id } = await this.getUserIntroName(
      msg.guild.id,
      msg.author.id
    );

    if (id == "disabled") {
      this.log.trace(`Handling 'get intro' command - intro is disabled`);
      return await msg.reply(`Your intro is currently disabled`);
    } else {
      return await msg.reply(`Your intro is currently set as '${name}'`);
    }
  }
};
