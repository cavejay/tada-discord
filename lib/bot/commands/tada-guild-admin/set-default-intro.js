const TadaCommand = require("../TadaCommand");

module.exports = class setDefaultIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "set-default-intro",
      group: "tada-guild-admin",
      alias: ["sdi"],
      memberName: "set-guild-default",
      userPermissions: ["MANAGE_GUILD"],
      description: "Sets the default intro for that server",
      args: [
        {
          key: "introChoice",
          label: "intro",
          prompt:
            "Which intro do you want to set as the default for users in this server?",
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
