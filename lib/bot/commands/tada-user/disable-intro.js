const TadaCommand = require("../TadaCommand");

module.exports = class Disable extends TadaCommand {
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

  async run(msg) {
    this.log.info(`Handling 'disable' command for '${msg.content}'`);

    await this.di.ensureUserGuildConnection(msg.author.id, msg.guild.id);

    await this.di.setUserIntro(msg.guild.id, msg.author.id, "disabled");
    await msg.react("✅");
  }
};
