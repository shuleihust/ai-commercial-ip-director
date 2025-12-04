// 共享类型定义
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
  reasoning: string;
  status: TopicStatus;
  videoBlob?: Blob;
  analysis?: AnalysisResult;
  script?: string;
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

// API 请求/响应类型
export interface GenerateTopicsRequest {
  profile: UserProfile;
}

export interface AnalyzeVideoRequest {
  videoBase64: string;
  mimeType: string;
  question: string;
}

export interface GenerateSpeechRequest {
  text: string;
  voiceName?: string;
}
