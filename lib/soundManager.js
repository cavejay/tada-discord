const p = require("./loggerFactory")("SoundManager");
const fs = require("fs")

var sm = async function ({db, config}) {
    // Check config for sounds folder
    let folder = config.soundStorageFolder || process.env.SOUND_STORAGE_FOLDER || "./sounds"
    if (!fs.existsSync(folder)) {
        p.error(`The folder used to store sounds files no longer exists. Please restore '${folder}' and the original, included intros`)
        process.exit()
    }

    // read all files in sounds folder
    let soundfiles = fs.readdirSync(folder)
    p.info("Files found in sounds folder: ", soundfiles.join(', '))
    
    // update db with any new sounds found in sounds folder
    await Promise.all(soundfiles.map(async sf => {
        await db.addSoundFile(sf)
    }))

    // deprecate any sounds no longer found in the sounds folder
    let knownSounds = await db.getAllSounds()
    p.info('Sounds in database:', knownSounds)
    let lostSounds = []
    await Promise.all(knownSounds.map(async dbSound => {
        // if we don't have the a file that matches the sound then we need to remove that sound from the db
        if (!soundfiles.includes(dbSound)) {
            try {
                lostSounds.push(dbSound)
                await db.deprecateSound(dbSound)
            } catch (err) {
                p.error('Unable to remove sound from database. Is something wrong?')
                p.error(err)
            }
        }
    }))
    p.info('Lost sounds found are: ', lostSounds)

    // Any users that had deprecated sounds will need to be stored so they can be messaged once the bot is online
    if (lostSounds.length > 0) {
        this.usersWithDeprecatedIntros = await db.getUsersWithIntros(lostSounds)
        p.info(`Users that had deprecated intros that we need to contact are: `, this.usersWithDeprecatedIntros )
    }
}

sm.validateSound = async function () {

}

sm.addSound = async function () {

}

module.exports = sm