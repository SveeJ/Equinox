import { CategoryChannel, Collection, GuildMember, MessageEmbed, MessageReaction, TextChannel, User, VoiceChannel } from "discord.js";
import { ObjectId, UpdateOneOptions, UpdateQuery } from "mongodb";
import { Constants } from "./constants";
import Logger from "./logger";
import { defaultGuild } from "./managers/bot";
import database from "./managers/database";
import { Game as _Game, GamePlayer, GameState, Team } from "./typings/games";
import type { Player as _Player } from "./typings/players";
import type { Tournament as _Tournament } from "./typings/tournaments";
const { HYPIXEL_KEY } = process.env;
import fetch from "node-fetch";
import { bots, devLogger } from "./managers/socket";

interface _Map {
    img: string;
    limit: string;
}

const maps_object: { [key: string]: _Map } = {
    "Aquarium": {img:"https://cdn.discordapp.com/attachments/799897234128764958/800008639342575667/aquariumold-png.png",limit:"+110"},
    "Katsu": {img:"https://cdn.discordapp.com/attachments/799897234128764958/800010460429942794/NEW-Katsu-bw-3v3v3v3-4v4v4v4.png",limit:"+96"},
    "Lectus": {img:"https://cdn.discordapp.com/attachments/799897234128764958/800014149232492594/image0.jpg",limit:"+90"},
    "Chained": {img:"https://cdn.discordapp.com/attachments/799897234128764958/800014260716699676/image0.jpg",limit:"+90"},
    "Invasion": {img:"https://cdn.discordapp.com/attachments/799897234128764958/800014465294008370/image0.jpg",limit:"+115"},
    "Rise": {img:"https://cdn.discordapp.com/attachments/800022796301369344/800024134217629706/rise-png.png",limit:"+96"},
    "Boletum": {img:"https://cdn.discordapp.com/attachments/800022796301369344/800025033007169546/BoletumOld.png",limit:"+121"},
    "Temple": {img:"https://cdn.discordapp.com/attachments/800022796301369344/800023969918746624/templebedwars-png.png", limit:"106"},
}

export class Player {

    constructor(private data: _Player){};

    get _id(){
        return this.data._id;
    }

    get discord(){
        return this.data.discord;
    }

    get minecraft(){
        return this.data.minecraft;
    }

    get registeredAt(){
        return this.data.registeredAt;
    }

    get wins(){
        return this.data.wins ?? 0;
    }

    get losses(){
        return this.data.losses ?? 0;
    }

    get kills(){
        return this.data.kills ?? 0;
    }

    get deaths(){
        return this.data.deaths ?? 0;
    }

    get bedsBroken() {
        return this.data.bedsBroken ?? 0;
    }

    get bedsLost() {
        return this.data.bedsLost ?? 0;
    }

    get roles() {
        return this.data.roles ?? [];
    }

    get games() {
        return this.data.games ?? 0;
    }

    get winstreak() {
        return this.data.winstreak ?? 0;
    }

    get bedstreak() {
        return this.data.bedstreak ?? 0;
    }

    async update(data: Partial<_Player>){
        this.data = (await (await database).players.findOneAndUpdate({ _id: this._id }, {
            $set: data,
        }, {
            upsert: true,
        })).value!;
        return this;
    }

    toGamePlayer(): GamePlayer {
        return { username: this.minecraft.name, winstreak: this.winstreak, bedstreak: this.bedstreak };
    }

    toJSON(): _Player {
        return { _id: this._id, discord: this.discord, minecraft: this.minecraft, registeredAt: this.registeredAt, bedsBroken: this.bedsBroken, bedsLost: this.bedsLost, bedstreak: this.bedstreak, deaths: this.deaths, games: this.games, kills: this.kills, losses: this.losses, roles: this.roles, wins: this.wins, winstreak: this.winstreak };
    }
}

/** Ways to fetch player data.  */
export namespace Players {

    /** Gets a player by their **Competitive Bedwars ID**. */
    export async function getById(id: ObjectId){
        const data = await (await database).players.findOne({ _id: id });
        return data ? new Player(data) : null;
    }

    /** Gets a player by their **Discord ID**. */
    export async function getByDiscord(id: string){
        const data = await (await database).players.findOne({ discord: id });
        return data ? new Player(data) : null;
    }

