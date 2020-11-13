# tada-discord

[![Build Status](https://drone.sablecliff.com/api/badges/cavejay/tada-discord/status.svg)](https://drone.sablecliff.com/cavejay/tada-discord)

The Discord Bot for dramatic entrances.

---

## Tasklist

### Necessary

- [x] 'Playing Status'
- [x] Action when user joins a voice channel
- [x] Play a 'noise' when user joins a voice channel
- [x] Play a user specific noise when a user joins vc
- [x] Have a way for a user to decide to _not_ have an intro
- [x] Files messaged to the bot can be turned into intros by the name of the file
- [x] Segregating Guilds because not everyone should get everything all the time
- [ ] Better configuration and command system
- [ ] Entry/exit time-out to prevent spam - eg. If user joins 2 times in 5 minutes their intro will be timed out for 25 minutes. Frequency/Period/Timeout are all set per guild
- [x] Persistent Backend for Configuration - SQLite? RethinkDB? Something bigger?
- [ ] Config from direct messages
- [ ] Dockerfile w/ build
- [ ] Deploy Pipeline

### Stretch Goals

- [x] Rewritten commands
- [ ] Fixing the Caching etc of sounds and intros and users - This is not the db's job
- [ ] Intro 'debounce' **no more join/rejoin shenanigans to spam your intro**
- [ ] 'Black'/'White' list for voice channels
- [ ] Random intros, either first time or every time
- [ ] New users or users still using the default noise are given a random set of intros

## How even use?

Installation guide pending.

## How even install?

1. Requires linux-based operating system
2. Hard dependency on an accessible [RethinkDB](https://rethinkdb.com) instance - no user/pw currently supported
3. `git clone` this repo
4. `cd tada-discord && npm i`
5. `cp config.default.js config.production.js && vi config.production.js`
6. Fill in the blanks and/or customise that config. Necessary things to fill are the `auth.client.\*`, the `auth.bot.token` and the owner fields. Perms are optional, I apparently use "53677376"
7. `ENV=production npm start` to run the bot. You can invite your bot by creating an OAuth2 link from the developer console. Go to the link you generate and add it to the server you want.
8. I would advise running Tada with pm2. `sudo npm -g i pm2 && pm2 start index.js` as that way if it dies it'll ressurect and you get nice log keeping etc.
9. Once your bot is online send it <1MB .mp3 files. It'll save them to i and make them available to set as your intro with tada-intro name-of-file-you-sent-minus-the-.mp3-bit.
10. Make a Baby Shark intro and troll your friends (and yourself)
