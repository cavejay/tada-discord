const TadaCommand = require("../TadaCommand");

module.exports = class disableUserIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "disable-user-intro",
      group: "tada-guild-admin",
      alias: ["disable-user-intro"],
      memberName: "disable-user-tada",
      userPermissions: ["ADMINISTRATOR"],
      description: "Prevents a user from playing an intro",
      args: [
        {
          key: "userID",
          label: "user-of-interest",
          prompt: "Which user did you want to see the intro of?",
          type: "string",
        },
        {
          key: "adminLock",
          label: "adminLocked",
          prompt: "true/false, will this require an admin to undo?",
          type: "boolean",
          default: false,
        },
      ],
      examples: ["disable-user-intro <user-of-interest> <admin-lock>"],
      guildOnly: true,
    });
  }

  async run(msg, args) {
    // Determine if this is a key or a video
    this.log.info(
      `Admin ${msg.author.name} wants to set the intro for '${args.userID}' to '${args.intro}'.`
    );

    await this.di.setUserIntro(msg.guild.id, args.userID, "disabled");

    msg.reply(`Update successful! ${user}'s intro is now disabled'`);
  }
};
