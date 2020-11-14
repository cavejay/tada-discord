const p = require("../loggerFactory")("bot.customEventHandlers");

const {
  saveIntro,
  getGuildIds,
  createGuild,
  getMetaProp,
} = require("./dataInterface");

const { hashBuffer, newUserMessage } = require("./util");

async function newGuildEvent(ctx, next) {
  p.info("handling a newGuildEvent");

  let gid;
  if (ctx.newGuildID) {
    gid = ctx.newGuildID;
  } else if (ctx.data && ctx.data.id) {
    gid = ctx.data.id;
  }

  // const newGuild = await ctx.client.guilds.cache.get(gid);

  const botDefaultIntro = await getMetaProp("defaultIntroHash");

  // Setup database etc
  await createGuild(
    gid,
    botDefaultIntro, // fix this it's bad
    ctx.cfg.maxIntroTime, // todo make this come from db, not config file
    ctx.cfg.prefix,
    null
  );

  // maybe drop a message in the main chat?
}

async function updateGuilds(ctx, next) {
  p.info(`Updating Tada's understanding of current Guilds`);
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
  newGuildEvent,
  updateGuilds,
};
