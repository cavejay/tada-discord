// const Datastore = require("nedb");
const Datastore = require("nedb-promise");
const p = require("./loggerFactory")("Database");

// todo should pass in the process.env.dbFile
let db = {};
db.raw = new Datastore({
  filename: process.env.dbFile || "./tada.db",
  autoload: true
});

db.makeUser = async function(user) {
  p.info(`Making new user ${user}`);
  const res = await db.raw.insert({userID: user, intro: "tada"});
  p.info(res)
}

db.getUserIntro = async function (user) {
  p.info(`Finding intro listed for ${user}`)
  const res = await db.getUser(user)
  return res.intro
}

db.getUser = async function(user) {
  p.info(`Attempting to fetch user: ${user}`);
  
  const res = await db.raw.findOne({userID: user});

  // this isn't returning undefined :'(
  p.info(res)
  return res;
};

module.exports = db;
