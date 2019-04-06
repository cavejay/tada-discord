// const Datastore = require("nedb");
const Datastore = require("nedb-promise");
const p = require("./loggerFactory")("Database");

let db = {};

/**
 * Examples of Current data types... for reminding
 */
const defaultUser = {
  type: "user",
  userid: "12313415151234151",
  presence: {
    "11512319287198237": {
      // guildid here
      intro: "5ecb17ce781bc41597228f8c1032e25f18b64e46"
    }
  }
};

const defaultSound = {
  type: "sound",
  soundFile: "tada.mp3",
  name: "tada",
  volume: 1,
  presence: {
    "11512319287198237": {
      // guildid here
      name: "tada",
      volume: 0.3
    }
  },
  checksum: "f0b15c4046f289702dac44a43f58d1614081ed5a"
};

const defaultGuild = {
  type: "guild",
  guildid: "12313415151234151",
  prefix: "plzstoptada",
  newUserDefault: "f0b15c4046f289702dac44a43f58d1614081ed5a"
};

db.schema = {
  constructUser: function(uid, firstGuild, firstGuildIntro) {
    let pres = {};
    pres[firstGuild] = firstGuildIntro;
    return {
      userid: uid,
      presence: pres
    };
  },
  constructSound: function(file, name, checksum) {
    return {
      soundFile: file,
      name: name,
      volume: 1,
      presence: {},
      checksum: checksum
    };
  },
  constructGuild: function(gid, prefix, defaultIntro) {
    return {
      guildid: gid,
      prefix: prefix,
      newUserDefault: defaultIntro
    };
  }
};

// todo should pass in the process.env.dbFile

db.raw = new Datastore({
  filename: process.env.dbFile || "/home/cj/proj/tada-discord/tada.db",
  autoload: true
});

const dbUpgrades = {
  ensureTypes: require("./databaseUpdates/addDataTypes"),
  ensureSoundIDs: require("./databaseUpdates/addSoundIDs"),
  upgradeUserIntros: require("./databaseUpdates/introObjToChecksum")
};

db.bootReport = async function bootReport() {
  // Perform any updates first
  for (const upgrade in Object.values(dbUpgrades)) {
    await Object.values(dbUpgrades)[upgrade](db.raw);
  }

  p.info("This would be the on boot report for the database");

  // User count and list
  let usersData = await db.raw.find({ type: "user" }, { name: 1, _id: 0, presence: 1, userid: 1 });
  users = Object.values(usersData).map(
    u => `${u.userid} ~ ${Object.keys(u.presence).map(k => `${k}|${u.presence[k]}`)}`
  );
  // p.info(users)
  p.info(`List of Users:\n - ${users.sort().join("\n - ")}`);

  // Intro count, list and spread.

  // Sound Files in database list
  let soundFiles = await db.raw.find({ soundFile: { $exists: true } }, { soundFile: 1, _id: 0 });
  soundFiles = Object.values(soundFiles).map(f => `${f.soundFile}`);
  p.info(`List of currently known and valid sound files:\n - ${soundFiles.sort().join("\n - ")}`);

  p.info("DB Boot report complete");
};

//

db.getObject = async function getObject({ dbCall, query }) {
  p.debug(`Running GET-OBJECT from ${dbCall} -- query: ${JSON.stringify(query)}`);
  return await db.raw.findOne(query);
};

db.getGuildObject = async function getGuildObject({ gid }) {
  return await db.getObject({
    dbCall: "getGuildObject",
    query: {
      type: "guild",
      guildid: gid
    }
  });
};

//

db.getField = async function getField({ dbCall, query, field }) {
  p.debug(`Running GET from ${dbCall} -- query: ${JSON.stringify(query)}, field: ${field}`);
  const res = await db.raw.findOne(query);
  if (res === undefined || res === null) {
    p.debug(`Returned GET from ${dbCall} -- query: ${JSON.stringify(query)}, result: null`);
    return null;
  }
  p.debug(`Returned GET from ${dbCall} -- query: ${JSON.stringify(query)}, result: ${res[field]}`);
  return res[field];
};

db.getUserField = async function getUserField({ uid, field }) {
  return await db.getField({
    dbCall: "getUserField",
    query: { userid: uid, type: "user" },
    field
  });
};

db.getSoundField = async function getSoundField({ checksum, field }) {
  return await db.getField({ dbCall: "getSoundField", query: { checksum: checksum, type: "sound" }, field });
};

db.getGuildField = async function getGuildField({ gid, field }) {
  return await db.getField({ dbCall: "getGuildField", query: { guildid: gid, type: "guild" }, field });
};

//

db.getAllOfType = async function getAllOfType({ dbCall, type }) {
  p.debug(`Running GETALL from ${dbCall} -- type: ${type}`);
  const res = await db.raw.find({ type: type });
  p.debug(`Returned GETALL from ${dbCall} -- count: ${res.length}`);
  return res;
};

db.getAllSounds = async function getAllSounds() {
  return await db.getAllOfType({ dbCall: "getAllSounds", type: "sound" });
};

db.getAllUsers = async function getAllUsers() {
  return await db.getAllOfType({ dbCall: "getAllUsers", type: "user" });
};

//

db.update = async function update({ dbCall, query, updateDescription }) {
  p.debug(`Running UPDATE from ${dbCall} -- query: ${query}, updateCommand: ${updateDescription}`);
  return await db.raw.update(query, updateDescription);
};

db.updateUserField = async function updateUserField({ uid, field, value }) {
  let desc = {};
  desc[field] = value;
  return await db.update({
    dbCall: "UpdateUserField",
    query: { type: "user", userid: uid },
    updateDescription: {
      $set: desc
    }
  });
};

db.updateIntroField = async function updateIntroField({ chksum, field, value }) {
  let desc = {};
  desc[field] = value;
  return await db.update({
    dbCall: "UpdateIntroField",
    query: { type: "sound", checksum: chksum },
    updateDescription: {
      $set: desc
    }
  });
};

//

db.insertObject = async function insertObject({ dbCall, document }) {
  p.debug(`Running INSERT from ${dbCall} -- type: ${document.type}, document: ${document}`, document);
  return await db.raw.insert(document);
};

db.insertUser = async function insertUser({ userDoc }) {
  return await db.insertObject({
    dbCall: "insertUser",
    document: Object.assign(userDoc, { type: "user" })
  });
};

db.insertSound = async function insertSound({ soundDoc }) {
  return await db.insertObject({
    dbCall: "insertSound",
    document: Object.assign(soundDoc, { type: "sound" })
  });
};

db.insertGuild = async function insertGuild({ guildDoc }) {
  return await db.insertObject({
    dbCall: "insertGuild",
    document: Object.assign(guildDoc, { type: "guild" })
  });
};

//

db.deleteObject = async function deleteObject({ dbCall, query }) {
  p.debug(`Running DELETE from ${dbCall} -- query: ${JSON.stringify(query)}`);
  const res = await db.raw.remove(query);
  p.debug(`Returned DELETE from ${dbCall} -- #documentsRemoved: ${res}`);
  return res;
};

db.deleteSound = async function deleteSound({ checksum }) {
  return await db.deleteObject({
    dbCall: "deleteSound",
    query: {
      type: "sound",
      checksum: checksum
    }
  });
};

// (async () => {
//   await db.bootReport();
// })();

module.exports = db;
