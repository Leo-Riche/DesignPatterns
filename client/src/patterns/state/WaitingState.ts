import type { IGameState } from './IGameState';

export class WaitingState implements IGameState {
  readonly name = 'waiting';

  enter(context: any) {
    context.phase = 'waiting';
    context.dice = null;
  }

  handle(context: any, event: string, payload?: any) {
    if (event === 'start') {
      context.nextState = 'rolling';
    }
  }
}
