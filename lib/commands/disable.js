const commando = require("discord.js-commando");

module.exports = class DisableTadaCommand extends commando.Command {
  constructor(client) {
    super(client, {
      name: "disable-tada",
      group: "tada",
      memberName: "disable-tada",
      description: "Disable your own introduction",
      examples: ["disable"],
      guildOnly: false
    });
  }

  async run(msg, { name }) {
    p.info(`Handling 'disable' command for '${msg.content}'`);
    await db.setUserIntro(msg.author.id, "null");
    await msg.reply(`Your user settings have been updated to prevent me from playing an intro for you`);
  }
};
