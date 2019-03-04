const { Command } = require("discord.js-commando");

const p = require("../../loggerFactory")("disable-Command");
const db = require("../../db");

module.exports = class DisableTadaCommand extends Command {
  constructor(client) {
    super(client, {
      name: "disable-tada",
      group: "tada-bot",
      memberName: "disable-tada",
      description: "Prevents this bot from playing intros for the running user",
      examples: ["disable"],
      guildOnly: false
    });
  }

  async run(msg) {
    p.info(`Handling 'disable' command for '${msg.content}'`);
    await db.setUserIntro(msg.author.id, "null");
    await msg.reply(`Your user settings have been updated to prevent me from playing an intro for you`);
  }
};
