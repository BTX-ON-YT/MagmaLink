import { EventEmitter } from "events";
import { OceanicAdapter } from "./Adapters/Oceanic";
import { Node } from "./Node/Node";
import { Player } from "./Player/Player";
import { Response } from "./Response";

export type SupportedLibraries = "oceanic" | "eris" | "discord.js" | "custom";

export interface ClientOptions {
    library?: "oceanic" | "eris" | "discord.js",
    client: any,
    nodes: NodeGroup[],
    resumeKey?: string,
    resumeTimeout?: number,
}

export interface NodeGroup {
    name: string;
    host: string;
    port: number;
    password: string;
    secure?: boolean;
    region?: string[];
}

export interface ConnectionOptions {
    guildID: string;
    voiceChannel: string;
    textChannel: string;
    deaf?: boolean;
    mute?: boolean;
    region?: string;
}

export class Client extends EventEmitter {
    public readonly client: any;
    public readonly _nodes: NodeGroup[];

    public nodes: Map<string, Node>;
    public options: ClientOptions;
    public library: string;
    public adapter: OceanicAdapter;
    public userID: any;
    public players: Map<any, any>;
    constructor(options: ClientOptions) {
        super();

        this.options = options;
        this.client = options.client;
        this._nodes = options.nodes;
        this.nodes = new Map();
        this.players = new Map();
        this.library = options.library || "discord.js";

        if (this.library === "oceanic") {
            this.adapter = new OceanicAdapter(this.options.client, this);
        }
    }

    public init(client: any) {
        this.adapter.updateClient(client);
        this.userID = client.user.id;

        this._nodes.forEach(async (node) => {
            await this.addNode(node);
        });
    }

    public packetHandler(packet: any) {
        if (!["VOICE_SERVER_UPDATE", "VOICE_STATE_UPDATE"].includes(packet.t)) return;

        const player = this.players.get(packet.d.guild_id);
        if (!player) return;

        switch (packet.t) {
            case "VOICE_SERVER_UPDATE": {
                player.connection.voiceServerUpdate(packet.d);
                break;
            }
            case "VOICE_STATE_UPDATE": {
                if (packet.d.user_id !== this.userID) return;
                player.connection.voiceStateUpdate(packet.d);
                break;
            }
        }
    }

    private async addNode(options: NodeGroup) {
        const node = new Node(this, options);
        this.nodes.set(options.name, node);
        node.connect();
        return node;
    }

    public getNodeByRegion(region: string) {
        return [...this.nodes.values()]
          .filter(
            (node) =>
              node.connected && node.regions.includes(region.toLowerCase())
          )
          .sort((a, b) => {
            const aLoad = a.stats.cpu
              ? (a.stats.cpu.systemLoad / a.stats.cpu.cores) * 100
              : 0;
            const bLoad = b.stats.cpu
              ? (b.stats.cpu.systemLoad / b.stats.cpu.cores) * 100
              : 0;
            return aLoad - bLoad;
          });
    }

    public getLeastUsedNode() {
        return [...this.nodes.values()]
        .filter((node) => node.connected)
        .sort((a, b) => a.penalties - b.penalties);
    }

    public async createConnection(options: ConnectionOptions) {
        let player = this.players.get(options.guildID);
        if (player) return player;

        if (this.nodes.size === 0) this.emit("error", "No nodes available");

        let node: any;

        if (options.region) {
            node = this.getNodeByRegion(options.region)[0];
        } else {
            node = this.getLeastUsedNode()[0];
        }

        if (!node) this.emit("error", "No nodes available");

        return this.createPlayer(options, node);
    }

    private createPlayer(options: ConnectionOptions, node: Node) {
        let player = new Player(node, this, options);
        this.players.set(options.guildID, player);
        player.connect();
        return player;
    }

    public async resolve({ query, source, requester }: { query: string, source?: string, requester: any }, node: Node | null = null) {
        if (!node) node = this.getLeastUsedNode()[0];
        if (!node) return this.emit("error", "No nodes available");
        const regex = /^https?:\/\//;

        if (regex.test(query)) {
            let res = await node.rest.get(`/v3/loadtracks?identifier=${encodeURIComponent(query)}`);
            return new Response(res, requester);
        } else {
            let track = `${source || "ytsearch"}:${query}`;
            let res = await node.rest.get(`/v3/loadtracks?identifier=${encodeURIComponent(track)}`);
            return new Response(res, requester);
        }
    }
}