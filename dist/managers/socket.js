"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketManagerLogger = exports.devLogger = exports.bots = void 0;
const challonge_ts_1 = require("challonge-ts");
const discord_js_1 = require("discord.js");
const http_1 = require("http");
const mongodb_1 = require("mongodb");
const socket_io_1 = require("socket.io");
const logger_1 = __importDefault(require("../logger"));
const games_1 = require("../typings/games");
const utils_1 = require("../utils");
const bot_1 = require("./bot");
const database_1 = __importDefault(require("./database"));
exports.bots = new discord_js_1.Collection();
const logger = new logger_1.default("Socket Manager");
exports.socketManagerLogger = logger;
exports.devLogger = new logger_1.default("Socket Manager (Dev)");
const { SOCKET_KEY, NODE_ENV, API_KEY } = process.env;
if (!SOCKET_KEY) {
    logger.error("Required environment variable SOCKET_KEY is not defined.");
    process.exit(1);
}
if (NODE_ENV === "development")
    exports.devLogger.warn("Additional logging enabled because the app is running in development mode. Remember to set NODE_ENV to production on release.");
const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const server = http_1.createServer();
const io = new socket_io_1.Server(server);
io.use((socket, next) => {
    const { key, bot } = socket.handshake.query;
    if (!key) {
        if (NODE_ENV === "development")
            exports.devLogger.warn("Refusing connection from unauthenticated socket.");
        return next(new Error("Authentication failed."));
    }
    if (SOCKET_KEY !== key) {
        if (NODE_ENV === "development")
            exports.devLogger.warn("Refusing connection from socket using an invalid key.");
        return next(new Error("Authentication failed."));
    }
    if (exports.bots.get(bot) && NODE_ENV === "development")
        exports.devLogger.info(`${bot} has connected, but is already in the socket cache.`);
    exports.bots.set(bot, socket);
    if (NODE_ENV === "development")
        exports.devLogger.info(`${bot} has connected successfully.`);
    socket.on("reconnect", () => {
        if (NODE_ENV === "development")
            exports.devLogger.info(`${bot} has reconnected.`);
        exports.bots.set(bot, socket);
    });
    socket.on("disconnect", () => {
        if (NODE_ENV === "development")
            exports.devLogger.info(`${bot} has disconnected.`);
        exports.bots.delete(bot);
    });
    socket.on("gameFinish", async (players) => {
        if (process.env.NODE_ENV === "development")
            exports.devLogger.info(`Received payload: ${JSON.stringify(players)}`);
        const _game = await utils_1.BotManager.getAssignedGame(bot);
        logger.info('reached1');
        if (!_game)
            return logger.warn(`Received gameFinish event from bot ${bot} that is not currently bound to a game. Ignoring invocation.`);
        const game = utils_1.activeGames.get(_game);
        if (!game)
            return logger.warn(`Received gameFinish event from bot ${bot} that is not currently bound to game ${_game} that does not exist. Ignoring invocation.`);
        if (game.state !== games_1.GameState.ACTIVE && game.state !== games_1.GameState.SCORING)
            return logger.warn(`Received gameFinish event from bot ${bot} that is not currently bound to game ${game.id} which is not currently open to scoring modifications. Ignoring invocation.`);
        logger.info('reached2');
        try {
            const result = (players[0].wins ?? 0) - game.teamPlayers[0][0].wins;
            const bedBreakers = players.filter(p => p.bedstreak !== 0).map(player => player.discord);
            let indexes = [];
            bedBreakers.forEach(bb => {
                indexes.push(players.map(p => p.discord).indexOf(bb));
            });
            const db = await database_1.default;
            const _players = db.players.initializeUnorderedBulkOp();
            game.teams[result === 1 ? 0 : 1].winner = true;
            let team1scores = '';
            let team2scores = '';
            let users = '';
            logger.info('reached3');
            players.forEach((player, _i) => {
                player.games = (player.games ?? 0) + 1;
                player._id = new mongodb_1.ObjectId(player._id);
                const { i, teamId } = _i < (players.length / 2) ? { i: _i, teamId: 0 } : { i: _i - (players.length / 2), teamId: 1 };
                const p = game.teams[teamId].players[i];
                users += `<@${player.discord}>`;
                p.kills = (players[i].kills ?? 1) - game.teamPlayers[teamId][i].kills;
                p.deaths = (players[i].deaths ?? 0) - game.teamPlayers[teamId][i].deaths;
                p.destroyedBed = players[i].bedsBroken !== game.teamPlayers[teamId][i].bedsBroken;
                _players.find({ "minecraft.name": player.minecraft.name }).replaceOne(player);
            });
            logger.info('reached4');
            let scores = '';
            let player1 = -1;
            let player2 = -1;
            await challonge_ts_1.MatchAdapter.show(API_KEY, game.URL, game.chID).then((response) => {
                const match = response;
                scores = match.match.scores_csv;
                player1 = match.match.player1_id;
                player2 = match.match.player2_id;
            });
            let finalScores = scores === '' ? [0, 0] : scores.split('-').map(score => parseInt(score));
            finalScores[result === 1 ? 0 : 1] += 1;
            if (finalScores.includes(2)) {
                const win_id = finalScores[0] === 2 ? player1 : player2;
                await challonge_ts_1.MatchAdapter.update(API_KEY, game.URL, game.chID, {
                    "match": {
                        "scores_csv": `${finalScores[0]}-${finalScores[1]}`,
                        "winner_id": win_id
                    }
                });
            }
            else {
                await challonge_ts_1.MatchAdapter.update(API_KEY, game.URL, game.chID, {
                    "match": {
                        "scores_csv": `${finalScores[0]}-${finalScores[1]}`
                    }
                });
            }
            const matches = (await db.tournaments.findOne({ "name": game.URL.slice(8) }))?.matches;
            const match = matches?.find(match => match.id === game.chID);
            if (match)
                match.result = [...finalScores];
            await Promise.all([
                utils_1.gameReport(team1scores, team2scores, game.gameNumber, (result === 1 ? 'Team 1' : 'Team 2'), users),
                _players.execute(),
                db.tournaments.updateOne({ "name": game.URL.slice(8) }, { $pull: { "matches": { "id": game.chID } }, $push: { "matches": match } }, { upsert: true }),
                game.end(),
            ]);
            logger.info(`Successfully finished game ${game.id} (managed by ${bot}).`);
        }
        catch (e) {
            logger.error(`Failed to process gameFinish event for ${game.id}:\n${e.stack}`);
        }
    });
    socket.on("alertStaff", async (nickIGN, gamePlayers) => {
        try {
            (await bot_1.defaultGuild).channels.cache.get('801294842914930698').send(`**Nick Exploit Detected:** Nick --> ${nickIGN} Players --> ${gamePlayers}`);
        }
        catch {
            logger.info(`Failed to send player info. Nick --> ${nickIGN} Players --> ${gamePlayers}`);
        }
    });
    socket.on("ActualGameStart", async (uuids) => {
        const new_players = (await utils_1.Players.getManyByMinecraft(uuids)).array();
        if (process.env.NODE_ENV === "development")
            exports.devLogger.info(`Received gameStart: ${JSON.stringify(new_players)}`);
        const _game = await utils_1.BotManager.getAssignedGame(bot);
        if (!_game)
            return logger.warn(`Received ActualGameStart event from bot ${bot} that is not currently bound to a game. Ignoring invocation.`);
        const game = utils_1.activeGames.get(_game);
        if (!game)
            return logger.warn(`Received ActualGameStart event from bot ${bot} that is not currently bound to game ${_game} that does not exist. Ignoring invocation.`);
        game.start(new_players.slice(0, new_players.length / 2), new_players.slice(new_players.length / 2));
        exports.bots.get(bot)?.emit("actualgamestart", new_players);
    });
    next();
});
server.listen(port, () => {
    logger.info(`Now listening on port ${port}.`);
});
exports.default = io;
