import { Client } from '../Client';
import { Node } from './Node';
import { fetch, Response } from 'undici';

export enum RestMethods {
    GET = 'GET',
    POST = 'POST',
    PATCH = 'PATCH',
    DELETE = 'DELETE'
}

export interface playerOptions {
    guildId: string;
    data: {
        encodedTrack?: string;
        identifier?: string;
        startTime?: number;
        endTime?: number;
        volume?: number;
        position?: number;
        paused?: Boolean;
        filters?: Object;
        voice?: any;
    }
}

export class Rest {
    public client: Client;
    public node: Node;
    public url: string;
    public password: string;
    public sessionID: string;
    constructor(Client: Client, Node: Node) {
        this.client = Client;
        this.node = Node;
        this.url = this.node.restURL;
        this.password = this.node.password;
        
        if (this.node.restURL.endsWith('/')) {
            this.url = this.node.restURL.slice(0, -1);
        }
    }

    public setSessionID(id: string) {
        this.sessionID = id;
    }

    public async updatePlayer(options: playerOptions) {
        return await this.request(RestMethods.PATCH, `/v3/sessions/${this.sessionID}/players/${options.guildId}/?noReplace=false`, options.data);
    }

    public async destroyPlayer(guildID: string) {
        return await this.request(RestMethods.DELETE, `/v3/sessions/${this.sessionID}/players/${guildID}`);
    }

    public async decodeTrack(track: string) {
        return await this.request(RestMethods.GET, `/v3/decodetrack?encodedTrack=${track}`);
    }

    private async parseResponse(res: Response) {
        let body = await res.text();
        if (body) {
            this.client.emit('http', JSON.parse(body));
            return JSON.parse(body);
        }
        return null;
    }

    public async request(method: RestMethods, path: string, body?: any) {
        switch (method) {
            case RestMethods.GET:
                return await this.get(path);
            case RestMethods.POST:
                return await this.post(path, body);
            case RestMethods.PATCH:
                return await this.patch(path, body);
            case RestMethods.DELETE:
                return await this.delete(path);
        }
    }

    public async get(path: string) {
        let res = await fetch(`${this.url}${path}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: this.password
            }
        });
        return this.parseResponse(res);
    }

    public async post(path: string, body: any) {
        let res = await fetch(`${this.url}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: this.password
            },
            body: JSON.stringify(body)
        });
        return this.parseResponse(res);
    }

    public async patch(path: string, body: any) {
        let res = await fetch(`${this.url}${path}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: this.password
            },
            body: JSON.stringify(body)
        });
        return this.parseResponse(res);
    }

    public async delete(path: string) {
        let res = await fetch(`${this.url}${path}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: this.password
            }
        });
        return this.parseResponse(res);
    }
}