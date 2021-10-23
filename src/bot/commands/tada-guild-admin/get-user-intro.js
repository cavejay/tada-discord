const TadaCommand = require("../TadaCommand");

module.exports = class getUserIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "get-user-intro",
      group: "tada-guild-admin",
      alias: ["gui"],
      memberName: "get-user-intro",
      description:
        "Provides the name of the intro configured by the target user",
      userPermissions: ["MANAGE_GUILD"],
      args: [
        {
          key: "user",
          label: "userID",
          prompt: "Which user did you want to see the intro of?",
          type: "user",
        },
      ],
      examples: ["!tada get-user-intro <userid>"],
      guildOnly: true,
    });
  }

  async run(message, args) {
    this.log.info({
      msg: `Handling 'get user intro' command for '${message.content}' from '${message.author.id}'`,
      action: "command",
      text: message.content,
      user: message.author.id,
      guild: message.guild.id,
    });

    await this.ensureUser(message.guild.id, args.user.id);

    const { name, id } = await this.getUserIntroName(
      message.guild.id,
      args.user.id
    );

    if (id == "disabled") {
      this.log.trace(`Handling 'get user intro' command - intro is disabled`);
      return await message.reply(`${args.user}'s intro is currently disabled`);
    } else {
      return await message.reply(
        `${args.user}'s intro is currently set as ${name}`
      );
    }
  }
};
