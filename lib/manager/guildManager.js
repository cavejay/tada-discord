const p = require("../loggerFactory")("GuildManager");

const guildCache = new (require("../cache"))("GuildCache");

/**
 * Guild Manager is literally just for guild specific settings. It keeps a type: "guild" data type for each new guild that's managed by the bot
 */
var gm = {};

gm.init = async function({ db, config, Bot }) {
  gm.db = db;
  gm.config = config;

  Bot.on("voiceStateUpdate", async oldMember => {
    await gm.ensureGuild(oldMember.guild.id);
  });
  Bot.on("guildCreate", async guild => {
    await gm.createGuild(guild.id);
  });

  const allGuilds = await gm.db.raw.find({ type: "guild" });
  let _cache = allGuilds.reduce((cum, guild) => {
    cum[guild.guildid] = guild;
    return cum;
  }, {});
  guildCache.setCache(_cache);

  p.trace("Guild Manager Booted");
};

gm.ensureGuild = async function ensureGuild(gid) {
  p.trace("Ensuring a new guild");
  const gCheck = await guildCache.getOrSet(gid, async () => {
    return await gm.db.raw.findOne({ type: "guild", guildid: gid });
  });
  if (gCheck) {
    // guild exists
    return true;
  }
  p.info(`Tada has seen a voice event in a guild it doesn't recognise`);
  return await gm.createGuild(gid);
};

gm.createGuild = async function createGuild(gid) {
  p.info(`Creating a new db record for Guild: ${gid}`);
  return await gm.db.insertGuild({
    guildDoc: gm.db.schema.constructGuild(gid, gm.config.prefix, gm.config.newUserDefault)
  });
};

gm.getGuildDefaultIntro = async function guildDefaultIntro(gid) {
  const guildobj = await guildCache.getOrSet(gid, async () => {
    return await gm.db.getGuildObject({ gid });
  });
  if (guildobj === null || guildobj === undefined) {
    return null;
  } else {
    return Object.freeze(guildobj.newUserDefault);
  }
};

module.exports = gm;
