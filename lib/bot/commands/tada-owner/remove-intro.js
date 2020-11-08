const TadaCommand = require("../TadaCommand");

module.exports = class RemoveIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "remove-intro",
      group: "tada-owner",
      memberName: "remove-intro",
      userPermissions: ["ADMINISTRATOR"],
      description: "Remove an intro from the tada database",
      args: [
        {
          key: "introChoice",
          label: "Name-Of-Intro",
          prompt:
            "Which intro would you like to remove? A list of available introductions is provided when running show-intros",
          type: "string",
        },
        {
          key: "forceRemoval",
          label: "forceRemoval",
          default: false,
          prompt:
            "This action will prevent people that are currently using this intro from continuing this way. If you'd like to force them onto the default intro then set this to true",
          type: "boolean",
        },
        {
          key: "forcedReplacement",
          label: "Replacement Intro",
          default: "tada",
          prompt:
            "Provide a valid introduction to assign to those that will be affected by removing this intro",
          type: "string",
        },
      ],
      examples: ["remove-intro <intro name>"],
      guildOnly: false,
      ownerOnly: true,
    });
  }

  async run(msg, args) {
    let { introChoice } = args;

    this.log.info(
      `User ${msg.author.username} is attempting to remove the '${introChoice}' intro.`
    );

    // Does the key match those known?
    let allSounds = await this.db.getAllSounds();

    if (allSounds.includes(introChoice)) {
      // Is there anyone using it?

      // Is the forceRemoval key true?

      // todo complete the replacement functionality

      this.log.info(`${introChoice} is a valid intro available for deletion`);

      // Double check with the user
      let confirmMsg = await msg.reply(
        "This will permanently remove the intro from system. If you're certain you want to do this click the :white_check_mark: emoji below"
      );
      await confirmMsg.react("✅");

      const reactionFilter = (reaction, user) => {
        return reaction.emoji.name === "✅";
      };

      // Collect Emojis
      let collected;
      try {
        collected = await confirmMsg.awaitReactions(reactionFilter, {
          time: 5000,
        });
      } catch (e) {
        this.log.error(e);
      }

      // If they didn't confirm then let them know and return out
      if (collected.first().count !== 2) {
        return await confirmMsg.reply(
          `Confirmation Emoji was not recieved. ${introChoice} will not be removed.`
        );
      } else {
        await confirmMsg.reply(`Confirmation recieved, removal continuing`);
      }

      // If it matches then update the database?
      this.log.info(
        `Updating user '${msg.author.username}''s registered intro to: ${introChoice}`
      );
      try {
        await this.client.soundManager.removeSound(introChoice);
      } catch (err) {
        p.error(err);
        return await msg.reply(
          "Something went wrong and I was unable to remove the . I've logged the error though and have contacted @cavejay#2808"
        );
      }
    } else {
      this.log.info(
        `'${introChoice}' is not a valid intro. Returning command here.`
      );
      return await msg.reply(
        `The intro '${introChoice}' is not available. Please pick from the list provided by the \`list-intros\` command.`
      );
    }

    this.log.info(`removing of the intro '${introChoice}' was successful`);
    return await msg.reply(
      `Update successful! The '${introChoice}' is no longer available`
    );
    // todo also provide a soft reset of the timer here so that they can hear it immediately. Do not let them spam through this though, so max of 5?
  }
};
