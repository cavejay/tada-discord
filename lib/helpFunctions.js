const fs = require("fs");
const https = require("https");
const path = require("path");

const promisePipe = require("promisepipe");

function uuid(a) {
  return a
    ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
}

/**
 * Download the URL and save to the configured sounds 'tmp' folder
 */
async function downloadfile(url) {
  const filename = url.split("/").slice(-1)[0];
  const destination = path.join(folder, "tmp", filename);

  p.info(`Attempting to download ${filename} into ${destination} from ${url}`);

  var file = fs.createWriteStream(path.join(folder, "tmp", filename));

  httpsgetP = (url) => {
    return new Promise((resolve, reject) => {
      https.get(url, function (res) {
        p.info("got data stream thing");
        resolve(res);
      });
    });
  };

  res = await httpsgetP(url);
  await promisePipe(res, file);

  p.info(`Finished downloading ${filename} into ${destination} from ${url}`);

  return filename;
}

module.exports = { uuid, downloadfile };
