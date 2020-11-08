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
    this.log.info(`Handling 'get intro' command for '${msg.content}'`);
    let intro = await this.di.getUserIntro(msg.guild.id, msg.author.id);

    if (intro == "disabled") {
      this.log.trace(`Handling 'get 'intro' command - intro is disabled`);
      return await msg.reply(`Your intro is currently disabled`);
    } else {
      this.log.trace(
        `Handling 'get intro' command - resolving filename of intro`
      );
      const introName = await this.di.getIntroProp(intro, "filename");
      return await msg.reply(`Your intro is currently set as '${introName}'`);
    }
  }
};
