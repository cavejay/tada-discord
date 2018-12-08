const p = require("../loggerFactory")("Bot.DirectMessages");
const strings = require("../../strings.json");
const Commands = require("../commands/commands.js");

async function argHandler(args, { message }) {
  // If there was nothing past the '!tada' then message the user and move on.
  if (args.length === 1) {
    message.reply("Current command options for use with this bot are: \n" + Object.keys(Commands.meta).join(", "));
    p.info("User did not supply any commands. Will now inform them of current command options");
    return;
  }

  // Validate that the message contains a valid command
  if (!Object.keys(Commands.meta).includes(args[1])) {
    message.reply(`Sorry, I don't recognise the command '${args[1]}'`);
    p.info(`User entered unrecognised command '${args[1]}'`);
    return;
  }

  return Commands.cmd[args[1]];
}

// Deal with the arguments that we get from users. Mostly passes things to commands.js
module.exports.handleDirectMessage = async function(message) {
  // If it's me (the bot) I don't care. plz check
  if (message.author.id === client.user.id) return;

  // If this isn't a direct message
  if (message.channel.type !== "dm") return;
  p.info(`We were messaged '${message}' from ${message.author.username}`);

  // what type of DM is this?
  if (message.content.startsWith(`${config.prefix}tada`)) {
    p.debug(`The command starts with the correct identifier`);

    // split out the args
    let args = message.content.split(" ");

    // Let the handler deal with it now
    let command = await argHandler(args, { message: message });

    command(args, { message: message, db: db });
  } else if (message.attachments.keyArray().length > 0) {
    p.info("User has sent a new file");

    // we're only expecting one attachment
    let attachment = message.attachments.array()[0];

    p.info(attachment);

    // is the attachment a valid filename?
    if (attachment.filename.slice(-4) == ".mp3") {
      p.info(
        `User's attachment '${attachment.filename}' was not an mp3 file - '${attachment.filename.slice(-4)}' != .mp3`
      );
      // message the player
      return;
    }

    // is the attachment a valid size?
    if (attachment.filesize > config.maxIntroSize) {
      p.info(`User's attachment ${attachment.filename} was over the maximum allowable size of: ${config.maxIntroSize}`);
      // message the player
      return;
    }

    // download the file.
    // fileName = soundManager.downloadFile(url)

    // vet it and then move it to the accepted sounds folder and update the soundManager
    // if (soundManager.verifyFile(fileName))
    //      move good file to sounds folder
    // else
    //      remove bad file and inform user
  } else {
    p.info(`The message does not start with the appropriate string: '${config.prefix}tada'`);
    return;
  }
};
