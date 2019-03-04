const TadaCommand = require("../TadaCommand");

module.exports = class RemoveIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "remove-intro",
      group: "tada-admin",
      alias: ["rm-intro"],
      memberName: "remove-intro",
      description: "Remove an intro from the tada database",
      args: [
        {
          key: "introChoice",
          label: "Name-Of-Intro",
          prompt:
            "Which intro would you like to remove? A list of available introductions is provided when running show-intros",
          type: "string"
        },
        {
          key: "forceRemoval",
          label: "forceRemoval",
          default: false,
          prompt:
            "This action will prevent people that are currently using this intro from continuing this way. If you'd like to force them onto the default intro then set this to true",
          type: "string"
        },
        {
          key: "forcedReplacement",
          label: "Replacement Intro",
          default: "tada",
          prompt: "Provide a valid introduction to assign to those that will be affected by removing this intro",
          type: "string"
        }
      ],
      examples: ["remove-intro <intro name>", "rm-intro <intro name> true"],
      guildOnly: false
    });
  }

  async run(msg, args) {
    let message = msg;
    let { introChoice } = args;

    return;
    // Determine if this is a key or a video
    this.log.info(`User ${message.author.username} is claiming they want to remove the '${introChoice}' intro.`);

    // Does the key match those known?
    let allSounds = await this.db.getAllSounds();
    if (allSounds.includes(introChoice)) {
      this.log.info(`${introChoice} is a known file-type intro so we'll use that`);

      // If it matches then update the database?
      this.log.info(`Updating user '${message.author.username}''s registered intro to: ${introChoice}`);
      try {
        await this.db.setUserIntro(message.author.id, {
          type: "file",
          key: introChoice
        });
      } catch (err) {
        message.reply(
          "Something went wrong and I was unable to update your introduction. I've logged the error though and have contacted @cavejay#2808"
        );
        p.error(err);
        return;
      }
    } else {
      this.log.info(`'${introChoice}' is not a valid intro. Informing user now.`);
      message.reply(
        `The intro '${introChoice}' is not available. Please pick from the list provided by the \`!tada get intro all\` command.`
      );
      return;
    }

    this.log.info(`Intro update for ${message.author.username} was successful`);
    message.reply(`Update successful! Your intro is now '${introChoice}'`);
    // todo also provide a soft reset of the timer here so that they can hear it immediately. Do not let them spam through this though, so max of 5?
  }
};
