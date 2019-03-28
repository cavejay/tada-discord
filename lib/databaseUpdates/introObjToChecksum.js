const p = require("../loggerFactory")("DBUPGRADE_IntroObj_tofileChecksum");
module.exports = async function(db) {
  // for each entry without a type
  let usersToUpdate = await db.find({ type: "user", "intro.type": { $exists: true } });

  // add the 'type' field. sounds if 'soundFile' exists or users if 'userID' exists
  if (usersToUpdate.length > 0) {
    try {
      await Promise.all(
        usersToUpdate.map(async entry => {
          // find the checksum of the intro they're using
          const soundChecksum = await db.findOne({ type: "sound", name: entry.intro.key }, { _id: 0, checksum: 1 });

          // Update the intro of their user log
          entry.intro = soundChecksum.checksum;

          // p.info(entry);
          // Send the update
          return await db.update({ _id: entry._id }, entry);
        })
      );
      p.info("DATABASE UPGRADE COMPLETE");
    } catch (err) {
      p.error("DATABASE UPGRADE ERROR: " + err);
    }
  }
};
