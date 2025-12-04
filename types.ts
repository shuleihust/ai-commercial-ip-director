export interface UserProfile {
  name: string;
  product: string;
  targetAudience: string;
}

export enum TopicStatus {
  PENDING = 'PENDING',
  RECORDED = 'RECORDED',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
}

export interface InterviewTopic {
  id: string;
  question: string;
  reasoning: string; // Why AI chose this
  status: TopicStatus;
  videoBlob?: Blob;
  analysis?: AnalysisResult;
  script?: string; // User provided script/outline for teleprompter
}

export interface AnalysisResult {
  transcript: string;
  viralStructure: {
    hook: string;
    painPoint: string;
    solution: string;
    cta: string;
  };
  score: {
    traffic: number;
    leads: number;
    total: number;
  };
  suggestions: string[];
}