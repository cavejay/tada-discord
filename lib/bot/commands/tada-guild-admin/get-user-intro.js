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
          key: "userid",
          label: "userID",
          prompt: "Which user did you want to see the intro of?",
          type: "string",
        },
      ],
      examples: ["!tada get-user-intro <userid>"],
      guildOnly: true,
    });
  }

  async run(msg, args) {
    this.log.info({
      msg: `Handling 'get user intro' command for '${msg.content}' from '${msg.author.id}'`,
      action: "command",
      text: msg.content,
      user: msg.author.id,
      guild: msg.guild.id,
    });

    await this.ensureUser(msg.guild.id, args.userid);
    const user = await this.client.users.fetch(args.userid);

    const { name, id } = await this.getUserIntroName(msg.guild.id, args.userid);

    if (id == "disabled") {
      this.log.trace(`Handling 'get user intro' command - intro is disabled`);
      return await msg.reply(`${user}'s intro is currently disabled`);
    } else {
      return await msg.reply(`${user}'s intro is currently set as ${name}`);
    }
  }
};
