import type { IGameState } from './IGameState';

export class FinishedState implements IGameState {
  readonly name = 'finished';

  enter(context: any) {
    context.phase = 'finished';
  }

  handle(context: any, event: string, payload?: any) {
    if (event === 'restart') {
      context.nextState = 'waiting';
    }
  }
}
