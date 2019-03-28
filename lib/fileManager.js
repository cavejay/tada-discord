const p = require("./loggerFactory")("FileManager");
const { moveFile, unlinkFile } = require("./bot/bot.shared");
const cacher = require("./cache");

const fs = require("fs");
const https = require("https");
const path = require("path");
const util = require("util");

const promisePipe = require("promisepipe");

var folder = "";
var tmpfolder = "";
const soundCache = new cacher("FileCache"); // introname -> filename

/**
 * FileManager
 *
 * The goal and scope of this class to provide abstracted management of the files stored for intros.
 *
 * Pretty much just an interface between tada and the filesystem in general
 *
 * Inscope:
 * - changes to files
 */
var fm = {
  soundFolder: process.env.SOUND_STORAGE_FOLDER || "./sounds"
};

/**
 * Ensure Tada has the appropriate file structure for playing and storing Intros.
 */
fm.init = async function({ db, config }) {
  fm.config = config;

  // Check config for sounds folder
  fm.soundFolder = config.soundStorageFolder || fm.soundFolder;
  if (!fs.existsSync(fm.soundFolder)) {
    p.error(
      `The folder used to store sounds files no longer exists. Please restore '${folder}' and the original, included intros`
    );
    process.exit();
  }

  // Check to see if tmp folder exists.
  p.info("Checking that the tmp sound folder exists");
  tmpfolder = path.join(fm.soundFolder, "tmp");
  if (!fs.existsSync(tmpfolder)) {
    p.warn("Tmp folder does not exist, will attempt to create it now");

    try {
      fs.mkdirSync(tmpfolder);
      p.info("tmp sound folder has been created successfully");
    } catch (err) {
      p.error(err);
    }

    // If it exists then we should clear it incase it's stupid full or something
  } else {
    p.info(`tmp sound folder exists. Attempting to clear/clean it`);

    try {
      files = fs.readdirSync(tmpfolder);
      for (const file of files) {
        fs.unlinkSync(path.join(tmpfolder, file));
      }
      p.info("Successfully cleaned tmp sound folder. Files removed:", files);
    } catch (err) {
      p.error(err);
    }
  }

  p.trace("FileManager Booted");
};

fm.soundsOnDiskSync = function soundsOnDiskSync() {
  return fs.readdirSync(fm.soundFolder).filter(f => f.split(".").slice(-1) == "mp3");
};

/**
 * Download the URL and save to the configured 'tmp' folder
 */
fm.downloadFile = async function(url) {
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
 * User ffmpeg to validate a sound file stored in the 'tmp' folder
 */
fm.validateFileAsIntro = function(filename) {
  // use ffmpeg to check it's a playable sound file
  // make sure it's an mp3 file?
  return true;
};

/**
 * Remove a file from the 'tmp' folder
 */
fm.deleteTmpFile = async function(filename) {
  try {
    await unlinkFile(path.join(tmpfolder, filename));
  } catch (e) {
    p.error(e);
  }
};

/**
 * Move a tmp file from the tmp folder to the sounds folder
 */
fm.moveFileToSoundsFolder = async function(filename) {
  try {
    await moveFile(path.join(tmpfolder, filename), path.join(folder, filename));
    return true;
  } catch (e) {
    p.error(e);
    throw e;
  }
};

/**
 * Remove a file from the sounds folder
 */
fm.deleteFile = async function(sound) {
  try {
    let filename = await fm.db.getSoundFileFromName(sound);
    await unlinkFile(path.join(folder, filename));
  } catch (e) {
    p.error(e);
  }
};

module.exports = fm;
