import type { IGameState } from './IGameState';

export class RollingState implements IGameState {
  readonly name = 'rolling';

  enter(context: any) {
    context.phase = 'rolling';
    context.dice = null;
  }

  handle(context: any, event: string, payload?: any) {
    if (event === 'rolled') {
      context.dice = payload; 
      context.nextState = 'deciding';
    }
  }
}
