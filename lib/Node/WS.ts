import WebSocket from "ws";
import { Node } from "./Node";
import { Client } from "../Client";

export class WS {
    public node: Node;
    public client: Client;
    public ws: any | WebSocket;
    public durable: boolean;
    constructor(node: Node, client: Client) {
        this.node = node;
        this.client = client;
        this.ws = null;
        this.durable = false;
    }

    public async connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.close();
        const headders = {
            Authorization: this.node.password,
            "User-Id": this.client.userID,
            "Client-Name": "MagmaLink"
        }

        if (this.node.resumeKey) headders["Resume-Key"] = this.node.resumeKey;

        this.ws = new WebSocket(this.node.wsURL, { headers: headders });

        this.ws.on("open", this.open.bind(this));
        this.ws.on("message", this.message.bind(this));
    }

    public async send(packet: any): Promise<boolean> {
        const payload = JSON.stringify(packet);

        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(payload);
            return true;
        } else {
            return false;
        }
    }

    private async open() {
        this.node.connected = true;
        this.client.emit("nodeConnect", this.node);
    }

    private async message(packet: any) {
        const data = JSON.parse(packet);
        if (!data?.op) return;

        this.client.emit("nodeRaw", data);
        this.client.emit('debug', `Received packet from node ${this.node.name}: ${packet}`);

        switch (data.op) {
            case "stats": {
                this.node.setStats(data);
                break;
            }
            case "ready": {
                this.node.rest.setSessionID(data.sessionId);
                this.node.sessionID = data.sessionId;
                this.client.emit("nodeReady", this.node);
                if (this.node.resumeKey) {
                    this.node.rest.patch(`/v3/sessions/${this.node.sessionID}`, {
                        resumingKey: this.node.resumeKey,
                        timeout: this.node.resumeTimeout
                    });
                }
                break;
            }
        }

        
    }
}