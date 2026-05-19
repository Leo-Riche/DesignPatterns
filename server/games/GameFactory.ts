import { Server } from 'socket.io';
import { IGame, PlayerData, GameOptions, GameConstructor } from './IGame';

const TimeBomb: GameConstructor = require('./timebomb');
const LoupGarou: GameConstructor = require('./loupgarou');
const Qwixx: GameConstructor = require('./qwixx');

export type GameType = 'timebomb' | 'loupgarou' | 'qwixx';

export class GameFactory {
  private static readonly registry: Record<GameType, GameConstructor> = {
    timebomb: TimeBomb,
    loupgarou: LoupGarou,
    qwixx: Qwixx,
  };

  static create(
    type: GameType,
    roomCode: string,
    players: PlayerData[],
    io: Server,
    options?: GameOptions
  ): IGame {
    const GameClass = GameFactory.registry[type];

    if (!GameClass) {
      throw new Error(`Type de jeu inconnu : "${type}"`);
    }

    if (type === 'loupgarou') {
      return new GameClass(roomCode, players, io, options?.roleComposition ?? null);
    }

    return new GameClass(roomCode, players, io);
  }

  static isValidType(type: string): type is GameType {
    return type in GameFactory.registry;
  }
}
