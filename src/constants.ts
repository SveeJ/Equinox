import Logger from "./logger";

const logger = new Logger("Constants");

const { GUILD } = process.env;
if(!GUILD){
    logger.error("Required environment variable GUILD is not defined.");
    process.exit(1);
}

export namespace Constants {

    // api base url for discord
    export const DISCORD_API_BASE_URL = "https://discord.com/api/v8";

    // bot logo image url
    export const BRANDING_URL = "";

    // game logs channel
    export const GAME_REPORT_CHANNEL: string = '';

    // waiting room vc
    export const WAITING_ROOM: string = '';

    // member role with all perms
    export const MEMBER_ROLE: string = '';

    // channel to do /register in
    export const REGISTER_CHANNEL: string = '';

    // admin commands channel
    export const ADMIN_COMMANDS_CHANNEL: string = '';

    // channel where bots can be restarted
    export const BOT_RESTART_CHANNEL = '';

    // chat channel where commands are disabled
    export const CHAT = '';
}