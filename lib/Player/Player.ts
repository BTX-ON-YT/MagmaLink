import { EventEmitter } from 'events';
import { Node } from '../Node/Node';
import { Client, ConnectionOptions } from '../Client';
import { Connection } from './Connection';
import { Queue } from './Queue';

export class Player extends EventEmitter {
    public client: Client;
    public node: Node;
    public guildID: any;
    public connection: Connection;
    public queue: Queue;
    public playing: boolean;
    public paused: boolean;
    public volume: number;
    public position: number;
    public filters: any;
    public ping: number;
    public voiceChannel: string;
    public textChannel: string;
    public currentTrack: any;
    public previousTrack: any;
    public connected: boolean;
    public timeStamp: number;
    public deaf: boolean;
    public mute: boolean;

    constructor(node: Node, client: Client, options: any) {
        super();

        this.client = client;
        this.node = node;
        this.guildID = options.guildID;
        this.connection = new Connection(this);
        this.queue = new Queue();
        this.voiceChannel = options.voiceChannel;
        this.textChannel = options.textChannel;
        this.playing = false;
        this.paused = false;
        this.volume = 100;
        this.connected = false;
        this.currentTrack = null;
        this.position = 0;
        this.previousTrack = null;
        this.filters = {};
        this.ping = 0;
        this.timeStamp = 0;
        this.deaf = options.deaf || false;
        this.mute = options.mute || false;
    }

    public async connect(options: ConnectionOptions = this) {
        let { guildID, voiceChannel, deaf, mute } = options;
        this.client.adapter.send({
            op: 4,
            d: {
                guild_id: guildID,
                channel_id: voiceChannel,
                self_deaf: deaf || true,
                self_mute: mute || false,
            }
        })

        this.connected = true;
    }

    public async play() {
        if (!this.queue.size) return;
        this.currentTrack = this.queue.next;
        if (!this.currentTrack.track) await this.currentTrack.resolve(this.client);
        this.playing = true;
        this.position = 0;

        this.node.rest.updatePlayer({
            guildId: this.guildID,
            data: {
                encodedTrack: this.currentTrack.track,
            }
        });
    }

    public async pause() {
        this.node.rest.updatePlayer({ guildId: this.guildID, data: { paused: true } });
    }

    public async resume() {
        this.node.rest.updatePlayer({ guildId: this.guildID, data: { paused: false } });
    }

    public async stop() {
        this.node.rest.updatePlayer({ guildId: this.guildID, data: { encodedTrack: null } });
    }

    public seek(position: number) {
        if (this.position + position >= this.currentTrack.info.length) position = this.currentTrack.info.length;
        this.node.rest.updatePlayer({ guildId: this.guildID, data: { position } });
    }

    public async disconnect() {
        if (!this.voiceChannel) return;
        this.pause();
        this.connected = false;
        this.client.adapter.send({
            op: 4,
            d: {
                guild_id: this.guildID,
                channel_id: null,
                self_deaf: false,
                self_mute: false,
            }
        });
        this.voiceChannel = null;
    }

    public async destroy() {
        this.disconnect();
        this.node.rest.destroyPlayer(this.guildID);
        this.client.players.delete(this.guildID);
        this.client.emit('playerDestroy', this);
    }
}