import type { ObjectId } from "mongodb";

export interface Tournament {
    /** Tournament ID in the database. */
    _id: ObjectId;
    /** Tournament Name. */
    name: string;
    /** Time the tournament was created. */
    createdAt: number;
    /** Teams in this tournament */
    teams: TournamentTeam[];
    /** Tournament Manager Channel */
    manager: string;
    /** Tournament Registration Channel */
    registration: string;
    /** Tournament Registered Teams Channel */
    registered: string;
    /** Team Index */
    teamIndex: number;
    /** Number of Players in a tournament */
    number_of_players: number;
    /** Tournament State */
    state: string;
    /** Matches */
    matches: TournamentMatch[];
    /** Game Channels */
    gameChannels: string[];
}

export interface TournamentTeam {
    /** Team Name */
    teamName: string;
    /** Team Members */
    teamMembers: string[];
    /** Team ID */
    teamID: number;
    /** Challonge ID */
    challongeID: number;
}

export interface TournamentMatch {
    /** Teams */
    teams: string[];
    /** State */
    matchState: string;
    /** Result */
    result: number[];
    /** ID */
    id: number;
}