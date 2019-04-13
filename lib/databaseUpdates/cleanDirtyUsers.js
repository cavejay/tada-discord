const p = require("../loggerFactory")("DBUPGRADE_CleanDirtyUsers");
module.exports = async function(db) {
  // for each entry without a type
  let entriesToUpdate = await db.find({ type: "user", presence: {} });

  // Remove all user entries that don't have things in the presence column
  if (entriesToUpdate.length > 0) {
    try {
      await Promise.all(
        entriesToUpdate.map(async entry => {
          p.warn(`Dirty user entry`, entry);
          db.remove({ _id: entry._id });
        })
      );
      p.info("DATABASE UPGRADE COMPLETE");
    } catch (err) {
      p.error("DATABASE UPGRADE ERROR: " + err);
    }
  }
};
