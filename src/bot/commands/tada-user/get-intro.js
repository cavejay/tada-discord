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

  async run(message) {
    this.log.info({
      msg: `Handling 'get intro' command for '${message.content}' from '${message.author.id}'`,
      action: "command",
      text: message.content,
      user: message.author.id,
      guild: message.guild.id,
    });

    await this.ensureUser(message.guild.id, message.author.id);
    const { name, id } = await this.getUserIntroName(
      message.guild.id,
      message.author.id
    );

    if (id == "disabled") {
      this.log.trace(`Handling 'get intro' command - intro is disabled`);
      return await message.reply(`Your intro is currently disabled`);
    } else {
      return await message.reply(`Your intro is currently set as '${name}'`);
    }
  }
};
