const p = require("./loggerFactory")("UserManager");

const userCache = new (require("./cache"))("UserCache");

var um = {};

um.init = async function({ db, config, Bot, soundManager }) {
  um.db = db;
  um.config = config;
  um.sm = soundManager;

  // pull initial users and their intros from db

  p.trace("UserManager Booted");
};

um.makeUser = async function makeUser({ gid, uid }) {
  let userdetails = await Bot.fetchUser(uid);
  let guildDetails = Bot.guilds.get(gid);
  p.trace(`Making new user ${userdetails.username}(${uid}) for ${guildDetails.name}(${gid})`);
  um.db.createUser(userdetails.username, uid, config.newUserDefault);
};

um.checkUser = function checkUser({ gid, uid }) {
  return userCache.checkUser(uid);
};

um.getUserIntro = async function getUserIntro({ userid }) {
  p.debug(`Finding intro listed for ${user}`);
  const res = await um.db.getUserField(user, "intro");
  return res.intro;
};

um.setUserIntro = async function setUserIntro({ userid, name }) {
  // Get the checksum of the name'd sound through soundmanager
  const soundCS = await um.sm.getCheckSum({ soundName: name });

  // Update the db for the user with the checksum
  um.db.setUserIntro(userid, soundCS);
};

module.exports = um;
