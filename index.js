const Discord = require("discord.js"); // Import the discord.js module
const client = new Discord.Client(); // Create an instance of a Discord client
const auth = require("./auth.json");

const meID = "181615330861252608";

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */
client.on("ready", () => {
  console.log("We're online!");
});

// Create an event listener for messages
client.on("message", message => {
  // If the message is "ping"
  if (message.content === "ping") {
    // Send "pong" to the same channel
    message.channel.send("pong");
  }
});

client.on("error", e => {
	console.log('client error:', e)
});


client.on("voiceStateUpdate", async (oldMember, newMember) => {
  let newUserChannel = newMember.voiceChannel;
  let oldUserChannel = oldMember.voiceChannel;

  if (oldUserChannel === undefined && newUserChannel !== undefined) {
    let msg = `${newMember.displayName} joined channel ${newUserChannel.name}`;

    // User Joins a voice channel
    console.log(msg);
    client.users.get(meID)
      .send(msg)
      .then(message => console.log(`Sent message: ${message.content}`))
      .catch(console.error);

    // Quick! Play their entry noise:
    if (newUserChannel) {
      console.log("apparently we never reach this?");
      let connection = await newUserChannel.join()
 
          console.log(
            `Bot has joined channel ${newUserChannel.name} to 'tada' someone`
          );

          // create the dispatcher to play the tada noise
          const dispatcher = connection.playFile(
            "/home/cj/proj/tada-discord/none.mp3"
          );

          // when it ends let us know
          dispatcher.on("end", () => {
            // log finishing
            console.log(
              `Bot has finished 'tadaing' ${newMember.displayName} in channel ${
                newUserChannel.name
              }`
            );

            // leave the channel
            newUserChannel.leave()
          });

          dispatcher.on("error", err => {
            console.log('dispatcher error:', err);
          });
    }
  } else if (newUserChannel === undefined) {
    let msg = `${oldMember.displayName} left channel ${oldUserChannel.name}`;

    // User leaves a voice channel
    console.log(msg);
  }
});

// Log our bot in using the token from https://discordapp.com/developers/applications/me
client.login(auth.bot.token);
