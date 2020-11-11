const TadaCommand = require("../TadaCommand");

module.exports = class setUserIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "set-user-intro",
      group: "tada-guild-admin",
      alias: ["sui"],
      memberName: "set-user-intro",
      userPermissions: ["MANAGE_GUILD"],
      description: "Returns the intro currently configured for your user",
      args: [
        {
          key: "userID",
          label: "user-of-interest",
          prompt: "Which user did you want to see the intro of?",
          type: "string",
        },
        {
          key: "introChoice",
          label: "intro",
          prompt: "Which intro did you want to set for this user?",
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
      examples: ["!tada set-user-intro <user-of-interest> <intro>"],
      guildOnly: true,
    });
  }

  async run(message, args) {
    // Determine if this is a key or a video
    this.log.info({
      msg: `Handling 'set user intro' command for '${message.content}' from '${message.author.id}'`,
      action: "command",
      text: message.content,
      user: message.author.id,
      guild: message.guild.id,
    });

    await this.ensureUser(message.guild.id, args.userID);

    // Does the key match those known or for this guild?
    const { isIntroValid, introhash } = await this.validateIntroNameForGuild(
      message.guild.id,
      args.introChoice
    );
    if (isIntroValid) {
      await this.di.setUserIntro(message.guild.id, args.userID, introhash);
      await message.react("✅");
      return;
    } else {
      await message.react("❌");
      return await message.reply(
        `The intro '${args.introChoice}' is not available. Please pick from the list provided by the \`list-intros\` command. DM me 'help' if you're stuck`
      );
    }
  }
};
