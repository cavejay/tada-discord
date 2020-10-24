const { Command } = require("discord.js-commando");

const di = require("../dataInterface");
const pino = require("../../loggerFactory");

module.exports = class TadaCommand extends Command {
  constructor(client, options) {
    super(client, options);

    this.di = di;
    this.log = pino(`${options.name}|command`);
  }
};
