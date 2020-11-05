const TadaCommand = require("../TadaCommand");

module.exports = class setUserIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "get-default-intro",
      group: "tada-guild-admin",
      alias: ["get-default-intro"],
      memberName: "get-guild-default",
      userPermissions: ["ADMINISTRATOR"],
      description: "Returns the intro currently configured for your user",
      args: [
        {
          key: "introChoice",
          label: "intro",
          prompt: "Which intro did you want to set for this user?",
          type: "string",
        },
      ],
      examples: ["get-default-intro <intro>"],
      guildOnly: true,
    });
  }

  async run(message, args) {
    await message.react("✅");
    // todo also provide a soft reset of the timer here so that they can hear it immediately. Do not let them spam through this though, so max of 5?
  }
};