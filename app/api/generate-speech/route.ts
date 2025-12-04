import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";
import { Modality } from "@google/genai";
import { GenerateSpeechRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: GenerateSpeechRequest = await request.json();
    const { text, voiceName = "Zephyr" } = body;

    if (!text) {
      return NextResponse.json({ error: "缺少文本内容" }, { status: 400 });
    }

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return NextResponse.json(
        { error: "未能生成语音数据" },
        { status: 500 }
      );
    }

    return NextResponse.json({ audioBase64: base64Audio });
  } catch (error) {
    console.error("语音生成失败:", error);
    return NextResponse.json({ error: "语音生成失败" }, { status: 500 });
  }
}
