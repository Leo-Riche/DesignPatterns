import type { IValidationStrategy } from './IValidationStrategy'

export default class ClassicValidationStrategy implements IValidationStrategy {
  isValidCombination(context: any, color: string, value: number): boolean {
    if (!context || !context.dice || !context.scoreSheet) return false;
    const { dice, scoreSheet, lockedColors, isActivePlayer } = context;

    const hasCross = (c: string, v: number | string) => {
      if (!scoreSheet[c]) return false;
      return scoreSheet[c].includes(v);
    };

    if (hasCross(color, value) || (lockedColors && lockedColors[color])) return false;

    const crossedArr = (scoreSheet[color] || []).filter((v: any) => v !== 'lock');
    if (crossedArr.length > 0) {
      const lastAction = crossedArr[crossedArr.length - 1];
      if (color === 'red' || color === 'yellow') {
        if (value <= lastAction) return false;
      } else {
        if (value >= lastAction) return false;
      }
    }

    const isLastBox = (color === 'red' || color === 'yellow') ? value === 12 : value === 2;
    if (isLastBox && crossedArr.length < 5) return false;

    const wSum = dice.w1 + dice.w2;
    const cSum1 = dice.w1 + dice[color];
    const cSum2 = dice.w2 + dice[color];

    return value === wSum || (isActivePlayer && (value === cSum1 || value === cSum2));
  }
}
