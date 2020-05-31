const p = require("../loggerFactory")("bot.voiceutils");

function lonelyInAChannelCheck(channel) {
  // If user leaves a voice channel and we're still in it
  if (channel.members.keyArray().length === 1) {
    let msg = `T_T Lonely in ${channel.name}/${channel.guild.name} - will leave now`;
    p.info(msg);
    p.debug({ msg, guild: channel.guild.id, channel: channel.id });
    channel.leave();
  }
}

async function playTadaNoise(channel, maxIntroTime) {
  if (channel.connection) {
    // We're already in this channel
    p.info(`Bot is already in ${channel.name}`);
    return;
  }

  soundFile = "./sounds/tada.mp3";

  // Cover our butts incase we're already intro'ing
  let connection = await channel.join();
  let msg = `Bot has joined channel ${channel.name} to 'tada' someone`;
  p.info({ msg });

  // create the dispatcher to play the tada noise
  const dispatcher = await connection.play(soundFile);

  p.info(`Playing from ${soundFile}`);
  dispatcher.on("start", (s) => {
    setTimeout(() => {
      // If the dispatcher hasn't ended then end it
      if (!dispatcher.destroyed) {
        p.info(`Ending dispatcher at ${maxIntroTime}ms`);
        dispatcher.end("Max video time reached");
      }
    }, maxIntroTime);
  });

  // when it ends let us know
  dispatcher.on("speaking", (isSpeaking) => {
    if (!isSpeaking) {
      let msg = `Bot has finished 'tadaing' in channel ${channel.name}`;
      p.info({ msg });

      // leave the channel
      channel.leave();
    }
  });

  dispatcher.on("error", (err) => {
    p.error("dispatcher error:", err);
  });
}

module.exports = {
  lonelyInAChannelCheck,
  playTadaNoise,
};