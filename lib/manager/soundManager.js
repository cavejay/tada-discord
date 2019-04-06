const p = require("../loggerFactory")("SoundManager");
const { moveFile, unlinkFile, checksumFile } = require("../bot/bot.shared");
const cacher = require("../cache");
const { schema } = require("../db");

const fs = require("fs");
const https = require("https");
const path = require("path");
const util = require("util");

const promisePipe = require("promisepipe");

var folder = "";
var tmpfolder = "";
const soundCache = new cacher("SoundCache"); // introname -> filename

/**
 * SoundManager
 *
 * The goal and scope of this class to provide abstracted management of how user's intros map to sounds.
 *
 * Pretty much just an interface between tada and the database for INTROS ONLY
 *
 * Out of Scope:
 * - simple db requests/edits
 * - Editing/updating of user details
 *
 */
var sm = {};

/**
 * Associate sounds files with the db
 *
 * Look at all the sound files in the sounds folder and:
 * 1) Make sure they have an entry in the database
 * 2) Create a new entry if they don't have one. These files are 'lost' and only viewable by the owner(?)
 * 3) Clear the DB of any broken references to no-longer found files. Users with broken links should have their Intro reset to their guild's default and messaged.
 *
 * */
sm.hardloadSounds = async function({ db, config, fileManager }) {
  // read all files in sounds folder
  folder = fileManager.soundFolder;
  let soundfiles = fileManager.soundsOnDiskSync();
  let knownSounds = await sm.getSoundFileNames();
  p.info("Files found in sounds folder: ", soundfiles.sort().join(", "));

  try {
    // Ensure sounds are in database
    await Promise.all(
      soundfiles.map(async sf => {
        try {
          const id = await fileManager.checksumFile(path.join(folder, sf));
          const newSound = await sm.registerNewSound({ checksum: id, filename: sf });
          if (newSound) p.info("created the new sound", newSound); // only show this if we created a new sound (substantive output)
        } catch (e) {
          p.error(e);
        }
      })
    );
  } catch (err) {
    p.error(err);
  }

  // Deal with sounds that are in the database but no longer on disk.
  const missingSoundfiles = knownSounds.filter(s => {
    return !soundfiles.includes(s);
  });

  p.info("Missing soundfiles", missingSoundfiles);
  try {
    await Promise.all(
      missingSoundfiles.map(async sf => {
        try {
          const s = await sm.getSoundFromFilename({ filename: sf });
          await sm.removeSound({ checksum: s.checksum, filename: sf });
        } catch (e) {
          p.error(e);
        }
      })
    );
  } catch (err) {
    p.error(err);
  }
};

/**
 * Ensure Tada has the appropriate file structure for playing and storing Intros.
 * Load the sounds that are currently available.
 */
sm.init = async function({ db, config, fileManager }) {
  sm.db = db;
  sm.config = config;
  sm.fm = fileManager;

  await sm.hardloadSounds(...arguments);

  p.trace("SoundManager Booted");
};

/**
 * Return all current sounds
 * todo: implement guild filter
 */
sm.getSoundNames = async function({ gid }) {
  return (await sm.db.getAllSounds()).map(s => s.name); //soundCache.values() ||
};

sm.getSoundFileNames = async function() {
  return (await sm.db.getAllSounds()).map(s => s.soundFile);
};

sm.getSoundFromFilename = async function({ filename }) {
  const q = { type: "sound", soundFile: filename };
  p.debug(`Running GETSOUND from getSoundFromFilename -- query: ${JSON.stringify(q)}`);
  const res = await sm.db.raw.findOne(q);
  p.debug(`Returned GETSOUND from getSoundFromFilename -- result: ${JSON.stringify(res)}`);
  return res;
};

/**
 * Return the chksum of a intro based on the name available to a guild
 */
sm.getCheckSum = async function({ soundName, guildID }) {
  let q = {};
  q[`presence.${guildID}.name`] = soundName;
  const sound = await sm.db.getSound(q);
  return sound.checksum;
};

sm.getSoundFileOfChecksum = async function getSoundFileOfChecksum({ checksum }) {
  return await sm.db.getSoundField({ checksum, field: "soundFile" });
};

/**
 * Download the URL and save to the configured sounds 'tmp' folder
 */
sm.downloadFile = async function({ url }) {
  const filename = url.split("/").slice(-1)[0];
  const destination = path.join(folder, "tmp", filename);

  p.info(`Attempting to download ${filename} into ${destination} from ${url}`);

  var file = fs.createWriteStream(path.join(folder, "tmp", filename));

  httpsgetP = url => {
    return new Promise((resolve, reject) => {
      https.get(url, function(res) {
        p.info("got data stream thing");
        resolve(res);
      });
    });
  };

  res = await httpsgetP(url);
  await promisePipe(res, file);

  p.info(`Finished downloading ${filename} into ${destination} from ${url}`);

  return filename;
};

/**
 * User ffmpeg to validate a sound file stored in the sounds 'tmp' folder
 */
sm.validateSound = function({ filename }) {
  // use ffmpeg to check it's a playable sound file
  // make sure it's an mp3 file?
  return true;
};

/**
 * Remove a file from the sounds 'tmp' folder
 */
sm.deleteTmpSound = async function(filename) {
  try {
    await unlinkFile(path.join(tmpfolder, filename));
  } catch (e) {
    p.error(e);
  }
};

/**
 * REgister a new sound
 */
sm.registerNewSound = async function({ checksum, filename }) {
  // First check if we have the sound file already?
  const filePath = await soundCache.getOrSet(checksum, async () => {
    return await sm.getSoundFileOfChecksum({ checksum });
  });
  if (filePath === null) {
    const res = await sm.db.insertSound({
      soundDoc: schema.constructSound(filename, filename.split(".mp3")[0], checksum)
    });
    return res;
  }
};

/**
 * Remove an intro by deleting the reference in the database and then deleting the file itself.
 */
sm.removeSound = async function removeSound({ checksum, filename, deleteFile }) {
  p.info(`Removing Sound: ${JSON.stringify(arguments)}`);
  try {
    await sm.db.deleteSound({ checksum });
    if (deleteFile) {
      await sm.fm.deleteFile({ filename });
    }
  } catch (e) {
    p.error(e);
  }
};

/**
 * Reload the sounds currently learnt/known by tada
 */
sm.reload = async function() {
  await sm.hardloadSounds({ db: sm.db });
};

module.exports = sm;
