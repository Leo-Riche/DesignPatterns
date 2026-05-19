import { ITimeBombPhase, ITimeBombContext } from './ITimeBombPhase';
import { PlayingPhase } from './PlayingPhase';

export class AnnouncementPhase implements ITimeBombPhase {
  constructor(private game: ITimeBombContext) {}

  handleAction(playerId: string, actionType: string, payload: any) {
    if (actionType === 'announce') {
      const { defuses, hasBomb } = payload;
      const player = this.game.state.players.find((p: any) => p.id === playerId);
      if (!player) return;

      this.game.state.announcements[player.name] = { defuses, hasBomb };
      
      const allAnnounced = Object.keys(this.game.state.announcements).length === this.game.state.players.length;
      
      if (allAnnounced) {
        for (const [name, annVal] of Object.entries(this.game.state.announcements)) {
          const ann = annVal as any;
          const bombText = ann.hasBomb ? " et prétend avoir la BOMBE 💥" : "";
          this.game.log(`📣 ${name} annonce : ${ann.defuses} câble(s) de désamorçage${bombText}.`);
        }
        this.game.setPhase(new PlayingPhase(this.game));
      }
      this.game.broadcastState();
    }
  }
}