    /** Gets a player by their **Minecraft UUID**. */
    export async function getByMinecraft(uuid: string){
        const data = await (await database).players.findOne({ "minecraft.uuid": uuid });
        return data ? new Player(data) : null;
    }

    /** Gets multiple players by their **Competitive Bedwars ID**. */
    export async function getManyById(ids: ObjectId[]){
        const data = await (await database).players.find({
            _id: {
                $in: ids
            }
        }).toArray();
        const players = new Collection<ObjectId, Player>();
        data.forEach(player => players.set(player._id, new Player(player)));
        return players;
    }

    /** Gets multiple players by their **Discord ID**. */
    export async function getManyByDiscord(ids: string[]){

        const data = await (await database).players.find({
            discord: {
                $in: ids
            }
        }).toArray();

        const players = new Collection<string, Player>();
        data.forEach(player => players.set(player.discord, new Player(player)));
        return players;
    }

    /** Gets multiple players by their **Minecraft UUID**. */
    export async function getManyByMinecraft(uuids: string[]){
        const data = await (await database).players.find({
            "minecraft.uuid": {
                $in: uuids
            }
        }).toArray();

        data.sort(function(a, b) {return uuids.indexOf(a.minecraft.uuid) - uuids.indexOf(b.minecraft.uuid)})

        const players = new Collection<string, Player>();
        data.forEach(player => players.set(player.minecraft.uuid, new Player(player)));
        return players;
    }
}

export class Game {

    constructor(private data: _Game){};

    get _id(){
        return this.data._id;
    }

    get voiceChannel() {
        return this.data.voiceChannel;
    }

    get textChannel() {
        return this.data.textChannel;
    }

    get team1() {
        return this.data.team1;
    }

    get team2() {
        return this.data.team2;
    }

    async update(data: Partial<_Game>){
        this.data = (await (await database).games.findOneAndUpdate({ _id: this._id }, {
            $set: data,
        }, {
            upsert: true,
        })).value!;
        return this;
    }

}

export class Tournament {

    constructor(private data: _Tournament){};

    get _id(){
        return this.data._id;
    }

    get manager() {
        return this.data.manager;
    }

    get registration() {
        return this.data.registration;
    }

    get createdAt() {
        return this.data.createdAt;
    }

    get name() {
        return this.data.name;
    }
    
    get teams() {
        return this.data.teams;
    }

    get number_of_players() {
        return this.data.number_of_players;
    }

    get teamIndex() {
        return this.data.teamIndex;
    }

    get registered() {
        return this.data.registered;
    }

    async update(data: Partial<_Tournament>){
        this.data = (await (await database).tournaments.findOneAndUpdate({ _id: this._id }, {
            $set: data,
        }, {
            upsert: true,
        })).value!;
        return this;
    }
}
  
function sum(arr: number[], start: number, end: number) {
    
    var tot = 0;  
    
    for(var i = start; i <= end; i++) {
      tot += arr[i];
    }
  
    return tot;
}

export class LocalGame {

    public readonly logger = new Logger(`Game #${this.gameNumber}`);
    private gamePlayers?: string[];
    private _textChannel?: TextChannel;
    private _voiceChannel?: VoiceChannel;
    private _bot?: string;
    private _state = GameState.PRE_GAME;
    private team1?: Team;
    private team2?: Team;
    private team1Players?: Player[];
    private team2Players?: Player[];
    private team1Channel?: VoiceChannel;
    private team2Channel?: VoiceChannel;

    constructor(public readonly gameNumber: number, public readonly id: ObjectId){};

    get state(){
        return this._state;
    }

    get textChannel(){
        return this._textChannel;
    }

    get voiceChannel(){
        return this._voiceChannel;
    }

    get teams(): [ Team | undefined, Team | undefined ] {
        return [ this.team1, this.team2 ];
    }

    get teamPlayers(): [ Player[] | undefined, Player[] | undefined ] {
        return [ this.team1Players, this.team2Players ];
    }

    get gameMembers(){
        return this.gamePlayers ?? [];
    }

