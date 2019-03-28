const config = require("../../config.json");

const path = require("path");

const p = require("../loggerFactory")("DBUPGRADE_AddSoundID");
const { checksumFile } = require("../bot/bot.shared.js");

module.exports = async function(db) {
  // for each sound file without a checksum value
  let soundsToUpdate = await db.find({ type: "sound", checksum: { $exists: false } });

  // add the 'checksum' field to the sound with the value of checksumFile
  if (soundsToUpdate.length > 0) {
    try {
      await Promise.all(
        soundsToUpdate.map(async sound => {
          let chksum = await checksumFile("sha1", path.join(config.soundStorageFolder, sound.soundFile));
          return await db.update({ _id: sound._id }, Object.assign(sound, { checksum: chksum }));
        })
      );
      p.info("DATABASE UPGRADE COMPLETE");
    } catch (err) {
      p.error("DATABASE UPGRADE ERROR: " + err);
    }
  }
};
