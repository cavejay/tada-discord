const p = require("./lib/loggerFactory")("index");
const env = process.env.NODE_ENV || 'development'
const cfg = require('./config.'+env);

const AddCommands = require("./lib/addCommands");
