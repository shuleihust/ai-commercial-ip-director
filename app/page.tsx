"use client";

import React, { useState } from "react";
import { SetupCanvas } from "@/components/SetupCanvas";
import { Recorder } from "@/components/Recorder";
import { AnalysisView } from "@/components/AnalysisView";
import { UserProfile, InterviewTopic, TopicStatus } from "@/lib/types";
import {
  generateInterviewTopics,
  analyzeInterviewVideo,
} from "@/lib/api";
import {
  Video,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  FileText,
  X,
} from "lucide-react";

export default function Home() {
  const [step, setStep] = useState<
    "SETUP" | "TOPIC_SELECTION" | "RECORDING" | "REVIEW"
  >("SETUP");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [topics, setTopics] = useState<InterviewTopic[]>([]);
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [processingVideo, setProcessingVideo] = useState(false);

  // Custom Topic State
  const [showCustomTopicInput, setShowCustomTopicInput] = useState(false);
  const [customTopicText, setCustomTopicText] = useState("");

  // Script Editor State
  const [editingScriptTopicId, setEditingScriptTopicId] = useState<
    string | null
  >(null);
  const [tempScript, setTempScript] = useState("");

  // 1. Handle Profile Setup -> Generate Topics
  const handleSetupComplete = async (userProfile: UserProfile) => {
    setProfile(userProfile);
    setLoading(true);
    try {
      const generatedTopics = await generateInterviewTopics(userProfile);
      setTopics(generatedTopics);
      setStep("TOPIC_SELECTION");
    } catch (error) {
      alert("生成选题失败，请检查网络连接。");
    } finally {
      setLoading(false);
    }
  };

  // Regenerate Topics (Swap Batch)
  const handleRegenerateTopics = async () => {
    if (!profile) return;
    if (!window.confirm("确定要换一批新的选题吗？当前未录制的选题将被替换。"))
      return;

    setIsRegenerating(true);
    setLoading(true);
    setTopics([]);

    try {
      const newTopics = await generateInterviewTopics(profile);
      setTopics(newTopics);
    } catch (error) {
      alert("换一批选题失败，请稍后再试。");
    } finally {
      setLoading(false);
      setIsRegenerating(false);
    }
  };

  // Add Custom Topic
  const handleAddCustomTopic = () => {
    if (!customTopicText.trim()) return;
    const newTopic: InterviewTopic = {
      id: `custom-${Date.now()}`,
      question: customTopicText,
      reasoning: "用户自定义选题",
      status: TopicStatus.PENDING,
    };
    setTopics([...topics, newTopic]);
    setCustomTopicText("");
    setShowCustomTopicInput(false);
  };

  // Script Editor Logic
  const handleOpenScriptEditor = (topic: InterviewTopic) => {
    setEditingScriptTopicId(topic.id);
    setTempScript(topic.script || "");
  };

  const handleSaveScript = () => {
    if (editingScriptTopicId) {
      setTopics((prev) =>
        prev.map((t) =>
          t.id === editingScriptTopicId ? { ...t, script: tempScript } : t
        )
      );
      setEditingScriptTopicId(null);
      setTempScript("");
    }
  };

  // 2. Select Topic -> Start Recording
  const handleSelectTopic = (id: string) => {
    setCurrentTopicId(id);
    setStep("RECORDING");
  };

  // 3. Recording Complete -> Analyze
  const handleRecordingComplete = async (blob: Blob) => {
    if (!currentTopicId) return;

    setTopics((prev) =>
      prev.map((t) =>
        t.id === currentTopicId
          ? { ...t, videoBlob: blob, status: TopicStatus.ANALYZING }
          : t
      )
    );
    setProcessingVideo(true);

    try {
      const currentTopic = topics.find((t) => t.id === currentTopicId);
      if (currentTopic) {
        const analysis = await analyzeInterviewVideo(
          blob,
          currentTopic.question
        );

        setTopics((prev) =>
          prev.map((t) =>
            t.id === currentTopicId
              ? { ...t, analysis, status: TopicStatus.COMPLETED }
              : t
          )
        );

        setStep("REVIEW");
      }
    } catch (error) {
      alert("视频分析失败。");
      setTopics((prev) =>
        prev.map((t) =>
          t.id === currentTopicId ? { ...t, status: TopicStatus.RECORDED } : t
        )
      );
    } finally {
      setProcessingVideo(false);
    }
  };

  // 4. Next Topic or Finish
  const handleNext = () => {
    const hasPending = topics.some((t) => t.status === TopicStatus.PENDING);
    if (hasPending) {
      setStep("TOPIC_SELECTION");
    } else {
      alert("所有选题已完成！");
      setStep("TOPIC_SELECTION");
    }
  };

  const activeTopic = topics.find((t) => t.id === currentTopicId);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Video className="w-6 h-6 text-indigo-500" />
            <h1 className="text-xl font-bold tracking-tight">
              AI 商业 IP 编导{" "}
              <span className="text-indigo-500 text-sm font-normal bg-indigo-500/10 px-2 py-0.5 rounded-full ml-2">
                Beta
              </span>
            </h1>
          </div>
          {profile && (
            <div className="text-sm text-gray-400 hidden sm:block">
              当前 IP: <span className="text-white font-medium">{profile.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 flex flex-col">
        {step === "SETUP" && (
          <div className="flex-1 flex items-center justify-center">
            <SetupCanvas onComplete={handleSetupComplete} isLoading={loading} />
          </div>
        )}

        {step === "TOPIC_SELECTION" && (
          <div className="max-w-5xl mx-auto w-full p-6 space-y-8 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">拍摄计划</h2>
                <p className="text-gray-400">
                  选择一个选题开始录制，或添加自定义选题。
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCustomTopicInput(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition"
                  disabled={isRegenerating}
                >
                  <Plus className="w-4 h-4" />
                  <span>自定义选题</span>
                </button>
                <button
                  onClick={handleRegenerateTopics}
                  disabled={loading || isRegenerating}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {loading || isRegenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>换一批</span>
                </button>
              </div>
            </div>

            {/* Custom Topic Input Area */}
            {showCustomTopicInput && (
              <div className="bg-gray-900 border border-indigo-500/50 p-4 rounded-xl animate-fade-in">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  输入自定义选题
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTopicText}
                    onChange={(e) => setCustomTopicText(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="例如：我的创业故事..."
                  />
                  <button
                    onClick={handleAddCustomTopic}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium"
                  >
                    确定
                  </button>
                  <button
                    onClick={() => setShowCustomTopicInput(false)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-6">
              {loading || isRegenerating ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800 border-dashed animate-pulse">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                  <p className="text-gray-400">
                    AI 正在为您策划新的爆款选题...
                  </p>
                </div>
              ) : (
                topics.map((topic, index) => (
                  <div
                    key={topic.id}
                    className={`relative bg-gray-900 border ${
                      topic.status === TopicStatus.COMPLETED
                        ? "border-green-900"
                        : "border-gray-800"
                    } rounded-2xl p-6 transition-all hover:border-gray-600 group`}
                  >
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="bg-gray-800 text-gray-400 text-xs font-bold px-2 py-1 rounded">
                            选题 {index + 1}
                          </span>
                          {topic.status === TopicStatus.COMPLETED && (
                            <span className="flex items-center text-green-500 text-xs font-bold uppercase">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> 已录制
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold text-white group-hover:text-indigo-400 transition-colors">
                          &quot;{topic.question}&quot;
                        </h3>
                        <p className="text-sm text-gray-500 italic">
                          设计思路: {topic.reasoning}
                        </p>
                        {topic.script && (
                          <div className="mt-2 text-xs text-gray-400 bg-gray-800/50 p-2 rounded inline-block">
                            <span className="font-semibold text-indigo-400">
                              已添加提词:{" "}
                            </span>
                            {topic.script.length > 20
                              ? topic.script.substring(0, 20) + "..."
                              : topic.script}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        {topic.status !== TopicStatus.COMPLETED && (
                          <button
                            onClick={() => handleOpenScriptEditor(topic)}
                            className={`px-4 py-3 rounded-lg font-medium transition flex items-center ${
                              topic.script
                                ? "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            }`}
                            title="添加/编辑提词器文案"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            {topic.script ? "编辑提词" : "添加提词"}
                          </button>
                        )}

                        {topic.status === TopicStatus.COMPLETED ? (
                          <button
                            onClick={() => {
                              setCurrentTopicId(topic.id);
                              setStep("REVIEW");
                            }}
                            className="px-6 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition flex items-center"
                          >
                            复盘
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSelectTopic(topic.id)}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center shadow-lg shadow-indigo-600/20"
                          >
                            <Video className="w-4 h-4 mr-2" />
                            开始录制
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Script Editor Modal */}
            {editingScriptTopicId && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center p-6 border-b border-gray-800">
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-indigo-500" />
                      提词器文案编辑
                    </h3>
                    <button
                      onClick={() => setEditingScriptTopicId(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="p-6 flex-1 overflow-y-auto">
                    <p className="text-sm text-gray-400 mb-2">
                      为该选题输入您的回答大纲或完整文案，录制时将作为提词器显示。
                    </p>
                    <textarea
                      value={tempScript}
                      onChange={(e) => setTempScript(e.target.value)}
                      className="w-full h-64 bg-gray-800 border border-gray-700 text-white rounded-lg p-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
                      placeholder="输入文案内容..."
                      autoFocus
                    />
                  </div>
                  <div className="p-6 border-t border-gray-800 flex justify-end space-x-3">
                    <button
                      onClick={() => setEditingScriptTopicId(null)}
                      className="px-5 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveScript}
                      className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-medium"
                    >
                      保存文案
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "RECORDING" && activeTopic && (
          <Recorder
            question={activeTopic.question}
            script={activeTopic.script}
            onRecordingComplete={handleRecordingComplete}
            onCancel={() => setStep("TOPIC_SELECTION")}
          />
        )}

        {/* Processing State (Overlay) */}
        {processingVideo && (
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-center p-6">
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">
              AI 编导正在复盘中...
            </h2>
            <p className="text-gray-400 max-w-md">
              正在分析您的视频，提取文案并进行爆款结构重组...
            </p>
          </div>
        )}

        {step === "REVIEW" &&
          activeTopic &&
          activeTopic.analysis &&
          activeTopic.videoBlob && (
            <AnalysisView
              result={activeTopic.analysis}
              videoBlob={activeTopic.videoBlob}
              onNext={handleNext}
              isLastTopic={topics.every(
                (t) => t.status === TopicStatus.COMPLETED
              )}
            />
          )}
      </main>
    </div>
  );
}
