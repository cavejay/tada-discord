const Discord = require("discord.js"); // Import the discord.js module
const client = new Discord.Client(); // Create an instance of a Discord client
const p = require("./loggerFactory")("Bot");

function directMessageUser(userID, message) {
    client.users.get(userID)
        .send(message)
        .then(m => p.info(`Sent message: ${m.content}`))
        .catch(p.error);
}

module.exports = function bot (db, config) {
    /**
     * The ready event is vital, it means that only _after_ this will your bot start reacting to information
     * received from Discord
     */
    client.on("ready", () => {
        p.info("We're online!");
    });
    
    // let us know about errors
    client.on("error", e => {
        p.error('client error:', e)
    });
    
    client.on("voiceStateUpdate", async (oldMember, newMember) => {
        let newUserChannel = newMember.voiceChannel;
        let oldUserChannel = oldMember.voiceChannel;
        
        // IF the user is joining a channel
        if (oldUserChannel === undefined && newUserChannel !== undefined) {
            let msg = `${newMember.displayName} joined channel ${newUserChannel.name}`;
            
            // User Joins a voice channel
            p.info(msg); //log 
            directMessageUser(config.owner, msg) //message bot owner
            
            // If it's me (the bot) I don't care. plz check
            if (newMember.id === client.user.id || newMember.id !== config.owner) {
                p.info('we only play noises for the owner for now')
                return
            }
            
            // Make sure I have the correct permissions to access the channel!
            
            // Quick! Play their entry noise:
            if (newUserChannel) {
                // Is this a new user?
                if (undefined === await db.getUser(newMember.id)) {
                    // new users get the basic 'tada' and a PM!
                    directMessageUser(newMember.id, "\
Hi! Did you hear your intro?\n \
You can update it by replying to this message with the numbers 1,2 or 3\n \
== OPTIONS ==\n \
1) Basic 'tada' noise\n \
2) Cheers of joy from a crowd [coming soon]\n \
3) A sick as explosion [coming soon]")
                    await db.makeUser(newMember.id)
                }
            
                let connection = await newUserChannel.join()
                
                p.info(`Bot has joined channel ${newUserChannel.name} to 'tada' someone`);
                    
                // create the dispatcher to play the tada noise
                const dispatcher = await connection.playFile("./tada.mp3");
                        
                // when it ends let us know
                dispatcher.on("end", () => {
                    // log finishing
                    p.info(`Bot has finished 'tadaing' ${newMember.displayName} in channel ${newUserChannel.name}`);
                    
                    // leave the channel
                    newUserChannel.leave()
                });
                
                dispatcher.on("error", err => {
                    p.error('dispatcher error:', err);
                });
            }
        } else if (newUserChannel === undefined) {
            let msg = `${oldMember.displayName} left channel ${oldUserChannel.name}`;
            
            // User leaves a voice channel

            // If we're left alone in the vc then leave
            p.info(msg);
        }
    });

    return client
}