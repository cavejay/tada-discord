const TadaCommand = require("../TadaCommand");

module.exports = class Disable extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "disable-intro",
      group: "tada-bot",
      memberName: "disable intro",
      description: "Prevents this bot from playing intros for the running user",
      examples: ["disable"],
      guildOnly: false
    });
  }

  async run(msg) {
    this.log.info(`Handling 'disable' command for '${msg.content}'`);
    await this.db.setUserIntro(msg.author.id, "null");
    await msg.reply(`Your user settings have been updated to prevent me from playing an intro for you`);
  }
};
