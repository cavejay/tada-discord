const { getIntrosUploadedByUser } = require("../../dataInterface");
const TadaCommand = require("../TadaCommand");

const { setGuildAssignmentInfo } = require("../../textEventHandlers");

module.exports = class assignIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "assign-intro",
      group: "tada-user",
      memberName: "assign-intro",
      aliases: ["ai"],
      description:
        "Provides the intro you currently have configured in that server",
      args: [
        {
          key: "introName",
          label: "Name-Of-Intro",
          prompt: "Which intro would you like to re-assign?",
          type: "string",
        },
      ],
      examples: ["!tada assign-intro <Name-Of-Intro>"],
      guildOnly: false,
    });
  }

  async run(message, args) {
    // If people haven't uploaded any intros then they can't use this
    const uploaded = await getIntrosUploadedByUser(message.author.id);
    if (uploaded.length === 0) {
      return await message.reply(
        `You've not got any intros uploaded to re-assign - there is nothing to do here.`
      );
    }

    // get the id of the intro targetted
    const introid = await this.di.getIntroFromName(args.introName);

    await message.reply(
      "Which Discord Servers would you this intro to be accessible from?"
    );

    // bring up the assign intro thing
    await setGuildAssignmentInfo(introid, message.author, message.client);
  }
};
