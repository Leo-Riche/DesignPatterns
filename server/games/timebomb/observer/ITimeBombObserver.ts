export interface ITimeBombObserver {
  onActionLog(message: string): void;
  onPlayerStateUpdate(playerId: string, data: any): void;
  onGameStarted(): void;
  onGameOver(data: { winner: string; reason: string; players: any[] }): void;
}
