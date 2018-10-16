const Discord = require("discord.js"); // Import the discord.js module
const client = new Discord.Client(); // Create an instance of a Discord client
const p = require("./loggerFactory")("Bot");
const soundsMeta = require('./sounds/sounds.config.json')

function resolveID(id){
    return client.fetchUser(id).displayName
}

function directMessageUser(userID, message) {
    p.info(`DMing ${resolveID(userID)} to say: '${message.slice(0,20)}'`)
    client.users.get(userID)
        .send(message)
        .then(m => p.info(`Sent message: ${m.content}`))
        .catch(p.error);
}

function handleVoiceChannelEvent (db,config) {
    return async (oldMember, newMember) => {
        let newUserChannel = newMember.voiceChannel;
        let oldUserChannel = oldMember.voiceChannel;
        
        // IF the user is joining a channel
        if (oldUserChannel === undefined && newUserChannel !== undefined) {
            // If it's me (the bot) I don't care. plz check
            if (newMember.id === client.user.id) return

            let msg = `${newMember.displayName} joined channel ${newUserChannel.name}`;
            
            // User Joins a voice channel
            directMessageUser(config.owner, msg) //message bot owner

            // If it's not me (the owner) then also skip
            // if (newMember.id !== config.owner) return
            
            // Make sure I have the correct permissions to access the channel!
            
            // If we can't resolve the userchannel lets just skip
            if (!newUserChannel) return

            // Is this a new user?
            if (null === await db.getUser(newMember.id)) {
                // new users get the basic 'tada' and a PM!
                directMessageUser(newMember.id, "\
    Hi! Did you hear your intro?\n \
    You can update it by replying to this message with the numbers 1,2 or 3\n \
    == OPTIONS ==\n \
    1) Basic 'tada' noise\n \
    2) Cheers of joy from a crowd\n \
    3) A sick as explosion")

                await db.makeUser(newMember.name, newMember.id)
            }
            
            let soundKey = await db.getUserIntro(newMember.id)
            let soundFile = soundsMeta[soundKey]

            let connection = await newUserChannel.join()
            p.info(`Bot has joined channel ${newUserChannel.name} to 'tada' ${newMember.displayName} with preferred sound of '${soundKey}`);
                
            // create the dispatcher to play the tada noise
            const dispatcher = await connection.playFile(soundFile);
                    
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
            
        } else if (newUserChannel === undefined) {
            let msg = `${oldMember.displayName} left channel ${oldUserChannel.name}`;
            
            // User leaves a voice channel and we're still in it
            if (oldUserChannel.members.keyArray.length === 1) {
                try {
                    p.info("There's only one person left in the voice channel, lets try to leave it incase it's us")
                    oldUserChannel.leave()
                } catch (e){
                    p.error(e)
                }
            }

            // If we're left alone in the vc then leave
            p.info(msg);
        }
    }
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
    
    client.on("voiceStateUpdate", handleVoiceChannelEvent(db,config));

    client.on("message", function (message) {
         // If it's me (the bot) I don't care. plz check
         if (message.author.id === client.user.id) return


        if (message.channel.type === 'dm') {
            p.info(`We were messaged '${message}' from ${message.author.name}`)
        }
    })

    return client
}