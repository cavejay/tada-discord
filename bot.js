const Discord = require("discord.js"); // Import the discord.js module
const client = new Discord.Client(); // Create an instance of a Discord client
const p = require("./loggerFactory")("Bot");
const soundsMeta = require('./sounds/sounds.config.json');
const strings = require('./strings.json');
const Commands = require('./commands.js');
const nodeCleanup = require('node-cleanup');
const ytdl = require('ytdl-core');

// Configure node to logout before closing
nodeCleanup(function (exitCode, signal) {
    if (signal) {
        p.info("Process has been cancelled. Will attempt to close connection with Discord gracefully")
        client.destroy().then(() => {
            // calling process.exit() won't inform parent process of signal
            p.info("Exiting now...")
            process.kill(process.pid, signal);
        });
        nodeCleanup.uninstall(); // don't call cleanup handler again
        return false;
    }
});

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

async function handleVoiceChannelEvent (member,channel,db,config) {
    // Is this a new user?
    if (null === await db.getUser(member.id)) {
        // new users get the basic 'tada' and a PM!
        p.info(`${member.displayName} is not a known user. Creating instance for them now`)
        directMessageUser(member.id, strings.newUserText)
        await db.makeUser(member.displayName, member.id, config.newUserDefault )
    }
    
    // get the information from the db
    let chosenIntro = await db.getUserIntro(member.id)
    if (chosenIntro === 'null') {
        p.error("Something went wrong and we couldn't get the user data?")
        return
    }
    
    let dispatcher

    // stream yt
    if (chosenIntro.type === "yt") {
        let connection = await channel.join()
        p.info(`Bot has joined channel ${channel.name} to 'tada' ${member.displayName} with a snippet from a youtube video: '${chosenIntro.url}'`);
        
        const streamOptions = { seek: 0, volume: 1 };
        const stream = ytdl(chosenIntro.url, { filter : 'audioonly'});

        // create the dispatcher to play the tada noise
        dispatcher = await connection.playStream(stream, streamOptions);
        p.info(`Playing from ${chosenIntro.url}`)

    // play a sound
    } else if (chosenIntro.type === "file") {
        let soundFile = soundsMeta[chosenIntro.key]
    
        let connection = await channel.join()
        p.info(`Bot has joined channel ${channel.name} to 'tada' ${member.displayName} with preferred sound of '${chosenIntro.key}'`);
            
        // create the dispatcher to play the tada noise
        dispatcher = await connection.playFile(soundFile);
        p.info(`Playing from ${soundFile}`)
    }

    dispatcher.on("start", s => {
        setTimeout(() => {
            p.info("Ending dispatcher at 4 seconds")
            dispatcher.end('Max video time reached')
          }, config.maxIntroTime);
    })

    // when it ends let us know
    dispatcher.on("end", () => {
        // log finishing
        p.info(`Bot has finished 'tadaing' ${member.displayName} in channel ${channel.name}`);
        
        // leave the channel
        channel.leave()
    });
    
    dispatcher.on("error", err => {
        p.error('dispatcher error:', err);
    });
}

async function argHandler(args, {message}) {
    // If there was nothing past the '!tada' then message the user and move on.
    if (args.length === 1) {
        message.reply("Current command options for use with this bot are: \n" + Object.keys(Commands.meta).join(', '))
        p.info("User did not supply any commands. Will now inform them of current command options")
        return
    }

    // Validate that the message contains a valid command
    if (!Object.keys(Commands.meta).includes(args[1])) {
        message.reply(`Sorry, I don't recognise the command '${args[1]}'`)
        p.info(`User entered unrecognised command '${args[1]}'`)
        return
    }

    return Commands.cmd[args[1]]
}

module.exports = function bot (db, config) {
    /**
     * The ready event is vital, it means that only _after_ this will your bot start reacting to information
     * received from Discord
     */
    client.on("ready", () => {
        p.info("We're online!");
        
        // Set the client user's presence
        client.user.setPresence({ game: { name: '!tada <command>' }})
            .then(() => p.info("Set bot's 'playing' status to '!tada <command>'"))
            .catch(p.error);
    });

    // let us know about errors
    client.on("error", e => {
        p.error('client error:', e)
    });
    
    client.on("voiceStateUpdate", async function (oldMember, newMember) {
        let newUserChannel = newMember.voiceChannel;
        let oldUserChannel = oldMember.voiceChannel;
        
        // If the user is joining a channel
        if (oldUserChannel === undefined && newUserChannel !== undefined) {
            // If it's me (the bot) I don't care. plz check
            if (newMember.id === client.user.id) return
            
            // If it's another bot then also don't join. That would be bad
            if (newMember.user.bot) return

            let msg = `${newMember.displayName} joined channel ${newUserChannel.name}`;
            
            // User Joins a voice channel
            directMessageUser(config.owner, msg) // message bot owner

            // If it's not me (the owner) then also skip
            // if (newMember.id !== config.owner) return
            
            // Make sure I have the correct permissions to access the channel!
            // todo

            // If we can't resolve the userchannel lets just skip
            if (!newUserChannel) return

            // handle the entry
            await handleVoiceChannelEvent(newMember, newUserChannel, db, config)
            
        } else if (newUserChannel === undefined) {
            let msg = `${oldMember.displayName} left channel ${oldUserChannel.name}`;
            
            // If user leaves a voice channel and we're still in it
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
    })

    client.on("message", async function (message) {
         // If it's me (the bot) I don't care. plz check
         if (message.author.id === client.user.id) return

        // If this isn't a direct message
        if (message.channel.type !== 'dm') return 
        p.info(`We were messaged '${message}' from ${message.author.username}`)
        
        // Check that this is formatted as a command
        if (!message.content.startsWith(`${config.prefix}tada`)) {
            p.info(`The message does not start with the appropriate string: '${config.prefix}tada'`)
            return
        }

        // split out the args
        let args = message.content.split(' ')

        // Let the handler deal with it now
        let command = await argHandler(args, {message: message})
        
        command(args, {message: message, db: db})

    })

    return client
}