import { ITimeBombPhase, ITimeBombContext } from './states/ITimeBombPhase';
import { AnnouncementPhase } from './states/AnnouncementPhase';
import { FinishedPhase } from './states/FinishedPhase';

const availableSherlockCards = ['Sherlock1', 'Sherlock2', 'Sherlock3', 'Sherlock4', 'Sherlock5', 'Sherlock1', 'Sherlock2'];
const availableMoriartyCards = ['Moriarty1', 'Moriarty2', 'Moriarty3', 'Moriarty1'];

export const shuffle = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export class TimeBomb implements ITimeBombContext {
  roomCode: string;
  players: any[];
  io: any;
  state: any;
  private currentPhase!: ITimeBombPhase;

  constructor(roomCode: string, playersData: any[], io: any) {
    this.roomCode = roomCode;
    this.io = io;
    this.players = playersData; 
    
    this.state = {
      round: 1,
      turnCuts: 0,
      defusesFound: 0,
      totalDefuses: playersData.length,
      status: 'playing',
      isRedistributing: false,
      lastShooterId: null,
      announcements: {},
      players: []
    };
  }

  start() {
    const nbPlayers = this.players.length;
    this.state.announcements = {};
    
    // 1. Logique des rôles
    let nbSherlock, nbMoriarty;
    if (nbPlayers >= 4 && nbPlayers <= 5) {
      nbSherlock = 3; nbMoriarty = 2; 
    } else if (nbPlayers === 6) {
      nbSherlock = 4; nbMoriarty = 2; 
    } else if (nbPlayers >= 7 && nbPlayers <= 8) {
      nbSherlock = 5; nbMoriarty = 3; 
    }
    else if (nbPlayers === 9) {
      nbMoriarty = Math.random() < 0.5 ? 3 : 4; 
      nbSherlock = nbPlayers - nbMoriarty;
    } else if (nbPlayers === 10) {
      nbSherlock = 6; nbMoriarty = 4; 
    } 
    else {
      nbMoriarty = Math.floor(nbPlayers / 2);
      nbSherlock = nbPlayers - nbMoriarty;
    }

    const shuffledSherlocks = shuffle([...availableSherlockCards]);
    const shuffledMoriartys = shuffle([...availableMoriartyCards]);

    const selectedSherlocks = shuffledSherlocks.slice(0, nbSherlock);
    const selectedMoriartys = shuffledMoriartys.slice(0, nbMoriarty);

    const finalRoleCardsPool = [...selectedSherlocks, ...selectedMoriartys];
    const assignedRoleCards = shuffle(finalRoleCardsPool).slice(0, nbPlayers);
    
    let deck = ['bomb'];
    
    for (let i = 0; i < nbPlayers; i++) {
      deck.push('defuse');
    }
    
    const totalCards = nbPlayers * 5;
    while (deck.length < totalCards) {
      deck.push('wire');
    }
    
    deck = shuffle(deck);

    const startingPlayerIndex = Math.floor(Math.random() * nbPlayers);

    // 3. Distribution initiale (Manche 1)
    this.state.players = this.players.map((p: any, index: number) => {
      const specificRoleCard = assignedRoleCards[index];
      const roleType = specificRoleCard.startsWith('Sherlock') ? 'Sherlock' : 'Moriarty';

      return {
        id: p.id,
        name: p.name,
        role: roleType,            
        roleCard: specificRoleCard, 
        hand: deck.splice(0, 5).map(type => ({ type: type, isRevealed: false })),
        hasScissors: index === startingPlayerIndex 
      };
    });

    this.io.to(this.roomCode).emit('game_started');
    this.setPhase(new AnnouncementPhase(this));
    this.broadcastState();
  }

  setPhase(newPhase: ITimeBombPhase) {
    this.currentPhase = newPhase;
  }

  handleAction(playerId: string, actionType: string, payload?: any): void {
    if (this.currentPhase) {
      this.currentPhase.handleAction(playerId, actionType, payload);
    }
  }

  startNextRound() {
    this.state.round++;
    
    if (this.state.round > 4) {
      return this.endGame('Moriarty', '⏳ Le temps est écoulé, la bombe explose !');
    }

    let newDeck: string[] = [];
    this.state.players.forEach((p: any) => {
      p.hand.forEach((c: any) => {
        if (!c.isRevealed) newDeck.push(c.type);
      });
      p.hand = []; 
    });

    newDeck = shuffle(newDeck);

    const cardsPerPlayer = newDeck.length / this.state.players.length;
    this.state.players.forEach((p: any) => {
      p.hand = newDeck.splice(0, cardsPerPlayer).map(type => ({ type, isRevealed: false }));
    });

    this.state.turnCuts = 0; 
    this.state.isRedistributing = false;
    this.state.lastShooterId = null;
    this.state.announcements = {};

    const playerWithScissors = this.state.players.find((p: any) => p.hasScissors);
    const scissorsHolderName = playerWithScissors ? playerWithScissors.name : "Quelqu'un";
    this.io.to(this.roomCode).emit('action_log', `Manche ${this.state.round} démarrée. Les ciseaux sont chez ${scissorsHolderName} !`);

    this.setPhase(new AnnouncementPhase(this));
    this.broadcastState();
  }

  endGame(winner: string, reason: string) {
    this.setPhase(new FinishedPhase());
    this.state.status = 'finished';
    this.state.players.forEach((p: any) => {
      p.hand.forEach((c: any) => c.isRevealed = true);
    });
    
    const revealedPlayers = this.state.players.map((p: any) => ({
      name: p.name,
      role: p.role
    }));

    this.broadcastState(); 
    this.io.to(this.roomCode).emit('game_over', { winner, reason, players: revealedPlayers });
  }

  broadcastState() {
    const allAnnounced = Object.keys(this.state.announcements).length === this.state.players.length;

    this.state.players.forEach((player: any) => {
      const opponents = this.state.players
        .filter((p: any) => p.id !== player.id)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          hasScissors: p.hasScissors,
          hand: p.hand.map((c: any) => c.isRevealed ? c : { type: 'hidden', isRevealed: false })
        }));

      this.io.to(player.id).emit('update_board_state', {
        round: this.state.round,
        defusesLeft: this.state.totalDefuses - this.state.defusesFound,
        cutsLeft: this.state.players.length - this.state.turnCuts,
        announcements: this.state.announcements,
        myRole: player.role,
        myRoleCard: player.roleCard,
        myHand: player.hand,
        hasScissors: player.hasScissors,
        opponents: opponents,
        isRedistributing: this.state.isRedistributing,
        protectedPlayerId: this.state.lastShooterId,
        allAnnounced: allAnnounced
      });
    });
  }

  reconnectPlayer(newSocketId: string, playerName: string) {
    if (this.state.status !== 'playing') return false;

    const player = this.state.players.find((p: any) => p.name === playerName);
    
    if (player) {
      player.id = newSocketId;
      return true;
    }
    return false;
  }
}

