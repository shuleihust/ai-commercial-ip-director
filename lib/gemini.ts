// 服务端 Gemini 初始化 - API Key 只在服务端可访问
import { GoogleGenAI } from "@google/genai";

// 确保 GEMINI_API_KEY 只在服务端环境变量中
// Next.js 中不带 NEXT_PUBLIC_ 前缀的环境变量只在服务端可用
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 环境变量未设置");
  }

  return new GoogleGenAI({ apiKey });
}
