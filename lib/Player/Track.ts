import { Client } from "../Client";

let escapeRegExp = (str: any) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export interface TrackData {
    track: string;
    info: TrackInfo;
}

export interface TrackInfo {
    identifier: string;
    isSeekable: boolean;
    author: string;
    length: number;
    isStream: boolean;
    title: string;
    uri: string;
    sourceName: string;
    image?: string;
    requester?: any;
}

export class Track {
    public client: Client | null;
    public track: string;
    public info: TrackInfo;

    constructor(data: TrackData, requester: any = null) {
        this.client = null;
        this.track = data.track;
        this.info = {
            identifier: data.info.identifier,
            isSeekable: data.info.isSeekable,
            author: data.info.author,
            length: data.info.length,
            isStream: data.info.isStream,
            sourceName: data.info.sourceName,
            title: data.info.title,
            uri: data.info.uri,
            image: data.info.image || `https://i.ytimg.com/vi/${data.info.identifier}/maxresdefault.jpg` || null,
            requester
        };
    }

    public async resolve(client: Client): Promise<Track> {
        this.client = client;
        let query = [this.info.author, this.info.title].join(" - ");

        let result: any = this.client.resolve({ query, requester: this.info.requester });

        if (this.info.author) {
            let author = [this.info.author, `${this.info.author} - Topic`];

            let officialAudio = result.tracks.find(
                (track: Track) =>
                  author.some((name) =>
                    new RegExp(`^${escapeRegExp(name)}$`, "i").test(track.info.author)
                  ) ||
                  new RegExp(`^${escapeRegExp(this.info.title)}$`, "i").test(
                    track.info.title
                  )
            );
            if (officialAudio) {
                this.info.identifier = officialAudio.info.identifier;
                this.info.image = `https://i.ytimg.com/vi/${this.info.identifier}/maxresdefault.jpg`;
                this.track = officialAudio.track;
                return this;
            };
        }
        if (this.info.length) {
            let sameDuration = result.tracks.find(
                (track: TrackData) =>
                    track.info.length >= (this.info.length ? this.info.length : 0) - 2000 &&
                    track.info.length <= (this.info.length ? this.info.length : 0) + 2000
            );
            if (sameDuration) {
                this.info.identifier = sameDuration.info.identifier;
                this.info.image = `https://i.ytimg.com/vi/${this.info.identifier}/maxresdefault.jpg`;
                this.track = sameDuration.track;
                return this;
            }
        }
        this.info.identifier = result.tracks[0].info.identifier;
        this.info.image = `https://i.ytimg.com/vi/${this.info.identifier}/maxresdefault.jpg`;
        this.track = result.tracks[0].track;
        return this;
    }
}