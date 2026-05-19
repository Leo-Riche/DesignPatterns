export interface ITimeBombPhase {
  handleAction(playerId: string, actionType: string, payload: any): void;
}

export interface ITimeBombContext {
  state: any;
  setPhase(phase: ITimeBombPhase): void;
  broadcastState(): void;
  startNextRound(): void;
  endGame(winner: string, reason: string): void;
  /** Envoie un message de log à tous les observateurs */
  log(message: string): void;
}
