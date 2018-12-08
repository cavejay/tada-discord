const p = require("../loggerFactory")("Bot.Shared");

function resolveID(client, id) {
  return client.fetchUser(id).username;
}
// helper function I don't think we use
module.exports.resolveID = resolveID;

// helper function to message user. #lazy
function directMessageUser(client, userID, message) {
  p.info(`DMing owner: ${resolveID(client, userID)} to say: '${message.slice(0, 20)}'`);
  client.users
    .get(userID)
    .send(message)
    .then(m => p.info(`Sent message: ${m.content}`))
    .catch(p.error);
}
module.exports.directMessageUser = directMessageUser;
