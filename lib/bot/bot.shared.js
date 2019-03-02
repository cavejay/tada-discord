const p = require("../loggerFactory")("Bot.Shared");

const fs = require("fs");

function resolveID(client, id) {
  return client.fetchUser(id).username;
}
// helper function I don't think we use
module.exports.resolveID = resolveID;

function interestingGuildThingFilter(guild) {
  return { name: guild.name, id: guild.id, memberCount: guild.memberCount, region: guild.region };
}
module.exports.g = interestingGuildThingFilter;

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

// things for moving and manipulating files
const renameFile = (path, newPath) =>
  new Promise((res, rej) => {
    fs.rename(path, newPath, (err, data) => (err ? rej(err) : res(data)));
  });

const copyFile = (path, newPath, flags) =>
  new Promise((res, rej) => {
    const readStream = fs.createReadStream(path),
      writeStream = fs.createWriteStream(newPath, { flags });

    readStream.on("error", rej);
    writeStream.on("error", rej);
    writeStream.on("finish", res);
    readStream.pipe(writeStream);
  });

const unlinkFile = path =>
  new Promise((res, rej) => {
    fs.unlink(path, (err, data) => (err ? rej(err) : res(data)));
  });
module.exports.unlinkFile = unlinkFile;

const moveFile = (path, newPath, flags) =>
  renameFile(path, newPath).catch(e => {
    if (e.code !== "EXDEV") throw e;
    else return copyFile(path, newPath, flags).then(() => unlinkFile(path));
  });
module.exports.moveFile = moveFile;
