const TadaCommand = require("../TadaCommand");

module.exports = class SetIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "set-intro",
      group: "tada-bot",
      memberName: "set-tada",
      aliases: ["vi-intro"],
      description: "Set the intro played by tada by using this command",
      args: [
        {
          key: "introChoice",
          label: "Name-Of-Intro",
          prompt:
            "Which intro would you like to use? A list of available introductions is provided when running show-intros",
          type: "string"
        }
      ],
      examples: ["set-intro <intro name>"],
      guildOnly: false
    });
  }

  async run(msg, args) {
    let message = msg;
    let { introChoice } = args;

    // Determine if this is a key or a video
    this.log.info(`User ${message.author.username} is claiming they want to use the '${introChoice}' intro.`);

    // Does the key match those known or for this guild?
    let allSounds = await this.client.soundManager.getSoundNames();
    if (allSounds.includes(introChoice)) {
      this.log.info(`${introChoice} is a known file-type intro so we'll use that`);

      // If it matches then update the database?
      this.log.info(`Updating user '${message.author.username}''s registered intro to: ${introChoice}`);
      try {
        await this.client.userManager.setUserIntro({ userid: message.author.id, name: introChoice });
      } catch (err) {
        message.reply(
          "Something went wrong and I was unable to update your introduction. I've logged the error though and have contacted @cavejay#2808"
        );
        this.log.error(err);
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
