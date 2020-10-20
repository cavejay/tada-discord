const pino = require("pino");
const chalk = require("chalk");

module.exports = function (instanceName) {
  const _ = pino({
    name: instanceName,
    safe: true,
    prettyPrint: {
      colorize: chalk.supportsColor, // --colorize
      crlf: false, // --crlf
      errorLikeObjectKeys: ["err", "error"], // --errorLikeObjectKeys
      errorProps: "", // --errorProps
      levelFirst: false, // --levelFirst
      messageKey: "msg", // --messageKey
      levelKey: "level", // --levelKey
      messageFormat: "{msg}", // --messageFormat
      timestampKey: "time", // --timestampKey
      translateTime: true, // --translateTime
      // search: "foo == `bar`", // --search
      // ignore: "pid,hostname", // --ignore,
      customPrettifiers: {},
    },
  });
  _.level = process.env.NODE_ENV == "production" ? "info" : "debug";
  return _;
};

// consider consola
