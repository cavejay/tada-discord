const TadaCommand = require("../TadaCommand");

module.exports = class getUserIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "get-user-intro",
      group: "tada-guild-admin",
      alias: ["cat-user-intro"],
      memberName: "get-user-tada",
      description: "Returns the intro currently configured for your user",
      userPermissions: ["ADMINISTRATOR"],
      args: [
        {
          key: "userid",
          label: "userID",
          prompt: "Which user did you want to see the intro of?",
          type: "string",
        },
      ],
      examples: ["get-user-intro <userid>", "cat-intro <userid>"],
      guildOnly: true,
    });
  }

  async run(msg, args) {
    this.log.info(
      `Handling 'get intro' command run by ${msg.author.name} to inspect ${args.userid}`
    );
    const user = await this.client.users.fetch(args.userid);
    const intro = await this.di.getUserIntro(msg.guild.id, args.userid);
    return await msg.reply(
      `${user}'s intro is currently set as ${JSON.stringify(intro.filename)}`
    );
  }
};
