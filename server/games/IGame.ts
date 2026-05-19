import { Server } from 'socket.io';

export interface PlayerData {
  id: string;
  name: string;
}

export interface GameOptions {
  roleComposition?: unknown;
}

export interface IGame {
  state: {
    status: 'playing' | 'finished' | 'starting';
    [key: string]: unknown;
  };
  start(): void;
  handleAction(playerId: string, actionType: string, payload?: unknown): void;
  broadcastState(): void;
  reconnectPlayer(newSocketId: string, playerName: string): boolean;
}

export type GameConstructor = new (
  roomCode: string,
  players: PlayerData[],
  io: Server,
  options?: unknown
) => IGame;
