import type { Collection } from "mongodb";
import type { Bot } from "./bot";
import type { Game } from "./games";
import type { Player } from "./players";
import type { Tournament } from "./tournaments";

export interface Database {
    bots: Collection<Bot>;
    games: Collection<Game>;
    players: Collection<Player>;
    tournaments: Collection<Tournament>;
}