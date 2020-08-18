const p = require("../loggerFactory")("bot.textEventHandlers");

const { directMessageUser } = require("./util.js");

async function filterMessageEvent(ctx, next) {
  const message = ctx.data;
  // If it's not this bot continue - else just print
  if (message.author.id !== message.client.user.id) {
    return await next();
  }
  p.debug(`Text Channel message '${message}' was filtered as not unnecessary`);
}

async function logMessageEvent(ctx, next) {
  const message = ctx.data;
  p.info(
    `Text Channel message '${message.content.slice(0, 20)}' was seen in ${
      message.channel.name
    }`
  );
  return await next();
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
  if (message.attachments.array().length != 1) {
    p.warn(
      `DirectMessage from ${message.author} (${message.author.id}) contains more than 1 attachment - send a message asking for only one`
    );
    directMessageUser(
      message.client,
      message.author.id,
      "We recieved more than one attachment in from you. Please only send one at a time"
    );
    return false;
  }

  // grab the single attachment
  const attachment = message.attachments.array()[0];

  // is the attachment a valid file type?
  if (attachment.name.slice(-4).trim() !== ".mp3") {
    p.warn(
      `DirectMessage from ${message.author} (${message.author.id}) contains a non-mp3 attachment - sending a message reminding them we require mp3`
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
      `DirectMessage from ${message.author} (${message.author.id}) had single attachment with invalid name - responding with warning`
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
      `DirectMessage from ${message.author} (${message.author.id}) contains non-mp3 attachment - sending a message reminding them we require mp3`
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

  // Start the download
}

module.exports = {
  logMessageEvent,
  filterMessageEvent,
  actionDirectMessageEvent,
  actionDirectMessageAttachment,
};
