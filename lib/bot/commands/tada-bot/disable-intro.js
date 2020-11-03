const TadaCommand = require("../TadaCommand");

module.exports = class Disable extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "disable-intro",
      group: "tada-bot",
      memberName: "disable intro",
      description: "Prevents this bot from playing intros for the running user",
      examples: ["disable"],
      guildOnly: false,
    });
  }

  async run(msg) {
    this.log.info(`Handling 'disable' command for '${msg.content}'`);

    // Check to make sure the user exists
    const userExists = await this.di.doesUserExist(msg.author.id);
    if (!userExists) {
      this.log.info(`User didn't exist so we will create one`);
      await this.di.createUser(msg.author.id);
    }

    await this.di.setUserIntro(msg.guild.id, msg.author.id, "disabled");
    await msg.reply(
      `Your user settings have been updated to prevent me from playing an intro for you`
    );
  }
};
