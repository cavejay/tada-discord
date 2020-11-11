const TadaCommand = require("../TadaCommand");

module.exports = class disableDefaultIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "disable-default-intro",
      group: "tada-guild-admin",
      alias: ["ddi"],
      memberName: "disable-guild-default",
      userPermissions: ["MANAGE_GUILD"],
      description:
        "Disables default introductions for users. Users will only have intros after configuration themselves.",
      examples: ["!tada disable-default-intro "],
      guildOnly: true,
    });
  }

  async run(message, args) {
    this.log.info({
      msg: `Handling 'disable default intro' command for '${message.content}' from '${message.author.id}'`,
      action: "command",
      text: message.content,
      user: message.author.id,
      guild: message.guild.id,
    });

    await this.di.setGuildProp(message.guild.id, "defaultIntro", "disabled");
    await message.react("✅");
  }
};
