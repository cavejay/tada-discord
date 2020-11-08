const TadaCommand = require("../TadaCommand");

module.exports = class Disable extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "reset-intro",
      group: "tada-user",
      memberName: "reset-intro",
      aliases: ["ri"],
      description:
        "Resets your intro to using whatever the server's default is",
      examples: ["!tada reset-intro"],
      guildOnly: true,
    });
  }

  async run(msg) {
    this.log.info(`Handling 'reset' command for '${msg.content}'`);

    // Check to make sure the user exists
    const userExists = await this.di.doesUserExist(msg.author.id);
    if (!userExists) {
      this.log.info(`No user record to reset guild intro information of`);
      await msg.react("✅");
    } else {
      await this.di.removeUserIntro(msg.guild.id, msg.author.id);
      await msg.react("✅");
    }
  }
};
