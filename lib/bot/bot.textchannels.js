const p = require("../loggerFactory")("Bot.TextChannels");
const { directMessageUser } = require("./bot.shared.js");
const strings = require("../../strings.json");

// Filter out text channel events we don't care about by returning false
function filterTextEvent({ message, opts }) {
  // If it's me (the bot) I don't care. plz check
  if (message.author.id === message.client.user.id) return false;

  return true;
}

function filterDMEvent({ message, opts }) {
  const { db, config } = opts;
  if (!message.attachments.keyArray().length > 0 && !message.content.startsWith(`${config.prefix}tada`)) {
    p.info({ msg: `DM had no attachment or prefix` });
    return false;
  }
  return true;
}

// Deal with the arguments that we get from users. Mostly passes things to commands.js
async function handleDirectMessage({ message, opts }) {
  const { db, config, soundManager } = opts;

  // what type of DM is this?
  if (message.attachments.keyArray().length > 0) {
    p.info("User has sent a new file");

    // we're only expecting one attachment
    let attachment = message.attachments.array()[0];

    p.info(attachment);

    // is the attachment a valid filename?
    if (attachment.filename.slice(-4).trim() !== ".mp3") {
      p.info(
        `User's attachment '${attachment.filename}' was not an mp3 file - '${attachment.filename.slice(-4)}' != .mp3`
      );
      directMessageUser(
        message.client,
        message.author.id,
        "Attachment did not have the required '.mp3' extension. Please check your file type and name before trying again"
      );
      // message the player
      return;
    }

    // todo
    // Check that the name of the file is reasonable (<20 characters, no spaces etc)

    // Do a quick check to see if there will be a name clash
    if (soundManager.getSounds().includes(attachment.filename)) {
      p.info("sound already exists, informing user and stopping process");
      directMessageUser(
        message.client,
        message.author.id,
        "Your intro has the same name as another intro. Please either contact an admin or change the name of your intro"
      );
      return;
    }

    // is the attachment a valid size?
    if (attachment.filesize > config.maxIntroSize) {
      p.info(`User's attachment ${attachment.filename} was over the maximum allowable size of: ${config.maxIntroSize}`);
      directMessageUser(
        message.client,
        message.author.id,
        `Attachment exceeds the max file size for an intro. Please compress the file and try again.\nAttachment size: ${
          attachment.filesize
        }\nMax intro size: ${config.maxIntroSize}`
      );
      return;
    }

    p.info(`We've been sent a probably valid intro file! Starting download`);

    // download the file.
    let filename = await soundManager.downloadFile(attachment.url);

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
  } else {
    p.info(`This DM does not have any attachments and will be left to commando to handle`);
    return;
  }
}

async function handleTextChannelMaster({ message, opts }) {
  if (!filterTextEvent(...arguments)) {
    p.debug(`Text Channel message '${message}' was filtered as not unnecessary`);
    return;
  }

  p.info(`Text Channel message '${message.content.slice(0, 20)}' was seen in ${message.channel.name}`);

  // if it's a direct message
  if (message.channel.type == "dm" && filterDMEvent(...arguments)) {
    p.info(`We were messaged directly '${message}' from ${message.author.username}`);
    handleDirectMessage(...arguments);
  }
}

// return the type of function that the discord channel.listen event expects while recieving the opts from bot
module.exports.handleTextChannel = function(opts) {
  p.info("Initialising text channel event handler");
  return async function(message) {
    await handleTextChannelMaster({ message, opts });
  };
};