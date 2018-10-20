const Discord = require("discord.js"); // Import the discord.js module
const client = new Discord.Client(); // Create an instance of a Discord client
const p = require("./loggerFactory")("Bot");
const soundsMeta = require('./sounds/sounds.config.json')
const strings = require('./strings.json')

const validCommands = {
    "intro":"",
    "listintro":"",
    "disable": ""
}

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
                directMessageUser(newMember.id, strings.newUserText)
                await db.makeUser(newMember.displayName, newMember.id)
            }
            
            let soundKey = await db.getUserIntro(newMember.id)

            // If the user did not want an intro then leave now.
            if (soundKey === 'null') {
                return
            }

            let soundFile = soundsMeta[soundKey]

            let connection = await newUserChannel.join()
            p.info(`Bot has joined channel ${newUserChannel.name} to 'tada' ${newMember.displayName} with preferred sound of '${soundKey}'`);
                
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

async function handleUserIntroConfig (m,db,config) {
    let words = m.content.split(' ')
    let introChoice = words.slice(2,words.length).join(' ')
    p.info(`User ${m.author.username} is claiming they want to use the '${introChoice}' intro.`)

    // Validate the intro they've asked to use.
    if (!Object.keys(soundsMeta).includes(introChoice)) {
        p.info(`${introChoice} is not a valid intro. Informing user now.`)
        m.reply(`The intro '${introChoice}' is not available. Please pick from the list provided by the \`!tada listintros\` command.`)
        return
    } 

    // If it matches then update the database?
    p.info(`Updating user '${m.author.username}''s registered intro to: ${introChoice}`)
    try {
        await db.setUserIntro(m.author.id, introChoice)
    } catch (err) {
        m.reply("Something went wrong and I was unable to update your introduction. I've logged the error though and have contacted @cavejay#2808")
        p.error(err)
    }

    p.info(`Intro update for ${m.author.username} was successful`)
    m.reply(`Update successful! Your intro is now '${introChoice}'`) 
    // todo also provide a soft reset of the timer here so that they can hear it immediately. Do not let them spam through this though, so max of 5? 
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

        // String out the args
        let args = message.content.split(' ')

        // If there was nothing past the '!tada' then message the user and move on.
        if (args.length === 1) {
            p.info("User did not supply any commands. Will now inform them of current command options")
            message.reply("Current command options for use with this bot are: \n" + Object.keys(validCommands).join(', '))
            return
        }

        // Validate that the message contains a valid command
        if (!Object.keys(validCommands).includes(args[1])) {
            message.reply(`Sorry, I don't recognise the command '${args[1]}'`)
            p.info(`User entered unrecognised command '${args[1]}'`)
            return
        }

        // Action the command that is sent
        switch (args[1]) {
            case 'intro':
                p.info(`Handling 'intro' command for '${message.content}'`)
                await handleUserIntroConfig(message, db, config)
                break;
            case 'listintro':
                p.info(`Handling 'listintro' command for '${message.content}'`)
                await message.reply(`Currently available intros include: ${Object.keys(soundsMeta)}`)
                break;
            case 'disable':
                p.info(`Handling 'disable' command for '${message.content}'`)
                await db.setUserIntro(message.author.id, 'null')
                await message.reply(`Your user settings have been updated to prevent me from playing an intro for you`)
                break;
            default: 
                p.warning("We should not have been able to get to the default case of the argument switch.")
                await message.reply(`There was a bot-side error`)
                await directMessageUser(config.author, "Check Logs. There was something weird with the arguments switch")
        }
    })

    return client
}