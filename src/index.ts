import dotenv from "dotenv";
dotenv.config();

import Logger from "./logger";

const logger = new Logger("Main");

import { ColorResolvable, MessageEmbed } from "discord.js";
import https from "https";
import fetch from "node-fetch";
import bot, { defaultGuild } from "./managers/bot";
import database from "./managers/database";
import { getHypixelPlayer } from "./managers/hypixel";
import type { InteractionPayload } from "./typings/commands";
import { Constants } from "./constants";
import { BotManager, Players } from "./utils";
import { bots } from "./managers/socket";

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
                        guild.members.cache.get(user.id)?.setNickname(`${d.name}`).catch(e => logger.error(`Failed to update a new member's nickname:\n${e.stack}`));
                        respond(createEmbed(`You have successfully registered with the username **${d.name}**. Welcome to Equinox!`, "#228B22"));
                        const member = guild.members.cache.get(user.id);
                        
                        await member!.roles.add(Constants.MEMBER_ROLE).catch(() => null);
                        
                        break;
                    }
                    const member = guild.members.cache.get(user.id);
                    member?.setNickname(`${d.name}`).catch(e => logger.error(`Failed to update an existing member's nickname on re-registration:\n${e.stack}`));
                    respond(createEmbed(`You have successfully changed your linked Minecraft account to **${d.name}**.`, "#228B22"))

                } catch(e){
                    logger.error(`An error occurred while using the /register command:\nDeclared username: ${player}\n${e.stack}`);
                    respond(createEmbed('Something went wrong while registering your account. Please try again later. If the issue persists, please contact a staff member.', "RED"));
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
                        respond(createEmbed(`<@${lookup}> is not a registered Ranked Bedwars player.`, "RED"));
                        break;
                    }
                    const WLR = player.losses === 0 ? player.wins : Math.round((player.wins/player.losses + Number.EPSILON) * 100) / 100;
                    respond(createEmbed(`**${player.minecraft.name}**'s Stats`, "#228B22")
                        .addField("**Stats**", `\`Elo:\` ${player.elo}\n\`Strikes:\` ${player.strikes}`)
                        .addField("**Games**", `\`Wins:\` ${player.wins}\n\`Losses:\` ${player.losses}\n\`WLR:\` ${WLR}\n\`Winstreak:\` ${player.winstreak}\n\`Bedstreak:\` ${player.bedstreak}`)
                        .addField("**Combat**", `\`Kills:\` ${player.kills}\n\`Deaths:\` ${player.deaths}\n\`Beds Broken:\` ${player.bedsBroken}\n\`Beds Lost:\` ${player.bedsLost}`)
                    );
                } catch(e){
                    logger.error(`An error occurred while using the /info command:\nUser: ${lookup}\n${e.stack}`);
                    respond(createEmbed("Something went wrong while requesting a player's stats. Please try again later. If the issue persists, please contact a staff member.", "RED"));
                }
                break;
            }
        }
    });

    client.on("message", async function(message){

        if(!message.guild) {
            return;
        }

        if(message.channel.id === Constants.BOT_RESTART_CHANNEL && message.content.startsWith('=restart') && message.content.split(' ').length > 1) {
            const bot = message.content.split(' ')[1];
            const _bot = bots.get(bot);
            if(!_bot) return message.reply(`${bot} is not a valid bot.`);
            _bot.emit("restart");
            BotManager.release(bot);
            return message.reply(`${bot} successfully restarted.`);
        }

        
    });

    client.on('guildMemberAdd', async member => {
        const player = (await Players.getByDiscord(member.id));

        if(player) {
            await member.roles.set(player.roles);
        }
    });

    client.on('guildMemberRemove', async member => {
        const player = (await Players.getByDiscord(member.id));

        if(player) {
            player.update({ roles: member.roles.cache.map(({ id }) => id) });
        }
    });

    logger.info("App is now online!");
}();
