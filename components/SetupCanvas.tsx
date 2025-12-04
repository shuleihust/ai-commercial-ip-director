import React, { useState } from 'react';
import { UserProfile } from '../types';
import { UserCircle, Target, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';

interface SetupCanvasProps {
  onComplete: (profile: UserProfile) => void;
  isLoading: boolean;
}

export const SetupCanvas: React.FC<SetupCanvasProps> = ({ onComplete, isLoading }) => {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    product: '',
    targetAudience: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.name && profile.product && profile.targetAudience) {
      onComplete(profile);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 mb-4">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">AI 商业 IP 编导</h2>
          <p className="text-gray-400">定义您的 IP 画布，让 AI 为您定制专访。</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-300">
              <UserCircle className="w-4 h-4 mr-2" />
              IP 名称 / 专家姓名
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="例如：张医生，李老师"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-300">
              <ShoppingBag className="w-4 h-4 mr-2" />
              产品或服务
            </label>
            <input
              type="text"
              value={profile.product}
              onChange={(e) => setProfile({ ...profile, product: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="例如：高净值人群理财咨询，企业主私教课"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-300">
              <Target className="w-4 h-4 mr-2" />
              目标人群
            </label>
            <textarea
              value={profile.targetAudience}
              onChange={(e) => setProfile({ ...profile, targetAudience: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition h-24 resize-none"
              placeholder="例如：35-50岁，没有时间去健身房但想减肥的企业高管。"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.01] ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <span>正在策划采访方案...</span>
            ) : (
              <>
                <span>开始策划</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};