    async createChannels(members: GuildMember[], vc: VoiceChannel){
        const guild = await defaultGuild;
        const [ textChannel ] = await Promise.all([
            guild.channels.create(`game-${this.gameNumber}`, {
                type: "text",
                permissionOverwrites: [
                    {
                        id: (await defaultGuild).id,
                        deny: ["VIEW_CHANNEL"]
                    }
                ]
            })
        ]);
        this._textChannel = textChannel;
        this._voiceChannel = vc;
        this.gamePlayers = members.map(mem => mem.id);
        return { textChannel };
    }

    async end(){
        await Promise.all<any>([
            this.update({
                $set: {
                    state: GameState.FINISHED,
                    team1: this.team1,
                    team2: this.team2,
                }
            }),
            ...this._bot ? [BotManager.release(this._bot)] : [],
        ]);
        this._state = GameState.FINISHED;
        activeGames.delete(this.id);
        setTimeout(async () => {
            this._textChannel?.delete().catch(_ => null);
            if(this.team1Channel){
                await Promise.all(this.team1Channel!.members.map(member => member.voice.setChannel(Constants.WAITING_ROOM))).catch(_ => null);
                this.team1Channel?.delete().catch(_ => null);
            }
            if(this.team2Channel){
                await Promise.all(this.team2Channel!.members.map(member => member.voice.setChannel(Constants.WAITING_ROOM))).catch(_ => null);
                this.team2Channel?.delete().catch(_ => null);
            }
        }, 10000);
    }

    async start(team1: Player[], team2: Player[]){
        this.team1 = {
            players: team1.map(player => player.toGamePlayer())
        };
        this.team1Players = team1;
        this.team2 = {
            players: team2.map(player => player.toGamePlayer())
        };
        this.team2Players = team2;
        await this.update({
            $set: {
                state: GameState.ACTIVE,
                team1: {
                    players: this.team1.players,
                },
                team2: {
                    players: this.team2.players,
                },
            }
        });
        this._state = GameState.ACTIVE;
    }

    getPlayer(player: string){
        return this.team1?.players.find(({ username }) => username === player) ?? this.team2?.players.find(({ username }) => username === player) ?? null;
    }

    /** Gets the full `Player` object of a player cached by this game. */
    getFullPlayer(player: string){
        return this.team1Players?.find(({ minecraft }) => minecraft.name === player) ?? this.team2Players?.find(({ minecraft }) => minecraft.name === player) ?? null;
    }

    async cancel(){
        this._state = GameState.VOID;
        activeGames.delete(this.id);
        try {
            await Promise.all<any>([
                this.update({
                    $set: {
                        state: GameState.VOID,
                    },
                    $unset: {
                        textChannel: "",
                        voiceChannel: "",
                    }
                }),
                ...this._bot ? [BotManager.release(this._bot)] : [],
            ])
        } catch(e){
            this.logger.error(`Failed to cancel the game:\n${e.stack}`);
        }
        return async () => {
            this._textChannel?.delete().catch(_ => null);
            if(this.team1Channel){
                await Promise.all(this.team1Channel!.members.map(member => member.voice.setChannel(Constants.WAITING_ROOM))).catch(_ => null);
                this.team1Channel?.delete().catch(_ => null);
            }
            if(this.team2Channel){
                await Promise.all(this.team2Channel!.members.map(member => member.voice.setChannel(Constants.WAITING_ROOM))).catch(_ => null);
                this.team2Channel?.delete().catch(_ => null);
            }
        }
    }

    async enterStartingState(){
        try {
            await this.update({
                $set: {
                    state: GameState.STARTING,
                },
                $unset: {
                    textChannel: "",
                    voiceChannel: "",
                }
            });
            this._state = GameState.STARTING;
        } catch(e){
            this.logger.error(`Failed to entering the starting phase:\n${e.stack}`);
        }
    }

