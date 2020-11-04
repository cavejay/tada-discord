const TadaCommand = require("../TadaCommand");

module.exports = class listIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "list-intros",
      group: "tada-user",
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

    this.log.debug(availableSoundsandHashes);

    // Split the introductions into groups of 10 for columning
    const _t = `${
      availableSoundsandHashes.length
    } introductions available:\n    - ${availableSoundsandHashes
      .map((s) => s.filename)
      .join("\n    - ")}`;

    // Assemble the list
    let fields = [];
    for (let i = 0; i < availableSoundsandHashes.length % 10; i++) {
      fields.push({
        name: i == 0 ? "Intros" : ".",
        value: availableSoundsandHashes
          .slice(10 * i, 10 * i + 10)
          .map((s) => `▫ ${s.filename}`)
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
