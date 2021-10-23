const fs = require("fs");
const https = require("https");
const path = require("path");

const promisePipe = require("promisepipe");

function uuid(a) {
  return a
    ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
}

module.exports = { uuid };
