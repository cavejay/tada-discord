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
  const allUsers = await um.db.getAllUsers();
  let _cache = allUsers.reduce((cum, user) => {
    if (!user.presence) {
      return cum;
    }

    Object.keys(user.presence).forEach(guild => {
      cum[`${user.userid}-${guild}`] = user.presence[guild];
    });
    return cum;
  }, {});
  userCache.setCache(_cache);

  p.trace("UserManager Booted");
};

/**
 * Returns:
 * 2: User exists in guild
 * 1: User exists
 * 0: Completely new user
 */
um.checkUser = async function checkUser({ gid, uid }) {
  const user = await um.db.getUserObject({ uid });
  if (user) {
    if (user.presence[gid]) {
      return 2;
    } else {
      return 1;
    }
  } else {
    return 0;
  }
};

um.makeNewUser = async function makeNewUser({ gid, uid }) {
  // Get the user and guild's details for better logging(?)
  let userdetails = await um.bot.fetchUser(uid);
  let guildDetails = await um.bot.guilds.get(gid);

  // Ensure the guild
  await um.gm.ensureGuild(gid);

  // Log
  p.debug(`Making new user ${userdetails.username}(${uid}) for ${guildDetails.name}(${gid})`);

  // Assemble the user
  let user = um.db.schema.constructUser(uid, gid, await um.gm.getGuildDefaultIntro(gid));

  // save the userdoc
  const res = await um.db.insertUser({ userDoc: user });

  // Update the cache once that's done
  userCache.set(`${uid}-${gid}`, resolveUserIntro(res, gid));
};

/**
 * User needs to be updated with a new guild in presence
 */
um.userNewGuild = async function userNewGuild({ gid, uid }) {
  let userdetails = await um.bot.fetchUser(uid);
  let guildDetails = await um.bot.guilds.get(gid);

  // Ensure the guild
  await um.gm.ensureGuild(gid);

  // Log
  p.debug(`Updating user ${userdetails.username}(${uid}) for ${guildDetails.name}(${gid})`);

  const user = await um.db.raw.findOne({ type: "user", userid: uid });
  const newPresence = {};
  newPresence[gid] = await um.gm.getGuildDefaultIntro(gid);
  const presence = Object.assign(user.presence, newPresence);

  // Send the update
  const res = await um.db.updateUserField({ uid, field: "presence", value: presence });
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
