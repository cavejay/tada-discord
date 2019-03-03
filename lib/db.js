// const Datastore = require("nedb");
const Datastore = require("nedb-promise");
const p = require("./loggerFactory")("Database");

// todo should pass in the process.env.dbFile
let db = {};
db.raw = new Datastore({
  filename: process.env.dbFile || "/home/cj/proj/tada-discord/tada.db",
  autoload: true
});

db.userIntroCache = {};
db.introCache = [];

db.bootReport = async function() {
  p.info("This would be the on boot report for the database");

  // User count and list
  let usersData = await db.raw.find({ userID: { $exists: true } }, { name: 1, _id: 0, intro: 1, userID: 1 });
  users = Object.values(usersData).map(u => `${u.name} ~ ${u.intro.type === "file" ? u.intro.key : u.intro.url}`);
  // p.info(users)
  p.info(`List of Users:\n - ${users.join("\n - ")}`);

  // Intro count, list and spread.

  // Sound Files in database list
  let soundFiles = await db.raw.find({ soundFile: { $exists: true } }, { soundFile: 1, _id: 0 });
  soundFiles = Object.values(soundFiles).map(f => `${f.soundFile}`);
  p.info(`List of currently known and valid sound files:\n - ${soundFiles.join("\n - ")}`);

  db.introCache = soundFiles
    .map(s => {
      return s.split(".mp3")[0];
    })
    .sort();

  // Add all users and their intro int o the userIntroCache
  for (let user of usersData) {
    db.userIntroCache[user.userID] = user.intro.key;
  }
};

db.makeUser = async function(username, userid, defaultUserConfig) {
  p.info(`Making new user ${username}`);
  const res = await db.raw.insert({ userID: userid, name: username, intro: defaultUserConfig });
  p.debug(res);
  return res;
};

db.getUserIntro = async function(user) {
  p.info(`Finding intro listed for ${user}`);
  const res = await db.getUser(user);
  return res.intro;
};

db.getUsersWithIntros = async function(intros) {
  p.info(`Attempting to fetch users with any of the intros: ${intros.join(", ")}`);
  const res = await db.raw.find({
    $or: intros.map(introName => {
      return {
        intro: {
          type: "file",
          key: introName
        }
      };
    })
  });
};

db.setUserIntro = async function(userid, intro) {
  p.info(`Updating user '${userid}' to have the intro: '${JSON.stringify(intro)}'`);
  db.userIntroCache[userid] = intro.key;
  const res = await db.raw.update({ userID: userid }, { $set: { intro: intro } });
  return res;
};

db.getUser = async function(user) {
  p.info(`Attempting to fetch user: ${user}`);

  const res = await db.raw.findOne({ userID: user });

  // this isn't returning undefined :'(
  p.debug(res);
  return res;
};

db.getSoundFileFromName = async function getSoundFileFromName(soundName) {
  if (!soundName) {
    throw `soundName must be something was: ${soundName}`;
    return;
  }

  p.debug(`Getting file for sound: ${soundName}`);
  let res = await db.raw.findOne({ name: soundName }, { soundFile: 1, _id: 0 });
  p.debug(res);
  return res.soundFile;
};

db.addSoundFile = async function(soundFile) {
  p.debug(`Checking if ${soundFile} exists in db`);
  let res = await db.raw.findOne({ soundFile: soundFile });
  p.debug(res);
  if (!res) {
    p.info(`New sound found was found: ${soundFile}`);
    res = await db.raw.insert({
      soundFile: soundFile,
      name: soundFile
        .split(".")
        .slice(0, -1)
        .join(".")
    });
    db.introCache += soundFile.split(".mp3")[0];
    return 1;
  } else {
    return 0;
  }
};

db.getAllSoundFiles = async function() {
  p.info(`Attempting to return all known sound files`);

  const res = await db.raw.find({ soundFile: { $exists: true } });
  p.info(`Found ${res.length} sound files`);
  p.debug(res);
  return res.map(sf => sf.soundFile);
};

db.getAllSounds = async function getAllSounds() {
  p.info(`Attempting to return all known sound files`);

  if (db.introCache) {
    return db.introCache;
  }

  const res = await db.raw.find({ soundFile: { $exists: true } });
  p.info(`Found ${res.length} sound files`);
  p.debug(res);
  return res.map(sf => sf.name);
};

// remove a sound from the database
db.deprecateSound = async function(soundFile) {
  p.info(`Attempting to remove ${soundFile}'s entry in the database`);
  let res;
  try {
    res = await db.raw.remove({ soundFile: soundFile });
    p.debug(res);
    p.info(`${soundFile} removed successfully`);
  } catch (e) {
    p.error(e);
  }
  return res <= 0 ? false : true;
};

db.bootReport();

module.exports = db;