    /** Gets the bot assigned to this game, or assigns a bot to this game if it doesn't have one. If no bots are available, will wait until one is. */
    getAssignedBot(){
        return new Promise<string>(async (res, rej) => {
            if(this._state === GameState.VOID) return rej(new Error("GAME_VOID"));
            if(this._bot) return res(this._bot);
            try {
                const bot = await BotManager.assign(this.id);
                this._bot = bot;
                res(bot);
            } catch(e){
                if(e.message !== "NONE_AVAILABLE") this.logger.error(`Failed to bind to a bot:\n${e.stack}`);
                // Check again every 15 seconds
                const checker = setInterval(() => {
                    BotManager.assign(this.id).then(bot => {
                        clearInterval(checker);
                        this._bot = bot;
                        res(bot);
                    }).catch(_ => null);
                }, 15000);
            }
        });
    }

    async update(update: UpdateQuery<_Game> | Partial<_Game>, options?: UpdateOneOptions | undefined){
        return await (await database).games.updateOne({
            _id: this.id,
        }, update, options);
    }

    setTeamChannels(team1: VoiceChannel, team2: VoiceChannel){
        this.team1Channel = team1;
        this.team2Channel = team2;
    }

    pickMap(){
        return new Promise(async (res, rej) => { 
            const reject = () => rej(new Error("MESSAGE_DELETED"));
            const playerCount = (this.team1Players?.length ?? 0) + (this.team2Players?.length ?? 0);
            let maps = Object.keys(maps_object), firstMap: string, secondMap: string, pick, rankedlogo = Constants.BRANDING_URL;

            firstMap = maps[Math.floor(Math.random() * maps.length)];
            maps = maps.filter(map => map !== firstMap);
            secondMap = maps[Math.floor(Math.random() * maps.length)];

            let [,, m] = await Promise.all([
                this.textChannel!.send(
                    new MessageEmbed()
                    .setColor("ORANGE")
                    .setTitle(`1️⃣ ${firstMap}`)
                    .addField("Build Limit", `Y: ${maps_object[firstMap].limit}`)
                    .setImage(maps_object[firstMap].img)
                    .setFooter("© Ranked Bedwars", rankedlogo)
                ),
                this.textChannel!.send(
                    new MessageEmbed()
                    .setColor("ORANGE")
                    .setTitle(`2️⃣ ${secondMap}`)
                    .addField("Build Limit", `Y: ${maps_object[secondMap].limit}`)
                    .setImage(maps_object[secondMap].img)
                    .setFooter("© Ranked Bedwars", rankedlogo)
                ),
                await this.textChannel!.send(
                    new MessageEmbed()
                    .setColor("ORANGE")
                    .setTitle("Map Picking")
                    .addField(`1️⃣ ${firstMap}`, "\u200b")
                    .addField(`2️⃣ ${secondMap}`, "\u200b")
                    .addField("♻️ Reroll", "\u200b")
                    .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                ),
            ]);

            let reactions = ["1️⃣", "2️⃣", "♻️"];

            await Promise.all(reactions.map(reaction => m.react(reaction).catch(rej)));

            let optionone: User[] = [], optiontwo: User[] = [], optionthree: User[] = [];

            if (m.deleted) return reject();
            
            let collector = m.createReactionCollector((reaction: MessageReaction) => {
                return reactions.includes(reaction.emoji.name);
            }, { time: 30000 });
            
            collector.on('collect', async (reaction, user) => {
                reaction.users.remove(user);
                switch (reaction.emoji.name) {
                    case "1️⃣": {
                        if (optionone.includes(user)) return;
                        optionone.push(user);
                        optiontwo = optiontwo.filter(u => u !== user);
                        optionthree = optionthree.filter(u => u !== user);

                        await m.edit(
                            new MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle("Map Picking")
                            .addField(`1️⃣ ${firstMap}`, "\u200b"+optionone.join("\n"))
                            .addField(`2️⃣ ${secondMap}`, "\u200b"+optiontwo.join("\n"))
                            .addField("♻️ Reroll", "\u200b"+optionthree.join("\n"))
                            .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                        );
                        break;
                    }
                    case "2️⃣": {
                        if (optiontwo.includes(user)) return;
            
                        optionone = optionone.filter(u => u !== user);
                        optiontwo.push(user);
                        optionthree = optionthree.filter(u => u !== user);
                
                        await m.edit(
                            new MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle("Map Picking")
                            .addField(`1️⃣ ${firstMap}`, "\u200b"+optionone.join("\n"))
                            .addField(`2️⃣ ${secondMap}`, "\u200b"+optiontwo.join("\n"))
                            .addField("♻️ Reroll", "\u200b"+optionthree.join("\n"))
                            .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                        );
                        break;
                    }
                    case "♻️": {
                        if (optionthree.includes(user)) return;
            
                        optionone = optionone.filter(u => u !== user);
                        optiontwo = optiontwo.filter(u => u !== user);
                        optionthree.push(user);
                
                        await m.edit(
                            new MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle("Map Picking")
                            .addField(`1️⃣ ${firstMap}`, "\u200b"+optionone.join("\n"))
                            .addField(`2️⃣ ${secondMap}`, "\u200b"+optiontwo.join("\n"))
                            .addField("♻️ Reroll", "\u200b"+optionthree.join("\n"))
                            .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                        );
                        break;
                    }
                }
            });
            
            collector.on('end', async () => {
                if (m.deleted) return reject();
                m.reactions.removeAll().catch(err => console.log(err));
                
                if(optionone.length > optiontwo.length && optionone.length > optionthree.length) pick = firstMap
                else if (optiontwo.length > optionone.length && optiontwo.length > optionthree.length) pick = secondMap
                else pick = null;
            
                if (pick) {
                    // assign a bot and then tell it which map has been picked
                    await m.edit(
                        new MessageEmbed()
                        .setColor("ORANGE")
                        .setTitle("Map Picking")
                        .setDescription(`The map **${pick}** has been chosen, by a margin of ${Math.abs(optionone.length-optiontwo.length)} vote${Math.abs(optionone.length-optiontwo.length) > 1 ? "s" : ""}!`)
                        .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                    );
                    return res(pick);
                } else {
                    
                    maps = maps.filter(map => map !== secondMap);
                    firstMap = maps[Math.floor(Math.random() * maps.length)];
                    maps = maps.filter(map => map !== firstMap);
                    secondMap = maps[Math.floor(Math.random() * maps.length)];

                    const [,, m] = await Promise.all([
                        this.textChannel!.send(
                            new MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle(`1️⃣ ${firstMap}`)
                            .addField("Build Limit", `Y: ${maps_object[firstMap].limit}`)
                            .setImage(maps_object[firstMap].img)
                            .setFooter("© Ranked Bedwars", rankedlogo)
                        ),
                        this.textChannel!.send(
                            new MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle(`2️⃣ ${secondMap}`)
                            .addField("Build Limit", `Y: ${maps_object[secondMap].limit}`)
                            .setImage(maps_object[secondMap].img)
                            .setFooter("© Ranked Bedwars", rankedlogo)
                        ),
                        this.textChannel!.send(
                            new MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle("Map Picking | Reroll")
                            .addField(`1️⃣ ${firstMap}`, "\u200b")
                            .addField(`2️⃣ ${secondMap}`, "\u200b")
                            .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                        )
                    ]);
            
                    optionone = [], optiontwo = [];
            
                    reactions = ["1️⃣", "2️⃣"];
            
                    for (const reaction of reactions) {
                        await m.react(reaction).catch(rej);
                    };

                    if (m.deleted) return reject();
            
                    collector = m.createReactionCollector((reaction: MessageReaction) => {
                        return reactions.includes(reaction.emoji.name);
                    }, { time: 30000 });
            
                    collector.on('collect', async (reaction, user) => {
                        reaction.users.remove(user);
                        if (reaction.emoji.name === "1️⃣") {
            
                            if (optionone.includes(user)) return;
            
                            optionone.push(user);
                            optiontwo = optiontwo.filter(u => u !== user);
            
                            await m.edit(
                                new MessageEmbed()
                                .setColor("ORANGE")
                                .setTitle("Map Picking | Reroll")
                                .addField(`1️⃣ ${firstMap}`, "\u200b"+optionone.join("\n"))
                                .addField(`2️⃣ ${secondMap}`, "\u200b"+optiontwo.join("\n"))
                                .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                            );
            
                        } else if (reaction.emoji.name === "2️⃣") {
            
                            if (optiontwo.includes(user)) return;
            
                            optionone = optionone.filter(u => u !== user);
                            optiontwo.push(user);
            
                            await m.edit(
                                new MessageEmbed()
                                .setColor("ORANGE")
                                .setTitle("Map Picking | Reroll")
                                .addField(`1️⃣ ${firstMap}`, "\u200b"+optionone.join("\n"))
                                .addField(`2️⃣ ${secondMap}`, "\u200b"+optiontwo.join("\n"))
                                .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                            );
            
                        }
                    });
            
                    collector.on('end', async () => {
                        if (m.deleted) return reject();
                        m.reactions.removeAll().catch(err => console.log(err));
                        
                        if(optionone.length > optiontwo.length) pick = firstMap
                        else if(optiontwo.length > optionone.length) pick = secondMap
                        else pick = null;
                        
                        if (pick) {
                            // assign a bot and then tell it which map has been picked
                            await m.edit(
                                new MessageEmbed()
                                .setColor("ORANGE")
                                .setTitle("Map Picking | Reroll")
                                .setDescription(`The map **${pick}** has been chosen, by a margin of ${Math.abs(optionone.length-optiontwo.length)} vote${Math.abs(optionone.length-optiontwo.length) > 1 ? "s" : ""}!`)
                                .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                            );
                        } else {
                            pick = [firstMap, secondMap][Math.floor(Math.random() * 2)];
                            // assign a bot and then tell it which map has been picked
                            await m.edit(
                                new MessageEmbed()
                                .setColor("ORANGE")
                                .setTitle("Map Picking | Reroll")
                                .setDescription(`The map **${pick}** has been randomly chosen, due to a draw.`)
                                .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)
                            );
                        }
                        res(pick);
                    });
                }
            });
        });
    }

}

