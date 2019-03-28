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

const dbUpgrades = {
  ensureTypes: require("./databaseUpdates/addDataTypes"),
  ensureSoundIDs: require("./databaseUpdates/addSoundIDs")
};

db.bootReport = async function bootReport() {
  // Perform any updates first
  for (const upgrade in Object.values(dbUpgrades)) {
    await Object.values(dbUpgrades)[upgrade](db.raw);
  }

  p.info("This would be the on boot report for the database");

  // User count and list
  let usersData = await db.raw.find({ type: "user" }, { name: 1, _id: 0, intro: 1, userID: 1 });
  users = Object.values(usersData).map(u => `${u.name} ~ ${u.intro.type === "file" ? u.intro.key : u.intro.url}`);
  // p.info(users)
  p.info(`List of Users:\n - ${users.sort().join("\n - ")}`);

  // Intro count, list and spread.

  // Sound Files in database list
  let soundFiles = await db.raw.find({ soundFile: { $exists: true } }, { soundFile: 1, _id: 0 });
  soundFiles = Object.values(soundFiles).map(f => `${f.soundFile}`);
  p.info(`List of currently known and valid sound files:\n - ${soundFiles.sort().join("\n - ")}`);

  db.introCache = soundFiles
    .map(s => {
      return s.split(".mp3")[0];
    })
    .sort();

  // Add all users and their intro into the userIntroCache
  for (let user of usersData) {
    db.userIntroCache[user.userID] = user.intro.key;
  }
};

db.createUser = async function makeUser(username, userid, defaultUserConfig) {
  let newuser = { type: "user", userID: userid, name: username, intro: defaultUserConfig };
  p.debug(`insert - ${newuser}`);
  const res = await db.raw.insert(newuser);
  p.debug(`insert - result: ${res}`);
  return res;
};

db.getUserIntro = async function getUserIntro(user) {
  p.info(`Finding intro listed for ${user}`);
  const res = await db.getUser(user);
  return res.intro;
};

db.getUsersWithIntros = async function getUsersWithIntros(intros) {
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

db.setUserIntro = async function setUserIntro(userid, intro) {
  p.info(`Updating user '${userid}' to have the intro: '${JSON.stringify(intro)}'`);
  db.userIntroCache[userid] = intro.key;
  const res = await db.raw.update({ userID: userid }, { $set: { intro: intro } });
  return res;
};

db.getUser = async function getUser(user) {
  p.info(`Attempting to fetch user: ${user}`);

  const res = await db.raw.findOne({ userID: user });

  // this isn't returning undefined :'(
  p.debug(res);
  return res;
};

db.getUserField = async function getUserField(user, field) {
  let userdata = await db.getUser(user);
  return userdata[field];
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

db.addSoundFile = async function addSoundFile(id, soundFile) {
  p.debug(`Checking if ${soundFile} exists in db`);
  let res = await db.raw.findOne({ checksum: id });
  p.debug(res);
  if (!res) {
    p.info(`New sound found was found: ${soundFile}`);
    res = await db.raw.insert({
      type: "sound",
      checksum: id,
      soundFile: soundFile,
      name: soundFile
        .split(".")
        .slice(0, -1)
        .join(".")
    });

    // db.introCache.push(soundFile.split(".mp3")[0]);

    return 1;
  } else {
    return 0;
  }
};

db.getAllSoundFiles = async function getAllSoundFiles() {
  p.info(`Attempting to return all known sound files`);

  const res = await db.raw.find({ type: "sound" });
  p.info(`Found ${res.length} sound files`);
  p.debug(res);
  return res.map(sf => sf.soundFile);
};

db.getAllSounds = async function getAllSounds() {
  p.info(`Attempting to return all known sound files`);

  const res = await db.raw.find({ soundFile: { $exists: true } });
  p.debug(`Found ${res.length} sound files`);
  p.debug(res);
  return res;
};

// remove a sound from the database
db.deprecateSound = async function deprecateSound(soundChecksum) {
  // Check it exists and fetch details
  const sound = await db.raw.findOne({ type: "sound", checksum: soundChecksum });
  p.info(`Attempting to remove ${sound.name}'s entry in the database`);
  let res;
  try {
    res = await db.raw.remove({ checksum: soundChecksum, type: "sound" });
    p.debug(res);
    p.info(`${sound.name} removed successfully`);
  } catch (e) {
    p.error(e);
  }
  return res <= 0 ? false : true;
};

(async () => {
  await db.bootReport();
  p.info("DB Boot report complete");
})();

module.exports = db;
