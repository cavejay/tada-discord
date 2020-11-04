const p = require("../loggerFactory")("bot.dataInterface");

async function getGuildChannelConfig(gid) {
  return [
    {
      id: 123123,
      disabled: false,
    },
  ];
}

async function getUserIntro(gid, uid) {
  return {
    status: "active",
  };
}

module.exports = { getGuildChannelConfig, getUserIntro };
