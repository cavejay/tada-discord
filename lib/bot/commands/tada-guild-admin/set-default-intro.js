const TadaCommand = require("../TadaCommand");

module.exports = class setUserIntro extends TadaCommand {
  constructor(client) {
    super(client, {
      name: "set-default-intro",
      group: "tada-guild-admin",
      alias: ["sdi"],
      memberName: "set-guild-default",
      userPermissions: ["MANAGE_GUILD"],
      description: "Sets the default intro for that server",
      args: [
        {
          key: "introChoice",
          label: "intro",
          prompt:
            "Which intro do you want to set as the default for users in this server?",
          type: "string",
        },
      ],
      examples: ["!tada set-default-intro <intro>"],
      guildOnly: true,
    });
  }

  async run(message, args) {
    // Does the key match those known or for this guild?
    const allSounds = await this.di.getIntrosOfGuild(message.guild.id);
    const introhash = await this.di.getIntroFromName(args.introChoice);

    if (allSounds.includes(introhash)) {
      // If it matches then update the database?
      this.log.info(
        `Updating user '${message.author.username}''s registered intro to: ${args.introChoice}`
      );

      await this.di.setGuildProp(message.guild.id, "defaultIntro", introhash);
      await message.react("✅");
      return;
    } else {
      this.log.info(
        `'${args.introChoice}' is not a valid intro. Informing user now.`
      );
      await message.reply(
        `The intro '${args.introChoice}' is not available. Please pick from the list provided by the \`list-intros\` command. DM me 'help' if you're stuck`
      );
      await message.react("✅");
      return;
    }
  }
};
