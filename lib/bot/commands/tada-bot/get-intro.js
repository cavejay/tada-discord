const TadaCommand = require("../TadaCommand");

module.exports = class getIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "get-intro",
      group: "tada-bot",
      memberName: "get-tada",
      aliases: ["cat-intro"],
      description: "Returns the intro currently configured for your user",
      examples: ["get-intro"],
      guildOnly: false,
    });
  }

  async run(msg) {
    this.log.info(`Handling 'get intro' command for '${msg.content}'`);
    let intro = await this.di.getUserIntro(msg.guild.id, msg.author.id);

    // resolve the intro - if the user doesn't have a specific one then they use the guild's default
    intro = !intro
      ? await this.di.getGuildProp(msg.guild.id, "defaultIntro")
      : intro;

    if (intro === "disabled") {
      return await msg.reply(`Your intro is currently disabled`);
    } else {
      const introName = await this.di.getIntroProp(intro, "filename");
      return await msg.reply(`Your intro is currently set as ${introName}`);
    }
  }
};
