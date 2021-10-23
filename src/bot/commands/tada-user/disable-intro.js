const TadaCommand = require("../TadaCommand");

module.exports = class Disable extends (
  TadaCommand
) {
  constructor(client) {
    super(client, {
      name: "disable-intro",
      group: "tada-user",
      memberName: "disable-intro",
      aliases: ["di"],
      description: "Prevents this bot from playing intros for the running user",
      examples: ["!tada disable-intro"],
      guildOnly: true,
    });
  }

  async run(message) {
    this.log.info({
      msg: `Handling 'disable intro' command for '${message.content}' from '${message.author.id}'`,
      action: "command",
      text: message.content,
      user: message.author.id,
      guild: message.guild.id,
    });

    await this.di.ensureUserGuildConnection(
      message.author.id,
      message.guild.id
    );

    await this.di.setUserIntro(message.guild.id, message.author.id, "disabled");
    await message.react("✅");
  }
};
