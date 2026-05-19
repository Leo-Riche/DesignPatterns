import { ITimeBombPhase, ITimeBombContext } from './ITimeBombPhase';

export class PlayingPhase implements ITimeBombPhase {
  constructor(private game: ITimeBombContext) {}

  handleAction(playerId: string, actionType: string, payload: any) {
    if (actionType === 'cut') {
      const { targetId, cardIndex } = payload;
      
      if (this.game.state.status !== 'playing') return;
      if (this.game.state.isRedistributing) return;
  
      const currentShooter = this.game.state.players.find((p: any) => p.hasScissors);
      if (!currentShooter || currentShooter.id !== playerId) return;
  
      if (targetId === this.game.state.lastShooterId) return;
  
      const targetPlayer = this.game.state.players.find((p: any) => p.id === targetId);
      const card = targetPlayer.hand[cardIndex];
  
      if (card.isRevealed) return;
  
      // 1. On révèle la carte
      card.isRevealed = true;
      this.game.state.turnCuts++;
  
      // 2. On mémorise l'ID du tireur AVANT de transférer les ciseaux
      this.game.state.lastShooterId = currentShooter.id;
  
      // 3. Transfert des ciseaux
      this.game.state.players.forEach((p: any) => p.hasScissors = false);
      targetPlayer.hasScissors = true;
  
      this.game.log(`${currentShooter.name} a coupé chez ${targetPlayer.name} !`);
  
      // 4. Vérification des conditions de victoire
      if (card.type === 'bomb') {
        this.game.endGame('Moriarty', '💥 BOUM ! La bombe a explosé.');
        return;
      } else if (card.type === 'defuse') {
        this.game.state.defusesFound++;
        if (this.game.state.defusesFound === this.game.state.totalDefuses) {
          this.game.endGame('Sherlock', '✅ Tous les câbles ont été désamorcés !');
          return;
        }
      }
  
      // 5. Vérification de fin de manche
      if (this.game.state.turnCuts === this.game.state.players.length) {
        this.game.state.isRedistributing = true;
        this.game.log(`Fin de la manche ${this.game.state.round}. Redistribution...`);
        setTimeout(() => this.game.startNextRound(), 2500);
      } 
  
      this.game.broadcastState();
    }
  }
}
