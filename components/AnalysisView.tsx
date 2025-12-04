"use client";

import React from "react";
import { AnalysisResult } from "@/lib/types";
import {
  Download,
  Star,
  TrendingUp,
  Users,
  AlertCircle,
} from "lucide-react";

interface AnalysisViewProps {
  result: AnalysisResult;
  videoBlob: Blob;
  onNext: () => void;
  isLastTopic: boolean;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  result,
  videoBlob,
  onNext,
  isLastTopic,
}) => {
  const videoUrl = React.useMemo(
    () => URL.createObjectURL(videoBlob),
    [videoBlob]
  );

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
      {/* Left Column: Video & Download */}
      <div className="space-y-6">
        <div className="bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 aspect-[9/16] max-h-[600px] mx-auto lg:mx-0 relative group">
          <video
            src={videoUrl}
            controls
            className="w-full h-full object-contain bg-gray-900"
          />
        </div>

        <div className="flex gap-4">
          <a
            href={videoUrl}
            download={`interview-clip-${Date.now()}.webm`}
            className="flex-1 flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition"
          >
            <Download className="w-4 h-4" />
            <span>下载原始视频</span>
          </a>
        </div>
      </div>

      {/* Right Column: AI Analysis */}
      <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-100px)] custom-scrollbar">
        {/* Score Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center">
            <Star className="w-5 h-5 text-yellow-500 mr-2" />
            AI 编导评分
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-white">
                {result.score.total}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">
                综合得分
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-indigo-400">
                {result.score.traffic}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1 flex justify-center items-center gap-1">
                <TrendingUp className="w-3 h-3" /> 流量潜力
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-400">
                {result.score.leads}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1 flex justify-center items-center gap-1">
                <Users className="w-3 h-3" /> 获客线索
              </div>
            </div>
          </div>
        </div>

        {/* Viral Structure Remaster */}
        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-indigo-100">
              爆款短视频结构重组
            </h3>
            <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded">
              原话重组
            </span>
          </div>

          <div className="space-y-4 text-sm">
            <div className="relative pl-4 border-l-2 border-pink-500">
              <span className="absolute -left-[9px] -top-1 w-4 h-4 bg-pink-500 rounded-full"></span>
              <p className="text-pink-400 font-bold text-xs uppercase mb-1">
                黄金开头 (Hook)
              </p>
              <p className="text-gray-200">
                {result.viralStructure.hook || (
                  <span className="text-gray-500 italic">
                    未检测到强有力的 Hook。
                  </span>
                )}
              </p>
            </div>

            <div className="relative pl-4 border-l-2 border-gray-600">
              <p className="text-gray-400 font-bold text-xs uppercase mb-1">
                痛点 / 背景 (Pain)
              </p>
              <p className="text-gray-300">{result.viralStructure.painPoint}</p>
            </div>

            <div className="relative pl-4 border-l-2 border-gray-600">
              <p className="text-gray-400 font-bold text-xs uppercase mb-1">
                解决方案 / 价值 (Solution)
              </p>
              <p className="text-gray-300">{result.viralStructure.solution}</p>
            </div>

            <div className="relative pl-4 border-l-2 border-green-500">
              <span className="absolute -left-[9px] bottom-0 w-4 h-4 bg-green-500 rounded-full"></span>
              <p className="text-green-400 font-bold text-xs uppercase mb-1">
                行动号召 (CTA)
              </p>
              <p className="text-gray-200">
                {result.viralStructure.cta || (
                  <span className="text-gray-500 italic">
                    未检测到明显的行动号召。
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-blue-400 mr-2" />
            编导优化建议
          </h3>
          <ul className="space-y-3">
            {result.suggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start text-gray-300 text-sm">
                <span className="mr-2 mt-1 text-blue-500">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onNext}
          className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition shadow-lg"
        >
          {isLastTopic ? "结束本次策划" : "下一个选题"}
        </button>
      </div>
    </div>
  );
};
