const { Command } = require("discord.js-commando");

const p = require("../../loggerFactory")("setIntro-Command");
const db = require("../../db");

module.exports = class SetIntroTadaCommand extends Command {
  constructor(client) {
    super(client, {
      name: "set-intro",
      group: "tada-bot",
      memberName: "set-tada",
      description: "Set the intro played by tada by using this command",
      args: [
        {
          key: "introChoice",
          label: "Name-Of-Intro",
          prompt: "Which intro would you like to use?",
          type: "string"
        }
      ],
      examples: ["set intro tada"],
      guildOnly: false
    });
  }

  async run(msg, args) {
    let message = msg;
    let { introChoice } = args;

    // Determine if this is a key or a video
    p.info(`User ${message.author.username} is claiming they want to use the '${introChoice}' intro.`);

    // Does the key match those known?
    let allSounds = await db.getAllSounds();
    if (allSounds.includes(introChoice)) {
      p.info(`${introChoice} is a known file-type intro so we'll use that`);

      // If it matches then update the database?
      p.info(`Updating user '${message.author.username}''s registered intro to: ${introChoice}`);
      try {
        await db.setUserIntro(message.author.id, {
          type: "file",
          key: introChoice
        });
      } catch (err) {
        message.reply(
          "Something went wrong and I was unable to update your introduction. I've logged the error though and have contacted @cavejay#2808"
        );
        p.error(err);
        return;
      }
    } else {
      p.info(`'${introChoice}' is not a valid intro. Informing user now.`);
      message.reply(
        `The intro '${introChoice}' is not available. Please pick from the list provided by the \`!tada get intro all\` command.`
      );
      return;
    }

    p.info(`Intro update for ${message.author.username} was successful`);
    message.reply(`Update successful! Your intro is now '${introChoice}'`);
    // todo also provide a soft reset of the timer here so that they can hear it immediately. Do not let them spam through this though, so max of 5?
  }
};
