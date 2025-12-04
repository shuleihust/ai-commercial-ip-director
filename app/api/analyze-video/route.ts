import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";
import { Type } from "@google/genai";
import { AnalyzeVideoRequest, AnalysisResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeVideoRequest = await request.json();
    const { videoBase64, mimeType, question } = body;

    if (!videoBase64 || !question) {
      return NextResponse.json(
        { error: "缺少视频数据或问题" },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();
    const model = "gemini-2.5-flash";

    const prompt = `
    你是一位 AI 商业 IP 编导。你刚刚录制了一位 IP 专家的采访回答。

    背景问题: "${question}"

    你的任务:
    1. 逐字逐句转录视频中的语音，**必须使用简体中文**。
    2. 将转录内容【重组】为"爆款短视频结构"（黄金开头 Hook、痛点 Pain Point、解决方案 Solution、行动号召 CTA）。
       **关键**: 不要改写用户的原话，必须使用用户说过的确切句子，只是重新排列或分组到这些模块中。如果某个模块的内容用户没说，请留空。
       **注意**：返回的文本内容必须是**简体中文** (Simplified Chinese)，严禁出现繁体字。
    3. 从"IP 商业编导"维度对回答进行评分（0-100分）：
       - "流量潜力" (Traffic Potential)：内容是否吸引人，能火吗？
       - "线索转化" (Lead Conversion)：内容能否建立信任并带来客户？
    4. 提供 3 个具体的优化建议，帮助该 IP 下次表现更好（例如：语气、节奏、眼神交流、内容缺失等）。

    请返回 JSON 格式，所有文本必须是**简体中文**。
  `;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "video/webm",
              data: videoBase64,
            },
          },
          { text: prompt },
        ],
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
                cta: { type: Type.STRING },
              },
            },
            score: {
              type: Type.OBJECT,
              properties: {
                traffic: { type: Type.NUMBER },
                leads: { type: Type.NUMBER },
                total: { type: Type.NUMBER },
              },
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    const result: AnalysisResult = JSON.parse(response.text || "{}");
    return NextResponse.json(result);
  } catch (error) {
    console.error("视频分析失败:", error);
    return NextResponse.json({ error: "视频分析失败" }, { status: 500 });
  }
}

// 增加请求体大小限制，因为视频可能很大
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};
