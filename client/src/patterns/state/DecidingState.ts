import type { IGameState } from './IGameState';

export class DecidingState implements IGameState {
  readonly name = 'deciding';

  enter(context: any) {
    context.phase = 'deciding';
  }

  handle(context: any, event: string, payload?: any) {
    if (event === 'resolved') {
      const lockedCount = Object.values(context.lockedColors || {}).filter(Boolean).length;
      const maxPenalty = (context.players || []).reduce((m: number, p: any) => Math.max(m, p.scoreSheet?.penalties || 0), 0);

      if (lockedCount >= 2 || maxPenalty >= 4) {
        context.nextState = 'finished';
      } else {
        context.nextState = 'rolling';
      }
    }
  }
}
