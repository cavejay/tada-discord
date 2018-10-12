const Discord = require("discord.js"); // Import the discord.js module
const client = new Discord.Client(); // Create an instance of a Discord client
const auth = require("./auth.json");

/**
 * A ping pong bot, whenever you send "ping", it replies "pong".
 */

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */
client.on("ready", () => {
  console.log("I am ready!");
});

// Create an event listener for messages
client.on("message", message => {
  // If the message is "ping"
  if (message.content === "ping") {
    // Send "pong" to the same channel
    message.channel.send("pong");
  }
});

client.on("voiceStateUpdate", (oldMember, newMember) => {
  let newUserChannel = newMember.voiceChannel;
  let oldUserChannel = oldMember.voiceChannel;

  if (oldUserChannel === undefined && newUserChannel !== undefined) {
    let msg = `${newUserChannel.displayName} joined channel ${
      newUserChannel.name
    }`;

    // User Joins a voice channel
    console.log(msg);
    newMember
      .send(msg)
      .then(message => console.log(`Sent message: ${message.content}`))
      .catch(console.error);
  } else if (newUserChannel === undefined) {
    let msg = `${oldUserChannel.displayName} left channel ${
      oldUserChannel.name
    }`;

    // User leaves a voice channel
    console.log(msg);
  }
});

// Log our bot in using the token from https://discordapp.com/developers/applications/me
client.login(auth.bot.token);
