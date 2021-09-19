const TadaCommand = require("../TadaCommand");

module.exports = class getUserIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "set-intro-volume",
      group: "tada-guild-admin",
      alias: ["siv"],
      memberName: "set-intro-volume",
      description:
        "Set a volume that an introduction plays back at between 0 and 1.0",
      userPermissions: ["MANAGE_GUILD"],
      args: [
        {
          key: "intro",
          label: "introID",
          prompt: "What's the name of the introduction?",
          type: "string",
        },
        {
          key: "volume",
          label: "volumeID",
          prompt:
            "How would you like to change the volume of the introduction?",
          type: "string",
        },
      ],
      examples: ["!tada set-intro-volume <intro_name> <volume_value>"],
      guildOnly: true,
    });
  }

  async run(message, args) {
    this.log.info({
      msg: `Handling 'set intro volume' command for '${message.content}' from '${message.author.id}'`,
      action: "command",
      text: message.content,
      user: message.author.id,
      guild: message.guild.id,
    });

    const { isIntroValid, introhash } = await this.validateIntroNameForGuild(
      message.guild.id,
      args.intro
    );

    // need to actually vet the volume number here considering it's a string above.

    if (isIntroValid) {
      this.log.trace(
        `Handling 'set intro volume' command - intro is being set`
      );

      const retVal = await this.di.setGuildIntroConfig(
        message.guild.id,
        introhash,
        { volume: parseFloat(args.volume) }
      );

      return await message.reply(
        `The intro '${args.intro}'s relative volume has been set to '${args.volume}'`
      );
    } else {
      return await message.reply(
        `${args.intro} couldn't be found in ${message.guild.name}`
      );
    }
  }
};
