export interface IGameState {
  readonly name: string;
  enter(context: any): void;
  exit?(context: any): void;
  handle(context: any, event: string, payload?: any): void;
}
