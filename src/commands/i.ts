import { Client, Message, GuildChannel, DMChannel, TextChannel, MessageEmbed } from "discord.js";
import { BotServer } from "../types/servers";
import { CommandHelp, InfoCache, PostableInfo, InfoResult } from "../types/util";
import { getAllInfos, displayInfo } from "../api/bot-db";

const help: CommandHelp = {
    name: "i",
    description: "Quick command for displaying an info topic.",
    usage: "[query]",
    moderatorOnly: false,
    adminOnly: false,
    officialOnly: false 
}

let cachedInfo: InfoCache;

async function run(client: Client, message: Message, args: string[], server: BotServer) {
    // Get reply channel
    const replyChannel: (GuildChannel | DMChannel | undefined | null) = server && server.channel_bot ? message.guild?.channels.resolve(server.channel_bot) : message.channel;
    const rc: TextChannel = (replyChannel as TextChannel);
    const prefix = rc === message.channel ? '' : `${message.author.toString()}`

    if (!cachedInfo || cachedInfo.expiry < new Date()) {
        const data = await getAllInfos().catch(() => []);
        const expiry = new Date(new Date().getTime() + 5*60000);
        cachedInfo = { data, expiry };
        console.log(`${new Date().toLocaleString()} - Updated info cache.`, cachedInfo.data.length);
    }

    if (!args.length) return rc.send(prefix, helpEmbed(client, message)).catch(() => undefined);

    const query: string = args[0].toLowerCase();
    const result: InfoResult|undefined = cachedInfo.data.find(i => i.name.toLowerCase() === query);
    if (!result) return rc.send(prefix, notFound(client, message, query)).catch(() => undefined);
    const postable: PostableInfo = displayInfo(client, message, result);
    message.channel.send(postable.content, postable.embed).catch(() => undefined);
}

const helpEmbed = (client: Client, message: Message): MessageEmbed => {
    return new MessageEmbed()
    .setColor(0xda8e35)
    .setTitle('Info Command Help')
    .setDescription('This command will return an embed or message based on a preset help topic.\nUse `!nm i {topic}` to invoke this command.')
    .addField('Available Topics (case insensitive)', cachedInfo.data.map(i => `${i.title} [${i.name}]`).join("\n").substr(0, 1024))
    .setFooter(`Nexus Mods API link - ${message.author.tag}: ${message.cleanContent}`, client.user?.avatarURL() || '');
}

const notFound = (client: Client, message: Message, query: string): MessageEmbed => {
    return new MessageEmbed()
    .setColor(0xda8e35)
    .setTitle('Info Not Found')
    .setDescription(`There are no stored infos matching your query "${query}".`)
    .setFooter(`Nexus Mods API link - ${message.author.tag}: ${message.cleanContent}`, client.user?.avatarURL() || '');
}

export { run, help };