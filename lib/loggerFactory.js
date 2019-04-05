var pino = require("pino");

module.exports = function(instanceName) {
  return pino({
    name: instanceName,
    prettyPrint: true, //true
    level: 20 // need to make this configurable
  });
};

// consider consola
