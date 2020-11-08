const TadaCommand = require("../TadaCommand");

module.exports = class setUserIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "get-default-intro",
      group: "tada-guild-admin",
      alias: ["gdi"],
      memberName: "get-guild-default",
      userPermissions: ["ADMINISTRATOR"],
      description:
        "Shows the currently configured default introduction for that server",
      args: [],
      examples: ["!tada get-default-intro"],
      guildOnly: true,
    });
  }

  async run(message, args) {
    const defaultIntrohash = await this.di.getGuildProp(
      message.guild.id,
      "defaultIntro"
    );
    const defaultIntroName = await this.di.getIntroProp(
      defaultIntrohash,
      "filename"
    );
    await message.react("✅");
    await message.reply(defaultIntroName);
    // todo also provide a soft reset of the timer here so that they can hear it immediately. Do not let them spam through this though, so max of 5?
  }
};
