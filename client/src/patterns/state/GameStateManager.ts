import type { IGameState } from './IGameState';
import { WaitingState } from './WaitingState';
import { RollingState } from './RollingState';
import { DecidingState } from './DecidingState';
import { FinishedState } from './FinishedState';

export class GameStateManager {
  private states: Record<string, IGameState>;
  private current: IGameState;
  private context: any;

  constructor(context: any = {}) {
    this.context = context;
    this.context.stateManager = this;

    this.states = {
      waiting: new WaitingState(),
      rolling: new RollingState(),
      deciding: new DecidingState(),
      finished: new FinishedState()
    };

    this.current = this.states.waiting;
    this.current.enter(this.context);
  }

  getCurrentState(): string {
    return this.current.name;
  }


  dispatch(event: string, payload?: any) {
    this.current.handle(this.context, event, payload);
    this.performTransitionIfNeeded();
  }


  requestTransition(stateName: string) {
    if (!this.states[stateName]) return;
    this.transitionTo(stateName);
  }

  private performTransitionIfNeeded() {
    const next = this.context.nextState;
    if (next && next !== this.current.name) {
      this.transitionTo(next);
      this.context.nextState = null;
    }
  }

  private transitionTo(stateName: string) {
    const newState = this.states[stateName];
    if (!newState) return;

    if (this.current.exit) this.current.exit(this.context);
    const prev = this.current.name;

    this.current = newState;
    this.current.enter(this.context);

  
    if (this.context.eventBus && typeof this.context.eventBus.emit === 'function') {
      this.context.eventBus.emit('state:changed', { from: prev, to: stateName });
    }
  }
}

export default GameStateManager;
