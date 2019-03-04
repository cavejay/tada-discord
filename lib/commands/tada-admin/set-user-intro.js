const TadaCommand = require("../TadaCommand");

module.exports = class setUserIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "set-user-intro",
      group: "tada-admin",
      alias: ["set-user-intro"],
      memberName: "set-user-tada",
      description: "Returns the intro currently configured for your user",
      args: [
        {
          key: "userID",
          label: "user-of-interest",
          prompt: "Which user did you want to see the intro of?",
          type: "string"
        },
        {
          key: "intro",
          label: "intro",
          prompt: "Which intro did you want to set for this user?",
          type: "string"
        }
      ],
      examples: ["set-user-intro <user-of-interest> <intro>"],
      guildOnly: false
    });
  }

  async run(msg, args) {
    // Determine if this is a key or a video
    this.log.info(`Admin ${msg.author.name} wants to set the intro for '${args.userID}' to '${args.intro}'.`);

    // Does the key match those known?
    let user = await this.client.fetchUser(args.userID);
    let allSounds = await this.db.getAllSounds();
    if (allSounds.includes(args.intro)) {
      this.log.info(`${args.intro} is a known file-type intro so we'll use that`);

      // If it matches then update the database?
      this.log.info(`Updating user '${user}''s registered intro to: ${args.intro}`);
      try {
        await this.db.setUserIntro(args.userID, {
          type: "file",
          key: args.intro
        });
      } catch (err) {
        msg.reply(
          "Something went wrong and I was unable to update your intro. I've logged the error though and have contacted @cavejay#2808"
        );
        this.log.error(err);
        return;
      }
    } else {
      this.log.info(`'${user}' is not a valid intro. Informing user now.`);
      msg.reply(
        `The intro '${args.intro}' is not available. Please pick from the list provided by the \`list-intros\` command.`
      );
      return;
    }

    this.log.info(`Intro update for ${user} was successful`);
    msg.reply(`Update successful! ${user}'s intro is now '${args.intro}'`);
    // todo also provide a soft reset of the timer here so that they can hear it immediately. Do not let them spam through this though, so max of 5?
  }
};
