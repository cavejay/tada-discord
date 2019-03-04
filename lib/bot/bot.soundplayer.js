const p = require("../loggerFactory")("Bot.soundPlayer");

const path = require("path");

const { g } = require("./bot.shared.js");

async function playIntro({ member, intro, channel, db, config }) {
  let dispatcher;

  if (intro.type === "file") {
    let soundFile = await db.getSoundFileFromName(intro.key);
    soundFile = path.join(".", config.soundStorageFolder, soundFile);

    // Cover our butts incase we're already intro'ing
    if (channel.connection) {
      // We're already in this channel
      p.info(`Bot is already in ${channel.name}`);
    } else {
      let connection = await channel.join();
      let msg = `Bot has joined channel ${channel.name} to 'tada' ${member.displayName} with preferred sound of '${
        intro.key
      }'`;
      p.info({ msg, guild: g(channel.guild) });

      // create the dispatcher to play the tada noise
      dispatcher = await connection.playFile(soundFile);
    }

    p.info(`Playing from ${soundFile}`);
  }

  dispatcher.on("start", s => {
    setTimeout(() => {
      // If the dispatcher hasn't ended then end it
      if (!dispatcher.destroyed) {
        p.info(`Ending dispatcher at ${config.maxIntroTime}ms`);
        dispatcher.end("Max video time reached");
      }
    }, config.maxIntroTime);
  });

  // when it ends let us know
  dispatcher.on("end", () => {
    // log finishing
    let msg = `Bot has finished 'tadaing' ${member.displayName} in channel ${channel.name}`;
    p.info({ msg, guild: g(channel.guild) });

    // leave the channel
    channel.leave();
  });

  dispatcher.on("error", err => {
    p.error("dispatcher error:", err);
  });
}

module.exports.handleIntroPlayback = playIntro;
