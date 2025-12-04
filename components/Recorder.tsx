"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  Video,
  StopCircle,
  RefreshCw,
  CheckCircle,
  Smartphone,
  Monitor,
  Volume2,
  FileText,
  X,
  Square,
} from "lucide-react";
import { generateSpeech } from "@/lib/api";

interface RecorderProps {
  question: string;
  script?: string;
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
}

type AspectRatio = "portrait" | "landscape";
type VoiceOption = "taiwanese" | "broadcast" | "teacher";

export const Recorder: React.FC<RecorderProps> = ({
  question,
  script,
  onRecordingComplete,
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [timer, setTimer] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("portrait");

  // Teleprompter State
  const [showTeleprompter, setShowTeleprompter] = useState(false);

  // Audio / TTS State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>("taiwanese");
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Auto-open teleprompter if script exists
  useEffect(() => {
    if (script) {
      setShowTeleprompter(true);
    }
  }, [script]);

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      try {
        const constraints: MediaStreamConstraints = {
          audio: true,
          video:
            aspectRatio === "portrait"
              ? { width: { ideal: 720 }, height: { ideal: 1280 }, facingMode: "user" }
              : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        };

        const mediaStream =
          await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("无法访问摄像头，请开启权限。");
      }
    };

    startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspectRatio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream]);

  // Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = useCallback(() => {
    if (!stream) return;

    stopAudio();
    setRecordedChunks([]);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8,opus",
    });

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };

    mediaRecorder.start();
    setIsRecording(true);
  }, [stream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleFinish = () => {
    if (recordedChunks.length === 0) return;
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    onRecordingComplete(blob);
  };

  // --- TTS Logic ---
  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // ignore if already stopped
      }
      audioSourceRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  const playAudio = async () => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    setIsGeneratingAudio(true);

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
          sampleRate: 24000,
        });
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      let voiceName = "Zephyr";
      if (selectedVoice === "broadcast") voiceName = "Fenrir";
      if (selectedVoice === "teacher") voiceName = "Kore";

      const pcmData = await generateSpeech(question, voiceName);

      const dataInt16 = new Int16Array(pcmData.buffer);
      const channelCount = 1;
      const sampleRate = 24000;
      const frameCount = dataInt16.length;

      const audioBuffer = audioContextRef.current.createBuffer(
        channelCount,
        frameCount,
        sampleRate
      );
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      source.onended = () => {
        setIsPlayingAudio(false);
        audioSourceRef.current = null;
      };

      audioSourceRef.current = source;
      source.start();
      setIsPlayingAudio(true);
    } catch (err) {
      console.error("Audio playback error:", err);
      alert("语音播放失败，请稍后重试");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header / Question Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center pointer-events-auto">
          <span className="inline-block py-1 px-3 rounded-full bg-indigo-600 text-xs font-bold uppercase tracking-wider text-white mb-3">
            当前采访问题
          </span>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-start justify-center gap-3">
              <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-md leading-tight max-w-2xl">
                &quot;{question}&quot;
              </h2>
            </div>

            {/* Voice Controls */}
            <div className="flex items-center gap-2 mt-2 bg-black/40 backdrop-blur-md rounded-full px-3 py-1 border border-white/10">
              <select
                value={selectedVoice}
                onChange={(e) => {
                  stopAudio();
                  setSelectedVoice(e.target.value as VoiceOption);
                }}
                className="bg-transparent text-xs text-gray-300 outline-none border-none cursor-pointer hover:text-white"
                disabled={isPlayingAudio && !isGeneratingAudio}
              >
                <option value="taiwanese">🇹🇼 台湾女生</option>
                <option value="broadcast">🎙️ 播音男主持</option>
                <option value="teacher">👩‍🏫 女老师</option>
              </select>

              <div className="w-px h-3 bg-gray-500 mx-1"></div>

              <button
                onClick={playAudio}
                disabled={isGeneratingAudio}
                className={`p-1 rounded-full transition flex-shrink-0 ${
                  isPlayingAudio
                    ? "text-red-400 hover:text-red-300"
                    : "text-indigo-400 hover:text-indigo-300"
                }`}
                title={isPlayingAudio ? "停止播放" : "朗读问题"}
              >
                {isGeneratingAudio ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                ) : isPlayingAudio ? (
                  <Square className="w-4 h-4 fill-current" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Teleprompter Overlay */}
      {showTeleprompter && script && (
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center pt-40 px-4 pb-32">
          <div className="bg-black/40 backdrop-blur-sm p-6 rounded-xl max-w-2xl w-full max-h-full overflow-y-auto pointer-events-auto text-center border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                提词器 (Teleprompter)
              </span>
              <button
                onClick={() => setShowTeleprompter(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-white text-xl md:text-2xl font-medium leading-relaxed whitespace-pre-wrap">
              {script}
            </p>
          </div>
        </div>
      )}

      {/* Camera Viewport */}
      <div className="flex-1 relative bg-gray-900 overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`object-cover transform scale-x-[-1] transition-all duration-500 ${
            aspectRatio === "portrait"
              ? "h-full w-auto aspect-[9/16]"
              : "w-full h-auto aspect-[16/9]"
          }`}
        />

        {/* Aspect Ratio Toggle */}
        {!isRecording && recordedChunks.length === 0 && (
          <div className="absolute bottom-12 right-6 z-20 flex flex-col space-y-2 bg-black/50 p-2 rounded-lg backdrop-blur-sm">
            <button
              onClick={() => setAspectRatio("portrait")}
              className={`p-2 rounded-md transition ${
                aspectRatio === "portrait"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              title="竖屏 (9:16)"
            >
              <Smartphone className="w-6 h-6" />
            </button>
            <button
              onClick={() => setAspectRatio("landscape")}
              className={`p-2 rounded-md transition ${
                aspectRatio === "landscape"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              title="横屏 (16:9)"
            >
              <Monitor className="w-6 h-6" />
            </button>
            {script && (
              <button
                onClick={() => setShowTeleprompter(!showTeleprompter)}
                className={`p-2 rounded-md transition ${
                  showTeleprompter
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
                title="打开/关闭提词器"
              >
                <FileText className="w-6 h-6" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-950 p-6 border-t border-gray-800 relative z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white font-medium text-sm p-2 transition"
          >
            取消
          </button>

          <div className="flex flex-col items-center">
            {!isRecording ? (
              recordedChunks.length > 0 ? (
                <div className="flex items-center space-x-6">
                  <button
                    onClick={startRecording}
                    className="flex flex-col items-center space-y-1 group"
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-gray-500 flex items-center justify-center group-hover:border-white transition">
                      <RefreshCw className="w-5 h-5 text-gray-400 group-hover:text-white" />
                    </div>
                    <span className="text-xs text-gray-500">重录</span>
                  </button>

                  <button
                    onClick={handleFinish}
                    className="flex items-center justify-center w-20 h-20 bg-green-500 rounded-full hover:bg-green-600 transition shadow-lg shadow-green-500/20"
                  >
                    <CheckCircle className="w-10 h-10 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={startRecording}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/10 transition relative"
                >
                  <div className="w-16 h-16 bg-red-500 rounded-full"></div>
                </button>
              )
            ) : (
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-red-500/30 animate-pulse-ring"></div>
                <button
                  onClick={stopRecording}
                  className="relative w-20 h-20 rounded-full border-4 border-red-500 flex items-center justify-center bg-transparent hover:bg-red-500/10 transition"
                >
                  <div className="w-8 h-8 bg-red-500 rounded-md"></div>
                </button>
              </div>
            )}
            <div className="mt-2 font-mono text-red-500 font-bold min-h-[20px]">
              {isRecording && formatTime(timer)}
            </div>
          </div>

          <div className="w-[60px] flex justify-end">
            {script && isRecording && (
              <button
                onClick={() => setShowTeleprompter(!showTeleprompter)}
                className={`p-2 rounded-full bg-gray-800 transition ${
                  showTeleprompter ? "text-indigo-400" : "text-gray-400"
                }`}
              >
                <FileText className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
