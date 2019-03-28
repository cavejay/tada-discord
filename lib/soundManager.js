const p = require("./loggerFactory")("SoundManager");
const { moveFile, unlinkFile, checksumFile } = require("./bot/bot.shared");
const cacher = require("./cache");

const fs = require("fs");
const https = require("https");
const path = require("path");
const util = require("util");

const promisePipe = require("promisepipe");

var folder = "";
var tmpfolder = "";
const soundCache = new cacher("SoundCache"); // introname -> filename
var soundNameCache = [];

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
sm.loadSounds = async function({ db, config, fileManager }) {
  // read all files in sounds folder
  folder = fileManager.soundFolder;
  let soundfiles = fileManager.soundsOnDiskSync();
  p.info("Files found in sounds folder: ", soundfiles.sort().join(", "));

  // Update the Database with the sounds on disk. addSoundFile only actually actions new files based on checksum
  let newSoundsCounter = 0;
  try {
    await Promise.all(
      soundfiles.map(async sf => {
        const id = await checksumFile("sha1", sf);
        console.log(id);
        newSoundsCount += await db.addSoundFile(id, sf);
      })
    );
  } catch (err) {
    p.error("Sound File loading error: " + err);
  }
  p.info(`${newSoundsCounter} new sounds were added to the db`);

  // Gracefully remove any sounds no longer found in the sounds folder
  let knownSounds = await db.getAllSounds();
  p.info("Sounds in database:", knownSounds.map(s => s.name));
  let lostSounds = [];
  await Promise.all(
    knownSounds.map(async dbSound => {
      // if we don't have a file that matches the sound then we need to remove that sound from the db
      if (!soundfiles.includes(dbSound.soundFile)) {
        try {
          lostSounds.push(dbSound);
          await db.deprecateSound(dbSound.checksum);
        } catch (err) {
          p.error("Unable to remove sound from database. Is something wrong?");
          p.error(err);
        }
      }
    })
  );
  p.info("Lost sounds found are: ", lostSounds);

  let usersWithDeprecatedIntros = [];
  // Any users that had deprecated sounds will need to be stored so they can be messaged once the bot is online
  if (lostSounds.length > 0) {
    usersWithDeprecatedIntros = await db.getUsersWithIntros(lostSounds);
    p.info(`Users that had deprecated intros that we need to contact are: `, usersWithDeprecatedIntros);
  }

  return {
    affectedUsers: usersWithDeprecatedIntros,
    currentValidSounds: await db.getAllSoundFiles()
  };
};

/**
 * Ensure Tada has the appropriate file structure for playing and storing Intros.
 * Load the sounds that are currently available.
 */
sm.init = async function({ db, config, fileManager }) {
  sm.db = db;
  sm.config = config;
  sm.fm = fileManager;

  let { affectedUsers, currentValidSounds } = await sm.loadSounds(...arguments);
  soundNameCache = Object.freeze(currentValidSounds);

  p.trace("SoundManager Booted");
  return affectedUsers;
};

/**
 * Return all current sounds
 */
sm.getSoundNames = async function() {
  return (await sm.db.getAllSounds()).map(s => s.name); //soundCache.values() ||
};

/**
 * Return the chksum of a intro based on the name available to a guild
 */
sm.getCheckSum = async function({ soundName, guildID }) {
  const sound = await sm.db.getSound({ name: soundName });

  return sound.checksum;
};

/**
 * Download the URL and save to the configured sounds 'tmp' folder
 */
sm.downloadFile = async function(url) {
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
sm.validateSound = function(filename) {
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
 * Add an intro the system by moving it from the sounds 'tmp' folder to the sounds folder proper
 */
sm.addSound = async function(filename) {
  try {
    await moveFile(path.join(tmpfolder, filename), path.join(folder, filename));
    return true;
  } catch (e) {
    p.error(e);
    throw e;
  }
};

/**
 * Remove an intro by deleting the reference in the database and then deleting the file itself.
 */
sm.removeSound = async function(sound) {
  try {
    let filename = await sm.db.getSoundFileFromName(sound);
    await sm.db.deprecateSound(filename);
    await unlinkFile(path.join(folder, filename));
  } catch (e) {
    p.error(e);
  }
};

/**
 * Reload the sounds currently learnt/known by tada
 */
sm.reload = function() {
  sm.loadSounds({ db: sm.db });
};

module.exports = sm;
