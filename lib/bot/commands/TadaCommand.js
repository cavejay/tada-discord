const { Command } = require("discord.js-commando");

const di = require("../dataInterface");
const pino = require("../../loggerFactory");

module.exports = class TadaCommand extends Command {
  constructor(client, options) {
    super(client, options);

    this.di = di;
    this.log = pino(`${options.name}|command`);
  }

  async ensureUser(gid, uid) {
    return await this.di.ensureUserGuildConnection(gid, uid);
  }

  async getUserIntroName(gid, uid) {
    const introid = await this.di.getUserIntro(gid, uid);
    if (introid == "disabled") {
      return { name: "", id: introid };
    } else {
      const iname = await this.di.getIntroProp(introid, "name");
      return { name: iname, id: introid };
    }
  }

  async validateIntroNameForGuild(gid, introName) {
    const allSounds = await this.di.getIntrosOfGuild(gid);
    const introhash = await this.di.getIntroFromName(introName);

    return { isIntroValid: allSounds.includes(introhash), introhash };
  }
};
