var pino = require("pino");
var pretty = pino.pretty();
pretty.pipe(process.stdout);
// var p = pino(
//   {
//     name: "app",
//     safe: true
//   },
//   pretty
// );

module.exports = function(instanceName) {
    return pino(
        {
            name: instanceName,
            safe: true
        },
        pretty
    );
};

// consider consola
