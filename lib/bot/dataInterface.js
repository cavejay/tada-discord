const p = require("../loggerFactory")("bot.dataInterface");

async function saveIntro({ filename, creator, hash, bytearray }) {
  p.info(`Saving introduction sound data to the database`);

  const newIntro = {
    filename: filename,
    uploader: creator,
    hash: hash,
    soundData: bytearray,
  };

  return await global.db.run((r) =>
    r.table("intros").insert(newIntro, { conflict: "replace" })
  );
}

async function getIntroProp(id, prop) {
  p.debug(`Fetching Intro Property '${prop}' from intro '${id}'`, { prop, id });
  return await global.db.run((r) => r.table("intros").get(id)(prop));
}

async function getIntroFromName(introName) {
  return (
    await global.db.run((r) =>
      r
        .table("intros")
        .filter({ filename: introName })("hash")
        .coerceTo("array")
    )
  )[0];
}

async function getIntroSoundData(id) {
  p.info("fetching intro data");

  return await getIntroProp(id, "soundData");
}

async function getIntrosOfGuild(gid) {
  return await global.db.run(
    (r) => r.table("intros").getField("filename").coerceTo("array")
    // r.table("guilds").get(gid)("availableIntros") // todo reimplement
  );
}

async function getGuildChannelConfig(gid) {
  return [
    {
      id: 123123,
      disabled: false,
    },
  ];
}

async function getGuildProp(gid, prop) {
  return await global.db.run((r) => r.table("guilds").get(gid)(prop));
}

async function validateGuildIntro(gid, intro) {
  return await global.db.run((r) =>
    r.table("guilds").get(gid)("availableIntros").contains(intro)
  );
}

async function getMetaProp(prop) {
  return await global.db.run((r) => r.table("meta").get(0)(prop));
}

async function setMetaProp(prop, newVal) {
  const oldVal = await getMetaProp(prop);

  let updateObj = {};
  updateObj[prop] = newVal;

  p.warn(
    `DB: Setting Meta table property '${prop}' from '${oldVal}' to '${newVal}'`
  );
  return await global.db.run((r) => r.table("meta").get(0).update(updateObj));
}

async function getGuildIds() {
  try {
    return await global.db.run((r) =>
      r.table("guilds")("guildid").coerceTo("array")
    );
  } catch {
    p.warn("getGuildIds errored - returning an empty array instead");
    return [];
  }
}

async function createGuild(gid, defaultIntro, maxTime, prefix, vipUsers) {
  p.info(`Creating a new guild ${gid}`);

  const newGuild = {
    guildid: gid,
    defaultIntro,
    availableIntros: [],
    maxIntroTime: maxTime,
    prefix,
    vipUsers,
    channelConfig: [],
    defaultChannelConfig: await getMetaProp("defaultChannelConfig"),
  };

  p.info(newGuild);

  return await global.db.run((r) => r.table("guilds").insert(newGuild));
}

async function createUser(uid) {
  p.info(`Creating a new user '${uid}'`);

  const newUser = {
    userid: uid,
    guilds: {},
  };

  return await global.db.run((r) =>
    r.table("users").insert(newUser, { conflict: "error" })
  );
}

async function doesUserExist(uid) {
  return await global.db.run((r) =>
    r.table("users").getAll(uid).isEmpty().not()
  );
}

async function getUserProp(uid, prop) {
  return await global.db.run((r) => r.table("users").get(uid)(prop));
}

async function setUserProp(uid, prop, newVal) {
  const oldVal = await getUserProp(uid, prop);

  let updateObj = {};
  updateObj[prop] = newVal;

  p.warn(
    `DB: Setting User '${uid}' property '${prop}' from '${oldVal}' to '${newVal}'`
  );
  return await global.db.run((r) =>
    r.table("users").get(uid).update(updateObj)
  );
}

async function getUserGuilds(uid) {
  return Object.keys(await getUserProp(uid, "guilds"));
}

async function registerUserWithGuild(uid, gid) {
  p.debug(`Adding guild '${gid}' to user '${uid}'`);

  await global.db.run((r) => r.do());
}

async function getUserIntro(gid, uid) {
  p.debug("Getting user's intro:", { gid, uid });
  try {
    const retVal = await global.db.run((r) =>
      r.branch(
        r
          .db("TadaDB_v1")
          .table("users")
          .get(uid)("guilds")
          .keys()
          .contains(gid),
        r.db("TadaDB_v1").table("users").get(uid)("guilds")(gid),
        r.db("TadaDB_v1").table("guilds").get(gid)("defaultIntro")
      )
    );
    p.debug(`User has custom intro for ${gid}: ${retVal}`);
    return retVal;
  } catch {
    p.debug(`User doesn't have custom intro for ${gid} - returning null`);
    return null;
  }
}

async function setUserIntro(gid, uid, introHash) {
  p.debug("Setting User's intro for guild", { gid, uid, introHash });

  // Make sure the intro is available
  if (!(await validateGuildIntro)) {
    // can't set user intro
    // throw `Intro not valid for guild ${gid}`;
  }

  // get current
  let updateObj = {};
  updateObj[gid] = introHash;

  await global.db.run((r) =>
    r
      .db("TadaDB_v1")
      .table("users")
      .get(uid)
      .update({
        guilds: r.row("guilds").merge(updateObj),
      })
  );
}

module.exports = {
  createUser,
  doesUserExist,
  getUserProp,
  getUserGuilds,
  getUserIntro,
  setUserIntro,
  saveIntro,
  getIntroProp,
  getIntroSoundData,
  getIntrosOfGuild,
  getIntroFromName,
  getGuildChannelConfig,
  getGuildProp,
  getGuildIds,
  getMetaProp,
  setMetaProp,
  createGuild,
};
