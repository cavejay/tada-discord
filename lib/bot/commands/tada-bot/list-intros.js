const TadaCommand = require("../TadaCommand");

module.exports = class listIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "list-intros",
      group: "tada-bot",
      memberName: "list-intros",
      aliases: ["cat-intros", "list-intro", "ls"],
      description: "Returns all currently available intros",
      examples: ["list-intros"],
      guildOnly: true,
    });
  }

  async run(msg) {
    this.log.info(`Handling 'get intro all' command for '${msg.content}'`);
    let availableSoundsandHashes = await this.di.getIntrosOfGuild(
      msg.guild.id,
      true
    );
    if (availableSoundsandHashes.length < 1)
      return await msg.reply("No intros for this Discord Guild");

    this.log.info(availableSoundsandHashes);

    return await msg.reply(
      `${
        availableSoundsandHashes.length
      } introductions available:\n    - ${availableSoundsandHashes
        .map((s) => s.filename)
        .join("\n    - ")}`
    );
  }
};