export const activeGames = new Collection<ObjectId, LocalGame>();

export async function hasPerms(member: GuildMember, roles: string[]) {
    let hasPerms = false;
    member?.roles.cache.forEach(role => {
        if(roles.includes(role.id)) {
            hasPerms = true;
        }
    })

    return hasPerms;
}

export async function createNewGame(){
    const db = await database;

    const { insertedId } = await db.games.insertOne({});

    const gameNumber = 1 + await db.games.find({
        _id: {
            $lt: insertedId
        }
    }).sort({ _id: 1 }).count();

    const game = new LocalGame(gameNumber, insertedId);

    activeGames.set(insertedId, game);

    return game;
}

export namespace BotManager {

    const logger = new Logger("Mineflayer Bot Manager");

    /** Cache of all bots, and whether they are currently assigned to a game or not. */
    export const assignedGamesCache = new Promise<Collection<string, ObjectId | null>>(async (res, rej) => {
        try {
            const bots = await (await database).bots.find().toArray();
            const collection = new Collection<string, ObjectId | null>();
            bots.forEach(bot => collection.set(bot.username, bot.assignedGame ?? null));
            res(collection);
            const { length } = bots;
            if(length > 0) return logger.info(`Cached the statuses of ${length} bots.`);
            logger.error("No bots were defined in the database. This will cause ALL games to never start.");
        } catch(e){
            logger.error(`Failed to create the assigned games cache:\n${e.stack}`);
            rej(e);
        }
    });

