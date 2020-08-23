const p = require("../loggerFactory")("bot.dataInterface");

async function saveIntro({ filename, creator, hash, bytearray }) {
  p.info(`Saving uploaded into to the database`);

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

async function getIntro({ user }) {
  p.info("fetching intro data");

  return await global.db.run((r) =>
    r
      .table("intros")
      .get("d88ec241c714368add0f383ebfbdab3bf2e9c4fafe4bec961a4a4e7d012060f7")(
      "soundData"
    )
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
  // return global.db.run((r) => r.table("guilds").get(gid)(prop));
}

async function getGuildIds() {
  try {
    return await global.db.run((r) =>
      r.table("guilds").getAll()("guildid").coerceTo("array")
    );
  } catch {
    p.warn("getGuildIds errored - returning an empty arrary instead");
    return [];
  }
}

async function createGuild(gid, defaultIntro, maxTime, prefix, vipUsers) {
  p.info(`Creating a new guild ${gid}`);

  const newGuild = { guildid: gid, defaultIntro, maxTime, prefix, vipUsers };

  p.info(newGuild);

  return await global.db.run((r) => r.table("guilds").insert(newGuild));
}

async function createUser(uid) {
  p.info(`Creating a new user '${uid}'`);

  const newUser = { userid: uid };

  return await global.db.run((r) =>
    r.table("users").insert(newUser, { conflict: "error" })
  );
}

async function addUserToGuild(uid, gid) {
  p.info(`A user has appeared in a guild - add that guild info to the user`);
}

async function getUserGuilds(uid) {
  try {
    return await global.db.run((r) => r.table("users").get(uid)("guilds"));
  } catch {
    return null;
  }
}

async function getUserIntro(gid, uid) {
  try {
    return await global.db.run((r) => r.table("users").get(uid)("guilds"));
  } catch {
    return null;
  }
}

module.exports = {
  getGuildChannelConfig,
  getUserIntro,
  createUser,
  saveIntro,
  getIntro,
  getUserGuilds,
  getGuildProp,
  getGuildIds,
  createGuild,
};
