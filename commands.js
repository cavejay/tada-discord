const p = require("./loggerFactory")("Command");
const soundsMeta = require('./sounds/sounds.config.json')
const strings = require('./strings.json')

/*
    List of commands we want to support

    new intro <>
    set intro <>
    disable
    help
    set config <>
    get config all
    get config <>
    get intro all
    get intro
*/
module.exports.meta = {
    help:"",
    disable:"",
    //admin: "",
    // new: {
    //     intro: ""
    // },
    set: {
        // config: "",
        intro: ""
    }, 
    get: {
        // config: {
        //     all: "",
        //     param: ""   
        // },
        intro: {
            all: "",
            param: ""
        }
    }
}

// Make the empty command object
command = {}

command.help = async function commandHelp(args, {message}) {
    this.summary = "Shows the help information for this bot"
    p.info('need to print out the help information')
    message.reply(strings.helpText)
}

command.disable = async function commandDisable(args, {db, message}) {
    this.summary = "Prevents this bot from playing intros for the running user"
    p.info(`Handling 'disable' command for '${message.content}'`)
    await db.setUserIntro(message.author.id, 'null')
    await message.reply(`Your user settings have been updated to prevent me from playing an intro for you`)
}

command.set = async function commandSet(args, opts) {
    this.summary = "Allows you to set things like the intro played by the bot when you join a channel"
    // Get and Check the next command in line (2)
    if (args.length === 2) {
        // Complain if it doesn't have a parameter one. Maybe list what's possible
        p.info("User did not provide any arguments with this command")
        opts.message.reply(`This command requires a parameter. This is what is currently supported: \n    - ${Object.keys(command.set.cmd).join("\n    - ")}`)
        return

    } else if (!Object.keys(command.set.cmd).includes(args[2])) {
        p.info(`Was unable to validate argument ${args[2]} for the set ${args[1]} command`)
        opts.message.reply(`I don't recognise the argument '${args[2]}' for the ${args[1]} command`)
        return
    
    } else {
        // Pass it onwards
        return await command.set.cmd[args[2]](args, opts)
    }
}
command.set.cmd = {
    intro: async function commandSetIntro(args, {message, db}) {
        this.summary = "Set the intro played by tada by using this command"

        // Determine if this is a key or a video
        let words = message.content.split(' ')
        let introChoice = words.slice(3,words.length).join(' ')
        p.info(`User ${message.author.username} is claiming they want to use the '${introChoice}' intro.`)

        // Does the key match those known?
        if (Object.keys(soundsMeta).includes(introChoice)) {
            p.info(`${introChoice} is a known file-type intro so we'll use that`)
            
            // If it matches then update the database?
            p.info(`Updating user '${message.author.username}''s registered intro to: ${introChoice}`)
            try {
                await db.setUserIntro(message.author.id, {type: 'file', key: introChoice})
            } catch (err) {
                message.reply("Something went wrong and I was unable to update your introduction. I've logged the error though and have contacted @cavejay#2808")
                p.error(err)
                return
            }

        // If the introChoice is more than 1 word or starts with either of the generic yt urls 
        } else if (args > 4 || introChoice.startsWith('https://www.youtube.com') || introChoice.startsWith('https://youtu.be')){
            p.info(`${introChoice} appears to be a youtube style intro`)

            // Do we have time stamps?
            introInfo = {
                type: 'yt',
                url: args[3],
                start: args[4],
                end: args[5]
            }
            try {
                await db.setUserIntro(message.author.id, introInfo)
            } catch (err) {
                message.reply("Something went wrong and I was unable to update your introduction. I've logged the error though and have contacted @cavejay#2808")
                p.error(err)
                return
            }

        } else {
            p.info(`'${introChoice}' is not a valid intro. Informing user now.`)
            message.reply(`The intro '${introChoice}' is not available. Please pick from the list provided by the \`!tada get intro all\` command.`)
            return
        }

        p.info(`Intro update for ${message.author.username} was successful`)
        message.reply(`Update successful! Your intro is now '${introChoice}'`) 
        // todo also provide a soft reset of the timer here so that they can hear it immediately. Do not let them spam through this though, so max of 5? 
    }
}

command.get = async function commandGet(args, opts) {
    this.summary = "Allows you to get information about things like the intro played by the bot when you join a channel"
    // Get and Check the next command in line (2)
    if (!Object.keys(command.get.cmd).includes(args[2])) {
        p.info(`Was unable to validate argument ${args[2]} for the set ${args[1]} command`)
        opts.message.reply(`I don't recognise the argument '${args[2]}' for the ${args[1]} command`)
        return
    
    } else if (args.length === 2) {
        // Complain if it doesn't have one. Maybe list what's possible
        p.info("User did not provide any arguments with this command")
        opts.message.reply(`This command requires a parameter. This is what is currently supported: \n    - ${Object.keys(command.get.cmd).join("\n    - ")}`)
        return

    } else {
        // Pass it onwards
        return await command.get.cmd[args[2]](args, opts)
    }
}
command.get.cmd = {
    intro: async function commandGetIntro(args, {message, db}) {
        this.summary = "Returns the intro currently configured for your user"
        // is this just a get for the users intro?
        if(args.length === 3) {
            p.info(`Handling 'get intro' command for '${message.content}'`)
            let intro = await db.getUserIntro(message.author.id)
            await message.reply(`Your currently configured intro is: ${intro}`)
        } else if (args.length > 3 && args[3] === 'all'){
            p.info(`Handling 'get intro all' command for '${message.content}'`)
            await message.reply(`Available introductions are:\n    - ${Object.keys(soundsMeta).join("\n    - ")}`)
        }
    }
}

module.exports.cmd = command
