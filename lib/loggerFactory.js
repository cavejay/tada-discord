var pino = require("pino");

module.exports = function(instanceName) {
  return pino({
    name: instanceName,
    prettyPrint: false, //true
    level: "trace" // need to make this configurable
  });
};

// consider consola
