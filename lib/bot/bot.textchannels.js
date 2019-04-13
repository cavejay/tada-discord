const p = require("../loggerFactory")("Bot.TextChannels");
const { directMessageUser } = require("./bot.shared.js");

const { stripIndents } = require("common-tags");
const filesanitise = require("sanitize-filename");

const { downloadFile } = require("../manager/fileManager");

// Deprecated -- Filter out text channel events we don't care about by returning false
function filterTextEvent({ message, opts }) {
  // If it's me (the bot) I don't care. plz check
  if (message.author.id === message.client.user.id) return false;

  return true;
}

function filterDMEvent({ message, opts }) {
  const { db, config } = opts;
  if (!message.attachments.keyArray().length > 0) {
    p.info({ msg: `DM had no attachment or prefix` });
    return false;
  }
  return true;
}

// Deal with the arguments that we get from users. Mostly passes things to commands.js
async function handleDirectMessage({ message, guild, opts }) {
  const { db, config, soundManager } = opts;

  // If we don't have only 1 attachment then it's not a new intro so return
  if (message.attachments.keyArray().length !== 1) {
    p.info(`This DM does not have any attachments and will be left to commando to handle`);
    return;
  }

  // we're only expecting one attachment
  let attachment = message.attachments.array()[0];
  p.info("User has sent a new file", {
    name: attachment.filename,
    size: attachment.filesize
  });

  // is the attachment a valid filename?
  if (attachment.filename.slice(-4).trim() !== ".mp3") {
    p.info(
      `User's attachment '${attachment.filename}' was not an mp3 file - '${attachment.filename.slice(-4)}' != .mp3`
    );
    // message the user
    directMessageUser(
      message.client,
      message.author.id,
      "Attachment did not look like a valid mp3. Please check your file type before trying again"
    );
    return;
  }

  // Does it have a somewhat valid filename?
  if (filesanitise(attachment.filename) === "") {
    p.info("Sound contains no valid characters");
    directMessageUser(
      message.client,
      message.author.id,
      "Your file's name contains no valid characters. Please rename the file to something simple with '-'s and '_'s instead of spaces."
    );
    return;
  }

  // is the attachment a valid size?
  if (attachment.filesize > config.maxIntroSize) {
    p.info(`User's attachment ${attachment.filename} was over the maximum allowable size of: ${config.maxIntroSize}`);
    directMessageUser(
      message.client,
      message.author.id,
      stripIndents`Attachment exceeds the max file size for an intro. Please compress the file and try again.
        Attachment size: ${attachment.filesize}
        Max intro size: ${config.maxIntroSize}
        `
    );
    return;
  }

  p.info(`We've been sent a probably valid intro file! Starting download`);

  // download the file.
  let filename = await downloadFile(attachment.url);

  p.info("Verifying file is a valid sound file");
  if (soundManager.validateSound(filename)) {
    p.info("Verified. Attempting to add Sound");
    let success = await soundManager.addSound(filename);

    if (success) {
      p.info("Sound file added successfully. Reloading intro list");
      // message the user letting them know the
      directMessageUser(
        message.client,
        message.author.id,
        `Your new intro ${filename} has been successfully processed and added to the full list of intros`
      );
      await soundManager.reload();
    } else {
      await soundManager.deleteTmpSound(filename);
      p.error("Something went wrong and we couldn't add the sound to the sounds folder...");
      directMessageUser(
        message.client,
        message.author.id,
        `Something went wrong and we couldn't add the sound to the sounds folder. Maybe try again? Definitely contact a tada admin/owner`
      );
      directMessageUser(
        message.client,
        config.owner,
        `Something went wrong when ${message.author.name} tried to add a new intro. You should check it out`
      );
    }
  }

  p.info(`New Intro ${filename} finished being added`);

  // vet it and then move it to the accepted sounds folder and update the soundManager
  // if (soundManager.verifyFile(fileName))
  //      move good file to sounds folder
  // else
  //      remove bad file and inform user
}

async function handleTextChannelMaster({ message, guild, opts }) {
  // We don't actually do anything with normal text messages here.
  // That's all now handled by Commando and the commands in the lib/commands folder.

  // if it's a direct message
  if (message.channel.type == "dm" && filterDMEvent(...arguments)) {
    p.info(`We were messaged directly '${message}' from ${message.author.username}`);
    return await handleDirectMessage(...arguments);
  }
}

// return the type of function that the discord channel.listen event expects while recieving the opts from bot
module.exports.handleTextChannel = function(opts) {
  p.info("Initialising text channel event handler");
  return async function(message) {
    await handleTextChannelMaster({ message, guild: message.guild, opts });
  };
};
