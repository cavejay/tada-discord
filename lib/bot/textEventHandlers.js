const p = require("../loggerFactory")("bot.textEventHandlers");

const https = require("https");
const getStream = require("get-stream");

const {
  directMessageUser,
  hashBuffer,
  getUsersGuilds,
  emTable,
} = require("./util.js");
const {
  saveIntro,
  getUserGuilds,
  addIntroToGuild,
} = require("./dataInterface");
const { Message } = require("discord.js");

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
  const introid = await saveIntro({
    filename: attachment.name,
    creator: message.author.id,
    hash: fileHash,
    bytearray: fileBuffer,
  });

  await message.react("✅");

  // Send a new message:
  const m = await message.author.send(
    "Which of your current Discord Servers should this intro be published to? Please use the reactions available on the following message to show me:"
  );

  await setGuildAssignmentInfo(introid, message.author, ctx.client);

  // allow the intro to be used by the chosen reactions
}

async function setGuildAssignmentInfo(introid, discordUser, client) {
  p.debug({ introid, discordUser });

  // Get the user's guilds and resolved the names
  const guildids = await getUserGuilds(discordUser.id);

  const userGuilds = await Promise.all(
    guildids.map(async (gid) => await client.guilds.fetch(gid))
  );

  // Assemble the question we want to ask them
  const allEmotes = "123456789abcdefghijklmnopqrstuvwxyz"
    .split("")
    .map((letter) => emTable[letter]);

  p.debug({ msg: "reaction things", allEmotes });

  let guildEmoteMap = {};
  for (i = 0; i < userGuilds.length; i++) {
    guildEmoteMap[allEmotes[i]] = userGuilds[i];
  }

  const userQuestion = Object.keys(guildEmoteMap).map(
    (emote) => `${emote} - ${guildEmoteMap[emote].name}`
  );

  p.debug({ userQuestion });

  const questionMessage = await discordUser.send(userQuestion);

  // Build the list of reactions to attached to the message

  // Collect the feed back
  await collectUserReactionInput(
    questionMessage,
    allEmotes.slice(0, userGuilds.length),
    async (reaction, user) => {
      // turn the emote back into a guild/gid
      const gid = guildEmoteMap[reaction.emoji.name].id;
      // Add the intro to the chosen guild
      await addIntroToGuild(gid, introid);
    },
    (collected) => {
      p.info({ msg: "items collected", collected });
    }
  );
}

/**
 *
 * @param {Message} discordMessage
 * @param {Array<String>} reactionsToAdd
 * @param {Function} onCollect
 * @param {Function} onEnd
 * @returns {void}
 */
async function collectUserReactionInput(
  discordMessage,
  reactionsToAdd,
  onCollect,
  onEnd
) {
  p.debug({ reactionsToAdd, discordMessage });
  // Add the reactions of interest
  await Promise.all(
    reactionsToAdd.map(async (x) => await discordMessage.react(x))
  );

  const filter = (reaction, user) => {
    p.debug({ reaction, user, mess: discordMessage.channel.recipient.id });
    return (
      reactionsToAdd.includes(reaction.emoji.name) &&
      user.id == discordMessage.channel.recipient.id
    );
  };

  const collector = discordMessage.createReactionCollector(filter, {
    time: 60000,
  });

  collector.on("collect", (reaction, user) => {
    p.debug(
      `Collected ${reaction.emoji.name} from ${user.tag} on ${discordMessage.id}`
    );
    return onCollect(reaction, user);
  });

  collector.on("end", (collected) => {
    p.debug(
      `Collected ${collected.size} items from message id ${discordMessage.id}`
    );
    return onEnd(collected);
  });

  // Other options here are to watch the messageReactionAdd/Remove events, filter them on the dm messages and then action those.
  // This would require some extra db working I think?
  // https://gist.github.com/Danktuary/27b3cef7ef6c42e2d3f5aff4779db8ba
  // https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/raw-events.md

  // listen to reactions
}

module.exports = {
  logMessageEvent,
  filterMessageEvent,
  launchDirectorChannelMessageEvent,
  actionDirectMessageEvent,
  actionDirectMessageAttachment,
};
