// const Datastore = require("nedb");
const Datastore = require("nedb-promise");
const p = require("./loggerFactory")("Database");

// todo should pass in the process.env.dbFile
let db = {};
db.raw = new Datastore({
  filename: process.env.dbFile || "./tada.db",
  autoload: true
});

db.userprefs = async function() {
  p.info(`Creating a new document for video: `);
  // Should we do some checks first?
  const res = await db.raw.insert({});
  return res;
};

module.exports = db;
