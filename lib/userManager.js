const p = require("./loggerFactory")("UserManager");

const userCache = new (require("./cache"))("UserCache");

var um = {};

um.init = async function({ db, config, Bot }) {
  um.db = db;
  um.config = config;

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
  p.trace(`Finding intro listed for ${user}`);
  const res = await um.db.getUserField(user, "intro");
  return res.intro;
};

module.exports = um;
