const { Command } = require("discord.js-commando");

const db = require("../db");
const pino = require("../loggerFactory");

module.exports = class TadaCommand extends Command {
  constructor(client, options) {
    super(client, options);

    this.db = db;
    this.log = pino(`${options.name}|command`);
  }
};
