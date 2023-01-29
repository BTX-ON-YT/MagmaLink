export class OceanicAdapter {
    public BotClient: any;
    public readonly LavaClient: any;
    constructor(BotClient: any, lavaClient: any) {
        this.BotClient = BotClient;
        this.LavaClient = lavaClient;

        this.BotClient.on("packet", async (packet: any) => {
            await this.packetUpdate(packet);
        });
    }

    public updateClient(client: any) {
        this.BotClient = client;
    }

    public send(packet: any) {
        const guild = this.BotClient.guilds.get(packet.d.guild_id);

        if (guild) guild.shard.send(packet?.op, packet?.d);
    }

    public async packetUpdate(packet: any) {
        this.LavaClient.packetHandler(packet);
    }
}