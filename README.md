# tada-discord

Discord Bot for dramatic entrances

## todo

- [x] Action when user joins a voice channel
- [x] Play a 'noise' when user joins a voice channel - _this is beautiful_
- [x] Play a user specific noise when a user joins vc
- [x] Have a way for a user to decide to _not_ have an intro
- [x] 'Playing Status'
- [x] Rewritten commands
- [x] Importing of soundbytes from youtube - `!tada new intro <youtube-url>` The first 6 seconds are played
- [ ] Files messaged to the bot can be turned into intros by the name of the file
- [ ] New users or users still using the default noise are giving a random set of intros
- [ ] Entry/exit time-out to prevent spam - eg. If user joins 2 times in 5 minutes their intro will be timed out for 25 minutes. Frequency/Period/Timeout are all set in config file
- [ ] -Collision avoidance if more than one user joins- It doesn't look like this is an issue?
- [ ] 'Black'/'White' list for voice channels
- [ ] Persistent Backend for Configuration
- [ ] Config from direct messages
- [ ] Dockerfile w/ build

# How even use?

1. Send tada your files. If they're less than 1MB mp3 files it will accept them and save them to disk.
2. Files sent to tada with the naming standard sickintro.default.mp3 will be recognised as 'default' intros
3. There are no private intros
4. There is a maximum number of saved files (50). Oldest unused files are cleaned first
5. 

https://github.com/fent/node-ytdl-core