    /** Assigns an available bot to the given game. Rejects if no bots are available. Resolves to the username of the bot that's been assigned to the game. */
    export async function assign(game: ObjectId){
        
        let botAssigned: boolean = false;
        const checkedBots: string[] = [];
        let assignedBot: string = '';

        while(!botAssigned) {

            await delay(1000);
    
            const value = await (await database).bots.findOne({
                assignedGame: {
                    $exists: false
                },
                username: {
                    $nin: checkedBots
                }
            });

            if(!value) break;

            const mojang = await (await fetch(`https://api.mojang.com/users/profiles/minecraft/${value.username}`)).text();
            const d = JSON.parse(mojang);
            logger.info(JSON.stringify(d));
            logger.info(d.id);

            await checkStatus(d.id).then(res => {
                if(!res) {
                    checkedBots.push(value.username);
                }
                else {
                    logger.info(`${value.username} online --> ${res}`);
                    assignedBot = value.username;
                    botAssigned = true;
                }
            }).catch(() => logger.info(`Couldn't check status.`));
        }

        if(checkedBots.length !== 0) logger.warn(`Offline Bots --> ${checkedBots.join(' ')}`);

        checkedBots.forEach(bot => {
            const _bot = bots.get(bot);
            if(!_bot) return logger.warn(`${bot} does not exist in Bots cache.`);
            _bot.emit("restart");
        })

        if(assignedBot === '') throw new Error("NONE_AVAILABLE");
    
        (await assignedGamesCache).set(assignedBot, game);

        await (await database).bots.updateOne(

            { 
                username: assignedBot 
            },

            { 
                $set: 
                {
                    assignedGame: new ObjectId(), 
                } 
            },

            {
                upsert: true
            }
        )

        return assignedBot;
    }

