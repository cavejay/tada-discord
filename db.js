// const Datastore = require("nedb");
const Datastore = require("nedb-promise");
const p = require("./loggerFactory")("Database");

// todo should pass in the process.env.dbFile
let db = {};
db.raw = new Datastore({
  filename: process.env.dbFile || "./tada.db",
  autoload: true
});

db.bootReport = async function () {
  p.info("This would be the on boot report for the database")
  
  // User count and list

  // Intro count, list and spread.
}

db.makeUser = async function(username, userid, defaultUserConfig) {
  p.info(`Making new user ${username}`);
  const res = await db.raw.insert({userID: userid, name: username, intro: defaultUserConfig});
  p.info(res)
  return res
}

db.getUserIntro = async function (user) {
  p.info(`Finding intro listed for ${user}`)
  const res = await db.getUser(user)
  return res.intro
}

db.setUserIntro = async function (userid, intro) {
  p.info(`Updating user '${userid}' to have the intro: '${JSON.stringify(intro)}'`)
  const res = await db.raw.update({userID: userid}, { $set: {intro: intro}})
  return res
}

db.getUser = async function(user) {
  p.info(`Attempting to fetch user: ${user}`);
  
  const res = await db.raw.findOne({userID: user});

  // this isn't returning undefined :'(
  p.info(res)
  return res;
};

db.bootReport()

module.exports = db;
