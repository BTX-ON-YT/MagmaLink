import { Client, NodeGroup } from "../Client";
import { WS } from "./WS";
import { Rest } from "./Rest";

export interface NodeStats {
    players: number;
    playingPlayers: number;
    memory: {
      reservable: number;
      used: number;
      free: number;
      allocated: number;
    };
    frameStats: {
      sent: number;
      deficit: number;
      nulled: number;
    };
    cpu: {
      cores: number;
      systemLoad: number;
      lavalinkLoad: number;
    };
    uptime: number;
  }

export class Node {
    public client: Client;
    public restURL: string;
    public wsURL: string;
    public password: string;
    public name: string;
    public regions: string[];
    public ws: any | WS;
    public connected: boolean;
    public resumeKey: string;
    public resumeTimeout: number;
    public sessionID: string | null;
    public stats: NodeStats | null;
    public rest: Rest;
    constructor(client: Client, node: NodeGroup) {
        this.client = client;
        this.restURL = `http${node.secure ? "s" : ""}://${node.host}:${node.port}`;
        this.wsURL = `ws${node.secure ? "s" : ""}://${node.host}:${node.port}`;
        this.password = node.password || "youshallnotpass";
        this.name = node.name;
        this.regions = node.region || [];
        this.ws = null;
        this.rest = new Rest(this.client, this);
        this.connected = false;
        this.sessionID = null;
        this.resumeKey = client.options.resumeKey || null;
        this.resumeTimeout = client.options.resumeTimeout || 60;
        /*this.autoResume = client.options.autoResume || false;
        this.reconnectTimeout = client.options.reconnectTimeout || 5000;
        this.reconnectTries = client.options.reconnectTries || 5;
        this.reconnectAttempt = null;*/
        this.stats = null;
    }

    public async connect() {
        this.ws = new WS(this, this.client);
        await this.ws.connect();
    }

    public async send(packet: any) {
        if (!this.connected) this.client.emit("error", new Error("Node is not connected!"));
        this.ws.send(packet, (err: any) => {
            if (err) this.client.emit("error", err);
            return true;
        });
    }

    public setStats(packet: NodeStats) {
        this.stats = packet;
    }

    public async decodeTrack(encodedTrack: string) {
        return this.rest.decodeTrack(encodedTrack);
    }

    get penalties(): number {
        let penalties = 0;
        if (!this.connected) return penalties;
        penalties += this.stats.players;
        penalties += Math.round(
          Math.pow(1.05, 100 * this.stats.cpu.systemLoad) * 10 - 10
        );
        if (this.stats.frameStats) {
          penalties += this.stats.frameStats.deficit;
          penalties += this.stats.frameStats.nulled * 2;
        }
        return penalties;
      }
}