const p = require("../loggerFactory")("bot.textEventHandlers");

const https = require("https");
const getStream = require("get-stream");

const { directMessageUser, hashBuffer, getUsersGuilds } = require("./util.js");
const { saveIntro, getUserGuilds } = require("./dataInterface");

async function filterMessageEvent(ctx, next) {
  const message = ctx.data;
  // If it's not this bot continue - else just print
  if (message.author.id == message.client.user.id) return;

  // if it's another bot don't do anything
  if (message.author.bot) return;

  return await next();
}

async function logMessageEvent(ctx, next) {
  const message = ctx.data;
  p.info(
    `Text Channel message '${message.content.slice(0, 10)}...' was seen in ${
      message.channel.name
    }`
  );
  return await next();
}

async function launchDirectorChannelMessageEvent(ctx, next) {
  const message = ctx.data;
  p.debug(`Text message was from a ${ctx.data.channel.type} type of channel`);

  // DM's are only for uploading files - nothing else
  if (message.channel.type == "dm")
    return ctx.client.emit("tada_directMessage", ctx.data);

  // Everything else is tied to guilds etc - so should be where users do config
  return ctx.client.emit("tada_textChannel", ctx.data);
}

async function actionDirectMessageEvent(ctx, next) {
  const message = ctx.data;
  if (message.channel.type == "dm") {
    p.info(
      `We were Direct Messaged '${message.content || "<empty>"}' by ${
        message.author.username
      }`
    );
  }
  return await next();
}

async function vetDirectMessageAttachment(ctx) {
  const message = ctx.data;

  p.info(
    `DirectMessage carries ${message.attachments.array().length} attachment(s)`
  );

  // we'll only except 1 attachment per message
  if (message.attachments.array().length > 1) {
    p.warn(
      `DirectMessage from ${message.author.name} (${message.author.id}) contains more than 1 attachment - send a message asking for only one`
    );
    directMessageUser(
      message.client,
      message.author.id,
      "We recieved more than one attachment in from you. Please only send one at a time"
    );
    return false;
  } else if (message.attachments.array().length < 1) {
    p.warn(
      `DirectMessage from ${message.author.name} (${message.author.id}) does not contain an attachment - send a message asking for one`
    );
    directMessageUser(
      message.client,
      message.author.id,
      "I recieved a message with no attachment from you. You'll need to provide an intro via an attachment"
    );
    return false;
  }

  // grab the single attachment
  const attachment = message.attachments.array()[0];

  // is the attachment a valid file type?
  if (attachment.name.slice(-4).trim() !== ".mp3") {
    p.warn(
      `DirectMessage from ${message.author.name} (${message.author.id}) contains a non-mp3 attachment - sending a message reminding them we require mp3`
    );
    directMessageUser(
      message.client,
      message.author.id,
      `Attachment '${attachment.name}' did not have the required '.mp3' extension. Please check your file type and name before trying again`
    );
    return false;
  }

  // Check the file name - so we don't end up silly file names
  if (attachment.name.includes("!")) {
    // todo
    p.warn(
      `DirectMessage from ${message.author.name} (${message.author.id}) had single attachment with invalid name - responding with warning`
    );
    directMessageUser(
      message.client,
      message.author.id,
      `Attachment '${attachment.name}' contained unallowed characters. Please reconsider your intro file's name`
    );
    return false;
  }

  // is the attachment a valid size?
  if (attachment.size > ctx.cfg.maxIntroSize) {
    p.warn(
      `DirectMessage from ${message.author.name} (${message.author.id}) contains non-mp3 attachment - sending a message reminding them we require mp3`
    );
    directMessageUser(
      message.client,
      message.author.id,
      `Attachment exceeds the max file size for an intro. Please compress the file and try again.\nAttachment size: ${attachment.filesize}\nMax intro size: ${config.maxIntroSize}`
    );
    return false;
  }

  // This attachment looks 'ok'
  return true;
}

async function actionDirectMessageAttachment(ctx, next) {
  const message = ctx.data;

  // If no attachments do nothing
  if (!message.attachments) {
    return await next();
  }

  // Vet the attachment
  const vetResponse = await vetDirectMessageAttachment(ctx);
  if (!vetResponse) {
    return await next();
  }

  const attachment = message.attachments.array()[0];

  p.info(
    `Downloading attachment '${attachment.name}' sent by ${message.author.name} (${message.author.id})`
  );

  // assemble the promise that will perform the download
  httpsgetP = (url) => {
    return new Promise((resolve, reject) => {
      https.get(url, function (res) {
        p.info("got data stream thing");
        resolve(res);
      });
    });
  };

  // get the initial response and then turn that stream into a buffer
  const res = await httpsgetP(attachment.url);
  const fileBuffer = await getStream.buffer(res, "latin1");

  // Make a hash from the buffer
  const fileHash = hashBuffer(fileBuffer);

  // Save the hash, user, binary data and filena1me to the database
  await saveIntro({
    filename: attachment.name,
    creator: message.author.id,
    hash: fileHash,
    bytearray: fileBuffer,
  });

  await message.react("✅");

  // Send a new message:
  await message.author.send(
    "Which of your current Discord Servers should this intro be published to? Please use the reactions available on the following message to show me:"
  );

  // Get the user's guilds and resolved the names
  const guildids = await getUserGuilds(message.author.id);

  const userGuilds = await Promise.all(
    guildids.map(async (gid) => (await ctx.client.guilds.fetch(gid)).name)
  );

  // Assemble the question we want to ask them
  const number = [
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
  ];
  const alpha = "abcdefghijklmnopqrstuvwxyz"
    .split("")
    .map((letter) => `regional_indicator_${letter}`);
  const allEmotes = number + alpha;

  const userQuestion = userGuilds.map(
    (gname, i) => `:${allEmotes[i]}: - ${gname}`
  );
  const questionMessage = await message.author.send(userQuestion);

  // Build the list of reactions to attached to the message

  // Collect the feed back
  const guildsSelected = await collectUserReactionInput(questionMessage);

  // allow the intro to be used by the chosen reactions
}

/**
 *
 * @param {MessageEvent} discordMessage
 * @param {Array<String>} reactionsToAdd
 *
 * returns:
 * Reactions that the user provided
 */
async function collectUserReactionInput(discordMessage, reactionsToAdd) {
  // Add the reactions of interest
  await Promise.all(reactionsToAdd.map((x) => discordMessage.react(x)));
}

module.exports = {
  logMessageEvent,
  filterMessageEvent,
  launchDirectorChannelMessageEvent,
  actionDirectMessageEvent,
  actionDirectMessageAttachment,
};
