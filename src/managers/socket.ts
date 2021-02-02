import { Collection, TextChannel } from "discord.js";
import { createServer } from "http";
import { ObjectId } from "mongodb";
import { Server, Socket } from "socket.io";
import Logger from "../logger";
import { GameState } from "../typings/games";
import type { Player } from "../typings/players";
import type { SocketAPI } from "../typings/socket";
import { activeGames, BotManager, gameReport, Players } from "../utils";
import { defaultGuild } from "./bot";
import database from "./database";

export const bots = new Collection<string, Socket>();

const logger = new Logger("Socket Manager");
export const devLogger = new Logger("Socket Manager (Dev)");

export { logger as socketManagerLogger };

const { SOCKET_KEY, NODE_ENV } = process.env;

if(!SOCKET_KEY){
    logger.error("Required environment variable SOCKET_KEY is not defined.");
    process.exit(1);
}

if(NODE_ENV === "development") devLogger.warn("Additional logging enabled because the app is running in development mode. Remember to set NODE_ENV to production on release.");

const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;

const server = createServer();

const io = new Server(server);

io.use((socket, next) => {
    const { key, bot } = socket.handshake.query as SocketAPI.Query;
    if(!key){
        if(NODE_ENV === "development") devLogger.warn("Refusing connection from unauthenticated socket.");
        return next(new Error("Authentication failed."));
    }

    if(SOCKET_KEY !== key){
        if(NODE_ENV === "development") devLogger.warn("Refusing connection from socket using an invalid key.");
        return next(new Error("Authentication failed."));
    }

    if(bots.get(bot) && NODE_ENV === "development") devLogger.info(`${bot} has connected, but is already in the socket cache.`);

    bots.set(bot, socket);

    if(NODE_ENV === "development") devLogger.info(`${bot} has connected successfully.`);

    socket.on("reconnect", () => {
        if(NODE_ENV === "development") devLogger.info(`${bot} has reconnected.`);
        bots.set(bot, socket);
    });

    socket.on("disconnect", () => {
        if(NODE_ENV === "development") devLogger.info(`${bot} has disconnected.`);
        bots.delete(bot);
    });

    socket.on("gameFinish", async (players: Player[]) => {
        // Continue handling the event
        if(process.env.NODE_ENV === "development") devLogger.info(`Received payload: ${JSON.stringify(players)}`);
        const _game = await BotManager.getAssignedGame(bot);
        if(!_game) return logger.warn(`Received gameFinish event from bot ${bot} that is not currently bound to a game. Ignoring invocation.`);
        const game = activeGames.get(_game);
        if(!game) return logger.warn(`Received gameFinish event from bot ${bot} that is not currently bound to game ${_game} that does not exist. Ignoring invocation.`);
        if(game.state !== GameState.ACTIVE && game.state !== GameState.SCORING) 
        return logger.warn(`Received gameFinish event from bot ${bot} that is not currently bound to game ${game.id} which is not currently open to scoring modifications. Ignoring invocation.`);
        
        try {
            const result = (players[0].wins ?? 0) - game.teamPlayers[0]![0].wins;
            const comparisonPoint = result === 1 ? 0:players.length/2;
            const bedBreakers = players.filter(p => p.bedstreak !== 0).map(player => player.discord);
            let indexes: number[] = [];
            bedBreakers.forEach(bb => {
                indexes.push(players.map(p => p.discord).indexOf(bb));
            })

            const db = await database;
            const _players = db.players.initializeUnorderedBulkOp();

            game.teams[result === 1 ? 0 : 1]!.winner = true;
            let team1scores = '';
            let team2scores = '';
            let users = '';

            players.forEach((player, _i) => {
                player.games = (player.games ?? 0) + 1;
                player._id = new ObjectId(player._id);
                const { i, teamId } = _i < (players.length / 2) ? { i: _i, teamId: 0 } : { i: _i - (players.length / 2), teamId: 1 };
                const p = game.teams[teamId]!.players[i];
                users += `<@${player.discord}>`;
                p.kills = (players[i].kills ?? 1) - game.teamPlayers[teamId]![i].kills;
                p.deaths = (players[i].deaths ?? 0) - game.teamPlayers[teamId]![i].deaths;
                p.destroyedBed = players[i].bedsBroken !== game.teamPlayers[teamId]![i].bedsBroken;

                _players.find({ "minecraft.name": player.minecraft.name }).replaceOne(player);
            });
            await Promise.all([
                gameReport(team1scores, team2scores, game.gameNumber, (result === 1? 'Team 1':'Team 2'), users),
                _players.execute(),
                game.end(),
            ]);
            logger.info(`Successfully finished game ${game.id} (managed by ${bot}).`);
        } catch(e){
            logger.error(`Failed to process gameFinish event for ${game.id}:\n${e.stack}`);
        } 
    });
    

    socket.on("alertStaff", async (nickIGN, gamePlayers) => {
        try {
            ((await defaultGuild).channels.cache.get('801294842914930698') as TextChannel).send(`**Nick Exploit Detected:** Nick --> ${nickIGN} Players --> ${gamePlayers}`);
        }
        catch {
            logger.info(`Failed to send player info. Nick --> ${nickIGN} Players --> ${gamePlayers}`);
        }
    })

    socket.on("ActualGameStart", async (uuids: string[]) => {
        const new_players = (await Players.getManyByMinecraft(uuids)).array();
        if(process.env.NODE_ENV === "development") devLogger.info(`Received gameStart: ${JSON.stringify(new_players)}`);
        const _game = await BotManager.getAssignedGame(bot);
        if(!_game) return logger.warn(`Received ActualGameStart event from bot ${bot} that is not currently bound to a game. Ignoring invocation.`);
        const game = activeGames.get(_game);
        if(!game) return logger.warn(`Received ActualGameStart event from bot ${bot} that is not currently bound to game ${_game} that does not exist. Ignoring invocation.`);

        game.start(new_players.slice(0, new_players.length/2), new_players.slice(new_players.length/2));
        bots.get(bot)?.emit("actualgamestart", new_players);
    })

    next();
});

server.listen(port, () => {
    logger.info(`Now listening on port ${port}.`);
});

export default io;