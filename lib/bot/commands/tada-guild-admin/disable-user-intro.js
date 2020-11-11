const TadaCommand = require("../TadaCommand");

module.exports = class disableUserIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "disable-user-intro",
      group: "tada-guild-admin",
      alias: ["dui"],
      memberName: "disable-user-intro",
      userPermissions: ["MANAGE_GUILD"],
      description: "Disables a user's introduction for a given server",
      args: [
        {
          key: "userID",
          label: "user-of-interest",
          prompt: "Which user did you want to see the intro of?",
          type: "string",
        },
        // {
        //   key: "adminLock",
        //   label: "adminLocked",
        //   prompt: "true/false, will this require an admin to undo?",
        //   type: "boolean",
        //   default: false,
        // },
      ],
      examples: ["!tada disable-user-intro <user-of-interest>"],
      guildOnly: true,
    });
  }

  async run(msg, args) {
    // Determine if this is a key or a video
    this.log.info({
      msg: `Handling 'disable user intro' command for '${msg.content}' from '${msg.author.id}'`,
      action: "command",
      text: msg.content,
      user: msg.author.id,
      guild: msg.guild.id,
    });

    await this.ensureUser(msg.guild.id, args.userID);
    await this.di.setUserIntro(msg.guild.id, args.userID, "disabled");

    msg.reply(`Update successful! ${user}'s intro is now disabled'`);
  }
};
