var pino = require("pino");

module.exports = function(instanceName) {
  return pino({
    name: instanceName,
    prettyPrint: true, //true
    level: 30 // need to make this configurable
  });
};

// consider consola
