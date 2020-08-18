const p = require("../loggerFactory")("bot.dataInterface");

const r = require("rethinkdb");

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

module.exports = { getGuildChannelConfig, saveIntro, getIntro };