    /** Releases the specified bot from its game, allowing it to be assigned to a new game. */
    export async function release(bot: string){
        try {
            await (await database).bots.updateOne({
                username: bot,
            }, {
                $unset: {
                    assignedGame: "",
                }
            });
        } catch {};
        (await assignedGamesCache).delete(bot);
    }

    export interface GetAssignedGameOptions {
        /** If true, fetches the status of the bot from the database. */
        update?: boolean;
    }

    /** Gets the game a bot is currently assigned to. */
    export async function getAssignedGame(name: string, options: GetAssignedGameOptions = {}){
        try {
            const cache = (await assignedGamesCache);
            if(!options.update) return cache.get(name) ?? null;
            const data = await (await database).bots.findOne({ username: name });
            if(!data) return null;
            const game = data.assignedGame ?? null;
            cache.set(data.username, game);
            return game;
        } catch(e){
            logger.error(`Failed to get the assigned game of ${name}:\n${e.stack}`);
            return null;
        }
    }
}

export function getBanDuration(existingStrikes: number, strikesToAdd: number) {

    devLogger.info(`existingStrikes --> ${existingStrikes}`);
    devLogger.info(`stringsToAdd --> ${strikesToAdd}`);

    const durations = [0.25, 0.5, 1, 2, 3, 4, 5, 6, 7];

    if(existingStrikes + strikesToAdd > 10) {
        return '0d';
    }

    existingStrikes = existingStrikes - 1 < 0? 0:existingStrikes - 1;

    const total_time = sum(durations, existingStrikes, strikesToAdd + existingStrikes - 1);
    
    return `${total_time}d`;
}

export async function gameReport(Team1Scores: string, Team2Scores: string, gameNumber: number, winner: string, users: string) {

    const ScoringEmbed = new MessageEmbed()
        .setAuthor(`Automatic Scoring: Score Request [#${gameNumber}]`, 'https://cdn.discordapp.com/attachments/799897234128764958/804020431576105000/Daco_3568543.png')
        .addField('Team 1', Team1Scores)
        .addField('Team 2', Team2Scores)
        .addField('Winning Team', `\`•\`${winner}`);

    const channel =((await defaultGuild)!.channels.cache.get(Constants.GAME_REPORT_CHANNEL) as TextChannel);
    
    try {
        const m = await channel.send(users);
        m.edit(ScoringEmbed);
    }
    catch {
        console.log(`Couldn't send Game Report for game: ${gameNumber}`);
    }
}

export async function updateRoles(member_id: string, role1_id: string, role2_id: string) {
    const guild = await defaultGuild;
    const member = guild.members.cache.get(member_id);
    await member?.roles.remove(role1_id).catch(() => null);
    await member?.roles.add(role2_id).catch(() => null);
}

export function delay(delay: number){
    return new Promise(function(resolve) {
        setTimeout(resolve, delay);
    });
}

/** Given an array of CategoryChannels, resolves with any CategoryChannel currently open. */
export function findOpenCategory(categories: CategoryChannel[]){
    return new Promise<CategoryChannel>(res => {
        const cat = categories.find(cat => cat.children.size <= 20);
        if(cat) return res(cat);
        const checker = setInterval(() => {
            const cat = categories.find(cat => cat.children.size <= 20);
            if(cat){
                clearInterval(checker);
                return res(cat);
            }
        }, 5000);
    });
}

export async function checkStatus(uuid: string) {
    let status = await fetch('https://api.hypixel.net/status?key=' + HYPIXEL_KEY + '&uuid=' + uuid).then(response => response.json());

    if (!status.session.online) return false;
    else return true;
}