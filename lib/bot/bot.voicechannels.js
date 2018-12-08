const p = require("../loggerFactory")("Bot.VoiceChannels");

const { directMessageUser } = require("./bot.shared.js");
const { handleIntroPlayback } = require("./bot.soundplayer.js");

// will populate as people join and leave and rejoin within periods of time
var userIntroTracker = {};

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
    directMessageUser(member.client, member.id, strings.newUserText);
    await db.makeUser(member.displayName, member.id, config.newUserDefault);
  }

  // get the information from the db
  let chosenIntro = await db.getUserIntro(member.id);
  if (chosenIntro === "null") {
    p.error("Something went wrong and we couldn't get the user data?");
    directMessageUser(
      member.client,
      config.owner,
      `I just broke when ${member.displayName} in ${member.guild.name} attempted to join ${channel}`
    );
    return;
  }

  await handleIntroPlayback({ member, intro: chosenIntro, channel, db, config });
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
