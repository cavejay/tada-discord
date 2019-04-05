const p = require("../loggerFactory")("GuildManager");

const { schema } = require("../db");

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

  p.trace("Guild Manager Booted");
};

gm.ensureGuild = async function ensureGuild(gid) {
  const gCheck = await guildCache.getOrSet(gid, async () => {
    return await gm.db.raw.find({ type: "guild", guildid: gid });
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
    guildDoc: schema.constructGuild(gid, gm.config.prefix, gm.config.newUserDefault)
  });
};

gm.getGuildDefaultIntro = async function guildDefaultIntro(gid) {
  const guildobj = await guildCache.getOrSet(gid, async () => {
    return await gm.db.getGuildObject({ gid });
  });
  return Object.freeze(guildobj.newUserDefault);
};

module.exports = gm;
