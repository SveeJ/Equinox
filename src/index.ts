import dotenv from "dotenv";
dotenv.config();

import Logger from "./logger";

const logger = new Logger("Main");

import { CollectorFilter, ColorResolvable, MessageEmbed, ReactionEmoji, ReactionManager, TextChannel, User } from "discord.js";
import https from "https";
import fetch from "node-fetch";
import bot, { defaultGuild } from "./managers/bot";
import database from "./managers/database";
import { getHypixelPlayer } from "./managers/hypixel";
import type { InteractionPayload } from "./typings/commands";
import { Constants } from "./constants";
import { BotManager, hasPerms, Players } from "./utils";
import { bots } from "./managers/socket";
import { ObjectId } from "mongodb";
import type { TournamentTeam } from "./typings/tournaments";

!async function(){

    const [ db, client, guild ] = await Promise.all([database, bot, defaultGuild]).catch(err => {
        logger.error(`Startup failed:\n${err.stack}`);
        return process.exit(1);
    });

    function createEmbed(description?: string, color: ColorResolvable = "#228B22", footerSuffix = `Watching ${guild!.memberCount} Players!`){
        const embed = new MessageEmbed() 
            .setColor(color)
            .setFooter(`© Equinox | ${footerSuffix}`, Constants.BRANDING_URL);

        if(description) embed.setDescription(description);
        
        return embed;
    }

    client.on("raw", async (payload: InteractionPayload) => {
        if(payload.t !== "INTERACTION_CREATE") return;

        const logger = new Logger("Command Handler");

        const { token, data, id, member, channel_id } = payload.d;

        const { user } = member;

        const { name: cmd } = data;

        const req = https.request(`${Constants.DISCORD_API_BASE_URL}/interactions/${id}/${token}/callback`, {
            method: "POST",
            headers: {
                authorization: `Bot ${process.env.TOKEN}`,
                "Content-Type": "application/json",
            }
        });

        function respond(message: string | MessageEmbed){
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

                if(Constants.REGISTER_CHANNEL !== channel_id) {
                    respond(createEmbed(`<@${user.id}> you cannot register in this channel. Please do /register [ign] in ${guild.channels.cache.get(Constants.REGISTER_CHANNEL)}`, "RED"));
                    break;
                }
 
                const player = payload.d.data.options[0].value;
                try {
                    const mojang = await (await fetch(`https://api.mojang.com/users/profiles/minecraft/${player}`)).text();
                    if(!mojang){
                        respond(createEmbed("Minecraft account not found.", "RED"));
                        break;
                    }
                    const d = JSON.parse(mojang);
                    if(!d.id){
                        respond(createEmbed("Minecraft account not found.", "RED"));
                        break;
                    }
                    const hypixelData = await getHypixelPlayer(d.id);
                    const discord = hypixelData?.player?.socialMedia?.links?.DISCORD;
                    if(!discord){
                        respond(createEmbed(`**${d.name}** does not have a Discord account linked. For more information, read ${guild.channels.cache.get('800070737091624970')}`, "RED"));
                        break;
                    }
                    if(discord !== `${user.username}#${user.discriminator}`){
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
                    if(!value){
                    
                        await respond(createEmbed(`You have successfully registered with the username **${d.name}**. Welcome to Equinox!`, "#228B22"));
                        
                        const member = guild.members.cache.get(user.id);
                        guild.members.cache.get(user.id)?.setNickname(`${d.name}`).catch(e => logger.error(`Failed to update a new member's nickname:\n${e.stack}`));
                        await member!.roles.add(Constants.MEMBER_ROLE).catch(() => null);
                        
                        break;
                    }
                    const member = guild.members.cache.get(user.id);
                    await respond(createEmbed(`You have successfully changed your linked Minecraft account to **${d.name}**.`, "#228B22"));
                    member?.setNickname(`${d.name}`).catch(e => logger.error(`Failed to update an existing member's nickname on re-registration:\n${e.stack}`));

                } catch(e){
                    logger.error(`An error occurred while using the /register command:\nDeclared username: ${player}\n${e.stack}`);
                    await respond(createEmbed('Something went wrong while registering your account. Please try again later. If the issue persists, please contact a staff member.', "RED"));
                }   
                    
                break;
            }

            case "info": {

                if(Constants.CHAT === channel_id) {
                    respond(createEmbed(`<@${user.id}> commands are disabled in this channel.`, "RED"));
                    break;
                }

                const lookup: string = payload.d.data.options[0].value;
                try {
                    const player = await Players.getByDiscord(lookup);
                    if(!player){
                        respond(createEmbed(`<@${lookup}> is not a registered Equinox player.`, "RED"));
                        break;
                    }
                    const WLR = player.losses === 0 ? player.wins : Math.round((player.wins/player.losses + Number.EPSILON) * 100) / 100;
                    respond(createEmbed(`**${player.minecraft.name}**'s Stats`, "#228B22")
                        .addField("**Games**", `\`Wins:\` ${player.wins}\n\`Losses:\` ${player.losses}\n\`WLR:\` ${WLR}`)
                        .addField("**Combat**", `\`Kills:\` ${player.kills}\n\`Deaths:\` ${player.deaths}\n\`Beds Broken:\` ${player.bedsBroken}\n\`Beds Lost:\` ${player.bedsLost}`)
                    );
                } catch(e){
                    logger.error(`An error occurred while using the /info command:\nUser: ${lookup}\n${e.stack}`);
                    respond(createEmbed("Something went wrong while requesting a player's stats. Please try again later. If the issue persists, please contact a staff member.", "RED"));
                }
                break;
            }

            type LeaderboardStat = "kills" | "wins" | "bedsBroken" | "losses";

            case "leaderboard": {

                if(Constants.CHAT === channel_id) {
                    respond(createEmbed(`<@${user.id}> commands are disabled in this channel.`, "RED"));
                    break;
                }

                try {
                    let { name, options } = payload.d.data.options[0];
                    if(name === "beds") name = "bedsBroken";
                    let page = options ? options[0].value as number : 1;
                    const nPerPage = 10;
                    const total = await db.players.find({
                        [name]: {
                            $exists: true,
                        }
                    }).count();

                    if(total < 1){
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
                    if(page > pages) page = pages;

                    const players = await db.players
                        .find({
                            [name]: {
                                $exists: true
                            }
                        })
                        .sort({ [name]: -1 })
                        .skip(page > 0 ? ( ( page - 1 ) * nPerPage ) : 0)
                        .limit(nPerPage)
                        .toArray();
                    
                    respond(createEmbed(players.map((player, i) => `\n\`#${i + 1 + (nPerPage * (page - 1))}\` **${player.minecraft.name}** : ${player[name as LeaderboardStat] ?? 0}`).join(""), "#228B22")
                        .setTitle(`${prettyName} | Page ${page}/${pages}`)
                    );
                } catch(e){
                    logger.error(`An error occurred while using the /leaderboard command:\n${e.stack}`);
                    respond(createEmbed("Something went wrong while requesting the leaderboard. Please try again later. If the issue persists, please contact a staff member.", "RED"));
                }
            }
        }
    });

    client.on("message", async function(message){

        // Check if message is sent in a guild
        if(!message.guild) {
            return;
        }

        // Bot Restart
        else if(message.channel.id === Constants.BOT_RESTART_CHANNEL && message.content.startsWith('=restart') && message.content.split(' ').length > 1) {
            const bot = message.content.split(' ')[1];
            const _bot = bots.get(bot);
            if(!_bot) return message.reply(`${bot} is not a valid bot.`);
            _bot.emit("restart");
            BotManager.release(bot);
            return message.reply(`${bot} successfully restarted.`);
        }

        // =modify
        else if(Constants.ADMIN_COMMANDS_CHANNEL === message.channel.id && message.content.toLowerCase().startsWith('=modify')) {
            
            if(!message.member) return;

            const users = message.content.split(' ').slice(2, -1).map(id => client.users.cache.get(id)).filter(u => u);
            users.push(...message.mentions.users.array());

            const msg_arr = message.content.split(' ');

            if(msg_arr.length < 4) return message.reply(createEmbed(`Invalid Usage. Please use format \`=modify wins|losses|kills|deaths|bedsbroken|bedslost| @User/User_ID ±[number]\``, "RED"));

            const option = msg_arr[1].toLowerCase();
            if(![`wins`, `losses`, `kills`, `deaths`, `bedsbroken`, `bedslost`].includes(option))  return message.reply(createEmbed(`Invalid Usage. Please use format \`=modify wins|losses|kills|deaths|bedsbroken|bedslost| @User/User_ID ±[number]\``, "RED"));

            const num = parseInt(msg_arr[3]);
            if(Number.isNaN(num)) return message.reply(createEmbed(`Number of ${option} must be an Integer or Valid Number.`));

            if(users.length > 0) {
                let ids = users.map(user => user!.id);
                const players = (await Players.getManyByDiscord(ids));
                const players2 = players.map(player => player.discord);

                ids = ids.filter(id => players2.includes(id));

                switch(option) {
                    case "wins": {
                        await db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "wins": num } }, { upsert: true }) 
                        break;
                    };

                    case "losses": {
                        await db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "losses": num } }, { upsert: true }) 
                        break;
                    };

                    case "bedsbroken": {
                        await db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "bedsBroken": num } }, { upsert: true }) 
                        break;
                    };

                    case "bedslost": {
                        await db.players.updateMany({ "discord": { $in: ids } }, { $inc: { "bedsLost": num } }, { upsert: true }) 
                        break;
                    };
                }

                message.reply(createEmbed(`Users → ${ids.map(id => `<@${id}>`).join(' ')} ${option} modified successfully.`));
            }
            else message.reply(createEmbed('Invalid User/User_ID specified.'));
            return;
        }

        // Tournament creation
        else if(message.channel.id === Constants.TOURNAMENT_CREATION_CHANNEL) {

            if(message.content.startsWith('=create')) {

                const msg_arr = message.content.split(' ');
                if(msg_arr.length !== 3) return message.reply(createEmbed(`Invalid Usage. Please use format \`=create name [number of players]\` to create a new tournament.`, "RED"));

                const name = msg_arr[1];
                const number_of_players = parseInt(msg_arr[2]);

                if(Number.isNaN(number_of_players) || number_of_players > 4 || number_of_players <= 0) {
                    return message.reply(createEmbed("Number of players must be a positive Integer <= 4", "RED"));
                }

                const { value } = await db.tournaments.findOneAndUpdate(
                    {
                        "name": name
                    },
                    {
                        $setOnInsert: {
                            "_id": new ObjectId(),
                            "createdAt": Date.now(),
                            "name": name,
                            "teams": [],
                            "number_of_players": number_of_players,
                            "registration": '',
                            "manager": '',
                            "teamIndex": 1
                        }
                    },
                    {
                        upsert: true
                    }
                )

                
                if(value) return message.reply(createEmbed(`There is already an active tournament with the name ${name}. All names for active tournaments must be unique.`, "RED"));
                
                await message.reply(createEmbed(`Tournament → ${name} Created Successfully!`));
                
                const [ manager, register, registered ] = await Promise.all([
                    guild.channels.create(`${name} Manager`, {
                        type: "text",
                        parent: Constants.ADMIN_CONSOLE_CATEGORY,
                    }),
                    guild.channels.create(`${name} Registration`, {
                        type: "text",
                        parent: Constants.TOURNEY_REGISTRATION_CATEGORY,
                    }),
                    guild.channels.create(`${name} Confirmation`, {
                        type: "text",
                        parent: Constants.TOURNEY_CONFIRMATION_CHANNEL,
                    })
                ]);

                await db.tournaments.updateOne(
                    {
                        "name": name
                    },
                    {
                        $set: {
                            "manager": manager.id,
                            "registration": register.id,
                            "registered": registered.id
                        }
                    },
                    {
                        "upsert": true
                    }
                );
            }

            if(message.content.startsWith('=delete')) {
                const msg_arr = message.content.split(' ');
                if(msg_arr.length !== 2) return message.reply(createEmbed("Invalid Usage. Please use format \`=delete name\` to delete a tournament", "RED"));
                
                const name = msg_arr[1];

                const tourney = await db.tournaments.findOne(
                    {
                        "name": name
                    }
                )

                if(!tourney) return message.reply(createEmbed(`Tournament with name ${name} does not exist.`, "RED"));

                await db.tournaments.deleteOne(
                    {
                        "name": name
                    }
                )

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

        // Team registration channel

        const tournament = await db.tournaments.findOne({ "registration": message.channel.id });
        if(tournament !== null) {
            logger.info('I have reached registration.');
            if(!message.content.startsWith('=team')) return;
            const msg_arr = message.content.split(' ');
            let users = msg_arr.slice(1).map(u => client.users.cache.get(u)).filter(u => u).map(u => u!.id);
            if(message.mentions.users.array()) users.push(...message.mentions.users.array().map(men => men.id));
            users.push(message.author.id);
            users = [...new Set(users)];

            const players = await Players.getManyByDiscord(users);
            if(players.array().length !== users.length) {
                const unregistered = users.filter(user => !players.find(u => u.discord === user));
                return message.reply(createEmbed(`You cannot team with unregistered users. Please ask ${unregistered.map(un => `<@${un}>`).join(' ')} to register in ${guild.channels.cache.get(Constants.REGISTER_CHANNEL)?.toString()} using /register first.`));
            }

            if(users.length !== tournament.number_of_players) return message.reply(createEmbed(`Invalid Usage. Please use format \`=team @user1...@user${tournament.number_of_players - 1}\``, "RED"));

            const mess = await message.channel.send(users.map(u => `<@${u}>`).join(' '));
            await mess.edit(createEmbed(`Team → ${users.map(u => `<@${u}>`).join(' ')}`).setTitle('Team Registration').addField('Created By', `${message.author}`).setColor("YELLOW"))
            .then((msg) => {
                msg.react('✅')
                .then(() => {
                    msg.react('❌');
                })
            })
            
            const filter: CollectorFilter = (reaction) => {
                return reaction.emoji.name === '✅' || reaction.emoji.name === '❌';
            };

            const collector = mess.createReactionCollector(filter, { time: 24*60*60*1000 });

            collector.on('collect', async (r, user) => {

                const updatedTourney = await db.tournaments.findOne({ "registration": message.channel.id });

                if(!users.includes(user.id) && user.id !== client.user!.id) {
                    await r.users.remove(user.id);
                }

                if(r.count! > tournament.number_of_players && r.emoji.name === '✅') {
                    await r.message.reactions.removeAll();
                    const registered: string[] = [];
                    updatedTourney?.teams.forEach(team => registered.push(...team.teamMembers));
                    const overlap: string[] = [];
                    users.forEach(user => {
                        if(registered.includes(user)) overlap.push(`<@${user}>`);
                    });
                    if(overlap.length > 0) await r.message.edit(createEmbed(`The member(s) ${overlap.join(' ')} are already in teams. Please contact a staff member if you think this is a mistake.`, "RED"));
                    else {
                        await r.message.edit(createEmbed(`Team → ${users.map(u => `<@${u}>`).join(' ')}`).setTitle('Team Registration → Pending Staff Approval'));
                        await (guild.channels.cache.get(tournament.registered)! as TextChannel).send(createEmbed(`Team → ${users.map(u => `<@${u}>`).join(' ')}`).setTitle('Team Registration → Pending Staff Approval'));
                    }
                    collector.stop("reacted");
                }
                else if(r.count! > 1 && r.emoji.name === '❌') {
                    await r.message.edit(createEmbed(`Team → ${users.map(u => `<@${u}>`).join(' ')}`).setTitle('Team Registration → Unsuccessful').setColor("RED"));
                    await r.message.reactions.removeAll();
                    collector.stop("reacted");
                }
            });

            collector.on('end', async (_collection, reason) => {
                if(reason === "reacted") return;
                await mess.edit(createEmbed(`Team → ${users.map(u => `<@${u}>`).join(' ')}`).setTitle('Team Registration → Unsuccessful').setColor("RED"));
            })
            return;
        }

        // Tourney manager channel

        const tourn = await db.tournaments.findOne({ "manager": message.channel.id }) 
        if(tourn !== null) {
            logger.info('I have reached manager.');
            if(message.content.startsWith('=removeTeam')) {
                const msg_arr = message.content.split(' ');
                if(msg_arr.length !== 2) return message.reply(createEmbed("Invalid Usage. Please use format `=removeTeam [ID]`", "RED"));
                const id = parseInt(msg_arr[1]);
                if(Number.isNaN(id)) return message.reply(createEmbed("Team ID must be a number.", "RED"));
                const deleted = await db.tournaments.updateOne(
                    {
                        "manager": message.channel.id
                    },
                    {
                        $pull: {
                            "teams": { teamID: id }
                        }
                    }
                );

                if(!deleted) return message.reply(createEmbed(`Team with id: ${id} does not exist.`, "RED"));
                return message.reply(createEmbed(`Team with id: ${id} was deleted successfully!`)); 
            }
        }

        // Team registered channel

        const tourney = await db.tournaments.findOne({ "registered": message.channel.id });
        if(tourney !== null && message.author.id === client.user!.id && message.embeds.length === 1) {
            logger.info('I have reached registered.');
            message.react('✅')
                .then(() => {
                    message.react('❌');
                })

                const filter: CollectorFilter = (reaction) => {
                return reaction.emoji.name === '✅' || reaction.emoji.name === '❌';
            };

            const collector = message.createReactionCollector(filter, { time: 0 });

            collector.on('collect', async r => {

                if(r.count! > 1 && r.emoji.name === '✅') {

                    const updatedTourney = await db.tournaments.findOne({ "registered": message.channel.id });
                    if(!updatedTourney) return;

                    const team: TournamentTeam = {
                        "teamID": updatedTourney.teamIndex,
                        "teamMembers": message.embeds[0].description?.slice(2).split(' ').map(split => split.slice(2, -1)).filter(str => str.length > 0)!
                    } 

                    await message.edit(message.embeds[0].setTitle('Team Registration → Successful').setColor("GREEN"));
                    await r.message.reactions.removeAll();
                    await db.tournaments.updateOne(
                        {
                            "registered": message.channel.id
                        },
                        {
                            $push: {
                                "teams": team
                            },
                            $inc: {
                                "teamIndex": 1
                            } 
                        },
                        {
                            upsert: true    
                        }
                    )   

                    collector.stop();
                }
                else if(r.count! > 1 && r.emoji.name === '❌') {
                    await message.edit(message.embeds[0].setTitle('Team Registration → Denied').setColor("RED"));
                    await r.message.reactions.removeAll();
                    collector.stop();
                }
            });
            return;
        }
    });

    // role storage
    client.on('guildMemberAdd', async member => {
        const player = (await Players.getByDiscord(member.id));

        if(player) {
            await member.roles.set(player.roles);
        }
    });

    // role storage
    client.on('guildMemberRemove', async member => {
        const player = (await Players.getByDiscord(member.id));

        if(player) {
            player.update({ roles: member.roles.cache.map(({ id }) => id) });
        }
    });

    logger.info("App is now online!");
}();
