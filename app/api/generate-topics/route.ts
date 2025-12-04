import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";
import { Type } from "@google/genai";
import { GenerateTopicsRequest, InterviewTopic } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: GenerateTopicsRequest = await request.json();
    const { profile } = body;

    if (!profile?.name || !profile?.product || !profile?.targetAudience) {
      return NextResponse.json(
        { error: "缺少必要的用户画像信息" },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();
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

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "采访 IP 的问题" },
              reasoning: {
                type: Type.STRING,
                description: "为什么选择这个问题（从营销角度分析）",
              },
            },
            required: ["question", "reasoning"],
          },
        },
      },
    });

    const data = JSON.parse(response.text || "[]");

    const topics: InterviewTopic[] = data.map(
      (item: { question: string; reasoning: string }, index: number) => ({
        id: `topic-${Date.now()}-${index}`,
        question: item.question,
        reasoning: item.reasoning,
        status: "PENDING",
      })
    );

    return NextResponse.json({ topics });
  } catch (error) {
    console.error("生成选题失败:", error);
    return NextResponse.json({ error: "生成选题失败" }, { status: 500 });
  }
}
