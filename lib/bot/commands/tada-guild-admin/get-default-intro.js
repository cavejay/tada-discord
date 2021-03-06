const TadaCommand = require("../TadaCommand");

module.exports = class getDefaultIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "get-default-intro",
      group: "tada-guild-admin",
      alias: ["gdi"],
      memberName: "get-guild-default",
      userPermissions: ["MANAGE_GUILD"],
      description:
        "Shows the currently configured default introduction for that server",
      args: [],
      examples: ["!tada get-default-intro"],
      guildOnly: true,
    });
  }

  async run(message, args) {
    this.log.info({
      msg: `Handling 'get default intro' command for '${message.content}' from '${message.author.id}'`,
      action: "command",
      text: message.content,
      user: message.author.id,
      guild: message.guild.id,
    });

    const defaultIntrohash = await this.di.getGuildProp(
      message.guild.id,
      "defaultIntro"
    );
    const defaultIntroName = await this.di.getIntroProp(
      defaultIntrohash,
      "name"
    );

    await message.react("✅");
    return await message.reply(defaultIntroName);
    // todo also provide a soft reset of the timer here so that they can hear it immediately. Do not let them spam through this though, so max of 5?
  }
};
