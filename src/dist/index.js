"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var dotenv_1 = require("dotenv");
dotenv_1["default"].config();
var logger_1 = require("./logger");
var logger = new logger_1["default"]("Main");
var discord_js_1 = require("discord.js");
var https_1 = require("https");
var node_fetch_1 = require("node-fetch");
var bot_1 = require("./managers/bot");
var database_1 = require("./managers/database");
var hypixel_1 = require("./managers/hypixel");
var constants_1 = require("./constants");
var utils_1 = require("./utils");
var socket_1 = require("./managers/socket");
var mongodb_1 = require("mongodb");
var challonge_ts_1 = require("challonge-ts");
var API_KEY = process.env.API_KEY;
if (!API_KEY) {
    logger.error("NO API KEY DEFINED");
    process.exit(1);
}
var state = false;
!function () {
    return __awaiter(this, void 0, void 0, function () {
        function createEmbed(description, color, footerSuffix) {
            if (color === void 0) { color = "#228B22"; }
            if (footerSuffix === void 0) { footerSuffix = "Watching " + guild.memberCount + " Players!"; }
            var embed = new discord_js_1.MessageEmbed()
                .setColor(color)
                .setFooter("\u00A9 Equinox | " + footerSuffix, constants_1.Constants.BRANDING_URL);
            if (description)
                embed.setDescription(description);
            return embed;
        }
        var _a, db, client, guild;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all([database_1["default"], bot_1["default"], bot_1.defaultGuild])["catch"](function (err) {
                        logger.error("Startup failed:\n" + err.stack);
                        return process.exit(1);
                    })];
                case 1:
                    _a = _b.sent(), db = _a[0], client = _a[1], guild = _a[2];
                    client.on("raw", function (payload) { return __awaiter(_this, void 0, void 0, function () {
                        function respond(message) {
                            return new Promise(function (res) {
                                req.write(JSON.stringify({
                                    type: 4,
                                    data: typeof message === "string" ? {
                                        content: message
                                    } : {
                                        content: "",
                                        embeds: [message.toJSON()]
                                    }
                                }));
                                req.end();
                                req.on("error", function () { return null; });
                                req.on("finish", res);
                            });
                        }
                        var logger, _a, token, data, id, member, channel_id, user, cmd, req, _b, player, mojang, d, hypixelData, discord, value, member_1, member_2, e_1, lookup, player, WLR, e_2, _c, name_1, options, page_1, nPerPage_1, total, prettyName, pages, players, e_3;
                        var _d, _e, _f;
                        var _g, _h, _j, _k;
                        return __generator(this, function (_l) {
                            switch (_l.label) {
                                case 0:
                                    if (payload.t !== "INTERACTION_CREATE")
                                        return [2 /*return*/];
                                    logger = new logger_1["default"]("Command Handler");
                                    _a = payload.d, token = _a.token, data = _a.data, id = _a.id, member = _a.member, channel_id = _a.channel_id;
                                    user = member.user;
                                    cmd = data.name;
                                    req = https_1["default"].request(constants_1.Constants.DISCORD_API_BASE_URL + "/interactions/" + id + "/" + token + "/callback", {
                                        method: "POST",
                                        headers: {
                                            authorization: "Bot " + process.env.TOKEN,
                                            "Content-Type": "application/json"
                                        }
                                    });
                                    _b = cmd;
                                    switch (_b) {
                                        case "register": return [3 /*break*/, 1];
                                        case "info": return [3 /*break*/, 14];
                                        case "leaderboard": return [3 /*break*/, 19];
                                    }
                                    return [3 /*break*/, 24];
                                case 1:
                                    if (constants_1.Constants.REGISTER_CHANNEL !== channel_id) {
                                        respond(createEmbed("<@" + user.id + "> you cannot register in this channel. Please do /register [ign] in " + guild.channels.cache.get(constants_1.Constants.REGISTER_CHANNEL), "RED"));
                                        return [3 /*break*/, 24];
                                    }
                                    player = payload.d.data.options[0].value;
                                    _l.label = 2;
                                case 2:
                                    _l.trys.push([2, 11, , 13]);
                                    return [4 /*yield*/, node_fetch_1["default"]("https://api.mojang.com/users/profiles/minecraft/" + player)];
                                case 3: return [4 /*yield*/, (_l.sent()).text()];
                                case 4:
                                    mojang = _l.sent();
                                    if (!mojang) {
                                        respond(createEmbed("Minecraft account not found.", "RED"));
                                        return [3 /*break*/, 24];
                                    }
                                    d = JSON.parse(mojang);
                                    if (!d.id) {
                                        respond(createEmbed("Minecraft account not found.", "RED"));
                                        return [3 /*break*/, 24];
                                    }
                                    return [4 /*yield*/, hypixel_1.getHypixelPlayer(d.id)];
                                case 5:
                                    hypixelData = _l.sent();
                                    discord = (_j = (_h = (_g = hypixelData === null || hypixelData === void 0 ? void 0 : hypixelData.player) === null || _g === void 0 ? void 0 : _g.socialMedia) === null || _h === void 0 ? void 0 : _h.links) === null || _j === void 0 ? void 0 : _j.DISCORD;
                                    if (!discord) {
                                        respond(createEmbed("**" + d.name + "** does not have a Discord account linked. For more information, read " + guild.channels.cache.get('800070737091624970'), "RED"));
                                        return [3 /*break*/, 24];
                                    }
                                    if (discord !== user.username + "#" + user.discriminator) {
                                        respond(createEmbed("**" + d.name + "** has another Discord account or server linked. If this is you, change your linked Discord to **" + user.username + "#" + user.discriminator + "**.\n\n**Changed your Discord username?** You'll need to change your linked account in game.", "RED"));
                                        return [3 /*break*/, 24];
                                    }
                                    return [4 /*yield*/, db.players.findOneAndUpdate({ discord: user.id }, {
                                            $set: {
                                                minecraft: {
                                                    uuid: d.id,
                                                    name: d.name
                                                },
                                                registeredAt: Date.now()
                                            },
                                            $setOnInsert: {
                                                discord: user.id
                                            }
                                        }, {
                                            upsert: true
                                        })];
                                case 6:
                                    value = (_l.sent()).value;
                                    if (!!value) return [3 /*break*/, 9];
                                    return [4 /*yield*/, respond(createEmbed("You have successfully registered with the username **" + d.name + "**. Welcome to Equinox!", "#228B22"))];
                                case 7:
                                    _l.sent();
                                    member_1 = guild.members.cache.get(user.id);
                                    (_k = guild.members.cache.get(user.id)) === null || _k === void 0 ? void 0 : _k.setNickname("" + d.name)["catch"](function (e) { return logger.error("Failed to update a new member's nickname:\n" + e.stack); });
                                    return [4 /*yield*/, member_1.roles.add(constants_1.Constants.MEMBER_ROLE)["catch"](function () { return null; })];
                                case 8:
                                    _l.sent();
                                    return [3 /*break*/, 24];
                                case 9:
                                    member_2 = guild.members.cache.get(user.id);
                                    return [4 /*yield*/, respond(createEmbed("You have successfully changed your linked Minecraft account to **" + d.name + "**.", "#228B22"))];
                                case 10:
                                    _l.sent();
                                    member_2 === null || member_2 === void 0 ? void 0 : member_2.setNickname("" + d.name)["catch"](function (e) { return logger.error("Failed to update an existing member's nickname on re-registration:\n" + e.stack); });
                                    return [3 /*break*/, 13];
                                case 11:
                                    e_1 = _l.sent();
                                    logger.error("An error occurred while using the /register command:\nDeclared username: " + player + "\n" + e_1.stack);
                                    return [4 /*yield*/, respond(createEmbed('Something went wrong while registering your account. Please try again later. If the issue persists, please contact a staff member.', "RED"))];
                                case 12:
                                    _l.sent();
                                    return [3 /*break*/, 13];
                                case 13: return [3 /*break*/, 24];
                                case 14:
                                    if (constants_1.Constants.CHAT === channel_id) {
                                        respond(createEmbed("<@" + user.id + "> commands are disabled in this channel.", "RED"));
                                        return [3 /*break*/, 24];
                                    }
                                    lookup = payload.d.data.options[0].value;
                                    _l.label = 15;
                                case 15:
                                    _l.trys.push([15, 17, , 18]);
                                    return [4 /*yield*/, utils_1.Players.getByDiscord(lookup)];
                                case 16:
                                    player = _l.sent();
                                    if (!player) {
                                        respond(createEmbed("<@" + lookup + "> is not a registered Equinox player.", "RED"));
                                        return [3 /*break*/, 24];
                                    }
                                    WLR = player.losses === 0 ? player.wins : Math.round((player.wins / player.losses + Number.EPSILON) * 100) / 100;
                                    respond(createEmbed("**" + player.minecraft.name + "**'s Stats", "#228B22")
                                        .addField("**Games**", "`Wins:` " + player.wins + "\n`Losses:` " + player.losses + "\n`WLR:` " + WLR)
                                        .addField("**Combat**", "`Kills:` " + player.kills + "\n`Deaths:` " + player.deaths + "\n`Beds Broken:` " + player.bedsBroken + "\n`Beds Lost:` " + player.bedsLost));
                                    return [3 /*break*/, 18];
                                case 17:
                                    e_2 = _l.sent();
                                    logger.error("An error occurred while using the /info command:\nUser: " + lookup + "\n" + e_2.stack);
                                    respond(createEmbed("Something went wrong while requesting a player's stats. Please try again later. If the issue persists, please contact a staff member.", "RED"));
                                    return [3 /*break*/, 18];
                                case 18: return [3 /*break*/, 24];
                                case 19:
                                    if (constants_1.Constants.CHAT === channel_id) {
                                        respond(createEmbed("<@" + user.id + "> commands are disabled in this channel.", "RED"));
                                        return [3 /*break*/, 24];
                                    }
                                    _l.label = 20;
                                case 20:
                                    _l.trys.push([20, 23, , 24]);
                                    _c = payload.d.data.options[0], name_1 = _c.name, options = _c.options;
                                    if (name_1 === "beds")
                                        name_1 = "bedsBroken";
                                    page_1 = options ? options[0].value : 1;
                                    nPerPage_1 = 10;
                                    return [4 /*yield*/, db.players.find((_d = {},
                                            _d[name_1] = {
                                                $exists: true
                                            },
                                            _d)).count()];
                                case 21:
                                    total = _l.sent();
                                    if (total < 1) {
                                        respond(createEmbed("There's no players on this leaderboard yet. Play now, and claim a top spot!", "RED"));
                                        return [3 /*break*/, 24];
                                    }
                                    prettyName = name_1;
                                    switch (name_1) {
                                        case "kills":
                                            prettyName = "Top Kills";
                                            break;
                                        case "wins":
                                            prettyName = "Top Wins";
                                            break;
                                        case "losses":
                                            prettyName = "Top Losses";
                                            break;
                                        case "bedsBroken":
                                            prettyName = "Most Beds Broken";
                                            break;
                                    }
                                    pages = Math.ceil(total / nPerPage_1);
                                    if (page_1 > pages)
                                        page_1 = pages;
                                    return [4 /*yield*/, db.players
                                            .find((_e = {},
                                            _e[name_1] = {
                                                $exists: true
                                            },
                                            _e))
                                            .sort((_f = {}, _f[name_1] = -1, _f))
                                            .skip(page_1 > 0 ? ((page_1 - 1) * nPerPage_1) : 0)
                                            .limit(nPerPage_1)
                                            .toArray()];
                                case 22:
                                    players = _l.sent();
                                    respond(createEmbed(players.map(function (player, i) { var _a; return "\n`#" + (i + 1 + (nPerPage_1 * (page_1 - 1))) + "` **" + player.minecraft.name + "** : " + ((_a = player[name_1]) !== null && _a !== void 0 ? _a : 0); }).join(""), "#228B22")
                                        .setTitle(prettyName + " | Page " + page_1 + "/" + pages));
                                    return [3 /*break*/, 24];
                                case 23:
                                    e_3 = _l.sent();
                                    logger.error("An error occurred while using the /leaderboard command:\n" + e_3.stack);
                                    respond(createEmbed("Something went wrong while requesting the leaderboard. Please try again later. If the issue persists, please contact a staff member.", "RED"));
                                    return [3 /*break*/, 24];
                                case 24: return [2 /*return*/];
                            }
                        });
                    }); });
                    client.on("message", function (message) {
                        var _a, _b, _c, _d, _e;
                        return __awaiter(this, void 0, void 0, function () {
                            var bot_2, _bot, users, msg_arr, option, num, ids, players, players2_1, _f, msg_arr, name, number_of_players, value, data, _g, manager, register, registered, msg_arr, name, tourney_1, tournament, msg_arr, indexOfLastMention, errMsg, team_1, users_1, registered_1, overlap_1, players_1, unregistered, mess_1, filter, collector_1, tourn, msg_arr, id_1, deleted, matches, tourney, filter, collector_2, name_2;
                            var _this = this;
                            return __generator(this, function (_h) {
                                switch (_h.label) {
                                    case 0:
                                        if (!!message.guild) return [3 /*break*/, 1];
                                        return [2 /*return*/];
                                    case 1:
                                        if (!(message.channel.id === constants_1.Constants.BOT_RESTART_CHANNEL && message.content.startsWith('=restart') && message.content.split(' ').length > 1)) return [3 /*break*/, 2];
                                        bot_2 = message.content.split(' ')[1];
                                        _bot = socket_1.bots.get(bot_2);
                                        if (!_bot)
                                            return [2 /*return*/, message.reply(bot_2 + " is not a valid bot.")];
                                        _bot.emit("restart");
                                        utils_1.BotManager.release(bot_2);
                                        return [2 /*return*/, message.reply(bot_2 + " successfully restarted.")];
                                    case 2:
                                        if (!(constants_1.Constants.ADMIN_COMMANDS_CHANNEL === message.channel.id && message.content.toLowerCase().startsWith('=modify'))) return [3 /*break*/, 15];
                                        if (!message.member)
                                            return [2 /*return*/];
                                        users = message.content.split(' ').slice(2, -1).map(function (id) { return client.users.cache.get(id); }).filter(function (u) { return u; });
                                        users.push.apply(users, message.mentions.users.array());
                                        msg_arr = message.content.split(' ');
                                        if (msg_arr.length < 4)
                                            return [2 /*return*/, message.reply(createEmbed("Invalid Usage. Please use format `=modify wins|losses|kills|deaths|bedsbroken|bedslost| @User/User_ID \u00B1[number]`", "RED"))];
                                        option = msg_arr[1].toLowerCase();
                                        if (!["wins", "losses", "kills", "deaths", "bedsbroken", "bedslost"].includes(option))
                                            return [2 /*return*/, message.reply(createEmbed("Invalid Usage. Please use format `=modify wins|losses|kills|deaths|bedsbroken|bedslost| @User/User_ID \u00B1[number]`", "RED"))];
                                        num = parseInt(msg_arr[3]);
                                        if (Number.isNaN(num))
                                            return [2 /*return*/, message.reply(createEmbed("Number of " + option + " must be an Integer or Valid Number."))];
                                        if (!(users.length > 0)) return [3 /*break*/, 13];
                                        ids = users.map(function (user) { return user.id; });
                                        return [4 /*yield*/, utils_1.Players.getManyByDiscord(ids)];
                                    case 3:
                                        players = (_h.sent());
                                        players2_1 = players.map(function (player) { return player.discord; });
                                        ids = ids.filter(function (id) { return players2_1.includes(id); });
                                        _f = option;
                                        switch (_f) {
                                            case "wins": return [3 /*break*/, 4];
                                            case "losses": return [3 /*break*/, 6];
                                            case "bedsbroken": return [3 /*break*/, 8];
                                            case "bedslost": return [3 /*break*/, 10];
                                        }
                                        return [3 /*break*/, 12];
                                    case 4: return [4 /*yield*/, db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "wins": num } }, { upsert: true })];
                                    case 5:
                                        _h.sent();
                                        return [3 /*break*/, 12];
                                    case 6: return [4 /*yield*/, db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "losses": num } }, { upsert: true })];
                                    case 7:
                                        _h.sent();
                                        return [3 /*break*/, 12];
                                    case 8: return [4 /*yield*/, db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "bedsBroken": num } }, { upsert: true })];
                                    case 9:
                                        _h.sent();
                                        return [3 /*break*/, 12];
                                    case 10: return [4 /*yield*/, db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "bedsLost": num } }, { upsert: true })];
                                    case 11:
                                        _h.sent();
                                        return [3 /*break*/, 12];
                                    case 12:
                                        message.reply(createEmbed("Users \u2192 " + ids.map(function (id) { return "<@" + id + ">"; }).join(' ') + " " + option + " modified successfully."));
                                        return [3 /*break*/, 14];
                                    case 13:
                                        message.reply(createEmbed('Invalid User/User_ID specified.'));
                                        _h.label = 14;
                                    case 14: return [2 /*return*/];
                                    case 15:
                                        if (!(message.channel.id === constants_1.Constants.TOURNAMENT_CREATION_CHANNEL)) return [3 /*break*/, 26];
                                        if (!message.content.startsWith('=create')) return [3 /*break*/, 21];
                                        msg_arr = message.content.split(' ');
                                        if (msg_arr.length !== 3)
                                            return [2 /*return*/, message.reply(createEmbed("Invalid Usage. Please use format `=create name [number of players]` to create a new tournament.", "RED"))];
                                        name = msg_arr[1];
                                        if (name.length > 50)
                                            return [2 /*return*/, message.reply(createEmbed("Invalid Usage. Tournament lengths cannot be over 50 characters.", "RED"))];
                                        number_of_players = parseInt(msg_arr[2]);
                                        if (Number.isNaN(number_of_players) || number_of_players > 4 || number_of_players <= 0) {
                                            return [2 /*return*/, message.reply(createEmbed("Number of players must be a positive Integer <= 4", "RED"))];
                                        }
                                        return [4 /*yield*/, db.tournaments.findOneAndUpdate({
                                                "name": name
                                            }, {
                                                $setOnInsert: {
                                                    "_id": new mongodb_1.ObjectId(),
                                                    "createdAt": Date.now(),
                                                    "name": name,
                                                    "teams": [],
                                                    "number_of_players": number_of_players,
                                                    "registration": '',
                                                    "manager": '',
                                                    "teamIndex": 1,
                                                    "state": "created",
                                                    "matches": []
                                                }
                                            }, {
                                                upsert: true
                                            })];
                                    case 16:
                                        value = (_h.sent()).value;
                                        if (value)
                                            return [2 /*return*/, message.reply(createEmbed("There is already an active tournament with the name " + name + ". All names for active tournaments must be unique.", "RED"))];
                                        return [4 /*yield*/, message.reply(createEmbed("Tournament \u2192 " + name + " Created Successfully!"))];
                                    case 17:
                                        _h.sent();
                                        return [4 /*yield*/, challonge_ts_1.TournamentAdapter.create(API_KEY, {
                                                "tournament": {
                                                    "name": name,
                                                    "url": "equinox_" + name,
                                                    "open_signup": false,
                                                    "private": true
                                                }
                                            })];
                                    case 18:
                                        data = _h.sent();
                                        console.log(data);
                                        return [4 /*yield*/, Promise.all([
                                                guild.channels.create(name + " Manager", {
                                                    type: "text",
                                                    parent: constants_1.Constants.ADMIN_CONSOLE_CATEGORY
                                                }),
                                                guild.channels.create(name + " Registration", {
                                                    type: "text",
                                                    parent: constants_1.Constants.TOURNEY_REGISTRATION_CATEGORY
                                                }),
                                                guild.channels.create(name + " Confirmation", {
                                                    type: "text",
                                                    parent: constants_1.Constants.TOURNEY_CONFIRMATION_CHANNEL
                                                })
                                            ])];
                                    case 19:
                                        _g = _h.sent(), manager = _g[0], register = _g[1], registered = _g[2];
                                        return [4 /*yield*/, db.tournaments.updateOne({
                                                "name": name
                                            }, {
                                                $set: {
                                                    "manager": manager.id,
                                                    "registration": register.id,
                                                    "registered": registered.id
                                                }
                                            }, {
                                                "upsert": true
                                            })];
                                    case 20:
                                        _h.sent();
                                        return [2 /*return*/, message.channel.send("https://challonge.com/equinox_" + name)];
                                    case 21:
                                        if (!message.content.startsWith('=delete')) return [3 /*break*/, 25];
                                        msg_arr = message.content.split(' ');
                                        if (msg_arr.length !== 2)
                                            return [2 /*return*/, message.reply(createEmbed("Invalid Usage. Please use format \`=delete name\` to delete a tournament", "RED"))];
                                        name = msg_arr[1];
                                        return [4 /*yield*/, db.tournaments.findOne({
                                                "name": name
                                            })];
                                    case 22:
                                        tourney_1 = _h.sent();
                                        if (!tourney_1)
                                            return [2 /*return*/, message.reply(createEmbed("Tournament with name " + name + " does not exist.", "RED"))];
                                        return [4 /*yield*/, db.tournaments.deleteOne({
                                                "name": name
                                            })];
                                    case 23:
                                        _h.sent();
                                        return [4 /*yield*/, challonge_ts_1.TournamentAdapter.destroy(API_KEY, "equinox_" + name)];
                                    case 24:
                                        _h.sent();
                                        message.reply(createEmbed("Tournament with name " + name + " was deleted successfully!"));
                                        try {
                                            (_a = guild.channels.cache.get(tourney_1.manager)) === null || _a === void 0 ? void 0 : _a["delete"]();
                                            (_b = guild.channels.cache.get(tourney_1.registration)) === null || _b === void 0 ? void 0 : _b["delete"]();
                                            (_c = guild.channels.cache.get(tourney_1.registered)) === null || _c === void 0 ? void 0 : _c["delete"]();
                                        }
                                        catch (_j) {
                                            logger.error("Could not delete channels for Tournament " + name);
                                        }
                                        _h.label = 25;
                                    case 25: return [2 /*return*/];
                                    case 26: return [4 /*yield*/, db.tournaments.findOne({ "registration": message.channel.id })];
                                    case 27:
                                        tournament = _h.sent();
                                        if (!(tournament !== null)) return [3 /*break*/, 33];
                                        if (!message.content.startsWith('=team'))
                                            return [2 /*return*/];
                                        msg_arr = message.content.split(' ');
                                        indexOfLastMention = msg_arr.slice(1).findIndex(function (msg) { return !msg.startsWith('<@'); });
                                        errMsg = tournament.number_of_players === 1 ? ' ' : tournament.number_of_players === 2 ? " @user1 " : " @user1...@user" + (tournament.number_of_players - 1) + " ";
                                        if (indexOfLastMention === -1)
                                            return [2 /*return*/, message.reply(createEmbed("Invalid Usage. Use format `=team" + errMsg + "[Team Name]`", "RED"))];
                                        team_1 = msg_arr.slice(indexOfLastMention - msg_arr.length + 1).join(' ');
                                        if (tournament.teams.map(function (team) { return team.teamName; }).includes(team_1))
                                            return [2 /*return*/, message.reply(createEmbed("A team with name " + team_1 + " already exists in this tournament.", "RED"))];
                                        users_1 = msg_arr.slice(1).map(function (u) { return client.users.cache.get(u); }).filter(function (u) { return u; }).map(function (u) { return u.id; });
                                        if (message.mentions.users.array())
                                            users_1.push.apply(users_1, message.mentions.users.array().map(function (men) { return men.id; }));
                                        users_1.push(message.author.id);
                                        users_1 = __spreadArrays(new Set(users_1));
                                        registered_1 = [];
                                        tournament === null || tournament === void 0 ? void 0 : tournament.teams.forEach(function (team) { return registered_1.push.apply(registered_1, team.teamMembers); });
                                        overlap_1 = [];
                                        users_1.forEach(function (user) {
                                            if (registered_1.includes(user))
                                                overlap_1.push("<@" + user + ">");
                                        });
                                        if (!(overlap_1.length > 0)) return [3 /*break*/, 29];
                                        return [4 /*yield*/, message.reply(createEmbed("The member(s) " + overlap_1.join(' ') + " is/are already in teams. Please contact a staff member if you think this is a mistake.", "RED"))];
                                    case 28: return [2 /*return*/, _h.sent()];
                                    case 29: return [4 /*yield*/, utils_1.Players.getManyByDiscord(users_1)];
                                    case 30:
                                        players_1 = _h.sent();
                                        if (players_1.array().length !== users_1.length) {
                                            unregistered = users_1.filter(function (user) { return !players_1.find(function (u) { return u.discord === user; }); });
                                            return [2 /*return*/, message.reply(createEmbed("You cannot team with unregistered users. Please ask " + unregistered.map(function (un) { return "<@" + un + ">"; }).join(' ') + " to register in " + ((_d = guild.channels.cache.get(constants_1.Constants.REGISTER_CHANNEL)) === null || _d === void 0 ? void 0 : _d.toString()) + " using /register first.", "RED"))];
                                        }
                                        if (users_1.length !== tournament.number_of_players)
                                            return [2 /*return*/, message.reply(createEmbed("Invalid Usage. Please use format `=team " + errMsg + " [Team Name]`", "RED"))];
                                        return [4 /*yield*/, message.channel.send(users_1.map(function (u) { return "<@" + u + ">"; }).join(' '))];
                                    case 31:
                                        mess_1 = _h.sent();
                                        return [4 /*yield*/, mess_1.edit(createEmbed("Team \u2192 " + users_1.map(function (u) { return "<@" + u + ">"; }).join(' ') + "\n\nPlease ask all your teammates to react with a \u2705").setTitle(team_1 + " Registration").setColor("#F6BE00"))
                                                .then(function (msg) {
                                                msg.react('✅')
                                                    .then(function () {
                                                    msg.react('❌');
                                                });
                                            })];
                                    case 32:
                                        _h.sent();
                                        filter = function (reaction) {
                                            return reaction.emoji.name === '✅' || reaction.emoji.name === '❌';
                                        };
                                        collector_1 = mess_1.createReactionCollector(filter, { time: 24 * 60 * 60 * 1000 });
                                        collector_1.on('collect', function (r, user) { return __awaiter(_this, void 0, void 0, function () {
                                            var updatedTourney, registered_2, overlap_2;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, db.tournaments.findOne({ "registration": message.channel.id })];
                                                    case 1:
                                                        updatedTourney = _a.sent();
                                                        if (!(!users_1.includes(user.id) && user.id !== client.user.id)) return [3 /*break*/, 3];
                                                        return [4 /*yield*/, r.users.remove(user.id)];
                                                    case 2: return [2 /*return*/, _a.sent()];
                                                    case 3:
                                                        if (!(r.count > tournament.number_of_players && r.emoji.name === '✅')) return [3 /*break*/, 10];
                                                        return [4 /*yield*/, r.message.reactions.removeAll()];
                                                    case 4:
                                                        _a.sent();
                                                        registered_2 = [];
                                                        updatedTourney === null || updatedTourney === void 0 ? void 0 : updatedTourney.teams.forEach(function (team) { return registered_2.push.apply(registered_2, team.teamMembers); });
                                                        overlap_2 = [];
                                                        users_1.forEach(function (user) {
                                                            if (registered_2.includes(user))
                                                                overlap_2.push("<@" + user + ">");
                                                        });
                                                        if (!(overlap_2.length > 0)) return [3 /*break*/, 6];
                                                        return [4 /*yield*/, r.message.edit(createEmbed("The member(s) " + overlap_2.join(' ') + " is/are already in teams. Please contact a staff member if you think this is a mistake.", "RED"))];
                                                    case 5:
                                                        _a.sent();
                                                        return [3 /*break*/, 9];
                                                    case 6: return [4 /*yield*/, r.message.edit(createEmbed("Team \u2192 " + users_1.map(function (u) { return "<@" + u + ">"; }).join(' ')).setTitle(team_1 + " Registration \u2192 Pending Staff Approval"))];
                                                    case 7:
                                                        _a.sent();
                                                        return [4 /*yield*/, guild.channels.cache.get(tournament.registered).send(createEmbed("Team \u2192 " + users_1.map(function (u) { return "<@" + u + ">"; }).join(' ')).setTitle(team_1 + " Registration \u2192 Pending Staff Approval"))];
                                                    case 8:
                                                        _a.sent();
                                                        _a.label = 9;
                                                    case 9:
                                                        collector_1.stop("reacted");
                                                        return [3 /*break*/, 13];
                                                    case 10:
                                                        if (!(r.count > 1 && r.emoji.name === '❌')) return [3 /*break*/, 13];
                                                        return [4 /*yield*/, r.message.edit(createEmbed("Team \u2192 " + users_1.map(function (u) { return "<@" + u + ">"; }).join(' ')).setTitle(team_1 + " Registration \u2192 Unsuccessful").setColor("RED"))];
                                                    case 11:
                                                        _a.sent();
                                                        return [4 /*yield*/, r.message.reactions.removeAll()];
                                                    case 12:
                                                        _a.sent();
                                                        collector_1.stop("reacted");
                                                        _a.label = 13;
                                                    case 13: return [2 /*return*/];
                                                }
                                            });
                                        }); });
                                        collector_1.on('end', function (_collection, reason) { return __awaiter(_this, void 0, void 0, function () {
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        if (reason === "reacted")
                                                            return [2 /*return*/];
                                                        return [4 /*yield*/, mess_1.edit(createEmbed("Team \u2192 " + users_1.map(function (u) { return "<@" + u + ">"; }).join(' ')).setTitle(team_1 + " Registration \u2192 Unsuccessful").setColor("RED"))];
                                                    case 1:
                                                        _a.sent();
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); });
                                        return [2 /*return*/];
                                    case 33: return [4 /*yield*/, db.tournaments.findOne({ "manager": message.channel.id })];
                                    case 34:
                                        tourn = _h.sent();
                                        if (!(tourn !== null)) return [3 /*break*/, 42];
                                        if (!message.content.startsWith('=removeTeam')) return [3 /*break*/, 36];
                                        msg_arr = message.content.split(' ');
                                        if (msg_arr.length !== 2)
                                            return [2 /*return*/, message.reply(createEmbed("Invalid Usage. Please use format `=removeTeam [ID]`", "RED"))];
                                        id_1 = parseInt(msg_arr[1]);
                                        if (Number.isNaN(id_1))
                                            return [2 /*return*/, message.reply(createEmbed("Team ID must be a number.", "RED"))];
                                        return [4 /*yield*/, db.tournaments.updateOne({
                                                "manager": message.channel.id
                                            }, {
                                                $pull: {
                                                    "teams": { teamID: id_1 }
                                                }
                                            })];
                                    case 35:
                                        deleted = _h.sent();
                                        if (deleted.modifiedCount === 0) {
                                            return [2 /*return*/, message.reply(createEmbed("Team with ID: " + id_1 + " does not exist.", "RED"))];
                                        }
                                        challonge_ts_1.ParticipantAdapter.destroy(API_KEY, "equinox_" + tourn.name, tourn.teams.find(function (team) { return team.teamID === id_1; }).challongeID);
                                        return [2 /*return*/, message.reply(createEmbed("Team with ID: " + id_1 + " was deleted successfully!"))];
                                    case 36:
                                        if (!message.content.startsWith('=start')) return [3 /*break*/, 41];
                                        if (!(tourn.state !== 'started')) return [3 /*break*/, 40];
                                        return [4 /*yield*/, challonge_ts_1.TournamentAdapter.start(API_KEY, "equinox_" + tourn.name, {
                                                "include_matches": 1
                                            })];
                                    case 37:
                                        _h.sent();
                                        return [4 /*yield*/, db.tournaments.updateOne({ "manager": message.channel.id }, { $set: { "state": "started" } }, { upsert: true })];
                                    case 38:
                                        _h.sent();
                                        message.reply(createEmbed().setTitle("Tournament " + tourn.name + " started!"));
                                        return [4 /*yield*/, challonge_ts_1.MatchAdapter.index(API_KEY, "equinox_" + tourn.name).then(function (response) { return __awaiter(_this, void 0, void 0, function () {
                                                var matches;
                                                var _this = this;
                                                return __generator(this, function (_a) {
                                                    matches = [];
                                                    response.matches.forEach(function (match) { return __awaiter(_this, void 0, void 0, function () {
                                                        return __generator(this, function (_a) {
                                                            console.log(match);
                                                            console.log("Player1_ID --> " + match.player1_id);
                                                            console.log("Player2_ID --> " + match.player2_id);
                                                            tourn.teams.forEach(function (team) { return console.log("Team " + team.teamID + " Challonge ID --> " + team.challongeID); });
                                                            return [2 /*return*/];
                                                        });
                                                    }); });
                                                    return [2 /*return*/];
                                                });
                                            }); })];
                                    case 39:
                                        _h.sent();
                                        return [2 /*return*/, (_e = guild.channels.cache.get(tourn.registration)) === null || _e === void 0 ? void 0 : _e["delete"]()];
                                    case 40: return [2 /*return*/, message.reply(createEmbed(undefined, "RED").setTitle("Tournament " + tourn.name + " has already started."))];
                                    case 41:
                                        if (message.content.startsWith('=matches')) {
                                            if (tourn.state !== 'started')
                                                return [2 /*return*/, message.reply(createEmbed('The tournament has not started as yet. Please use =start [name] to start the tournament.', "RED"))];
                                            matches = tourn.matches;
                                            matches.forEach(function (match) {
                                                message.reply(createEmbed(undefined, "GREEN", tourn.name + " Matches").setTitle("Match ID: " + match.id)
                                                    .addField('Team 1', match.teams[0].split(' ').map(function (mem) { return client.users.cache.get(mem); }).join(' ') + "\nScore: " + match.result[0])
                                                    .addField('Team 2', match.teams[1].split(' ').map(function (mem) { return client.users.cache.get(mem); }).join(' ') + "\nScore: " + match.result[1])
                                                    .addField('State', match.matchState));
                                            });
                                            return [2 /*return*/];
                                        }
                                        _h.label = 42;
                                    case 42: return [4 /*yield*/, db.tournaments.findOne({ "registered": message.channel.id })];
                                    case 43:
                                        tourney = _h.sent();
                                        if (tourney !== null && message.author.id === client.user.id && message.embeds.length === 1) {
                                            message.react('✅')
                                                .then(function () {
                                                message.react('❌');
                                            });
                                            filter = function (reaction) {
                                                return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && !state;
                                            };
                                            collector_2 = message.createReactionCollector(filter, { time: 0 });
                                            name_2 = message.embeds[0].title.split(' ').slice(0)[0];
                                            collector_2.on('collect', function (r) { return __awaiter(_this, void 0, void 0, function () {
                                                var updatedTourney, registered_3, overlap_3, users, part, team;
                                                var _a;
                                                return __generator(this, function (_b) {
                                                    switch (_b.label) {
                                                        case 0:
                                                            if (!(r.count === 2 && r.emoji.name === '✅')) return [3 /*break*/, 10];
                                                            state = true;
                                                            return [4 /*yield*/, db.tournaments.findOne({ "registered": message.channel.id })];
                                                        case 1:
                                                            updatedTourney = _b.sent();
                                                            if (!updatedTourney)
                                                                return [2 /*return*/];
                                                            if (updatedTourney.state === 'started') {
                                                                r.message.channel.send(createEmbed("This tournament has already started.", 'RED'));
                                                                return [2 /*return*/, collector_2.stop()];
                                                            }
                                                            registered_3 = [];
                                                            updatedTourney === null || updatedTourney === void 0 ? void 0 : updatedTourney.teams.forEach(function (team) { return registered_3.push.apply(registered_3, team.teamMembers); });
                                                            overlap_3 = [];
                                                            users = (_a = message.embeds[0].description) === null || _a === void 0 ? void 0 : _a.slice(2).split(' ').map(function (split) { return split.slice(2, -1); }).filter(function (str) { return str.length > 0; });
                                                            users.forEach(function (user) {
                                                                if (registered_3.includes(user))
                                                                    overlap_3.push("<@" + user + ">");
                                                            });
                                                            if (!(overlap_3.length > 0)) return [3 /*break*/, 3];
                                                            return [4 /*yield*/, message.edit(createEmbed("The member(s) " + overlap_3.join(' ') + " is/are already in teams.", "RED"))];
                                                        case 2:
                                                            _b.sent();
                                                            return [3 /*break*/, 9];
                                                        case 3: return [4 /*yield*/, challonge_ts_1.ParticipantAdapter.create(API_KEY, "equinox_" + tourney.name, {
                                                                "participant": {
                                                                    "name": name_2
                                                                }
                                                            })];
                                                        case 4:
                                                            part = _b.sent();
                                                            team = {
                                                                "teamID": updatedTourney.teamIndex,
                                                                "teamMembers": users,
                                                                "teamName": name_2,
                                                                "challongeID": part.participant.id
                                                            };
                                                            return [4 /*yield*/, db.tournaments.updateOne({
                                                                    "registered": message.channel.id
                                                                }, {
                                                                    $push: {
                                                                        "teams": team
                                                                    },
                                                                    $inc: {
                                                                        "teamIndex": 1
                                                                    }
                                                                }, {
                                                                    upsert: true
                                                                })];
                                                        case 5:
                                                            _b.sent();
                                                            return [4 /*yield*/, message.edit(users.map(function (u) { return "<@" + u + ">"; }).join(' '))];
                                                        case 6:
                                                            _b.sent();
                                                            return [4 /*yield*/, message.edit(message.embeds[0].setTitle(name_2 + " Registration \u2192 Successful").setColor("GREEN").setFooter("\u00A9 Equinox | Team ID: " + updatedTourney.teamIndex))];
                                                        case 7:
                                                            _b.sent();
                                                            return [4 /*yield*/, r.message.reactions.removeAll()];
                                                        case 8:
                                                            _b.sent();
                                                            collector_2.stop();
                                                            _b.label = 9;
                                                        case 9: return [3 /*break*/, 13];
                                                        case 10:
                                                            if (!(r.count === 2 && r.emoji.name === '❌')) return [3 /*break*/, 13];
                                                            state = true;
                                                            return [4 /*yield*/, message.edit(message.embeds[0].setTitle(name_2 + " Registration \u2192 Denied").setColor("RED"))];
                                                        case 11:
                                                            _b.sent();
                                                            return [4 /*yield*/, r.message.reactions.removeAll()];
                                                        case 12:
                                                            _b.sent();
                                                            collector_2.stop();
                                                            _b.label = 13;
                                                        case 13:
                                                            state = false;
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); });
                                            return [2 /*return*/];
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        });
                    });
                    // role storage
                    client.on('guildMemberAdd', function (member) { return __awaiter(_this, void 0, void 0, function () {
                        var player;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, utils_1.Players.getByDiscord(member.id)];
                                case 1:
                                    player = (_a.sent());
                                    if (!player) return [3 /*break*/, 3];
                                    return [4 /*yield*/, member.roles.set(player.roles)];
                                case 2:
                                    _a.sent();
                                    _a.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    // role storage
                    client.on('guildMemberRemove', function (member) { return __awaiter(_this, void 0, void 0, function () {
                        var player;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, utils_1.Players.getByDiscord(member.id)];
                                case 1:
                                    player = (_a.sent());
                                    if (player) {
                                        player.update({ roles: member.roles.cache.map(function (_a) {
                                                var id = _a.id;
                                                return id;
                                            }) });
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    logger.info("App is now online!");
                    return [2 /*return*/];
            }
        });
    });
}();
