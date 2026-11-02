export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Confidence = 'again' | 'hard' | 'good' | 'easy';
export type SessionKind = 'new' | 'revision' | 'attempt';
export type Verification = 'unverified' | 'verified';

export interface Problem {
  id: string; // canonical identity = LeetCode slug
  title: string;
  slug: string;
  url: string;
  difficulty: Difficulty;
  topicId: string;
  subtopic: string;
  priority: 1 | 2 | 3;
  patterns: string[];
  estMinutes: number;
  batchId: string;
  order: number; // 1..5 within batch
  objective: string;
  prerequisites: string[]; // topic ids
  verification: Verification;
}

/** One saved practice session. `date` = local practice day; `createdAt` = record creation (ms). */
export interface Session {
  id: string;
  problemId: string;
  kind: SessionKind;
  date: string; // YYYY-MM-DD, local
  durationSec: number;
  independent: boolean;
  hints: boolean;
  confidence: Confidence | null;
  createdAt: number;
  notes?: string;
}

export interface ReviewState {
  problemId: string;
  stage: number; // index of next interval to use
  nextDue: string; // YYYY-MM-DD
  lastReviewed: string;
  lapses: number;
  lastConfidence: Confidence;
}

export interface Note {
  problemId: string;
  approach: string; insight: string; whyFailed: string; edgeCases: string;
  timeComplexity: string; spaceComplexity: string; remember: string; nextTime: string;
  solutionLink: string; flagged: boolean; updatedAt: number;
}
export interface Settings {
  weeklyTarget: number; studyDays: number[]; intervals: number[];
  leetcodeUsername: string; freeMode: boolean; weekStartsOn: 0 | 1; language: 'C++';
}
export const DEFAULT_SETTINGS: Settings = {
  weeklyTarget: 12, studyDays: [1, 2, 3, 4, 5, 6], intervals: [1, 3, 7, 14, 30],
  leetcodeUsername: '', freeMode: false, weekStartsOn: 1, language: 'C++',
};
export interface AppData { app: 'dsa-quest'; version: 1; exportedAt: number; sessions: Session[]; reviews: ReviewState[]; notes: Note[]; settings: Settings }
