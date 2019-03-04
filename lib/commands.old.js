const p = require("./loggerFactory")("Command");
const strings = require("../strings.json");

/*
    List of commands we want to support

    new intro <>
    set intro <>
    disable
    help
    set config <>
    get config all
    get config <>
    get intro all
    get intro
*/
module.exports.meta = {
  //admin: "",
  // new: {
  //     intro: ""
  // },
  get: {
    // config: {
    //     all: "",
    //     param: ""
    // },
    intro: {
      all: "",
      param: ""
    }
  }
};

// Make the empty command object
command = {};

command.get = async function commandGet(args, opts) {
  // Get and Check the next command in line (2)
  if (!Object.keys(command.get.cmd).includes(args[2])) {
    p.info(`Was unable to validate argument ${args[2]} for the set ${args[1]} command`);
    opts.message.reply(`I don't recognise the argument '${args[2]}' for the ${args[1]} command`);
    return;
  } else if (args.length === 2) {
    // Complain if it doesn't have one. Maybe list what's possible
    p.info("User did not provide any arguments with this command");
    opts.message.reply(
      `This command requires a parameter. This is what is currently supported: \n    - ${Object.keys(
        command.get.cmd
      ).join("\n    - ")}`
    );
    return;
  } else {
    // Pass it onwards
    return await command.get.cmd[args[2]](args, opts);
  }
};
command.get.cmd = {
  intro: async function commandGetIntro(args, { message, db }) {
    this.summary = "Returns the intro currently configured for your user";
    // is this just a get for the users intro?
    if (args.length === 3) {
      p.info(`Handling 'get intro' command for '${message.content}'`);
      let intro = await db.getUserIntro(message.author.id);
      await message.reply(`Your currently configured intro is: ${JSON.stringify(intro)}`);
    } else if (args.length > 3 && args[3] === "all") {
      p.info(`Handling 'get intro all' command for '${message.content}'`);
      let allSounds = await db.getAllSounds();
      await message.reply(
        `${allSounds.length} introductions available:\n    - ${(await db.getAllSounds()).sort().join("\n    - ")}`
      );
    }
  }
};
command.get.summary =
  "Allows you to get information about things like the intro played by the bot when you join a channel";
command.get.cmd.intro.summary = "Returns the intro currently configured for your user";

module.exports.cmd = command;
