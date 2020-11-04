const TadaCommand = require("../TadaCommand");

module.exports = class SetIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "set-intro",
      group: "tada-user",
      memberName: "set-tada",
      aliases: ["vi-intro"],
      description: "Set the intro played by tada by using this command",
      args: [
        {
          key: "introChoice",
          label: "Name-Of-Intro",
          prompt:
            "Which intro would you like to use? A list of available introductions is provided when running show-intros",
          type: "string",
        },
      ],
      examples: ["set-intro <intro name>"],
      guildOnly: true,
    });
  }

  async run(msg, args) {
    let message = msg;
    let { introChoice } = args;

    this.log.info(
      `User ${message.author.username} is claiming they want to use the '${introChoice}' intro.`
    );

    // Check to make sure the user exists
    const userExists = await this.di.doesUserExist(message.author.id);
    if (!userExists) {
      this.log.info(`User didn't exist so we will create one`);
      await this.di.createUser(message.author.id);
    }

    // Does the key match those known or for this guild?
    const allSounds = await this.di.getIntrosOfGuild(message.guild.id);
    if (allSounds.includes(introChoice)) {
      // If it matches then update the database?
      this.log.info(
        `Updating user '${message.author.username}''s registered intro to: ${introChoice}`
      );
      try {
        const introhash = await this.di.getIntroFromName(introChoice);

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
        `'${introChoice}' is not a valid intro. Informing user now.`
      );
      message.reply(
        `The intro '${introChoice}' is not available. Please pick from the list provided by the \`list-intros\` command. DM me 'help' if you're stuck`
      );
      return;
    }

    this.log.info(`Intro update for ${message.author.username} was successful`);
    await message.react("✅");
    // todo also provide a soft reset of the timer here so that they can hear it immediately. Do not let them spam through this though, so max of 5?
  }
};
