const TadaCommand = require("../TadaCommand");

module.exports = class setUserIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "set-user-intro",
      group: "tada-guild-admin",
      alias: ["set-user-intro"],
      memberName: "set-user-tada",
      userPermissions: ["ADMINISTRATOR"],
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
        {
          key: "adminLock",
          label: "adminLocked",
          prompt: "true/false, will this require an admin to undo?",
          type: "boolean",
          default: false,
        },
      ],
      examples: ["set-user-intro <user-of-interest> <intro>"],
      guildOnly: true,
    });
  }

  async run(message, args) {
    // Determine if this is a key or a video
    this.log.info(
      `Admin ${message.author.name} wants to set the intro for '${args.userID}' to '${args.introChoice}'.`
    );

    // Check to make sure the user exists
    const userExists = await this.di.doesUserExist(args.userID);
    if (!userExists) {
      this.log.info(`User didn't exist so we will create one`);
      await this.di.createUser(message.author.id);
    }

    // Does the key match those known or for this guild?
    const allSounds = await this.di.getIntrosOfGuild(message.guild.id);
    if (allSounds.includes(args.introChoice)) {
      // If it matches then update the database?
      this.log.info(
        `Updating user '${message.author.username}''s registered intro to: ${args.introChoice}`
      );
      try {
        const introhash = await this.di.getIntroFromName(args.introChoice);

        await this.di.setUserIntro(
          message.guild.id,
          message.author.id,
          introhash
        );
      } catch (err) {
        message.reply(
          "Something went wrong and I was unable to update your introduction. I've logged the error though and have contacted @cavejay#2808"
        );
        this.log.error(err);
        return;
      }
    } else {
      this.log.info(
        `'${args.introChoice}' is not a valid intro. Informing user now.`
      );
      message.reply(
        `The intro '${args.introChoice}' is not available. Please pick from the list provided by the \`list-intros\` command. DM me 'help' if you're stuck`
      );
      return;
    }

    this.log.info(`Intro update for ${message.author.username} was successful`);
    await message.react("✅");
    // todo also provide a soft reset of the timer here so that they can hear it immediately. Do not let them spam through this though, so max of 5?
  }
};
