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
    export const BRANDING_URL = "https://cdn.discordapp.com/attachments/804621139866812427/805923193079857203/Dreams-Tourney.gif";

    // game logs channel
    export const GAME_REPORT_CHANNEL: string = '805892092147662869';

    // waiting room vc
    export const WAITING_ROOM: string = '805256521667444736';

    // member role with all perms
    export const MEMBER_ROLE: string = '735819463663943690';

    // channel to do /register in
    export const REGISTER_CHANNEL: string = '805891495193739284';

    // admin commands channel
    export const ADMIN_COMMANDS_CHANNEL: string = '804641716744749057';

    // channel where bots can be restarted
    export const BOT_RESTART_CHANNEL = '805891721158197258';

    // chat channel where commands are disabled
    export const CHAT = '804654582189260820';

    // Tournament Creation
    export const TOURNAMENT_CREATION_CHANNEL = '805903627721244683';

    // Admin Console
    export const ADMIN_CONSOLE_CATEGORY = '805903556750213130';

    // Tournament Registration
    export const TOURNEY_REGISTRATION_CATEGORY = '805914056376320020';

    // Tournament Confirmation
    export const TOURNEY_CONFIRMATION_CHANNEL = '806257368010457138';
}