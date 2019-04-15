const p = require("../loggerFactory")("Bot.VoiceChannels");

const { directMessageUser, g } = require("./bot.shared.js");
const { handleIntroPlayback } = require("./bot.soundplayer.js");

// If someone joins within 10s of leaving then then don't play their intro.
var userIntroTracker = {};

function filterVoiceEvent({ oldMember, newMember, opts }) {
  // make sure the channel is one that I'm allowed in
  return true;
}

function filterVoiceJoinEvent({ oldMember, newMember, opts }) {
  const { config, db } = opts;

  client = newMember.client;

  // If it's me (the bot) I don't care. plz check
  if (newMember.id === newMember.client.user.id) return false;

  // If it's another bot then also don't join. That would be bad
  if (newMember.user.bot) return false;

  // If we can't resolve the userchannel lets just skip
  if (!newMember.voiceChannel) return false;

  // Joining debounce
  if (userIntroTracker[newMember.id]) {
    let timeCheck = {
      old: userIntroTracker[newMember.id].date + config.introDebounce,
      new: new Date() / 1,
      continue: ""
    };
    timeCheck.continue = timeCheck.old < timeCheck.new;
    let introCheck = {
      old: userIntroTracker[newMember.id].intro,
      new: client.userManager.getUserIntro({ uid: newMember.id, gid: newMember.guild.id }),
      continue:
        userIntroTracker[newMember.id].intro !=
        client.userManager.getUserIntro({ uid: newMember.id, gid: newMember.guild.id })
    };
    p.info("Time compare:", timeCheck);
    p.info("Intro Compare: ", introCheck);
    if (timeCheck.continue || introCheck.continue || newMember.guild.id !== oldMember.guild.id) {
      return true;
    } else {
      p.info(
        `User ${newMember.displayName} did not have their intro played due to leaving < ${config.introDebounce}ms ago`
      );
      return false;
    }
  } else {
    return true;
  }
  // Make sure I have the correct permissions to access the channel!
  // todo
}

function filterVoiceLeaveEvent({ oldMember, newMember, opts }) {
  // If the person that left was us.
  if (oldMember.id === oldMember.client.user.id) return false;

  return true;
}

async function handleVoiceJoinEvent({ oldMember, newMember, opts }) {
  const { config, db } = opts;

  const channel = newMember.voiceChannel;
  const member = newMember;

  const tid = { uid: member.id, gid: channel.guild.id };

  // Is this a new user?
  const userCheck = await member.client.userManager.checkUser(tid);
  p.debug("userCheck: " + userCheck);
  if (0 == userCheck) {
    // new users get the basic 'tada' and a PM!
    let msg = `${member.displayName} is not a known user. Creating instance for them now`;
    p.info({ msg, guild: g(channel.guild) });
    // directMessageUser(member.client, member.id, strings.newUserText); //todo  need to message user
    await member.client.userManager.makeNewUser(tid); // .createUser(member.displayName, member.id, config.newUserDefault);
  } else if (userCheck == 1) {
    await member.client.userManager.userNewGuild(tid);
  }

  // get the information from the userManager
  let soundid = await member.client.userManager.getUserIntro(tid);
  if (soundid === "null") {
    let msg = "Something went wrong and we couldn't get the user data?";
    p.error({ msg, guild: g(channel.guild) });
    directMessageUser(
      member.client,
      config.owner,
      `I just broke when ${member.displayName} in ${member.guild.name} attempted to join ${channel}`
    );
    return;
  }

  // store the user's intro and entrance time
  userIntroTracker[member.id] = {
    date: "",
    intro: member.client.userManager.getUserIntro(tid)
  };

  await handleIntroPlayback({ member, soundid, channel, db, config });
}

async function handleVoiceLeaveEvent({ oldMember, newMember, opts }) {
  const { config, db } = opts;

  const tid = { uid: oldMember.id, gid: oldMember.guild.id };

  // Add that user's ID with their leaving time to the userIntroTracker Object
  if (userIntroTracker[oldMember.id]) {
    userIntroTracker[oldMember.id].date = new Date() / 1;
  } else {
    userIntroTracker[oldMember.id] = { date: new Date() / 1, intro: oldMember.client.userManager.getUserIntro(tid) };
  }

  // If user leaves a voice channel and we're still in it
  if (oldMember.voiceChannel.members.array().length == 1) {
    try {
      let msg = "There's only one person left in the voice channel, lets try to leave it incase it's us";
      p.info({ msg, guild: g(oldMember.voiceChannel.guild) });
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
    let msg = `User going from ${oldMember} to ${newMember} has had their voice event filtered.`;
    p.info({ msg, guild: g(newUserChannel.guild) });
    return;
  }

  // If the user is joining a channel and it passes the filter
  if (oldUserChannel === undefined && newUserChannel !== undefined && filterVoiceJoinEvent(...arguments)) {
    let msg = `${newMember.displayName} (${oldMember.id}) joined channel ${newUserChannel.name} in ${
      newUserChannel.guild.name
    } (${newUserChannel.guild.id})`;
    p.info({ msg, guild: g(newUserChannel.guild) });

    // User Joins a voice channel
    directMessageUser(newMember.client, config.owner, msg); // message bot owner

    // If it's not me (the owner) then also skip
    // if (newMember.id !== config.owner) return

    // handle the entry
    await handleVoiceJoinEvent(...arguments);

    // if a user leaves and we pass the filter
  } else if (newUserChannel === undefined && filterVoiceLeaveEvent(...arguments)) {
    let msg = `${oldMember.displayName} left channel ${oldUserChannel.name} in ${oldUserChannel.guild.name} (${
      oldUserChannel.guild.id
    })`;
    p.info({ msg, guild: g(oldUserChannel.guild) });

    await handleVoiceLeaveEvent(...arguments);
  }
}

// return the type of function that the discord channel.listen event expects while recieving the opts from bot
module.exports.handleVoiceChannel = function(opts) {
  p.info("Initialising voice channel event handler");
  return async function(oldMember, newMember) {
    await handleVoiceMaster({ oldMember, newMember, opts });
  };
};
