const TadaCommand = require("../TadaCommand");

module.exports = class listIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "list-intros",
      group: "tada-bot",
      memberName: "list-intros",
      aliases: ["cat-intros"],
      description: "Returns all currently available intros",
      examples: ["list-intros"],
      guildOnly: false
    });
  }

  async run(msg) {
    this.log.info(`Handling 'get intro all' command for '${msg.content}'`);
    let allSounds = await this.client.soundManager.getSoundNames();
    return await msg.reply(`${allSounds.length} introductions available:\n    - ${allSounds.sort().join("\n    - ")}`);
  }
};
