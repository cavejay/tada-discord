# tada-discord

The Discord Bot for dramatic entrances

## Tasklist

- [x] Action when user joins a voice channel
- [x] Play a 'noise' when user joins a voice channel - _this is beautiful_
- [x] Play a user specific noise when a user joins vc
- [x] Have a way for a user to decide to _not_ have an intro
- [x] 'Playing Status'
- [x] Rewritten commands
- <strike>[x] Importing of soundbytes from youtube - `!tada new intro <youtube-url>` The first 6 seconds are played</strike>
- [x] Files messaged to the bot can be turned into intros by the name of the file
- [x] Intro 'debounce' **no more join/rejoin shenanigans to spam your intro**
- [ ] Better configuration and command system
- [ ] Allow user customisable 'groups' of intros
- [ ] Random intros, either first time or every time
- [ ] New users or users still using the default noise are given a random set of intros
- [ ] Entry/exit time-out to prevent spam - eg. If user joins 2 times in 5 minutes their intro will be timed out for 25 minutes. Frequency/Period/Timeout are all set in config file
- [ ] -Collision avoidance if more than one user joins - Currently users that join during the playing of an intro are ignored by Tada
- [ ] 'Black'/'White' list for voice channels
- [ ] Persistent Backend for Configuration - currently using nedb, may move to something else oneday
- [ ] Config from direct messages
- [ ] Dockerfile w/ build

## How even use?

1. Send tada your files. If they're less than 1MB mp3 files it will accept them and save them to disk.
2. Files sent to tada with the naming standard sickintro.default.mp3 will be recognised as 'default' intros
3. There are no private intros
4. There is a maximum number of saved files (50). Oldest unused files are cleaned first

## How even install

1. Requires linux-based operating system
2. `git clone` this repo
3. `cd tada-discord && npm i`
4. `cp config.example.json config.json && vi config.json`
5. Fill in the blanks and/or customise that config. Necessary things to fill are the auth.client.\*, the auth.bot.token and the owner fields. Perms are optional, I apparently use "53677376"
6. `npm start` to run the bot. Once it's up and running you'll need to invite it to your Discord Server by visiting the "invite this bot" link that is unique for each bot. There's a tutorial somewhere with this info.
7. I would advise running Tada with pm2. `sudo npm -g i pm2 && pm2 start index.js` as that way if it dies it'll ressurect and you get nice log keeping etc.
8. Once your bot is online send it <1MB .mp3 files. It'll save them to disk and make them available to set as your intro with tada-intro name-of-file-you-sent-minus-the-.mp3-bit.
9. Make a Baby Shark intro and troll your friends (and yourself)
