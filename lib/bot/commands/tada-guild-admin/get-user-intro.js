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
    this.log.info(
      `Handling 'get intro' command run by ${msg.author.name} to inspect ${args.userid}`
    );

    // Check to make sure the user exists
    const userExists = await this.di.doesUserExist(args.userid);
    if (!userExists) {
      this.log.info(`User didn't exist so we will create one`);
      await this.di.createUser(args.userid, msg.guild.id);
    }

    const user = await this.client.users.fetch(args.userid);
    const intro = await this.di.getUserIntro(msg.guild.id, args.userid);
    return await msg.reply(
      `${user}'s intro is currently set as ${JSON.stringify(intro.filename)}`
    );
  }
};
