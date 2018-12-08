const p = require("../loggerFactory")("Command");
const strings = require("../../strings.json");
const ytdl = require("ytdl-core");

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

// Make the empty command object
command = {};

command.help = async function commandHelp(args, { message }) {
  p.info("need to print out the help information");
  let res = strings.helpText;

  let helpTexts = [];
  Object.keys(command).forEach(c => {
    helpTexts.push(`!tada ${c}\t\t\t - ` + command[c].summary);
    if (command[c].cmd) {
      Object.keys(command[c].cmd).forEach(c2 => {
        helpTexts.push(`!tada ${c} ${c2}\t\t - ` + command[c].cmd[c2].summary);
        // if (command.c.cmd.c2.cmd) {
        //     foreach(c3 in Object.keys(command.c.cmd.c2.cmd)) {
        //         helpTexts += command.c.cmd.c2.cmd.c3.summary
        //     }
        // }
      });
    }
  });

  p.info(helpTexts);

  message.reply(res + "\n" + helpTexts.join("\n"));
};
command.help.summary = "Shows the help information for this bot";

command.disable = async function commandDisable(args, { db, message }) {
  p.info(`Handling 'disable' command for '${message.content}'`);
  await db.setUserIntro(message.author.id, "null");
  await message.reply(`Your user settings have been updated to prevent me from playing an intro for you`);
};
command.disable.summary = "Prevents this bot from playing intros for the running user";

command.set = async function commandSet(args, opts) {
  // Get and Check the next command in line (2)
  if (args.length === 2) {
    // Complain if it doesn't have a parameter one. Maybe list what's possible
    p.info("User did not provide any arguments with this command");
    opts.message.reply(
      `This command requires a parameter. This is what is currently supported: \n    - ${Object.keys(
        command.set.cmd
      ).join("\n    - ")}`
    );
    return;
  } else if (!Object.keys(command.set.cmd).includes(args[2])) {
    p.info(`Was unable to validate argument ${args[2]} for the set ${args[1]} command`);
    opts.message.reply(`I don't recognise the argument '${args[2]}' for the ${args[1]} command`);
    return;
  } else {
    // Pass it onwards
    return await command.set.cmd[args[2]](args, opts);
  }
};
command.set.cmd = {
  intro: async function commandSetIntro(args, { message, db }) {
    // Determine if this is a key or a video
    let words = message.content.split(" ");
    let introChoice = words.slice(3, words.length).join(" ");
    p.info(`User ${message.author.username} is claiming they want to use the '${introChoice}' intro.`);

    // Does the key match those known?
    let allSounds = await db.getAllSounds();
    if (allSounds.includes(introChoice)) {
      p.info(`${introChoice} is a known file-type intro so we'll use that`);

      // If it matches then update the database?
      p.info(`Updating user '${message.author.username}''s registered intro to: ${introChoice}`);
      try {
        await db.setUserIntro(message.author.id, {
          type: "file",
          key: introChoice
        });
      } catch (err) {
        message.reply(
          "Something went wrong and I was unable to update your introduction. I've logged the error though and have contacted @cavejay#2808"
        );
        p.error(err);
        return;
      }

      // If the introChoice is more than 1 word or starts with either of the generic yt urls
    } else if (ytdl.validateURL(args[3])) {
      p.info(`${introChoice} appears to be a youtube style intro`);

      // Do we have time stamps?
      introInfo = {
        type: "yt",
        url: args[3],
        start: args[4],
        end: args[5]
      };
      try {
        await db.setUserIntro(message.author.id, introInfo);
      } catch (err) {
        message.reply(
          "Something went wrong and I was unable to update your introduction. I've logged the error though and have contacted @cavejay#2808"
        );
        p.error(err);
        return;
      }
    } else {
      p.info(`'${introChoice}' is not a valid intro. Informing user now.`);
      message.reply(
        `The intro '${introChoice}' is not available. Please pick from the list provided by the \`!tada get intro all\` command.`
      );
      return;
    }

    p.info(`Intro update for ${message.author.username} was successful`);
    message.reply(`Update successful! Your intro is now '${introChoice}'`);
    // todo also provide a soft reset of the timer here so that they can hear it immediately. Do not let them spam through this though, so max of 5?
  }
};
command.set.summary = "Allows you to set things like the intro played by the bot when you join a channel";
command.set.cmd.intro.summary = "Set the intro played by tada by using this command";

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
      await message.reply(`Available introductions are:\n    - ${(await db.getAllSounds()).join("\n    - ")}`);
    }
  }
};
command.get.summary =
  "Allows you to get information about things like the intro played by the bot when you join a channel";
command.get.cmd.intro.summary = "Returns the intro currently configured for your user";

module.exports.cmd = command;
