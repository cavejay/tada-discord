const TadaCommand = require("../TadaCommand");

module.exports = class getUserIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "get-user-intro",
      group: "tada-admin",
      alias: ["cat-user-intro"],
      memberName: "get-user-tada",
      description: "Returns the intro currently configured for your user",
      args: [
        {
          key: "userid",
          label: "userID",
          prompt: "Which user did you want to see the intro of?",
          type: "string"
        }
      ],
      examples: ["get-user-intro <userid>", "cat-intro <userid>"],
      guildOnly: false
    });
  }

  async run(msg, args) {
    this.log.info(`Handling 'get intro' command run by ${msg.author.name} to inspect ${args.userid}`);
    let user = await this.client.fetchUser(args.userid);
    let intro = await this.db.getUserIntro(args.userid);
    if (JSON.stringify(intro) === '"null"') {
      return await msg.reply(`${user}'s intro is currently disabled`);
    } else {
      return await msg.reply(`${user}'s intro is currently set as ${JSON.stringify(intro.key)}`);
    }
  }
};
