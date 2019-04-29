const p = require("../loggerFactory")("SoundManager");
const { moveFile, unlinkFile } = require("../bot/bot.shared");
const { checksumFile } = require("./fileManager");
const cacher = require("../cache");

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
sm.hardloadSounds = async function hardloadSounds({ db, config, fileManager }) {
  // read all files in sounds folder
  folder = sm.fm.soundFolder;
  let soundfiles = sm.fm.soundsOnDiskSync();
  let knownSounds = await sm.getSoundFileNames();
  p.info("Files found in sounds folder: ", soundfiles.sort().join(", "));

  try {
    // Ensure sounds are in database
    await Promise.all(
      soundfiles.map(async sf => {
        try {
          const id = await checksumFile(path.join(folder, sf));
          const newSound = await sm.registerNewSound({ checksum: id, filename: sf });
          if (newSound) p.info("created the new sound", newSound); // only show this if we created a new sound (substantive output)
        } catch (e) {
          p.error(e);
        }
      })
    );
  } catch (err) {
    p.error("HARDLOAD Sounds Problem: ", err);
  }

  // Deal with sounds that are in the database but no longer on disk.
  const missingSoundfiles = knownSounds.filter(s => {
    return !soundfiles.includes(s);
  });

  if (missingSoundfiles) {
    p.info("Missing soundfiles", missingSoundfiles);
  } else {
    p.info("No missing Sound files");
  }
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
    p.error("HARDLOAD Sounds Problem: ", err);
  }
};

/**
 * Attempt to load a file as a new intro
 *
 * Can only be run after sm.init
 */
sm.loadSound = async function loadSound({ file }) {
  try {
    const id = await checksumFile(path.join(sm.fm.soundFolder, file));
    const newSound = await sm.registerNewSound({ checksum: id, filename: file });
    if (newSound) {
      p.info("created the new sound", newSound);
      return true;
    } // only show this if we created a new sound (substantive output)
  } catch (e) {
    p.error(`Unable to load ${file} as a sound/intro.`, e);
    return false;
  }
};

/**
 * Ensure Tada has the appropriate file structure for playing and storing Intros.
 * Load the sounds that are currently available.
 */
sm.init = async function init({ db, config, fileManager }) {
  sm.db = db;
  sm.config = config;
  sm.fm = fileManager;

  await sm.hardloadSounds(...arguments);

  // If
  // there are no sounds that match checksum provided in the config
  // AND
  // we cannot find a sound with the .default.mp3 name
  // Crash with an error asking for either. Tada requires a default intro or it WILL NOT WORK

  p.trace("SoundManager Booted");
};

/**
 * Return all current sounds
 * todo: implement guild filter
 */
sm.getSoundNames = async function getSoundNames() {
  return (await sm.db.getAllSounds()).map(s => s.name); //soundCache.values() ||
};

sm.getSoundFileNames = async function getSoundFileNames() {
  return (await sm.db.getAllSounds()).map(s => s.soundFile);
};

sm.getSoundFromFilename = async function getSoundFromFilename({ filename }) {
  const q = { type: "sound", soundFile: filename };
  p.debug(`Running GETSOUND from getSoundFromFilename -- query: ${JSON.stringify(q)}`);
  const res = await sm.db.raw.findOne(q);
  p.debug(`Returned GETSOUND from getSoundFromFilename -- result: ${JSON.stringify(res)}`);
  return res;
};

sm.getNameFromChecksum = async function getNameFromChecksum({ checksum, gid }) {
  const presence = await sm.db.getSoundField({ checksum, field: "presence" });
  if (!presence) {
    throw "We were unable to get the name of a sound from it's checksum";
  }
  if (presence[gid]) {
    return presence[gid].name;
  } else {
    return await sm.db.getSoundField({ checksum, field: "name" });
  }
};

sm.checkSoundforGuild = async function checkSoundforGuild({ name, gid }) {
  const chksum = await sm.db.findOne({ type: "sound", name });
  if (chksum) {
    return true;
  } else {
    return false;
  }
};

/**
 * Return the chksum of a intro based on the name available to a guild
 */
sm.getCheckSum = async function getCheckSum({ soundName, guildID }) {
  if (!guildID) {
    p.debug("no Guild ID provided for determining sound name, continuing using defaults");
    return await sm.db.getField({
      dbCall: "getCheckSum[soundManager]",
      query: { name: soundName, type: "sound" },
      field: "checksum"
    });
  } else {
    let q = { type: "sound" };
    q[`presence.${guildID}.name`] = soundName;
    return await sm.db.getField({
      dbCall: "getCheckSum[soundManager]w/guild",
      query: q,
      field: "checksum"
    });
  }
};

sm.getSoundFileOfChecksum = async function getSoundFileOfChecksum({ checksum }) {
  return await sm.db.getSoundField({ checksum, field: "soundFile" });
};

/**
 * Download the URL and save to the configured sounds 'tmp' folder
 */
sm.downloadFile = async function downloadFile({ url }) {
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
sm.validateSound = function validateSound({ filename }) {
  // use ffmpeg to check it's a playable sound file
  // make sure it's an mp3 file?
  return true;
};

/**
 * Remove a file from the sounds 'tmp' folder
 */
sm.deleteTmpSound = async function deleteTmpSound(filename) {
  try {
    await unlinkFile(path.join(tmpfolder, filename));
  } catch (e) {
    p.error(e);
  }
};

/**
 * REgister a new sound
 */
sm.registerNewSound = async function registerNewSound({ checksum, filename }) {
  // First check if we have the sound file already?
  const filePath = await soundCache.getOrSet(checksum, async () => {
    return await sm.getSoundFileOfChecksum({ checksum });
  });
  if (filePath === null) {
    const res = await sm.db.insertSound({
      soundDoc: sm.db.schema.constructSound(filename, filename.split(".mp3")[0], checksum)
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
sm.reload = async function reload() {
  return await sm.hardloadSounds({ db: sm.db });
};

module.exports = sm;
