const p = require("../loggerFactory")("bot.voiceEventHandlers");

const {
  playTadaNoise,
  lonelyInAChannelCheck,
  informNewUser,
} = require("./util");
const di = require("./dataInterface");

async function parseOutChannelInfo(ctx, next) {
  ctx.oldState = ctx.data[0];
  ctx.newState = ctx.data[1];
  return await next();
}

async function launchJoinOrLeaveTadaEvent(ctx, next) {
  // If the user is joining a channel and it passes the filter
  if (!ctx.oldState.channel && ctx.newState.channel) {
    let msg = `${ctx.newState.member.user.username} joined channel ${ctx.newState.channel.name} in ${ctx.newState.guild.name}`;
    p.debug({
      msg,
      guild: ctx.newState.guild.id,
      user: ctx.newState.member.user.id,
      channelJoined: ctx.newState.channel.id,
    });
    return ctx.client.emit("tada_userJoinEvent", ctx.data);
  } else if (!ctx.newState.channel) {
    let msg = `${ctx.oldState.member.user.username} left channel ${ctx.oldState.channel.name} in ${ctx.oldState.guild.name}`;
    p.debug({
      msg,
      guild: ctx.oldState.guild.id,
      user: ctx.oldState.member.user.id,
      channelLeft: ctx.oldState.channel.id,
    });
    return ctx.client.emit("tada_userLeaveEvent", ctx.data);
  } else {
    p.info("user just changed channel - default is to not play anything here");
    let msg = `${ctx.oldState.member.user.username} moved channel from ${ctx.oldState.channel.name} in ${ctx.oldState.guild.name} to ${ctx.newState.channel.name} in ${ctx.newState.guild.name}`;
    p.info(msg);
    p.debug({
      msg,
      user: ctx.oldState.member.user.id,
      fromGuild: ctx.oldState.guild.id,
      fromChannel: ctx.oldState.channel.id,
      toGuild: ctx.newState.guild.id,
      toChannel: ctx.newState.channel.id,
    });
    return lonelyInAChannelCheck(ctx.oldState.channel);
  }
}

// Filters out the vc join events based on best practice things (eg. don't continue for this bot)
async function filterTadaJoinEvent_global(ctx, next) {
  // Setup the id's we'll reference during filtering

  ctx.uid = ctx.newState.member.id;
  ctx.gid = ctx.newState.guild.id;
  ctx.cid = ctx.newState.channel.id;

  // If it's me (the bot) I don't care. plz check
  if (ctx.newState.member.id === ctx.client.user.id) return;

  // If it's another bot then also don't join. That would be bad
  if (ctx.newState.member.user.bot) return;

  // If we can't resolve the userchannel lets just skip
  if (!ctx.newState.channel) return;

  return await next();
}

async function logTadaJoinEvent(ctx, next) {
  let msg = `${ctx.newState.member.user.username} joined channel ${ctx.newState.channel.name} in ${ctx.newState.guild.name}`;
  p.info(msg);
  return await next();
}

async function filterTadaJoinEvent_guild(ctx, next) {
  // Does the guild allow users in this channel?
  const channelconfig = await di.getGuildChannelConfig(ctx.gid, ctx.cid);
  if (channelconfig.disabled) return;

  return await next();
}

async function filterTadaJoinEvent_user(ctx, next) {
  // Check if the user exists?
  const userExists = await di.doesUserExist(ctx.uid);
  if (!userExists) {
    // setup the new user
    await di.createUser(ctx.uid, ctx.gid);

    // Tell the new user wtf this is
    await informNewUser(
      ctx.newState.member.user,
      ctx.newState.member.guild,
      ctx.client
    );
  }

  // Fetch and store the user's intro here
  ctx.currentUsersIntro = await di.getUserIntro(ctx.gid, ctx.uid);

  // Does the user have their intro disabled?
  if (ctx.currentUsersIntro == "disabled") return;

  // Have we seen this user too recently to trigger again so soon?
  // todo

  return await next();
}

async function actionTadaJoinEvent(ctx, next) {
  // get guild's intro length
  const introTime = await di.getGuildProp(ctx.gid, "maxIntroTime");

  const introId = !ctx.currentUsersIntro
    ? await di.getGuildProp(ctx.gid, "defaultIntro")
    : ctx.currentUsersIntro;

  // if the guild's intro is disabled we should also skip here:
  if (introId == "disabled") {
    p.debug(
      "Skipping playback - User didn't have a specific intro and guild default is disabled"
    );
    return;
  }

  // Get the Guild specific Volume
  const { volume: introVolume } = await di.getGuildIntroConfig(
    ctx.gid,
    introId
  );
  p.debug("Volume for this intro is", introVolume);

  await playTadaNoise(introId, ctx.newState.channel, introTime, introVolume);

  return await next();
}

async function actionTadaLeaveEvent(ctx, next) {
  let msg = `${ctx.oldState.member.user.username} left channel ${ctx.oldState.channel.name} in ${ctx.oldState.guild.name}`;
  p.info(msg);
  lonelyInAChannelCheck(ctx.oldState.channel);
  return await next();
}

module.exports = {
  parseOutChannelInfo,
  launchJoinOrLeaveTadaEvent,
  filterTadaJoinEvent_global,
  logTadaJoinEvent,
  filterTadaJoinEvent_guild,
  filterTadaJoinEvent_user,
  actionTadaJoinEvent,
  actionTadaLeaveEvent,
};
