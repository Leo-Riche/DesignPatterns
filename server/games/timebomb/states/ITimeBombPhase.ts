export interface ITimeBombPhase {
  handleAction(playerId: string, actionType: string, payload: any): void;
}

export interface ITimeBombContext {
  roomCode: string;
  io: any;
  state: any;
  setPhase(phase: ITimeBombPhase): void;
  broadcastState(): void;
  startNextRound(): void;
  endGame(winner: string, reason: string): void;
}
