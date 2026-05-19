import { Server } from 'socket.io';
import { ITimeBombObserver } from './ITimeBombObserver';

export class TimeBombNetworkObserver implements ITimeBombObserver {
  constructor(private io: Server, private roomCode: string) {}

  onActionLog(message: string): void {
    this.io.to(this.roomCode).emit('action_log', message);
  }

  onPlayerStateUpdate(playerId: string, data: any): void {
    this.io.to(playerId).emit('update_board_state', data);
  }

  onGameStarted(): void {
    this.io.to(this.roomCode).emit('game_started');
  }

  onGameOver(data: { winner: string; reason: string; players: any[] }): void {
    this.io.to(this.roomCode).emit('game_over', data);
  }
}
