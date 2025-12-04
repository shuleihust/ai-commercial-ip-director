// 前端服务 - 调用后端 API，不再直接访问 Gemini
import {
  UserProfile,
  InterviewTopic,
  AnalysisResult,
} from "@/lib/types";

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        // Remove data url prefix (e.g., "data:video/webm;base64,")
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const generateInterviewTopics = async (
  profile: UserProfile
): Promise<InterviewTopic[]> => {
  const response = await fetch("/api/generate-topics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ profile }),
  });

  if (!response.ok) {
    throw new Error("生成选题失败");
  }

  const data = await response.json();
  return data.topics;
};

export const analyzeInterviewVideo = async (
  videoBlob: Blob,
  question: string
): Promise<AnalysisResult> => {
  const videoBase64 = await blobToBase64(videoBlob);

  const response = await fetch("/api/analyze-video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      videoBase64,
      mimeType: videoBlob.type || "video/webm",
      question,
    }),
  });

  if (!response.ok) {
    throw new Error("视频分析失败");
  }

  return response.json();
};

export const generateSpeech = async (
  text: string,
  voiceName: string = "Zephyr"
): Promise<Uint8Array> => {
  const response = await fetch("/api/generate-speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, voiceName }),
  });

  if (!response.ok) {
    throw new Error("语音生成失败");
  }

  const data = await response.json();
  return base64ToUint8Array(data.audioBase64);
};
