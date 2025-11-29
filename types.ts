
export enum Difficulty {
  EASY = 'EASY',     // Only hours (1:00, 2:00)
  MEDIUM = 'MEDIUM', // Half hours (1:30, 2:30)
  HARD = 'HARD'      // 5 minute intervals (1:05, 1:10)
}

export enum GameMode {
  QUIZ = 'QUIZ',           // Classic: See clock, choose option
  INPUT = 'INPUT',         // See clock, enter digital time
  SET_HANDS = 'SET_HANDS'  // See digital time, set clock hands
}

export interface TimeTarget {
  hours: number;
  minutes: number;
}

export interface GameState {
  score: number;
  totalQuestions: number;
  currentLevel: number;
  difficulty: Difficulty;
  isCorrect: boolean | null;
}

export interface ScenarioResponse {
  scenario: string;
  emoji: string;
}
