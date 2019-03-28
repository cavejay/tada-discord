const p = require("../loggerFactory")("DBUPGRADE_AddDataType");
module.exports = async function(db) {
  // for each entry without a type
  let entriesToUpdate = await db.find({ type: { $exists: false } });

  // add the 'type' field. sounds if 'soundFile' exists or users if 'userID' exists
  if (entriesToUpdate.length > 0) {
    try {
      await Promise.all(
        entriesToUpdate.map(async entry => {
          const type = entry.userID !== undefined ? "user" : "sound";
          return await db.update({ _id: entry._id }, Object.assign(entry, { type: type }));
        })
      );
      p.info("DATABASE UPGRADE COMPLETE");
    } catch (err) {
      p.error("DATABASE UPGRADE ERROR: " + err);
    }
  }
};
