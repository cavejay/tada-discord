const TadaCommand = require("../TadaCommand");

module.exports = class uploadedIntros extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "list-uploaded-intros",
      group: "tada-user",
      memberName: "list-uploaded-intros",
      aliases: ["lui"],
      description:
        "Provides the intro you currently have configured in that server",
      examples: ["!tada list-uploaded-intros <Name-Of-Intro>"],
      guildOnly: false,
    });
  }

  async run(message) {
    // get all the intros the user uploaded
    const uploads = await this.di.getIntrosUploadedByUser(message.author.id);

    // Assemble the list
    let fields = [];
    for (let i = 0; i < uploads.length % 10; i++) {
      fields.push({
        name: i == 0 ? "Intros" : ".",
        value: uploads
          .slice(10 * i, 10 * i + 10)
          .map((s) => `▫ ${s.name}`)
          .join("\n"),
        inline: true,
      });
    }
    fields = fields.filter((s) => s.value != "");

    // Assemble the message
    const embed = {
      title: `You've uploaded ${uploads.length} intros to my DB`,
      color: 16098851,
      footer: {
        text: "-----",
      },
      fields,
    };

    // Send :)
    await message.channel.send("", { embed });
  }
};
