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
      guildOnly: false
    });
  }

  async run(msg) {
    this.log.info(`Handling 'get intro' command for '${msg.content}'`);
    let intro = await this.client.userManager.getUserIntro({ uid: msg.author.id, gid: msg.guild.id, readable: true });
    if (JSON.stringify(intro) === '"null"') {
      return await msg.reply(`Your intro is currently disabled`);
    } else {
      return await msg.reply(`Your intro is currently set as ${JSON.stringify(intro)}`);
    }
  }
};
