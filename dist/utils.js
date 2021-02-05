"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkStatus = exports.findOpenCategory = exports.delay = exports.updateRoles = exports.gameReport = exports.getBanDuration = exports.BotManager = exports.createNewGame = exports.hasPerms = exports.activeGames = exports.LocalGame = exports.Tournament = exports.Game = exports.Players = exports.Player = void 0;
const discord_js_1 = require("discord.js");
const mongodb_1 = require("mongodb");
const constants_1 = require("./constants");
const logger_1 = __importDefault(require("./logger"));
const bot_1 = require("./managers/bot");
const database_1 = __importDefault(require("./managers/database"));
const games_1 = require("./typings/games");
const { HYPIXEL_KEY } = process.env;
const node_fetch_1 = __importDefault(require("node-fetch"));
const socket_1 = require("./managers/socket");
require("assert");
const maps_object = {
    "Aquarium": { img: "https://cdn.discordapp.com/attachments/799897234128764958/800008639342575667/aquariumold-png.png", limit: "+110" },
    "Katsu": { img: "https://cdn.discordapp.com/attachments/799897234128764958/800010460429942794/NEW-Katsu-bw-3v3v3v3-4v4v4v4.png", limit: "+96" },
    "Lectus": { img: "https://cdn.discordapp.com/attachments/799897234128764958/800014149232492594/image0.jpg", limit: "+90" },
    "Chained": { img: "https://cdn.discordapp.com/attachments/799897234128764958/800014260716699676/image0.jpg", limit: "+90" },
    "Invasion": { img: "https://cdn.discordapp.com/attachments/799897234128764958/800014465294008370/image0.jpg", limit: "+115" },
    "Rise": { img: "https://cdn.discordapp.com/attachments/800022796301369344/800024134217629706/rise-png.png", limit: "+96" },
    "Boletum": { img: "https://cdn.discordapp.com/attachments/800022796301369344/800025033007169546/BoletumOld.png", limit: "+121" },
    "Temple": { img: "https://cdn.discordapp.com/attachments/800022796301369344/800023969918746624/templebedwars-png.png", limit: "106" },
};
class Player {
    constructor(data) {
        this.data = data;
    }
    ;
    get _id() {
        return this.data._id;
    }
    get discord() {
        return this.data.discord;
    }
    get minecraft() {
        return this.data.minecraft;
    }
    get registeredAt() {
        return this.data.registeredAt;
    }
    get wins() {
        return this.data.wins ?? 0;
    }
    get losses() {
        return this.data.losses ?? 0;
    }
    get kills() {
        return this.data.kills ?? 0;
    }
    get deaths() {
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
    async update(data) {
        this.data = (await (await database_1.default).players.findOneAndUpdate({ _id: this._id }, {
            $set: data,
        }, {
            upsert: true,
        })).value;
        return this;
    }
    toGamePlayer() {
        return { username: this.minecraft.name, winstreak: this.winstreak, bedstreak: this.bedstreak };
    }
    toJSON() {
        return { _id: this._id, discord: this.discord, minecraft: this.minecraft, registeredAt: this.registeredAt, bedsBroken: this.bedsBroken, bedsLost: this.bedsLost, bedstreak: this.bedstreak, deaths: this.deaths, games: this.games, kills: this.kills, losses: this.losses, roles: this.roles, wins: this.wins, winstreak: this.winstreak };
    }
}
exports.Player = Player;
var Players;
(function (Players) {
    async function getById(id) {
        const data = await (await database_1.default).players.findOne({ _id: id });
        return data ? new Player(data) : null;
    }
    Players.getById = getById;
    async function getByDiscord(id) {
        const data = await (await database_1.default).players.findOne({ discord: id });
        return data ? new Player(data) : null;
    }
    Players.getByDiscord = getByDiscord;
    async function getByMinecraft(uuid) {
        const data = await (await database_1.default).players.findOne({ "minecraft.uuid": uuid });
        return data ? new Player(data) : null;
    }
    Players.getByMinecraft = getByMinecraft;
    async function getManyById(ids) {
        const data = await (await database_1.default).players.find({
            _id: {
                $in: ids
            }
        }).toArray();
        const players = new discord_js_1.Collection();
        data.forEach(player => players.set(player._id, new Player(player)));
        return players;
    }
    Players.getManyById = getManyById;
    async function getManyByDiscord(ids) {
        const data = await (await database_1.default).players.find({
            discord: {
                $in: ids
            }
        }).toArray();
        const players = new discord_js_1.Collection();
        data.forEach(player => players.set(player.discord, new Player(player)));
        return players;
    }
    Players.getManyByDiscord = getManyByDiscord;
    async function getManyByMinecraft(uuids) {
        const data = await (await database_1.default).players.find({
            "minecraft.uuid": {
                $in: uuids
            }
        }).toArray();
        data.sort(function (a, b) { return uuids.indexOf(a.minecraft.uuid) - uuids.indexOf(b.minecraft.uuid); });
        const players = new discord_js_1.Collection();
        data.forEach(player => players.set(player.minecraft.uuid, new Player(player)));
        return players;
    }
    Players.getManyByMinecraft = getManyByMinecraft;
})(Players = exports.Players || (exports.Players = {}));
class Game {
    constructor(data) {
        this.data = data;
    }
    ;
    get _id() {
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
    async update(data) {
        this.data = (await (await database_1.default).games.findOneAndUpdate({ _id: this._id }, {
            $set: data,
        }, {
            upsert: true,
        })).value;
        return this;
    }
}
exports.Game = Game;
class Tournament {
    constructor(data) {
        this.data = data;
    }
    ;
    get _id() {
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
    get matches() {
        return this.data.matches;
    }
    async update(data) {
        this.data = (await (await database_1.default).tournaments.findOneAndUpdate({ _id: this._id }, {
            $set: data,
        }, {
            upsert: true,
        })).value;
        return this;
    }
}
exports.Tournament = Tournament;
function sum(arr, start, end) {
    var tot = 0;
    for (var i = start; i <= end; i++) {
        tot += arr[i];
    }
    return tot;
}
class LocalGame {
    constructor(gameNumber, id) {
        this.gameNumber = gameNumber;
        this.id = id;
        this.logger = new logger_1.default(`Game #${this.gameNumber}`);
        this._state = games_1.GameState.PRE_GAME;
    }
    ;
    get state() {
        return this._state;
    }
    get textChannel() {
        return this._textChannel;
    }
    get teams() {
        return [this.team1, this.team2];
    }
    get teamPlayers() {
        return [this.team1Players, this.team2Players];
    }
    get gameMembers() {
        return this.gamePlayers ?? [];
    }
    get chID() {
        return this.challongeID ?? -1;
    }
    get URL() {
        return this.url ?? '';
    }
    async createChannels(members) {
        const guild = await bot_1.defaultGuild;
        const [textChannel] = await Promise.all([
            guild.channels.create(`game-${this.gameNumber}`, {
                type: "text",
                permissionOverwrites: [
                    {
                        id: (await bot_1.defaultGuild).id,
                        deny: ["VIEW_CHANNEL"]
                    }
                ],
                parent: constants_1.Constants.GAMES_CATEGORY
            })
        ]);
        for (let i = 0; i < members.length; i++) {
            const mem = members[i];
            await textChannel.updateOverwrite(mem, { "VIEW_CHANNEL": true, "READ_MESSAGE_HISTORY": true, "ADD_REACTIONS": true, "ATTACH_FILES": true, "SEND_MESSAGES": true });
        }
        this._textChannel = textChannel;
        this.gamePlayers = members.map(mem => mem.id);
        return { textChannel };
    }
    async end() {
        await Promise.all([
            this.update({
                $set: {
                    state: games_1.GameState.FINISHED,
                    team1: this.team1,
                    team2: this.team2,
                }
            }),
            ...this._bot ? [BotManager.release(this._bot)] : [],
        ]);
        this._state = games_1.GameState.FINISHED;
        exports.activeGames.delete(this.id);
        setTimeout(async () => {
            this._textChannel?.delete().catch(_ => null);
            if (this.team1Channel) {
                await Promise.all(this.team1Channel.members.map(member => member.voice.setChannel(constants_1.Constants.WAITING_ROOM))).catch(_ => null);
                this.team1Channel?.delete().catch(_ => null);
            }
            if (this.team2Channel) {
                await Promise.all(this.team2Channel.members.map(member => member.voice.setChannel(constants_1.Constants.WAITING_ROOM))).catch(_ => null);
                this.team2Channel?.delete().catch(_ => null);
            }
        }, 10000);
    }
    async start(team1, team2) {
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
                state: games_1.GameState.ACTIVE,
                team1: {
                    players: this.team1.players,
                },
                team2: {
                    players: this.team2.players,
                },
            }
        });
        this._state = games_1.GameState.ACTIVE;
    }
    getPlayer(player) {
        return this.team1?.players.find(({ username }) => username === player) ?? this.team2?.players.find(({ username }) => username === player) ?? null;
    }
    getFullPlayer(player) {
        return this.team1Players?.find(({ minecraft }) => minecraft.name === player) ?? this.team2Players?.find(({ minecraft }) => minecraft.name === player) ?? null;
    }
    async cancel() {
        this._state = games_1.GameState.VOID;
        exports.activeGames.delete(this.id);
        try {
            await Promise.all([
                this.update({
                    $set: {
                        state: games_1.GameState.VOID,
                    },
                    $unset: {
                        textChannel: "",
                        voiceChannel: "",
                    }
                }),
                ...this._bot ? [BotManager.release(this._bot)] : [],
            ]);
        }
        catch (e) {
            this.logger.error(`Failed to cancel the game:\n${e.stack}`);
        }
        return async () => {
            this._textChannel?.delete().catch(_ => null);
            if (this.team1Channel) {
                await Promise.all(this.team1Channel.members.map(member => member.voice.setChannel(constants_1.Constants.WAITING_ROOM))).catch(_ => null);
                this.team1Channel?.delete().catch(_ => null);
            }
            if (this.team2Channel) {
                await Promise.all(this.team2Channel.members.map(member => member.voice.setChannel(constants_1.Constants.WAITING_ROOM))).catch(_ => null);
                this.team2Channel?.delete().catch(_ => null);
            }
        };
    }
    async enterStartingState() {
        try {
            await this.update({
                $set: {
                    state: games_1.GameState.STARTING,
                },
                $unset: {
                    textChannel: "",
                    voiceChannel: "",
                }
            });
            this._state = games_1.GameState.STARTING;
        }
        catch (e) {
            this.logger.error(`Failed to entering the starting phase:\n${e.stack}`);
        }
    }
    getAssignedBot() {
        return new Promise(async (res, rej) => {
            if (this._state === games_1.GameState.VOID)
                return rej(new Error("GAME_VOID"));
            if (this._bot)
                return res(this._bot);
            try {
                const bot = await BotManager.assign(this.id);
                this._bot = bot;
                res(bot);
            }
            catch (e) {
                if (e.message !== "NONE_AVAILABLE")
                    this.logger.error(`Failed to bind to a bot:\n${e.stack}`);
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
    async update(update, options) {
        return await (await database_1.default).games.updateOne({
            _id: this.id,
        }, update, options);
    }
    setTeamChannels(team1, team2) {
        this.team1Channel = team1;
        this.team2Channel = team2;
    }
    setChallongeInfo(matchID, url) {
        this.challongeID = matchID;
        this.url = url;
    }
    pickMap() {
        return new Promise(async (res, rej) => {
            const reject = () => rej(new Error("MESSAGE_DELETED"));
            const playerCount = (this.team1Players?.length ?? 0) + (this.team2Players?.length ?? 0);
            let maps = Object.keys(maps_object), firstMap, secondMap, pick, rankedlogo = constants_1.Constants.BRANDING_URL;
            firstMap = maps[Math.floor(Math.random() * maps.length)];
            maps = maps.filter(map => map !== firstMap);
            secondMap = maps[Math.floor(Math.random() * maps.length)];
            let [, , m] = await Promise.all([
                this.textChannel.send(new discord_js_1.MessageEmbed()
                    .setColor("ORANGE")
                    .setTitle(`1️⃣ ${firstMap}`)
                    .addField("Build Limit", `Y: ${maps_object[firstMap].limit}`)
                    .setImage(maps_object[firstMap].img)
                    .setFooter("© Ranked Bedwars", rankedlogo)),
                this.textChannel.send(new discord_js_1.MessageEmbed()
                    .setColor("ORANGE")
                    .setTitle(`2️⃣ ${secondMap}`)
                    .addField("Build Limit", `Y: ${maps_object[secondMap].limit}`)
                    .setImage(maps_object[secondMap].img)
                    .setFooter("© Ranked Bedwars", rankedlogo)),
                await this.textChannel.send(new discord_js_1.MessageEmbed()
                    .setColor("ORANGE")
                    .setTitle("Map Picking")
                    .addField(`1️⃣ ${firstMap}`, "\u200b")
                    .addField(`2️⃣ ${secondMap}`, "\u200b")
                    .addField("♻️ Reroll", "\u200b")
                    .setFooter("© Ranked Bedwars | Map Picking", rankedlogo)),
            ]);
            let reactions = ["1️⃣", "2️⃣", "♻️"];
            await Promise.all(reactions.map(reaction => m.react(reaction).catch(rej)));
            let optionone = [], optiontwo = [], optionthree = [];
            if (m.deleted)
                return reject();
            let collector = m.createReactionCollector((reaction) => {
                return reactions.includes(reaction.emoji.name);
            }, { time: 30000 });
            collector.on('collect', async (reaction, user) => {
                reaction.users.remove(user);
                switch (reaction.emoji.name) {
                    case "1️⃣": {
                        if (optionone.includes(user))
                            return;
                        optionone.push(user);
                        optiontwo = optiontwo.filter(u => u !== user);
                        optionthree = optionthree.filter(u => u !== user);
                        await m.edit(new discord_js_1.MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle("Map Picking")
                            .addField(`1️⃣ ${firstMap}`, "\u200b" + optionone.join("\n"))
                            .addField(`2️⃣ ${secondMap}`, "\u200b" + optiontwo.join("\n"))
                            .addField("♻️ Reroll", "\u200b" + optionthree.join("\n"))
                            .setFooter("© Ranked Bedwars | Map Picking", rankedlogo));
                        break;
                    }
                    case "2️⃣": {
                        if (optiontwo.includes(user))
                            return;
                        optionone = optionone.filter(u => u !== user);
                        optiontwo.push(user);
                        optionthree = optionthree.filter(u => u !== user);
                        await m.edit(new discord_js_1.MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle("Map Picking")
                            .addField(`1️⃣ ${firstMap}`, "\u200b" + optionone.join("\n"))
                            .addField(`2️⃣ ${secondMap}`, "\u200b" + optiontwo.join("\n"))
                            .addField("♻️ Reroll", "\u200b" + optionthree.join("\n"))
                            .setFooter("© Ranked Bedwars | Map Picking", rankedlogo));
                        break;
                    }
                    case "♻️": {
                        if (optionthree.includes(user))
                            return;
                        optionone = optionone.filter(u => u !== user);
                        optiontwo = optiontwo.filter(u => u !== user);
                        optionthree.push(user);
                        await m.edit(new discord_js_1.MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle("Map Picking")
                            .addField(`1️⃣ ${firstMap}`, "\u200b" + optionone.join("\n"))
                            .addField(`2️⃣ ${secondMap}`, "\u200b" + optiontwo.join("\n"))
                            .addField("♻️ Reroll", "\u200b" + optionthree.join("\n"))
                            .setFooter("© Ranked Bedwars | Map Picking", rankedlogo));
                        break;
                    }
                }
            });
            collector.on('end', async () => {
                if (m.deleted)
                    return reject();
                m.reactions.removeAll().catch(err => console.log(err));
                if (optionone.length > optiontwo.length && optionone.length > optionthree.length)
                    pick = firstMap;
                else if (optiontwo.length > optionone.length && optiontwo.length > optionthree.length)
                    pick = secondMap;
                else
                    pick = null;
                if (pick) {
                    await m.edit(new discord_js_1.MessageEmbed()
                        .setColor("ORANGE")
                        .setTitle("Map Picking")
                        .setDescription(`The map **${pick}** has been chosen, by a margin of ${Math.abs(optionone.length - optiontwo.length)} vote${Math.abs(optionone.length - optiontwo.length) > 1 ? "s" : ""}!`)
                        .setFooter("© Ranked Bedwars | Map Picking", rankedlogo));
                    return res(pick);
                }
                else {
                    maps = maps.filter(map => map !== secondMap);
                    firstMap = maps[Math.floor(Math.random() * maps.length)];
                    maps = maps.filter(map => map !== firstMap);
                    secondMap = maps[Math.floor(Math.random() * maps.length)];
                    const [, , m] = await Promise.all([
                        this.textChannel.send(new discord_js_1.MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle(`1️⃣ ${firstMap}`)
                            .addField("Build Limit", `Y: ${maps_object[firstMap].limit}`)
                            .setImage(maps_object[firstMap].img)
                            .setFooter("© Ranked Bedwars", rankedlogo)),
                        this.textChannel.send(new discord_js_1.MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle(`2️⃣ ${secondMap}`)
                            .addField("Build Limit", `Y: ${maps_object[secondMap].limit}`)
                            .setImage(maps_object[secondMap].img)
                            .setFooter("© Ranked Bedwars", rankedlogo)),
                        this.textChannel.send(new discord_js_1.MessageEmbed()
                            .setColor("ORANGE")
                            .setTitle("Map Picking | Reroll")
                            .addField(`1️⃣ ${firstMap}`, "\u200b")
                            .addField(`2️⃣ ${secondMap}`, "\u200b")
                            .setFooter("© Ranked Bedwars | Map Picking", rankedlogo))
                    ]);
                    optionone = [], optiontwo = [];
                    reactions = ["1️⃣", "2️⃣"];
                    for (const reaction of reactions) {
                        await m.react(reaction).catch(rej);
                    }
                    ;
                    if (m.deleted)
                        return reject();
                    collector = m.createReactionCollector((reaction) => {
                        return reactions.includes(reaction.emoji.name);
                    }, { time: 30000 });
                    collector.on('collect', async (reaction, user) => {
                        reaction.users.remove(user);
                        if (reaction.emoji.name === "1️⃣") {
                            if (optionone.includes(user))
                                return;
                            optionone.push(user);
                            optiontwo = optiontwo.filter(u => u !== user);
                            await m.edit(new discord_js_1.MessageEmbed()
                                .setColor("ORANGE")
                                .setTitle("Map Picking | Reroll")
                                .addField(`1️⃣ ${firstMap}`, "\u200b" + optionone.join("\n"))
                                .addField(`2️⃣ ${secondMap}`, "\u200b" + optiontwo.join("\n"))
                                .setFooter("© Ranked Bedwars | Map Picking", rankedlogo));
                        }
                        else if (reaction.emoji.name === "2️⃣") {
                            if (optiontwo.includes(user))
                                return;
                            optionone = optionone.filter(u => u !== user);
                            optiontwo.push(user);
                            await m.edit(new discord_js_1.MessageEmbed()
                                .setColor("ORANGE")
                                .setTitle("Map Picking | Reroll")
                                .addField(`1️⃣ ${firstMap}`, "\u200b" + optionone.join("\n"))
                                .addField(`2️⃣ ${secondMap}`, "\u200b" + optiontwo.join("\n"))
                                .setFooter("© Ranked Bedwars | Map Picking", rankedlogo));
                        }
                    });
                    collector.on('end', async () => {
                        if (m.deleted)
                            return reject();
                        m.reactions.removeAll().catch(err => console.log(err));
                        if (optionone.length > optiontwo.length)
                            pick = firstMap;
                        else if (optiontwo.length > optionone.length)
                            pick = secondMap;
                        else
                            pick = null;
                        if (pick) {
                            await m.edit(new discord_js_1.MessageEmbed()
                                .setColor("ORANGE")
                                .setTitle("Map Picking | Reroll")
                                .setDescription(`The map **${pick}** has been chosen, by a margin of ${Math.abs(optionone.length - optiontwo.length)} vote${Math.abs(optionone.length - optiontwo.length) > 1 ? "s" : ""}!`)
                                .setFooter("© Ranked Bedwars | Map Picking", rankedlogo));
                        }
                        else {
                            pick = [firstMap, secondMap][Math.floor(Math.random() * 2)];
                            await m.edit(new discord_js_1.MessageEmbed()
                                .setColor("ORANGE")
                                .setTitle("Map Picking | Reroll")
                                .setDescription(`The map **${pick}** has been randomly chosen, due to a draw.`)
                                .setFooter("© Ranked Bedwars | Map Picking", rankedlogo));
                        }
                        res(pick);
                    });
                }
            });
        });
    }
}
exports.LocalGame = LocalGame;
exports.activeGames = new discord_js_1.Collection();
async function hasPerms(member, roles) {
    let hasPerms = false;
    member?.roles.cache.forEach(role => {
        if (roles.includes(role.id)) {
            hasPerms = true;
        }
    });
    return hasPerms;
}
exports.hasPerms = hasPerms;
async function createNewGame() {
    const db = await database_1.default;
    const { insertedId } = await db.games.insertOne({});
    const gameNumber = 1 + await db.games.find({
        _id: {
            $lt: insertedId
        }
    }).sort({ _id: 1 }).count();
    const game = new LocalGame(gameNumber, insertedId);
    exports.activeGames.set(insertedId, game);
    return game;
}
exports.createNewGame = createNewGame;
var BotManager;
(function (BotManager) {
    const logger = new logger_1.default("Mineflayer Bot Manager");
    BotManager.assignedGamesCache = new Promise(async (res, rej) => {
        try {
            const bots = await (await database_1.default).bots.find().toArray();
            const collection = new discord_js_1.Collection();
            bots.forEach(bot => collection.set(bot.username, bot.assignedGame ?? null));
            res(collection);
            const { length } = bots;
            if (length > 0)
                return logger.info(`Cached the statuses of ${length} bots.`);
            logger.error("No bots were defined in the database. This will cause ALL games to never start.");
        }
        catch (e) {
            logger.error(`Failed to create the assigned games cache:\n${e.stack}`);
            rej(e);
        }
    });
    async function assign(game) {
        let botAssigned = false;
        const checkedBots = [];
        let assignedBot = '';
        while (!botAssigned) {
            await delay(1000);
            const value = await (await database_1.default).bots.findOne({
                assignedGame: {
                    $exists: false
                },
                username: {
                    $nin: checkedBots
                }
            });
            if (!value)
                break;
            const mojang = await (await node_fetch_1.default(`https://api.mojang.com/users/profiles/minecraft/${value.username}`)).text();
            const d = JSON.parse(mojang);
            logger.info(JSON.stringify(d));
            logger.info(d.id);
            await checkStatus(d.id).then(res => {
                if (!res) {
                    checkedBots.push(value.username);
                }
                else {
                    logger.info(`${value.username} online --> ${res}`);
                    assignedBot = value.username;
                    botAssigned = true;
                }
            }).catch(() => logger.info(`Couldn't check status.`));
        }
        if (checkedBots.length !== 0)
            logger.warn(`Offline Bots --> ${checkedBots.join(' ')}`);
        checkedBots.forEach(bot => {
            const _bot = socket_1.bots.get(bot);
            if (!_bot)
                return logger.warn(`${bot} does not exist in Bots cache.`);
            _bot.emit("restart");
        });
        if (assignedBot === '')
            throw new Error("NONE_AVAILABLE");
        (await BotManager.assignedGamesCache).set(assignedBot, game);
        await (await database_1.default).bots.updateOne({
            username: assignedBot
        }, {
            $set: {
                assignedGame: new mongodb_1.ObjectId(),
            }
        }, {
            upsert: true
        });
        return assignedBot;
    }
    BotManager.assign = assign;
    async function release(bot) {
        try {
            await (await database_1.default).bots.updateOne({
                username: bot,
            }, {
                $unset: {
                    assignedGame: "",
                }
            });
        }
        catch { }
        ;
        (await BotManager.assignedGamesCache).delete(bot);
    }
    BotManager.release = release;
    async function getAssignedGame(name, options = {}) {
        try {
            const cache = (await BotManager.assignedGamesCache);
            if (!options.update)
                return cache.get(name) ?? null;
            const data = await (await database_1.default).bots.findOne({ username: name });
            if (!data)
                return null;
            const game = data.assignedGame ?? null;
            cache.set(data.username, game);
            return game;
        }
        catch (e) {
            logger.error(`Failed to get the assigned game of ${name}:\n${e.stack}`);
            return null;
        }
    }
    BotManager.getAssignedGame = getAssignedGame;
})(BotManager = exports.BotManager || (exports.BotManager = {}));
function getBanDuration(existingStrikes, strikesToAdd) {
    socket_1.devLogger.info(`existingStrikes --> ${existingStrikes}`);
    socket_1.devLogger.info(`stringsToAdd --> ${strikesToAdd}`);
    const durations = [0.25, 0.5, 1, 2, 3, 4, 5, 6, 7];
    if (existingStrikes + strikesToAdd > 10) {
        return '0d';
    }
    existingStrikes = existingStrikes - 1 < 0 ? 0 : existingStrikes - 1;
    const total_time = sum(durations, existingStrikes, strikesToAdd + existingStrikes - 1);
    return `${total_time}d`;
}
exports.getBanDuration = getBanDuration;
async function gameReport(Team1Scores, Team2Scores, gameNumber, winner, users) {
    const ScoringEmbed = new discord_js_1.MessageEmbed()
        .setAuthor(`Automatic Scoring: Score Request [#${gameNumber}]`, constants_1.Constants.BRANDING_URL)
        .addField('Team 1', Team1Scores)
        .addField('Team 2', Team2Scores)
        .addField('Winning Team', `\`•\`${winner}`);
    const channel = (await bot_1.defaultGuild).channels.cache.get(constants_1.Constants.GAME_REPORT_CHANNEL);
    try {
        const m = await channel.send(users);
        m.edit(ScoringEmbed);
    }
    catch {
        console.log(`Couldn't send Game Report for game: ${gameNumber}`);
    }
}
exports.gameReport = gameReport;
async function updateRoles(member_id, role1_id, role2_id) {
    const guild = await bot_1.defaultGuild;
    const member = guild.members.cache.get(member_id);
    await member?.roles.remove(role1_id).catch(() => null);
    await member?.roles.add(role2_id).catch(() => null);
}
exports.updateRoles = updateRoles;
function delay(delay) {
    return new Promise(function (resolve) {
        setTimeout(resolve, delay);
    });
}
exports.delay = delay;
function findOpenCategory(categories) {
    return new Promise(res => {
        const cat = categories.find(cat => cat.children.size <= 20);
        if (cat)
            return res(cat);
        const checker = setInterval(() => {
            const cat = categories.find(cat => cat.children.size <= 20);
            if (cat) {
                clearInterval(checker);
                return res(cat);
            }
        }, 5000);
    });
}
exports.findOpenCategory = findOpenCategory;
async function checkStatus(uuid) {
    let status = await node_fetch_1.default('https://api.hypixel.net/status?key=' + HYPIXEL_KEY + '&uuid=' + uuid).then(response => response.json());
    if (!status.session.online)
        return false;
    else
        return true;
}
exports.checkStatus = checkStatus;
