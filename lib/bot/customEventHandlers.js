const p = require("../loggerFactory")("bot.customEventHandlers");

const { saveIntro, getGuildIds, createGuild } = require("./dataInterface");

const { hashBuffer } = require("./util");

async function newUserEvent(ctx, next) {
  p.info("Handling a new UserEvent");

  // send the new user information about tada and how to use
}

async function newGuildEvent(ctx, next) {
  p.info("handling a newGuildEvent");

  let gid;
  if (ctx.newGuildID) {
    gid = ctx.newGuildID;
  } else if (ctx.data && ctx.data.id) {
    gid = ctx.data.id;
  }

  const newGuild = await ctx.client.guilds.cache.get(gid);

  // Setup database etc
  await createGuild(
    gid,
    "d88ec241c714368add0f383ebfbdab3bf2e9c4fafe4bec961a4a4e7d012060f7", // fix this it's bad
    ctx.cfg.maxIntroTime,
    ctx.cfg.prefix,
    null
  );

  // maybe drop a message in the main chat?
}

async function ensureDefaultIntroPresent(ctx, next) {
  p.info("Ensuring we have at least one intro in the db");

  // Check if the default intro hash is in the db
  if (false) {
    p.error(``);
  }

  return await next();

  // If not then load it in and save it to the database

  const fileBuffer = await getStream.buffer(res, "latin1");
  const fileHash = hashBuffer(fileBuffer);

  // Save the hash, user, binary data and filena1me to the database
  await saveIntro({
    filename: attachment.name,
    creator: message.author.id,
    hash: fileHash,
    bytearray: fileBuffer,
  });
  // get local sound file based on config
  // hash it
  // confirm hash is in database
  // add to database if it isn't

  return next();
}

async function updateGuilds(ctx, next) {
  // from bot's current understanding
  const currentGuilds = ctx.client.guilds.cache.array().map((a) => a.id);

  // from database
  const storedGuilds = await getGuildIds();

  for (const gid in currentGuilds) {
    // if a current guild is not in the storedGuilds we need to update the database
    if (!storedGuilds.includes(currentGuilds[gid])) {
      // fill in possibly missing information
      ctx.newGuildID = currentGuilds[gid];
      await newGuildEvent(ctx, next);
    }
  }

  return await next();
}

module.exports = {
  newUserEvent,
  newGuildEvent,
  updateGuilds,
  ensureDefaultIntroPresent,
};
