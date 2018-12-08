const p = require("../loggerFactory")("Bot.VoiceChannels");
const path = require("path");
const ytdl = require("ytdl-core");

const { directMessageUser } = require("./bot.shared.js");

var playingIntro = false;

function filterVoiceEvent({ oldMember, newMember, opts }) {
  // make sure the channel is one that I'm allowed in
  return true;
}

function filterVoiceJoinEvent({ oldMember, newMember, opts }) {
  // If it's me (the bot) I don't care. plz check
  if (newMember.id === newMember.client.user.id) return false;

  // If it's another bot then also don't join. That would be bad
  if (newMember.user.bot) return false;

  // If we can't resolve the userchannel lets just skip
  if (!newMember.voiceChannel) return false;

  // Make sure I have the correct permissions to access the channel!
  // todo

  return true;
}

function filterVoiceLeaveEvent({ oldMember, newMember, opts }) {
  return true;
}

async function handleVoiceJoinEvent({ oldMember, newMember, db, config }) {
  const channel = newMember.voiceChannel;
  const member = newMember;

  // Is this a new user?
  if (null === (await db.getUser(member.id))) {
    // new users get the basic 'tada' and a PM!
    p.info(`${member.displayName} is not a known user. Creating instance for them now`);
    directMessageUser(member.id, strings.newUserText);
    await db.makeUser(member.displayName, member.id, config.newUserDefault);
  }

  // get the information from the db
  let chosenIntro = await db.getUserIntro(member.id);
  if (chosenIntro === "null") {
    p.error("Something went wrong and we couldn't get the user data?");
    return;
  }

  let dispatcher;

  // stream yt (deprecated. Takes too long to start the stream :()
  if (chosenIntro.type === "yt") {
    let connection = await channel.join();
    p.info(
      `Bot has joined channel ${channel.name} to 'tada' ${member.displayName} with a snippet from a youtube video: '${
        chosenIntro.url
      }'`
    );

    const streamOptions = { seek: 0, volume: 1 };
    const stream = ytdl(chosenIntro.url, { filter: "audioonly" });

    // create the dispatcher to play the tada noise
    dispatcher = await connection.playStream(stream, streamOptions);
    p.info(`Playing from ${chosenIntro.url}`);

    // play a sound
  } else if (chosenIntro.type === "file") {
    let soundFile = await db.getSoundFileFromName(chosenIntro.key);
    soundFile = path.join(".", config.soundStorageFolder, soundFile);

    // Cover our butts incase we're already intro'ing
    if (channel.connection) {
      // We're already in this channel
      p.info(`Bot is already in ${channel.name}`);
    } else {
      let connection = await channel.join();
      p.info(
        `Bot has joined channel ${channel.name} to 'tada' ${member.displayName} with preferred sound of '${
          chosenIntro.key
        }'`
      );

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
    p.info(`Bot has finished 'tadaing' ${member.displayName} in channel ${channel.name}`);

    // leave the channel
    channel.leave();
  });

  dispatcher.on("error", err => {
    p.error("dispatcher error:", err);
  });
}

async function handleVoiceLeaveEvent({ oldMember, newMember, db, config }) {
  // If user leaves a voice channel and we're still in it
  if (oldMember.voiceChannel.members.keyArray.length === 1) {
    try {
      p.info("There's only one person left in the voice channel, lets try to leave it incase it's us");
      oldMember.voiceChannel.leave();
    } catch (e) {
      p.error(e);
    }
  }
}

async function handleVoiceMaster({ oldMember, newMember, opts }) {
  const { db, config } = opts;
  let newUserChannel = newMember.voiceChannel;
  let oldUserChannel = oldMember.voiceChannel;

  // only run if we're meant to
  if (!filterVoiceEvent(...arguments)) {
    p.info(`User going from ${oldMember} to ${newMember} has had their voice event filtered.`);
    return;
  }

  // If the user is joining a channel and it passes the filter
  if (oldUserChannel === undefined && newUserChannel !== undefined && filterVoiceJoinEvent(...arguments)) {
    let msg = `${newMember.displayName} joined channel ${newUserChannel.name}`;
    p.info(msg);

    // User Joins a voice channel
    directMessageUser(newMember.client, config.owner, msg); // message bot owner

    // If it's not me (the owner) then also skip
    // if (newMember.id !== config.owner) return

    // handle the entry
    await handleVoiceJoinEvent({ newMember, newUserChannel, db, config });

    // if a user leaves and we pass the filter
  } else if (newUserChannel === undefined && filterVoiceLeaveEvent(...arguments)) {
    let msg = `${oldMember.displayName} left channel ${oldUserChannel.name}`;
    p.info(msg);

    await handleVoiceLeaveEvent({ oldMember, newMember, db, config });
  }
}

// return the type of function that the discord channel.listen event expects while recieving the opts from bot
module.exports.handleVoiceChannel = function(opts) {
  p.info("Initialising voice channel event handler");
  return async function(oldMember, newMember) {
    handleVoiceMaster({ oldMember, newMember, opts });
  };
};
