const p = require("../loggerFactory")("bot.voiceEventHandlers");

const { playTadaNoise, lonelyInAChannelCheck } = require("./util");
const di = require("./dataInterface");

module.exports = {};

module.exports.parseOutChannelInfo = async function parseOutChannelInfo(ctx, next) {
  ctx.oldState = ctx.data[0];
  ctx.newState = ctx.data[1];
  return await next();
};

module.exports.launchJoinOrLeaveTadaEvent = async function launchJoinOrLeaveTadaEvent(ctx, next) {
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
};

// Filters out the vc join events based on best practice things (eg. don't continue for this bot)
module.exports.filterTadaJoinEvent_global = async function filterTadaJoinEvent(ctx, next) {
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
};

module.exports.logTadaJoinEvent = async function logTadaJoinEvent(ctx, next) {
  let msg = `${ctx.newState.member.user.username} joined channel ${ctx.newState.channel.name} in ${ctx.newState.guild.name}`;
  p.info(msg);
  return await next();
};

module.exports.filterTadaJoinEvent_guild = async function guildFilterTadaJoinEvent(ctx, next) {
  // Does the guild allow users in this channel?
  const disabledChannels = (await di.getGuildChannelConfig(ctx.gid)).map((c) => {
    if (c.disabled) return c.id;
  });
  if (disabledChannels.includes(ctx.cid)) return;

  return await next();
};

module.exports.filterTadaJoinEvent_user = async function userFilterTadaJoinEvent(ctx, next) {
  // Check if the user exists?
  const uIntro = await di.getUserIntro(ctx.gid, ctx.uid);
  if ((uIntro = undefined)) {
    // setup the new user
    await di.createUser(ctx.gid, ctx.uid);
  }

  // Does the user have their intro disabled?
  else if (uIntro.status !== "active") return;

  // Have we seen this user too recently to trigger again so soon?

  return await next();
};

module.exports.actionTadaJoinEvent = async function actionTadaJoinEvent(ctx, next) {
  await playTadaNoise(ctx.newState.channel, ctx.cfg.maxIntroTime);
};

module.exports.actionTadaLeaveEvent = async function (ctx, next) {
  let msg = `${ctx.oldState.member.user.username} left channel ${ctx.oldState.channel.name} in ${ctx.oldState.guild.name}`;
  p.info(msg);
  lonelyInAChannelCheck(ctx.oldState.channel);
  return await next();
};