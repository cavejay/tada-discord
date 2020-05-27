const p = require("../loggerFactory")("bot.textEventHandlers");

module.exports = {};

module.exports.filterMessageEvent = async function filterMessageEvent(ctx, next) {
  const message = ctx.data;
  // If it's not this bot continue - else just print
  if (message.author.id !== message.client.user.id) {
    return await next();
  }
  p.debug(`Text Channel message '${message}' was filtered as not unnecessary`);
};

module.exports.logMessageEvent = async function logMessageEvent(ctx, next) {
  const message = ctx.data;
  p.info(`Text Channel message '${message.content.slice(0, 20)}' was seen in ${message.channel.name}`);
  return await next();
};

module.exports.actionDirectMessageEvent = async function actionDirectMessageEvent(ctx, next) {
  const message = ctx.data;
  if (message.channel.type == "dm") {
    p.info(`We were messaged directly '${message}' from ${message.author.username}`);
  }
  return await next();
};
