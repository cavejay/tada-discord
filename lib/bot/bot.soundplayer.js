const p = require("../loggerFactory")("Bot.soundPlayer");

const path = require("path");

const { g } = require("./bot.shared.js");

let playingIntro = false;

async function handleIntroPlayback({ member, soundid, channel, db, config }) {
  let dispatcher;

  // Get the sound file
  let soundFile = await member.client.soundManager.getSoundFileOfChecksum({ checksum: soundid });
  soundFile = path.join(".", config.soundStorageFolder, soundFile);

  // Cover our butts incase we're already intro'ing
  if (channel.connection) {
    // We're already in this channel
    p.info(`Bot is already in ${channel.name}`);
    if ((playingIntro = false)) {
      channel.leave();
    }
    return;
  } else {
    let connection = await channel.join();
    let msg = `Bot has joined channel ${channel.name} to 'tada' ${
      member.displayName
    } with preferred sound of '${soundid}'`;
    p.info({ msg, guild: g(channel.guild) });

    // create the dispatcher to play the tada noise
    p.info(process.cwd());
    dispatcher = await connection.playFile("/home/cj/proj/tada-discord/sounds/tada.mp3");
  }

  p.info(`Playing from ${soundFile}`);

  dispatcher.on("start", s => {
    playingIntro = true;
    // setTimeout(() => {
    //   // If the dispatcher hasn't ended then end it
    //   if (!dispatcher.destroyed) {
    //     p.info(`Ending dispatcher at ${config.maxIntroTime}ms`);
    //     dispatcher.end("Max video time reached");
    //   }
    // }, config.maxIntroTime);
  });

  // when it ends let us know
  dispatcher.on("end", () => {
    // log finishing
    let msg = `Bot has finished 'tadaing' ${member.displayName} in channel ${channel.name}`;
    p.info({ msg, guild: g(channel.guild) });

    // leave the channel
    playingIntro = false;
    channel.leave();
  });

  dispatcher.on("error", err => {
    p.error("dispatcher error:", err);
  });
}

module.exports.handleIntroPlayback = handleIntroPlayback;
