export interface InterviewSessionRequest {
  title: string;
  interviewType: string;
  difficulty: string;
}

export interface InterviewSessionResponse {
  id: number;
  email: string;
  title: string;
  status: string;
  interviewType: string;
  difficulty: string;
  startedAt?: string;
  endedAt?: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewStatisticsResponse {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  inProgressSessions: number;
  averageDurationSeconds: number;
}

export interface InterviewHistoryResponse {
  sessions: InterviewSessionResponse[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export interface QuestionResponse {
  id: number;
  questionText: string;
  questionSequence: number;
  isLastQuestion: boolean;
}

export interface AnswerRequest {
  answerText: string;
  answerMode: string;
  responseTime: number;
}

export interface FeedbackResponse {
  responseId: number;
  questionText: string;
  responseText: string;
  answerMode: string;
  responseTime: number;
  questionSequence: number;
  technicalKnowledge?: number;
  communication?: number;
  confidence?: number;
  grammar?: number;
  fluency?: number;
  relevance?: number;
  completeness?: number;
  professionalism?: number;
  overallScore?: number;
  feedbackText?: string;
  strengths?: string;
  weaknesses?: string;
  suggestions?: string;
  sampleAnswer?: string;
  audioPath?: string;
}

export interface SessionResultResponse {
  sessionId: number;
  title: string;
  status: string;
  interviewType: string;
  difficulty: string;
  averageScore: number;
  totalQuestions: number;
  questionsEvaluations: FeedbackResponse[];
}

export interface InterviewReportResponse {
  sessionId: number;
  candidateName: string;
  candidateEmail: string;
  title: string;
  interviewType: string;
  difficulty: string;
  // Round scores (null if round not completed)
  resumeScore: number | null;
  hrScore: number | null;
  technicalScore: number | null;
  codingScore: number | null;
  overallScore: number;
  // Soft-skill averages
  communicationAvg: number;
  grammarAvg: number;
  confidenceAvg: number;
  fluencyAvg: number;
  relevanceAvg: number;
  completenessAvg: number;
  professionalismaAvg: number;
  problemSolvingAvg: number;
  // AI qualitative analysis
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'CONSIDER' | 'NO_HIRE';
  recommendationDetail: string;
  strongAreas: string;
  weakAreas: string;
  suggestedLearningPath: string;
  // Question breakdown
  questionBreakdown: FeedbackResponse[];
}
