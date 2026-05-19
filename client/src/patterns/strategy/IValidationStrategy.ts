export interface IValidationStrategy {
  isValidCombination(context: any, color: string, value: number): boolean;
}
