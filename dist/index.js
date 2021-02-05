"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const logger_1 = __importDefault(require("./logger"));
const logger = new logger_1.default("Main");
const discord_js_1 = require("discord.js");
const https_1 = __importDefault(require("https"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const bot_1 = __importStar(require("./managers/bot"));
const database_1 = __importDefault(require("./managers/database"));
const hypixel_1 = require("./managers/hypixel");
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const socket_1 = require("./managers/socket");
const mongodb_1 = require("mongodb");
const challonge_ts_1 = require("challonge-ts");
const games_1 = require("./typings/games");
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    logger.error("NO API KEY DEFINED");
    process.exit(1);
}
let state = false;
!async function () {
    const [db, client, guild] = await Promise.all([database_1.default, bot_1.default, bot_1.defaultGuild]).catch(err => {
        logger.error(`Startup failed:\n${err.stack}`);
        return process.exit(1);
    });
    function createEmbed(description, color = "#228B22", footerSuffix = `Watching ${guild.memberCount} Players!`) {
        const embed = new discord_js_1.MessageEmbed()
            .setColor(color)
            .setFooter(`© Equinox | ${footerSuffix}`, constants_1.Constants.BRANDING_URL);
        if (description)
            embed.setDescription(description);
        return embed;
    }
    client.on("raw", async (payload) => {
        if (payload.t !== "INTERACTION_CREATE")
            return;
        const logger = new logger_1.default("Command Handler");
        const { token, data, id, member, channel_id } = payload.d;
        const { user } = member;
        const { name: cmd } = data;
        const req = https_1.default.request(`${constants_1.Constants.DISCORD_API_BASE_URL}/interactions/${id}/${token}/callback`, {
            method: "POST",
            headers: {
                authorization: `Bot ${process.env.TOKEN}`,
                "Content-Type": "application/json",
            }
        });
        function respond(message) {
            return new Promise(res => {
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
                req.on("error", () => null);
                req.on("finish", res);
            });
        }
        switch (cmd) {
            case "register": {
                if (constants_1.Constants.REGISTER_CHANNEL !== channel_id) {
                    respond(createEmbed(`<@${user.id}> you cannot register in this channel. Please do /register [ign] in ${guild.channels.cache.get(constants_1.Constants.REGISTER_CHANNEL)}`, "RED"));
                    break;
                }
                const player = payload.d.data.options[0].value;
                try {
                    const mojang = await (await node_fetch_1.default(`https://api.mojang.com/users/profiles/minecraft/${player}`)).text();
                    if (!mojang) {
                        respond(createEmbed("Minecraft account not found.", "RED"));
                        break;
                    }
                    const d = JSON.parse(mojang);
                    if (!d.id) {
                        respond(createEmbed("Minecraft account not found.", "RED"));
                        break;
                    }
                    const hypixelData = await hypixel_1.getHypixelPlayer(d.id);
                    const discord = hypixelData?.player?.socialMedia?.links?.DISCORD;
                    if (!discord) {
                        respond(createEmbed(`**${d.name}** does not have a Discord account linked. For more information, read ${guild.channels.cache.get('800070737091624970')}`, "RED"));
                        break;
                    }
                    if (discord !== `${user.username}#${user.discriminator}`) {
                        respond(createEmbed(`**${d.name}** has another Discord account or server linked. If this is you, change your linked Discord to **${user.username}#${user.discriminator}**.\n\n**Changed your Discord username?** You'll need to change your linked account in game.`, "RED"));
                        break;
                    }
                    const { value } = await db.players.findOneAndUpdate({ discord: user.id }, {
                        $set: {
                            minecraft: {
                                uuid: d.id,
                                name: d.name,
                            },
                            registeredAt: Date.now(),
                        },
                        $setOnInsert: {
                            discord: user.id
                        },
                    }, {
                        upsert: true,
                    });
                    if (!value) {
                        await respond(createEmbed(`You have successfully registered with the username **${d.name}**. Welcome to Equinox!`, "#228B22"));
                        const member = guild.members.cache.get(user.id);
                        guild.members.cache.get(user.id)?.setNickname(`${d.name}`).catch(e => logger.error(`Failed to update a new member's nickname:\n${e.stack}`));
                        await member.roles.add(constants_1.Constants.MEMBER_ROLE).catch(() => null);
                        break;
                    }
                    const member = guild.members.cache.get(user.id);
                    await respond(createEmbed(`You have successfully changed your linked Minecraft account to **${d.name}**.`, "#228B22"));
                    member?.setNickname(`${d.name}`).catch(e => logger.error(`Failed to update an existing member's nickname on re-registration:\n${e.stack}`));
                }
                catch (e) {
                    logger.error(`An error occurred while using the /register command:\nDeclared username: ${player}\n${e.stack}`);
                    await respond(createEmbed('Something went wrong while registering your account. Please try again later. If the issue persists, please contact a staff member.', "RED"));
                }
                break;
            }
            case "info": {
                if (constants_1.Constants.CHAT === channel_id) {
                    respond(createEmbed(`<@${user.id}> commands are disabled in this channel.`, "RED"));
                    break;
                }
                const lookup = payload.d.data.options[0].value;
                try {
                    const player = await utils_1.Players.getByDiscord(lookup);
                    if (!player) {
                        respond(createEmbed(`<@${lookup}> is not a registered Equinox player.`, "RED"));
                        break;
                    }
                    const WLR = player.losses === 0 ? player.wins : Math.round((player.wins / player.losses + Number.EPSILON) * 100) / 100;
                    respond(createEmbed(`**${player.minecraft.name}**'s Stats`, "#228B22")
                        .addField("**Games**", `\`Wins:\` ${player.wins}\n\`Losses:\` ${player.losses}\n\`WLR:\` ${WLR}`)
                        .addField("**Combat**", `\`Kills:\` ${player.kills}\n\`Deaths:\` ${player.deaths}\n\`Beds Broken:\` ${player.bedsBroken}\n\`Beds Lost:\` ${player.bedsLost}`));
                }
                catch (e) {
                    logger.error(`An error occurred while using the /info command:\nUser: ${lookup}\n${e.stack}`);
                    respond(createEmbed("Something went wrong while requesting a player's stats. Please try again later. If the issue persists, please contact a staff member.", "RED"));
                }
                break;
            }
            case "leaderboard": {
                if (constants_1.Constants.CHAT === channel_id) {
                    respond(createEmbed(`<@${user.id}> commands are disabled in this channel.`, "RED"));
                    break;
                }
                try {
                    let { name, options } = payload.d.data.options[0];
                    if (name === "beds")
                        name = "bedsBroken";
                    let page = options ? options[0].value : 1;
                    const nPerPage = 10;
                    const total = await db.players.find({
                        [name]: {
                            $exists: true,
                        }
                    }).count();
                    if (total < 1) {
                        respond(createEmbed("There's no players on this leaderboard yet. Play now, and claim a top spot!", "RED"));
                        break;
                    }
                    let prettyName = name;
                    switch (name) {
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
                    const pages = Math.ceil(total / nPerPage);
                    if (page > pages)
                        page = pages;
                    const players = await db.players
                        .find({
                        [name]: {
                            $exists: true
                        }
                    })
                        .sort({ [name]: -1 })
                        .skip(page > 0 ? ((page - 1) * nPerPage) : 0)
                        .limit(nPerPage)
                        .toArray();
                    respond(createEmbed(players.map((player, i) => `\n\`#${i + 1 + (nPerPage * (page - 1))}\` **${player.minecraft.name}** : ${player[name] ?? 0}`).join(""), "#228B22")
                        .setTitle(`${prettyName} | Page ${page}/${pages}`));
                }
                catch (e) {
                    logger.error(`An error occurred while using the /leaderboard command:\n${e.stack}`);
                    respond(createEmbed("Something went wrong while requesting the leaderboard. Please try again later. If the issue persists, please contact a staff member.", "RED"));
                }
            }
        }
    });
    client.on("message", async function (message) {
        if (!message.guild) {
            return;
        }
        else if (message.content === "=fclose" || message.content === "=forceclose") {
            let perms = await utils_1.hasPerms(message.member, constants_1.Constants.FCLOSE_ROLES);
            if (message.author.id === client.user.id)
                perms = true;
            if (!perms) {
                return message.channel.send(createEmbed(`${message.author} you do not have the required permissions to run this command.`, "RED", "RBW Game Management")).catch(_ => null);
            }
            const game = utils_1.activeGames.find(_game => _game.textChannel?.id === message.channel.id);
            if (!game)
                return message.channel.send(createEmbed("This channel is not bound to a currently active game.", "RED", "RBW Game Management")).catch(_ => null);
            try {
                const deleteChannels = await game.cancel();
                deleteChannels();
            }
            catch (e) {
                logger.error(`Failed to run =fclose command:\n${e.stack}`);
            }
            ;
        }
        else if (message.channel.id === constants_1.Constants.BOT_RESTART_CHANNEL && message.content.startsWith('=restart') && message.content.split(' ').length > 1) {
            const bot = message.content.split(' ')[1];
            const _bot = socket_1.bots.get(bot);
            if (!_bot)
                return message.reply(`${bot} is not a valid bot.`);
            _bot.emit("restart");
            utils_1.BotManager.release(bot);
            return message.reply(`${bot} successfully restarted.`);
        }
        else if (constants_1.Constants.ADMIN_COMMANDS_CHANNEL === message.channel.id && message.content.toLowerCase().startsWith('=modify')) {
            if (!message.member)
                return;
            const users = message.content.split(' ').slice(2, -1).map(id => client.users.cache.get(id)).filter(u => u);
            users.push(...message.mentions.users.array());
            const msg_arr = message.content.split(' ');
            if (msg_arr.length < 4)
                return message.reply(createEmbed(`Invalid Usage. Please use format \`=modify wins|losses|kills|deaths|bedsbroken|bedslost| @User/User_ID ±[number]\``, "RED"));
            const option = msg_arr[1].toLowerCase();
            if (![`wins`, `losses`, `kills`, `deaths`, `bedsbroken`, `bedslost`].includes(option))
                return message.reply(createEmbed(`Invalid Usage. Please use format \`=modify wins|losses|kills|deaths|bedsbroken|bedslost| @User/User_ID ±[number]\``, "RED"));
            const num = parseInt(msg_arr[3]);
            if (Number.isNaN(num))
                return message.reply(createEmbed(`Number of ${option} must be an Integer or Valid Number.`));
            if (users.length > 0) {
                let ids = users.map(user => user.id);
                const players = (await utils_1.Players.getManyByDiscord(ids));
                const players2 = players.map(player => player.discord);
                ids = ids.filter(id => players2.includes(id));
                switch (option) {
                    case "wins":
                        {
                            await db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "wins": num } }, { upsert: true });
                            break;
                        }
                        ;
                    case "losses":
                        {
                            await db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "losses": num } }, { upsert: true });
                            break;
                        }
                        ;
                    case "bedsbroken":
                        {
                            await db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "bedsBroken": num } }, { upsert: true });
                            break;
                        }
                        ;
                    case "bedslost":
                        {
                            await db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "bedsLost": num } }, { upsert: true });
                            break;
                        }
                        ;
                }
                message.reply(createEmbed(`Users → ${ids.map(id => `<@${id}>`).join(' ')} ${option} modified successfully.`));
            }
            else
                message.reply(createEmbed('Invalid User/User_ID specified.'));
            return;
        }
        else if (message.channel.id === constants_1.Constants.TOURNAMENT_CREATION_CHANNEL) {
            if (message.content.startsWith('=create')) {
                const msg_arr = message.content.split(' ');
                if (msg_arr.length !== 3)
                    return message.reply(createEmbed(`Invalid Usage. Please use format \`=create name [number of players]\` to create a new tournament.`, "RED"));
                const name = msg_arr[1];
                if (name.length > 50)
                    return message.reply(createEmbed(`Invalid Usage. Tournament lengths cannot be over 50 characters.`, "RED"));
                const number_of_players = parseInt(msg_arr[2]);
                if (Number.isNaN(number_of_players) || number_of_players > 4 || number_of_players <= 0) {
                    return message.reply(createEmbed("Number of players must be a positive Integer <= 4", "RED"));
                }
                const { value } = await db.tournaments.findOneAndUpdate({
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
                });
                if (value)
                    return message.reply(createEmbed(`There is already an active tournament with the name ${name}. All names for active tournaments must be unique.`, "RED"));
                await message.reply(createEmbed(`Tournament → ${name} Created Successfully!`));
                const data = await challonge_ts_1.TournamentAdapter.create(API_KEY, {
                    "tournament": {
                        "name": name,
                        "url": `equinox_${name}`,
                        "open_signup": false,
                        "private": true,
                    }
                });
                console.log(data);
                const [manager, register, registered] = await Promise.all([
                    guild.channels.create(`${name} Manager`, {
                        type: "text",
                        parent: constants_1.Constants.ADMIN_CONSOLE_CATEGORY,
                    }),
                    guild.channels.create(`${name} Registration`, {
                        type: "text",
                        parent: constants_1.Constants.TOURNEY_REGISTRATION_CATEGORY,
                    }),
                    guild.channels.create(`${name} Confirmation`, {
                        type: "text",
                        parent: constants_1.Constants.TOURNEY_CONFIRMATION_CHANNEL,
                    })
                ]);
                await db.tournaments.updateOne({
                    "name": name
                }, {
                    $set: {
                        "manager": manager.id,
                        "registration": register.id,
                        "registered": registered.id
                    }
                }, {
                    "upsert": true
                });
                return message.channel.send(`https://challonge.com/equinox_${name}`);
            }
            if (message.content.startsWith('=delete')) {
                const msg_arr = message.content.split(' ');
                if (msg_arr.length !== 2)
                    return message.reply(createEmbed("Invalid Usage. Please use format \`=delete name\` to delete a tournament", "RED"));
                const name = msg_arr[1];
                const tourney = await db.tournaments.findOne({
                    "name": name
                });
                if (!tourney)
                    return message.reply(createEmbed(`Tournament with name ${name} does not exist.`, "RED"));
                await db.tournaments.deleteOne({
                    "name": name
                });
                await challonge_ts_1.TournamentAdapter.destroy(API_KEY, `equinox_${name}`);
                message.reply(createEmbed(`Tournament with name ${name} was deleted successfully!`));
                try {
                    guild.channels.cache.get(tourney.manager)?.delete();
                    guild.channels.cache.get(tourney.registration)?.delete();
                    guild.channels.cache.get(tourney.registered)?.delete();
                }
                catch {
                    logger.error(`Could not delete channels for Tournament ${name}`);
                }
            }
            return;
        }
        const tournament = await db.tournaments.findOne({ "registration": message.channel.id });
        if (tournament !== null) {
            if (!message.content.startsWith('=team'))
                return;
            const msg_arr = message.content.split(' ');
            const indexOfLastMention = msg_arr.slice(1).findIndex(msg => !msg.startsWith('<@'));
            const errMsg = tournament.number_of_players === 1 ? ' ' : tournament.number_of_players === 2 ? ` @user1 ` : ` @user1...@user${tournament.number_of_players - 1} `;
            if (indexOfLastMention === -1)
                return message.reply(createEmbed(`Invalid Usage. Use format \`=team${errMsg}[Team Name]\``, "RED"));
            const team = msg_arr.slice(indexOfLastMention - msg_arr.length + 1).join(' ');
            if (tournament.teams.map(team => team.teamName).includes(team))
                return message.reply(createEmbed(`A team with name ${team} already exists in this tournament.`, "RED"));
            let users = msg_arr.slice(1).map(u => client.users.cache.get(u)).filter(u => u).map(u => u.id);
            if (message.mentions.users.array())
                users.push(...message.mentions.users.array().map(men => men.id));
            users.push(message.author.id);
            users = [...new Set(users)];
            const registered = [];
            tournament?.teams.forEach(team => registered.push(...team.teamMembers));
            const overlap = [];
            users.forEach(user => {
                if (registered.includes(user))
                    overlap.push(`<@${user}>`);
            });
            if (overlap.length > 0)
                return await message.reply(createEmbed(`The member(s) ${overlap.join(' ')} is/are already in teams. Please contact a staff member if you think this is a mistake.`, "RED"));
            const players = await utils_1.Players.getManyByDiscord(users);
            if (players.array().length !== users.length) {
                const unregistered = users.filter(user => !players.find(u => u.discord === user));
                return message.reply(createEmbed(`You cannot team with unregistered users. Please ask ${unregistered.map(un => `<@${un}>`).join(' ')} to register in ${guild.channels.cache.get(constants_1.Constants.REGISTER_CHANNEL)?.toString()} using /register first.`, "RED"));
            }
            if (users.length !== tournament.number_of_players)
                return message.reply(createEmbed(`Invalid Usage. Please use format \`=team ${errMsg} [Team Name]\``, "RED"));
            const mess = await message.channel.send(users.map(u => `<@${u}>`).join(' '));
            await mess.edit(createEmbed(`Team → ${users.map(u => `<@${u}>`).join(' ')}\n\nPlease ask all your teammates to react with a ✅`).setTitle(`${team} Registration`).setColor("#F6BE00"))
                .then((msg) => {
                msg.react('✅')
                    .then(() => {
                    msg.react('❌');
                });
            });
            const filter = (reaction) => {
                return reaction.emoji.name === '✅' || reaction.emoji.name === '❌';
            };
            const collector = mess.createReactionCollector(filter, { time: 24 * 60 * 60 * 1000 });
            collector.on('collect', async (r, user) => {
                const updatedTourney = await db.tournaments.findOne({ "registration": message.channel.id });
                if (!users.includes(user.id) && user.id !== client.user.id) {
                    return await r.users.remove(user.id);
                }
                if (r.count > tournament.number_of_players && r.emoji.name === '✅') {
                    await r.message.reactions.removeAll();
                    const registered = [];
                    updatedTourney?.teams.forEach(team => registered.push(...team.teamMembers));
                    const overlap = [];
                    users.forEach(user => {
                        if (registered.includes(user))
                            overlap.push(`<@${user}>`);
                    });
                    if (overlap.length > 0)
                        await r.message.edit(createEmbed(`The member(s) ${overlap.join(' ')} is/are already in teams. Please contact a staff member if you think this is a mistake.`, "RED"));
                    else {
                        await r.message.edit(createEmbed(`Team → ${users.map(u => `<@${u}>`).join(' ')}`).setTitle(`${team} Registration → Pending Staff Approval`));
                        await guild.channels.cache.get(tournament.registered).send(createEmbed(`Team → ${users.map(u => `<@${u}>`).join(' ')}`).setTitle(`${team} Registration → Pending Staff Approval`));
                    }
                    collector.stop("reacted");
                }
                else if (r.count > 1 && r.emoji.name === '❌') {
                    await r.message.edit(createEmbed(`Team → ${users.map(u => `<@${u}>`).join(' ')}`).setTitle(`${team} Registration → Unsuccessful`).setColor("RED"));
                    await r.message.reactions.removeAll();
                    collector.stop("reacted");
                }
            });
            collector.on('end', async (_collection, reason) => {
                if (reason === "reacted")
                    return;
                await mess.edit(createEmbed(`Team → ${users.map(u => `<@${u}>`).join(' ')}`).setTitle(`${team} Registration → Unsuccessful`).setColor("RED"));
            });
            return;
        }
        const tourn = await db.tournaments.findOne({ "manager": message.channel.id });
        if (tourn !== null) {
            if (message.content.startsWith('=removeTeam')) {
                const msg_arr = message.content.split(' ');
                if (msg_arr.length !== 2)
                    return message.reply(createEmbed("Invalid Usage. Please use format `=removeTeam [ID]`", "RED"));
                const id = parseInt(msg_arr[1]);
                if (Number.isNaN(id))
                    return message.reply(createEmbed("Team ID must be a number.", "RED"));
                const deleted = await db.tournaments.updateOne({
                    "manager": message.channel.id
                }, {
                    $pull: {
                        "teams": { teamID: id }
                    }
                });
                if (deleted.modifiedCount === 0) {
                    return message.reply(createEmbed(`Team with ID: ${id} does not exist.`, "RED"));
                }
                challonge_ts_1.ParticipantAdapter.destroy(API_KEY, `equinox_${tourn.name}`, tourn.teams.find(team => team.teamID === id).challongeID);
                return message.reply(createEmbed(`Team with ID: ${id} was deleted successfully!`));
            }
            else if (message.content.startsWith('=start') && !message.content.startsWith('=startGame')) {
                if (tourn.state !== 'started') {
                    await challonge_ts_1.TournamentAdapter.start(API_KEY, `equinox_${tourn.name}`, {
                        "include_matches": 1,
                    });
                    await db.tournaments.updateOne({ "manager": message.channel.id }, { $set: { "state": "started" } }, { upsert: true });
                    message.reply(createEmbed().setTitle(`Tournament ${tourn.name} started!`));
                    await challonge_ts_1.MatchAdapter.index(API_KEY, `equinox_${tourn.name}`).then(async (response) => {
                        const matches = [];
                        response.matches.forEach(async (_match) => {
                            const match = _match;
                            const team1 = tourn.teams.find(team => team.challongeID === match.match.player1_id);
                            const team2 = tourn.teams.find(team => team.challongeID === match.match.player2_id);
                            const tournamentMatch = {
                                "id": match.match.id,
                                "matchState": match.match.state,
                                "result": [0, 0],
                                "teams": [team1.teamMembers.join(' '), team2.teamMembers.join(' ')],
                            };
                            matches.push(tournamentMatch);
                        });
                        await db.tournaments.updateOne({ "manager": message.channel.id }, { $set: { "matches": matches } }, { upsert: true });
                    });
                    return guild.channels.cache.get(tourn.registration)?.delete();
                }
                return message.reply(createEmbed(undefined, "RED").setTitle(`Tournament ${tourn.name} has already started.`));
            }
            else if (message.content.startsWith('=matches')) {
                if (tourn.state !== 'started')
                    return message.reply(createEmbed('The tournament has not started as yet. Please use =start [name] to start the tournament.', "RED"));
                const matches = tourn.matches;
                matches.forEach(match => {
                    message.reply(createEmbed(undefined, "GREEN", `${tourn.name} Matches`).setTitle(`Match ID: ${match.id}`)
                        .addField('Team 1', `${match.teams[0].split(' ').map(mem => client.users.cache.get(mem)).join(' ')}\nScore: ${match.result[0]}`)
                        .addField('Team 2', `${match.teams[1].split(' ').map(mem => client.users.cache.get(mem)).join(' ')}\nScore: ${match.result[1]}`)
                        .addField('State', match.matchState));
                });
                return;
            }
            else if (message.content.startsWith('=startGame')) {
                const msg_arr = message.content.split(' ');
                if (msg_arr.length !== 2)
                    return message.reply(createEmbed("Invalid Format. Please use \`=startGame [Match ID]\`", "RED"));
                const match_id = parseInt(msg_arr[1]);
                if (Number.isNaN(match_id))
                    return message.reply(createEmbed("[Match ID] must be a number.", "RED"));
                const match = tourn.matches.find(match => match.id === match_id);
                if (!match)
                    return message.reply(createEmbed(`${match_id} is not a valid Match ID.`, "RED"));
                const team1Members = match.teams[0].split(' ').map(mem => guild.members.cache.get(mem)).filter(mem => mem);
                if (team1Members.length !== tourn.number_of_players)
                    return message.reply(createEmbed("Team 1 members are missing from the guild.", "RED"));
                const team2Members = match.teams[1].split(' ').map(mem => guild.members.cache.get(mem)).filter(mem => mem);
                if (team2Members.length !== tourn.number_of_players)
                    return message.reply(createEmbed("Team 2 members are missing from the guild.", "RED"));
                const waiting_room = guild.channels.cache.get(constants_1.Constants.WAITING_ROOM);
                if (waiting_room?.type !== "voice")
                    return message.reply(createEmbed("Waiting room not found.", "RED"));
                const waiting_room_members = waiting_room?.members.array();
                if (!waiting_room_members || waiting_room_members?.length < tourn.number_of_players * 2)
                    return message.reply(createEmbed("Members are not in waiting room.", "RED"));
                const gameMembers = [...team1Members, ...team2Members];
                if (gameMembers.filter(mem => waiting_room_members?.map(m => m.id).includes(mem.id)).length !== tourn.number_of_players * 2)
                    return message.reply(createEmbed("The match members are not in the waiting room. Please ensure they are all in the waiting room before starting the game.", "RED"));
                await db.tournaments.updateOne({ "manager": message.channel.id }, { $set: { "state": "started" } });
                const game = await utils_1.createNewGame();
                const { textChannel } = await game.createChannels(gameMembers);
                const { logger, id: insertedId } = game;
                const msg = await textChannel.send(gameMembers.join(""));
                await msg.delete({ timeout: 100 });
                const [tc1, tc2] = await Promise.all([
                    guild.channels.create(`Team #1 - Match ID ${match_id}`, {
                        type: "voice",
                        permissionOverwrites: team1Members.map(player => ({
                            id: player.id,
                            allow: ["CONNECT", "SPEAK"],
                        })),
                        userLimit: team1Members.length,
                        parent: constants_1.Constants.TEAM_CALL_CATEGORY,
                    }),
                    guild.channels.create(`Team #2 - Match ID ${match_id}`, {
                        type: "voice",
                        permissionOverwrites: team2Members.map(player => ({
                            id: player.id,
                            allow: ["CONNECT", "SPEAK"],
                        })),
                        userLimit: team2Members.length,
                        parent: constants_1.Constants.TEAM_CALL_CATEGORY,
                    })
                ]);
                game.setTeamChannels(tc1, tc2);
                game.setChallongeInfo(match_id, `equinox_${tourn.name}`);
                await game.enterStartingState();
                for await (const member of team1Members) {
                    await member?.voice.setChannel(tc1.id).catch(() => logger.info('failed to send players to teams'));
                    await utils_1.delay(200);
                }
                for await (const member of team2Members) {
                    await member?.voice.setChannel(tc2.id).catch(() => logger.info('failed to send players to teams'));
                    await utils_1.delay(200);
                }
                const map = await game.pickMap();
                if (!map)
                    throw new Error("pickMap returned nothing");
                const team1 = (await utils_1.Players.getManyByDiscord(team1Members.map(mem => mem.id))).array();
                const team2 = (await utils_1.Players.getManyByDiscord(team2Members.map(mem => mem.id))).array();
                let tookALongTime = false;
                const timeout = setTimeout(() => {
                    tookALongTime = true;
                    textChannel.send(createEmbed("No bots are currently available to assign to this game. Please be patient.")).catch(() => logger.info('Failed to send in No bots are available message.'));
                }, 10000);
                game.getAssignedBot().then(async (bot) => {
                    clearTimeout(timeout);
                    if (bot === 'undefined') {
                        if (!textChannel)
                            return;
                        await textChannel.send(createEmbed('The maximum waiting time has been exceeded. No bots are available right now. Please try again later.', "RED"));
                        await utils_1.delay(5000);
                        await textChannel.send('=fclose');
                    }
                    textChannel.send(createEmbed(tookALongTime
                        ? `We're sorry for the delay. The bot **${bot}** has been assigned to your game.`
                        : `The bot **${bot}** has been assigned to your game.`)).catch(() => logger.info('Failed to create `sorry for delay embed.`'));
                    if (game.state === games_1.GameState.VOID) {
                        tc1.delete().catch(() => logger.info("Failed to delete tc1"));
                        tc2.delete().catch(() => logger.info("Failed to delete tc2"));
                        return;
                    }
                    logger.info(JSON.stringify(socket_1.bots) + `, size → ${socket_1.bots.size}`);
                    const _bot = socket_1.bots.get(bot);
                    if (!_bot) {
                        textChannel.send(createEmbed(`Failed to bind to **${bot}**.`)).catch(() => logger.info("Failed to send 'Failed to bind bot message.'"));
                        utils_1.BotManager.release(bot);
                        return game.cancel();
                    }
                    logger.info(`Sending data: ${JSON.stringify([...team1.map(player => player.toJSON()), ...team2.map(player => player.toJSON())])}`);
                    _bot.once("gameCancel", async () => {
                        try {
                            setTimeout(await game.cancel(), 10000);
                        }
                        catch (e) {
                            logger.error(`Bot failed to cancel game:\n${e.stack}`);
                        }
                    });
                    _bot.emit("gameStart", {
                        players: [...team1.map(player => player.toJSON()), ...team2.map(player => player.toJSON())],
                        map,
                    });
                    game.start(team1, team2);
                });
            }
        }
        const tourney = await db.tournaments.findOne({ "registered": message.channel.id });
        if (tourney !== null && message.author.id === client.user.id && message.embeds.length === 1) {
            message.react('✅')
                .then(() => {
                message.react('❌');
            });
            const filter = (reaction) => {
                return (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && !state;
            };
            const collector = message.createReactionCollector(filter, { time: 0 });
            const name = message.embeds[0].title.split(' ').slice(0)[0];
            collector.on('collect', async (r) => {
                if (r.count === 2 && r.emoji.name === '✅') {
                    state = true;
                    const updatedTourney = await db.tournaments.findOne({ "registered": message.channel.id });
                    if (!updatedTourney)
                        return;
                    if (updatedTourney.state === 'started') {
                        r.message.channel.send(createEmbed(`This tournament has already started.`, 'RED'));
                        return collector.stop();
                    }
                    const registered = [];
                    updatedTourney?.teams.forEach(team => registered.push(...team.teamMembers));
                    const overlap = [];
                    const users = message.embeds[0].description?.slice(2).split(' ').map(split => split.slice(2, -1)).filter(str => str.length > 0);
                    users.forEach(user => {
                        if (registered.includes(user))
                            overlap.push(`<@${user}>`);
                    });
                    if (overlap.length > 0)
                        await message.edit(createEmbed(`The member(s) ${overlap.join(' ')} is/are already in teams.`, "RED"));
                    else {
                        const part = await challonge_ts_1.ParticipantAdapter.create(API_KEY, `equinox_${tourney.name}`, {
                            "participant": {
                                "name": name
                            }
                        });
                        const team = {
                            "teamID": updatedTourney.teamIndex,
                            "teamMembers": users,
                            "teamName": name,
                            "challongeID": part.participant.id,
                        };
                        await db.tournaments.updateOne({
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
                        });
                        await message.edit(users.map(u => `<@${u}>`).join(' '));
                        await message.edit(message.embeds[0].setTitle(`${name} Registration → Successful`).setColor("GREEN").setFooter(`© Equinox | Team ID: ${updatedTourney.teamIndex}`));
                        await r.message.reactions.removeAll();
                        collector.stop();
                    }
                }
                else if (r.count === 2 && r.emoji.name === '❌') {
                    state = true;
                    await message.edit(message.embeds[0].setTitle(`${name} Registration → Denied`).setColor("RED"));
                    await r.message.reactions.removeAll();
                    collector.stop();
                }
                state = false;
            });
            return;
        }
    });
    client.on('guildMemberAdd', async (member) => {
        const player = (await utils_1.Players.getByDiscord(member.id));
        if (player) {
            await member.roles.set(player.roles);
        }
    });
    client.on('guildMemberRemove', async (member) => {
        const player = (await utils_1.Players.getByDiscord(member.id));
        if (player) {
            player.update({ roles: member.roles.cache.map(({ id }) => id) });
        }
    });
    logger.info("App is now online!");
}();
