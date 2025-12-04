import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserProfile, InterviewTopic, AnalysisResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove data url prefix (e.g., "data:video/webm;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const generateInterviewTopics = async (profile: UserProfile): Promise<InterviewTopic[]> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    你是一位世界级的商业 IP 编导和短视频战略家。
    
    用户画像 (IP Profile):
    - IP 名称: ${profile.name}
    - 销售产品/服务: ${profile.product}
    - 目标人群: ${profile.targetAudience}

    请生成 3 个独特的、高潜力的采访问题（选题），旨在制作病毒式传播的短视频内容，以获得客户线索。
    这些问题应引导该 IP 专家分享有价值的见解、打破行业迷思或直击目标受众的痛点。

    请返回 JSON 格式，**内容必须严格使用简体中文 (Simplified Chinese)**。
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 1, // Increase creativity for diverse topics
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "采访 IP 的问题" },
              reasoning: { type: Type.STRING, description: "为什么选择这个问题（从营销角度分析）" }
            },
            required: ["question", "reasoning"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");
    
    return data.map((item: any, index: number) => ({
      id: `topic-${Date.now()}-${index}`,
      question: item.question,
      reasoning: item.reasoning,
      status: 'PENDING'
    }));
  } catch (error) {
    console.error("Error generating topics:", error);
    throw new Error("Failed to generate interview topics.");
  }
};

export const analyzeInterviewVideo = async (videoBlob: Blob, question: string): Promise<AnalysisResult> => {
  const model = "gemini-2.5-flash"; // Multimodal model capable of video analysis
  
  const base64Video = await blobToBase64(videoBlob);
  
  const prompt = `
    你是一位 AI 商业 IP 编导。你刚刚录制了一位 IP 专家的采访回答。
    
    背景问题: "${question}"

    你的任务:
    1. 逐字逐句转录视频中的语音，**必须使用简体中文**。
    2. 将转录内容【重组】为“爆款短视频结构”（黄金开头 Hook、痛点 Pain Point、解决方案 Solution、行动号召 CTA）。
       **关键**: 不要改写用户的原话，必须使用用户说过的确切句子，只是重新排列或分组到这些模块中。如果某个模块的内容用户没说，请留空。
       **注意**：返回的文本内容必须是**简体中文** (Simplified Chinese)，严禁出现繁体字。
    3. 从“IP 商业编导”维度对回答进行评分（0-100分）：
       - “流量潜力” (Traffic Potential)：内容是否吸引人，能火吗？
       - “线索转化” (Lead Conversion)：内容能否建立信任并带来客户？
    4. 提供 3 个具体的优化建议，帮助该 IP 下次表现更好（例如：语气、节奏、眼神交流、内容缺失等）。

    请返回 JSON 格式，所有文本必须是**简体中文**。
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: videoBlob.type || "video/webm",
              data: base64Video
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                transcript: { type: Type.STRING },
                viralStructure: {
                    type: Type.OBJECT,
                    properties: {
                        hook: { type: Type.STRING },
                        painPoint: { type: Type.STRING },
                        solution: { type: Type.STRING },
                        cta: { type: Type.STRING }
                    }
                },
                score: {
                    type: Type.OBJECT,
                    properties: {
                        traffic: { type: Type.NUMBER },
                        leads: { type: Type.NUMBER },
                        total: { type: Type.NUMBER }
                    }
                },
                suggestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as AnalysisResult;

  } catch (error) {
    console.error("Error analyzing video:", error);
    throw new Error("Failed to analyze the interview video.");
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Zephyr'): Promise<Uint8Array> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName }
                    }
                }
            }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data returned");
        }

        return base64ToUint8Array(base64Audio);
    } catch (error) {
        console.error("Error generating speech:", error);
        throw error;
    }
};