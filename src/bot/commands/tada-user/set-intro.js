const TadaCommand = require("../TadaCommand");

module.exports = class SetIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "set-intro",
      group: "tada-user",
      memberName: "set-intro",
      aliases: ["si", "set"],
      description: "Set the intro played by tada by using this command",
      args: [
        {
          key: "introChoice",
          label: "Name-Of-Intro",
          prompt:
            "Which intro would you like to use? A list of available introductions can be provided with the `list-intros` command",
          type: "string",
        },
      ],
      examples: ["!tada set-intro <intro name>"],
      guildOnly: true,
    });
  }

  async run(message, args) {
    this.log.info({
      msg: `Handling 'set intro' command for '${message.content}' from '${message.author.id}'`,
      action: "command",
      text: message.content,
      user: message.author.id,
      guild: message.guild.id,
    });

    let { introChoice } = args;

    await this.ensureUser(message.author.id, message.guild.id);

    // Does the key match those known or for this guild?
    const { isIntroValid, introhash } = await this.validateIntroNameForGuild(
      message.guild.id,
      args.introChoice
    );
    if (isIntroValid) {
      await this.di.setUserIntro(
        message.guild.id,
        message.author.id,
        introhash
      );
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
