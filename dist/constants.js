"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Constants = void 0;
const logger_1 = __importDefault(require("./logger"));
const logger = new logger_1.default("Constants");
const { GUILD } = process.env;
if (!GUILD) {
    logger.error("Required environment variable GUILD is not defined.");
    process.exit(1);
}
var Constants;
(function (Constants) {
    Constants.DISCORD_API_BASE_URL = "https://discord.com/api/v8";
    Constants.BRANDING_URL = "https://cdn.discordapp.com/attachments/804621139866812427/805923193079857203/Dreams-Tourney.gif";
    Constants.GAME_REPORT_CHANNEL = '805892092147662869';
    Constants.WAITING_ROOM = '805256521667444736';
    Constants.MEMBER_ROLE = '735819463663943690';
    Constants.REGISTER_CHANNEL = '805891495193739284';
    Constants.ADMIN_COMMANDS_CHANNEL = '804641716744749057';
    Constants.BOT_RESTART_CHANNEL = '805891721158197258';
    Constants.CHAT = '804654582189260820';
    Constants.TOURNAMENT_CREATION_CHANNEL = '805903627721244683';
    Constants.ADMIN_CONSOLE_CATEGORY = '805903556750213130';
    Constants.TOURNEY_REGISTRATION_CATEGORY = '805914056376320020';
    Constants.TOURNEY_CONFIRMATION_CHANNEL = '806257368010457138';
    Constants.TEAM_CALL_CATEGORY = '806981198840725574';
    Constants.FCLOSE_ROLES = ["804660071698268170", "736937231519842365", "805837339493924924", "804638676655145020"];
    Constants.GAMES_CATEGORY = '807009047680909312';
})(Constants = exports.Constants || (exports.Constants = {}));
