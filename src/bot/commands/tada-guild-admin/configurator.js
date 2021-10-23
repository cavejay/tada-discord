const TadaCommand = require("../TadaCommand");

module.exports = class setDefaultIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "guild-config",
      group: "tada-guild-admin",
      alias: ["gc"],
      memberName: "guild-configurator",
      userPermissions: ["MANAGE_GUILD"],
      description: "Use this to set and retrieve the settings of this guild",
      args: [
        {
          key: "action",
          label: "set/get",
          prompt: "Are you reading or writing this server's config?",
          type: "string",
        },
        {
          key: "setting",
          label: "Setting key",
          prompt: "What's the name of the setting that you're interacting with",
          type: "string",
        },
        {
          key: "value",
          label: "Setting Value",
          prompt: "What value should the config be set to?",
          type: "string",
        },
      ],
      examples: ["!tada set-default-intro <intro>"],
      guildOnly: true,
    });
  }

  async run(message, args) {
    this.log.info({
      msg: `Handling 'set default intro' command for '${message.content}' from '${message.author.id}'`,
      action: "command",
      text: message.content,
      user: message.author.id,
      guild: message.guild.id,
    });

    // Does the key match those known or for this guild?
    const { isIntroValid, introhash } = await this.validateIntroNameForGuild(
      message.guild.id,
      args.introChoice
    );
    if (isIntroValid) {
      await this.di.setGuildProp(message.guild.id, "defaultIntro", introhash);
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
