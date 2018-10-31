var pino = require("pino");

module.exports = function(instanceName) {
    return pino(
        {
            name: instanceName,
            prettyPrint: true
        }
    );
};

// consider consola
