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

  async run(message) {
    this.log.info({
      msg: `Handling 'reset intro' command for '${message.content}' from '${message.author.id}'`,
      action: "command",
      text: message.content,
      user: message.author.id,
      guild: message.guild.id,
    });

    // Check to make sure the user exists
    const userExists = await this.di.doesUserExist(message.author.id);
    if (!userExists) {
      this.log.info(`No user record to reset guild intro information of`);
      await message.react("✅");
    } else {
      await this.di.removeUserIntro(message.guild.id, message.author.id);
      await message.react("✅");
    }
  }
};
