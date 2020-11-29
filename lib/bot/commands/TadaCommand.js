const { Command } = require("discord.js-commando");

const di = require("../dataInterface");
const pino = require("../../loggerFactory");
const { informNewUser } = require("../util");

module.exports = class TadaCommand extends (
  Command
) {
  constructor(client, options) {
    super(client, options);

    this.di = di;
    this.log = pino(`${options.name}|command`);
  }

  async checkUser(uid) {
    const u = await this.di.doesUserExist(uid);
    return u;
  }

  async ensureUser(gid, uid) {
    const res = await this.di.ensureUserGuildConnection(gid, uid);

    // check if we inserted something
    if (res.inserted && res.inserted > 0) {
      // we created a new user
      await informNewUser(
        await this.client.users.fetch(uid),
        await this.client.guilds.fetch(gid),
        this.client
      );
    }

    return res;
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
