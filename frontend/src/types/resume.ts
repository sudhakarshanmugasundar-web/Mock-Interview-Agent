export interface ResumeIssue {
  id?: number;
  problem: string;
  reason: string;
  suggestion: string;
  improvedVersion: string;
  resumeSection: string;
  originalText: string;
  errorType: string;
  severity: string;
}

export interface ResumeAnalysis {
  id: number;
  resumeUrl: string;
  rawText: string;
  atsScore: number;
  grammarScore: number;
  professionalismScore: number;
  resumeQualityScore: number;
  skillsScore: number;
  optimizedResume: string;
  createdAt: string;
  issues: ResumeIssue[];
}
