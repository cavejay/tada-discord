const p = require("../loggerFactory")("UserManager");

const userCache = new (require("../cache"))("UserCache");

function resolveUserIntro(user, gid) {
  if (user.presence !== {} && user.presence != undefined) {
    return user.presence[gid].intro;
  } else {
    return user.intro;
  }
}

var um = {};

um.init = async function({ db, config, Bot, soundManager, guildManager }) {
  um.db = db;
  um.config = config;
  um.sm = soundManager;
  um.gm = guildManager;
  um.bot = Bot;

  // pull initial users and their intros from db and add to userCache

  p.trace("UserManager Booted");
};

um.checkUser = async function checkUser({ gid, uid }) {
  return await um.getUserIntro(...arguments);
};

um.makeNewUser = async function makeNewUser({ gid, uid }) {
  // Get the user and guild's details for better logging(?)
  let userdetails = await um.bot.fetchUser(uid);
  let guildDetails = await um.bot.guilds.get(gid);

  // Ensure the guild
  await um.gm.ensureGuild(gid);
  p.info("post guild ensure");

  // Log
  p.debug(`Making new user ${userdetails.username}(${uid}) for ${guildDetails.name}(${gid})`);

  // Assemble the user
  let user = um.db.schema.constructUser(uid, gid, await um.gm.getGuildDefaultIntro(gid));

  // save the userdoc
  const res = await um.db.insertUser({ userDoc: user });

  // Update the cache once that's done
  userCache.set(`${uid}-${gid}`, resolveUserIntro(res, gid));
};

um.getUserIntro = async function getUserIntro({ gid, uid }) {
  p.debug(`Finding intro listed for ${uid} in ${gid}`);
  return await userCache.getOrSet(`${uid}-${gid}`, async () => {
    const res = await um.db.getUserField({ uid, field: "presence" });
    if (res === null || res === undefined) {
      return null;
    } else {
      return res[gid];
    }
  });
};

um.setUserIntro = async function setUserIntro({ gid, userid, name }) {
  // Get the checksum of the name'd sound through soundmanager
  const soundCS = await um.sm.getCheckSum({ soundName: name });

  userCache.set(userid, soundCS);

  // Update the db for the user with the checksum
  return await um.db.setUserIntro(userid, soundCS, gid);
};

module.exports = um;
