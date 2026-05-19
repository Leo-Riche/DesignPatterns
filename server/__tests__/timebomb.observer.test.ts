import { TimeBomb } from '../games/timebomb/TimeBomb';
import { ITimeBombObserver } from '../games/timebomb/observer/ITimeBombObserver';

// ─── Mock Observateur ────────────────────────────────────────────────────────
/**
 * Faux observateur (Mock) utilisé pour les tests.
 * Il ne fait rien de réseau : il enregistre simplement
 * chaque appel reçu dans des tableaux.
 * C'est la preuve que le moteur de jeu est découplé de Socket.io.
 */
class MockObserver implements ITimeBombObserver {
  logs: string[] = [];
  gameStarted = false;
  gameOverData: { winner: string; reason: string; players: any[] } | null = null;
  stateUpdates: { playerId: string; data: any }[] = [];

  onActionLog(message: string): void {
    this.logs.push(message);
  }
  onGameStarted(): void {
    this.gameStarted = true;
  }
  onGameOver(data: { winner: string; reason: string; players: any[] }): void {
    this.gameOverData = data;
  }
  onPlayerStateUpdate(playerId: string, data: any): void {
    this.stateUpdates.push({ playerId, data });
  }

  reset(): void {
    this.logs = [];
    this.gameStarted = false;
    this.gameOverData = null;
    this.stateUpdates = [];
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Crée un jeu avec un mock observateur injecté à la place de Socket.io */
function createGameWithMock(playerCount = 4): { game: TimeBomb; mock: MockObserver } {
  const players = Array.from({ length: playerCount }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Joueur${i + 1}`,
  }));

  const game = new TimeBomb('TEST-ROOM', players, null as any);

  const mock = new MockObserver();
  (game as any).observers = [mock];

  return { game, mock };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Observer Pattern — TimeBomb', () => {

  // ── addObserver / removeObserver ──────────────────────────────────────────

  describe('Gestion des observateurs', () => {

    it('peut ajouter un observateur', () => {
      const { game } = createGameWithMock();
      const extraMock = new MockObserver();
      game.addObserver(extraMock);

      game.log('Hello !');

      expect(extraMock.logs).toContain('Hello !');
    });

    it('peut retirer un observateur', () => {
      const { game, mock } = createGameWithMock();
      game.removeObserver(mock);

      game.log('Ce message ne doit pas arriver');

      expect(mock.logs).toHaveLength(0);
    });

    it('notifie TOUS les observateurs inscrits', () => {
      const { game } = createGameWithMock();
      const mock1 = new MockObserver();
      const mock2 = new MockObserver();
      (game as any).observers = [mock1, mock2];

      game.log('Broadcast !');

      expect(mock1.logs).toContain('Broadcast !');
      expect(mock2.logs).toContain('Broadcast !');
    });

  });

  // ── onActionLog ───────────────────────────────────────────────────────────

  describe('onActionLog', () => {

    it('est appelé quand game.log() est invoqué', () => {
      const { game, mock } = createGameWithMock();

      game.log('Test de log');

      expect(mock.logs).toHaveLength(1);
      expect(mock.logs[0]).toBe('Test de log');
    });

    it('accumule plusieurs logs dans l\'ordre', () => {
      const { game, mock } = createGameWithMock();

      game.log('Premier');
      game.log('Deuxième');
      game.log('Troisième');

      expect(mock.logs).toEqual(['Premier', 'Deuxième', 'Troisième']);
    });

  });

  // ── onGameStarted ─────────────────────────────────────────────────────────

  describe('onGameStarted', () => {

    it('est appelé une fois quand la partie démarre', () => {
      const { game, mock } = createGameWithMock(4);

      game.start();

      expect(mock.gameStarted).toBe(true);
    });

  });

  // ── onPlayerStateUpdate ───────────────────────────────────────────────────

  describe('onPlayerStateUpdate', () => {

    it('est appelé une fois par joueur quand la partie démarre', () => {
      const { game, mock } = createGameWithMock(4);

      game.start();

      // Avec 4 joueurs, broadcastState() appelle onPlayerStateUpdate 4 fois
      expect(mock.stateUpdates).toHaveLength(4);
    });

    it('chaque update contient l\'ID du bon joueur', () => {
      const { game, mock } = createGameWithMock(4);

      game.start();

      const playerIds = mock.stateUpdates.map(u => u.playerId);
      expect(playerIds).toContain('player-1');
      expect(playerIds).toContain('player-2');
      expect(playerIds).toContain('player-3');
      expect(playerIds).toContain('player-4');
    });

    it('les données de l\'update contiennent les champs attendus', () => {
      const { game, mock } = createGameWithMock(4);

      game.start();

      const firstUpdate = mock.stateUpdates[0].data;
      expect(firstUpdate).toHaveProperty('round');
      expect(firstUpdate).toHaveProperty('myHand');
      expect(firstUpdate).toHaveProperty('myRole');
      expect(firstUpdate).toHaveProperty('opponents');
      expect(firstUpdate).toHaveProperty('hasScissors');
    });

    it('les adversaires voient les cartes cachées', () => {
      const { game, mock } = createGameWithMock(4);

      game.start();

      const firstUpdate = mock.stateUpdates[0].data;
      const opponentHands = firstUpdate.opponents.flatMap((o: any) => o.hand);
      opponentHands.forEach((card: any) => {
        expect(card.type).toBe('hidden');
      });
    });

  });

  // ── onGameOver ────────────────────────────────────────────────────────────

  describe('onGameOver', () => {

    it('est appelé quand endGame() est invoqué', () => {
      const { game, mock } = createGameWithMock(4);
      game.start();
      mock.reset();

      game.endGame('Sherlock', '✅ Tous les câbles ont été désamorcés !');

      expect(mock.gameOverData).not.toBeNull();
      expect(mock.gameOverData!.winner).toBe('Sherlock');
      expect(mock.gameOverData!.reason).toBe('✅ Tous les câbles ont été désamorcés !');
    });

    it('expose les rôles de tous les joueurs à la fin', () => {
      const { game, mock } = createGameWithMock(4);
      game.start();

      game.endGame('Moriarty', '💥 BOUM !');

      expect(mock.gameOverData!.players).toHaveLength(4);
      mock.gameOverData!.players.forEach((p: any) => {
        expect(p).toHaveProperty('name');
        expect(p).toHaveProperty('role');
      });
    });

    it('toutes les cartes sont révélées à la fin', () => {
      const { game, mock } = createGameWithMock(4);
      game.start();

      game.endGame('Moriarty', '💥 BOUM !');

      const lastUpdates = mock.stateUpdates.slice(-4);
      lastUpdates.forEach(update => {
        update.data.myHand.forEach((card: any) => {
          expect(card.isRevealed).toBe(true);
        });
      });
    });

    it('n\'émet plus aucun événement après la fin (FinishedPhase)', () => {
      const { game, mock } = createGameWithMock(4);
      game.start();
      game.endGame('Moriarty', '💥 BOUM !');
      mock.reset();

      game.handleAction('player-1', 'cut', { targetId: 'player-2', cardIndex: 0 });

      expect(mock.logs).toHaveLength(0);
      expect(mock.stateUpdates).toHaveLength(0);
    });

  });

});
