const p = require("../loggerFactory")("Bot.Shared");

const fs = require("fs");
const crypto = require("crypto");

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
    .catch(e => p.error(e));
}
module.exports.directMessageUser = directMessageUser;

// things for moving and manipulating files
function renameFile(path, newPath) {
  return new Promise((res, rej) => {
    fs.rename(path, newPath, (err, data) => (err ? rej(err) : res(data)));
  });
}

function copyFile(path, newPath, flags) {
  return new Promise((res, rej) => {
    const readStream = fs.createReadStream(path),
      writeStream = fs.createWriteStream(newPath, { flags });

    readStream.on("error", rej);
    writeStream.on("error", rej);
    writeStream.on("finish", res);
    readStream.pipe(writeStream);
  });
}

function unlinkFile(path) {
  return new Promise((res, rej) => {
    fs.unlink(path, (err, data) => (err ? rej(err) : res(data)));
  });
}
module.exports.unlinkFile = unlinkFile;

function moveFile(path, newPath, flags) {
  return renameFile(path, newPath).catch(e => {
    if (e.code !== "EXDEV") throw e;
    else return copyFile(path, newPath, flags).then(() => unlinkFile(path));
  });
}
module.exports.moveFile = moveFile;

function checksumFile(algorithm, path) {
  return new Promise((resolve, reject) =>
    fs
      .createReadStream(path)
      .on("error", reject)
      .pipe(crypto.createHash(algorithm).setEncoding("hex"))
      .once("finish", function() {
        resolve(this.read());
      })
  );
}
module.exports.checksumFile = checksumFile;
