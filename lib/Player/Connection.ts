import { Player } from "./Player";

export interface VoiceServer {
    token: string;
    sessionId: string;
    endpoint: string;
}

export class Connection {
    public player: Player;
    public sessionID: string | null;
    public voiceServer: VoiceServer | null;
    public region: string | null;
    public selfDeaf: boolean;
    public selfMute: boolean;

    constructor(player: Player) {
        this.player = player;
        this.sessionID = null;
        this.voiceServer = {
            token: null,
            sessionId: null,
            endpoint: null
        };
        this.region = null;
        this.selfDeaf = false;
        this.selfMute = false;
    }

    public voiceServerUpdate(data: any): void {
        if (!data.endpoint) { this.player.client.emit("error", new Error("Session endpoint not found!")); return; }

        this.voiceServer.endpoint = data.endpoint;
        this.voiceServer.token = data.token;
        
        this.region = data.endpoint.split(".").shift()?.replace(/[0-9]/g, "") || null;

        this.player.node.rest.updatePlayer({
            guildId: this.player.guildID,
            data: {
                voice: this.voiceServer
            }
        })
    }

    public voiceStateUpdate(data: any): void {
        const { session_id, channel_id, self_deaf, self_mute } = data;
        if (this.player.voiceChannel && channel_id && this.player.voiceChannel !== channel_id) {
            this.player.voiceChannel = channel_id;
        }

        this.selfDeaf = self_deaf;
        this.selfMute = self_mute;
        this.voiceServer.sessionId = session_id || null;
    }
}