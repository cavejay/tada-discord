const p = require("../loggerFactory")("bot.dataInterface");

async function saveIntro({ name, filename, creator, hash, bytearray }) {
  p.info(`Saving introduction sound data to the database`);

  const newIntro = {
    name: name || filename.split(".mp3")[0],
    filename: filename,
    uploader: creator,
    hash: hash,
    soundData: bytearray,
  };

  // todo handle please
  const response = await global.db.run((r) =>
    r.table("intros").insert(newIntro, { conflict: "replace" })
  );

  return hash;
}

async function getIntroProp(id, prop) {
  p.debug(`Fetching Intro Property '${prop}' from intro '${id}'`, { prop, id });
  return await global.db.run((r) => r.table("intros").get(id)(prop));
}

async function getIntroFromName(introName) {
  return (
    await global.db.run((r) =>
      r.table("intros").filter({ name: introName })("hash").coerceTo("array")
    )
  )[0];
}

async function getIntroSoundData(id) {
  p.info("fetching intro data");

  return await getIntroProp(id, "soundData");
}

async function getIntrosOfGuild(gid, includeIntroName = false) {
  // todo dedupe this function and do a branch in the db query
  if (includeIntroName) {
    return await global.db.run((r) =>
      r
        .do(
          r
            .table("guilds")
            .get(gid)("availableIntros")
            .setInsert(r.table("guilds").get(gid)("defaultIntro")),
          function (introids) {
            return r
              .table("intros")
              .getAll(r.args(introids))
              .pluck("name", "hash");
          }
        )
        .coerceTo("array")
    );
  } else {
    return await global.db.run((r) =>
      r
        .table("guilds")
        .get(gid)("availableIntros")
        .setInsert(r.table("guilds").get(gid)("defaultIntro"))
    );
  }
}

async function getGuildChannelConfig(gid, cid) {
  p.debug({
    msg: `Getting channel config for channel '${cid}' in guild '${gid}'`,
    action: "getGuildChannelConfig",
    gid,
    cid,
  });
  return await global.db.run((r) =>
    r.branch(
      r
        .db(global.db.getDBName())
        .table("guilds")
        .get(gid)("channelConfig")
        .keys()
        .contains(cid),
      r.db(global.db.getDBName()).table("guilds").get(gid)("channelConfig")(
        cid
      ),
      r.db(global.db.getDBName()).table("guilds").get(gid)(
        "defaultChannelConfig"
      )
    )
  );
}

async function getGuildProp(gid, prop) {
  return await global.db.run((r) => r.table("guilds").get(gid)(prop));
}

async function setGuildProp(gid, prop, newVal) {
  const oldVal = await getGuildProp(gid, prop);

  let updateObj = {};
  updateObj[prop] = newVal;

  p.warn(
    `DB: Setting guild '${gid}' property '${prop}' from '${oldVal}' to '${newVal}'`
  );
  return await global.db.run((r) =>
    r.table("guilds").get(gid).update(updateObj)
  );
}

async function addIntroToGuild(gid, introid) {
  return await global.db.run((r) =>
    r
      .table("guilds")
      .get(gid)
      .update({ availableIntros: r.row("availableIntros").append(introid) })
  );
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
    channelConfig: {},
    defaultChannelConfig: await getMetaProp("defaultChannelConfig"),
  };

  p.info(newGuild);

  return await global.db.run((r) => r.table("guilds").insert(newGuild));
}

async function createUser(uid, gid) {
  p.info(`Creating a new user '${uid}'`);

  let guildsObj = {};
  if (gid) guildsObj[gid] = null;

  const newUser = {
    userid: uid,
    guilds: guildsObj,
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

async function ensureUserGuildConnection(uid, gid) {
  // Check to make sure the user exists
  const userExists = await doesUserExist(uid);
  if (!userExists) {
    p.info(`User didn't exist so we will create one`);
    return await createUser(uid, gid);
  } else {
    return await global.db.run((r) =>
      r.branch(
        r.table("users").get(uid)("guilds").keys().contains(gid).not(),
        r
          .table("users")
          .get(uid)
          .update({ guilds: r.object(gid, null) }),
        { res: "no update needed" }
      )
    );
  }
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
  const guildsObj = await getUserProp(uid, "guilds");
  return Object.keys(guildsObj);
}

async function getUserIntro(gid, uid) {
  p.debug({
    msg: `Getting user '${uid}'s configured intro for guild '${gid}'`,
    action: "getUserIntro",
    gid,
    uid,
  });
  try {
    const retVal = await global.db.run((r) =>
      r
        .db(global.db.getDBName())
        .table("users")
        .get(uid)("guilds")(gid)
        .default(
          r.db(global.db.getDBName()).table("guilds").get(gid)("defaultIntro")
        )
    );
    p.debug(`User has custom intro for ${gid}: ${retVal}`);
    return retVal;
  } catch {
    p.debug(
      `User doesn't have custom intro for ${gid} - return the guild default`
    );
    return await global.db.run((r) =>
      r.db(global.db.getDBName()).table("guilds").get(gid)("defaultIntro")
    );
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
      .table("users")
      .get(uid)
      .update({
        guilds: r.row("guilds").merge(updateObj),
      })
  );
}

async function removeUserIntro(gid, uid) {
  p.debug({
    msg: `removing all intro settings for guild '${gid}' from user  '${uid}'`,
    action: "removeUserIntro",
    gid,
    uid,
  });
  await global.db.run((r) =>
    r
      .table("users")
      .get(uid)
      .update({
        guilds: r.row("guilds").merge(r.object(gid, null)),
      })
  );
}

module.exports = {
  createUser,
  doesUserExist,
  ensureUserGuildConnection,
  getUserProp,
  getUserGuilds,
  getUserIntro,
  setUserIntro,
  removeUserIntro,

  saveIntro,
  getIntroProp,
  getIntroSoundData,
  getIntroFromName,

  createGuild,
  getGuildProp,
  setGuildProp,
  getGuildIds,
  getGuildChannelConfig,
  getIntrosOfGuild,
  addIntroToGuild,
  getMetaProp,
  setMetaProp,
};
