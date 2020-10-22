const p = require("../loggerFactory")("bot.voiceutils");

const fs = require("fs");
const crypto = require("crypto");
const { Readable } = require("stream");

const getStream = require("get-stream");

const { getUsersIntro } = require("./dataInterface");

function lonelyInAChannelCheck(channel) {
  // If user leaves a voice channel and we're still in it
  if (channel.members.keyArray().length === 1) {
    let msg = `T_T Lonely in ${channel.name}/${channel.guild.name} - will leave now`;
    p.info(msg);
    p.debug({ msg, guild: channel.guild.id, channel: channel.id });
    channel.leave();
  }
}

// helper function to message user. #lazy
function directMessageUser(client, userID, message) {
  // Should probably have a log message here todo

  // what a lovely async promise chain
  client.users
    .fetch(userID)
    .then((u) => u.send(message))
    .then((m) => p.info(`Sent message: ${m.content}`))
    .catch((e) => p.error(e));
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

async function playTadaNoise2(channel, maxIntroTime) {
  if (channel.connection) {
    // We're already in this channel
    p.info(`Bot is already in ${channel.name}`);
    return;
  }

  const soundData = await getUsersIntro({ user: "user1" });
  const readable = new Readable();
  readable._read = () => {}; // _read is required but you can noop it
  readable.push(soundData);
  readable.push(null);

  // Cover our butts incase we're already intro'ing
  let connection = await channel.join();
  let msg = `Bot has joined channel ${channel.name} to 'tada' someone`;
  p.info({ msg });

  // create the dispatcher to play the tada noise
  const dispatcher = await connection.play(readable);

  p.info(`Playing from db`);
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

function hashBuffer(buffer, hash = "sha256") {
  // Make a hash from the buffer
  let hasher = crypto.createHash(hash);
  hasher.update(buffer);
  return hasher.digest(hash).toString("hex");
}

async function openFileBuffer(filename) {
  const res = fs.createReadStream(filename);
  return await getStream.buffer(res, "latin1");
}

module.exports = {
  lonelyInAChannelCheck,
  playTadaNoise: playTadaNoise2,
  directMessageUser,
  hashBuffer,
  openFileBuffer,
};