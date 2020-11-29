const TadaCommand = require("../TadaCommand");

module.exports = class listIntro extends (
  TadaCommand
) {
  constructor(client) {
    super(client, {
      name: "list-intros",
      group: "tada-user",
      memberName: "list-intros",
      aliases: ["li", "list-intro", "ls", "list"],
      description: "Provides a list of all intros available in that server",
      examples: ["!tada list-intros"],
      guildOnly: true,
    });
  }

  static assembleFields(availableSoundsandHashes) {
    // Assemble the list
    let fields = [];
    for (let i = 0; i < availableSoundsandHashes.length / 10; i++) {
      fields.push({
        name: i == 0 ? "Intros" : ".",
        value: availableSoundsandHashes
          .slice(10 * i, 10 * i + 10)
          .map((s) => `▫ ${s.name}`)
          .join("\n"),
        inline: true,
      });
    }

    return fields.filter((s) => s.value != "");
  }

  async run(message) {
    this.log.info({
      msg: `Handling 'list intros' command for '${message.content}' from '${message.author.id}'`,
      action: "command",
      text: message.content,
      user: message.author.id,
      guild: message.guild.id,
    });

    await this.ensureUser(message.guild.id, message.author.id);

    let availableSoundsandHashes = await this.di.getIntrosOfGuild(
      message.guild.id,
      true
    );
    if (availableSoundsandHashes.length < 1)
      return await message.reply("No intros for this Discord Guild");

    this.log.debug(availableSoundsandHashes);

    const fields = assembleFields(availableSoundsandHashes);

    // Assemble the message
    const embed = {
      title: `There are ${availableSoundsandHashes.length} intros available in this Discord Server`,
      color: 16098851,
      footer: {
        text:
          "One day you might even be able to listen to these on a website! 😱",
      },
      fields,
    };

    // Send :)
    await message.channel.send("", { embed });
  }
};
