<!--<h1 align="center">Magama Link: stable and preforment lavalink client for Node.JS</h1>-->

### Table of contents
- [Installation](https://github.com/BTX-ON-YT/MagmaLink#installation)

# Installation
```
// npm
npm install magmalink

// yarn
yarn add magmalink
```

# Example

#### Note this example uses the oceanic.js library and uses typescript for more examples with other librarys see [examples]()

```ts
import { Client, ApplicationCommandTypes, ApplicationCommandOptionTypes, CommandInteraction } from "oceanic.js";
import MagmaLink from "magmalink";

const client = new Client({
    auth: "Bot [token]",
    gateway: {
        intents: ["GUILDS", "GUILD_VOICE_STATES", "GUILD_MESSAGES", "MESSAGE_CONTENT"]
    }
})

const lavalink = new MagmaLink({
    client: client,
    library: "oceanic",
    nodes: [
        {
            name: "main-node",
            host: "localhost",
            password: "youshallnotpass",
            port: 2333,
            secure: false
        }
    ]
})

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    lavalink.init(client);
    
    const commands = [
        {
            type: ApplicationCommandTypes.CHAT_INPUT,
            name: "play",
            description: 'Play a song',
            options: [
                {
                    type: ApplicationCommandOptionTypes.STRING,
                    name: 'song',
                    description: 'The song you want to play',
                    required: true
                }
            ]
        }
    ];
    
    commands.forEach((command: any) => {
        await client.application.createGuildCommand("Your guildID", command)
    });
});

client.on("interactionCreate", async (interaction: any) => {
    if (!(interaction instanceof CommandInteraction)) return;
    
    switch (interaction.data.name) {
        case "play": {
            await interaction.defer();
        
            const song = interaction.data.options.raw[0].value;
        
            const guild = client.guilds.get(interaction.guildID);
            
            const voiceState = guild.voiceStates.get(interaction.member.user.id);
            
            if (!voiceState) {
                await interaction.createFollowup({ content: 'You are not in a voice channel!' });
                return;
            }
            
            const player = await lavalink.createConnection({
                guildID: guild.id,
                voiceChannel: voicestate.channelID,
                textChannel: interaction.channelID
            });
            
            const res = await lavalink.resolve({
                query: song,
                requester: interaction.member.user.id
            });
            
            if (res.loadType === 'NO_MATCHES') {
                await interaction.createFollowup({ content: 'No matches found!' });
                return;
            } else if (res.loadType === 'LOAD_FAILED') {
                await interaction.createFollowup({ content: 'Failed to load the song!' });
                return;
            }
            
            if (res.loadType === 'PLAYLIST_LOADED') {
                for (const track of res.tracks) {
                    track.info.requester = interaction.member.user.id;
                    track.info.urll = songUrl;
                    player.queue.add(track);
                }

                await interaction.createFollowup({ content: `Queued \`${res.playlistInfo.name}\` with ${res.tracks.length} tracks` });
            } else {
                const track = res.tracks[0];
                track.info.requester = interaction.member.user.id;
                track.info.urll = songUrl;
                player.queue.add(track);

                await interaction.createFollowup({ content: `Queued \`${track.info.title}\`` });
            }
            
            if (!player.playing && !player.paused) {
                player.play();
            }
        }
    }
});
```
