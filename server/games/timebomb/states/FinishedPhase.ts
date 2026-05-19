import { ITimeBombPhase } from './ITimeBombPhase';

export class FinishedPhase implements ITimeBombPhase {
  handleAction(playerId: string, actionType: string, payload: any) {}
}
