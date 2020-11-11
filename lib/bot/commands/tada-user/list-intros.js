const TadaCommand = require("../TadaCommand");

module.exports = class listIntro extends TadaCommand {
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

  async run(msg) {
    this.log.info({
      msg: `Handling 'list intros' command for '${msg.content}' from '${msg.author.id}'`,
      action: "command",
      text: msg.content,
      user: msg.author.id,
      guild: msg.guild.id,
    });

    await this.ensureUser(msg.guild.id, msg.author.id);

    let availableSoundsandHashes = await this.di.getIntrosOfGuild(
      msg.guild.id,
      true
    );
    if (availableSoundsandHashes.length < 1)
      return await msg.reply("No intros for this Discord Guild");

    this.log.debug(availableSoundsandHashes);

    // Split the introductions into groups of 10 for columning
    const _t = `${
      availableSoundsandHashes.length
    } introductions available:\n    - ${availableSoundsandHashes
      .map((s) => s.name)
      .join("\n    - ")}`;

    // Assemble the list
    let fields = [];
    for (let i = 0; i < availableSoundsandHashes.length % 10; i++) {
      fields.push({
        name: i == 0 ? "Intros" : ".",
        value: availableSoundsandHashes
          .slice(10 * i, 10 * i + 10)
          .map((s) => `▫ ${s.name}`)
          .join("\n"),
        inline: true,
      });
    }
    fields = fields.filter((s) => s.value != "");

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
    await msg.channel.send("", { embed });
  }
};
