export type InterrogationStage = 'SETUP' | 'ACTIVE' | 'EVALUATED';

export interface HistoryItem {
  question: string;
  answer: string;
  feedback: 'correct' | 'partially_correct' | 'incorrect';
  evaluation: string;
  explanation: string;
}

export interface SessionState {
  subject: string;
  topic: string;
  currentQuestion: string;
  history: HistoryItem[];
  studentAnswer: string;
  isSubmittingAnswer: boolean;
  isFinishing: boolean;
}

export interface EvaluationResult {
  id: string;
  subject: string;
  topic: string;
  grade: number;
  gradeExplanation: string;
  weakPoints: string[];
  progress: string[];
  generalSummary: string;
  timestamp: string;
  questionCount: number;
}
