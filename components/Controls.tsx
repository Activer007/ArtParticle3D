import React, { useState } from 'react';
import { ParticleConfig, Painting, AIResponse } from '../types';

interface ControlsProps {
  paintings: Painting[];
  selectedPainting: Painting;
  onSelectPainting: (p: Painting) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  config: ParticleConfig;
  onConfigChange: (c: ParticleConfig) => void;
  aiData: AIResponse | null;
  isLoadingAI: boolean;
  hasGeminiApiKey: boolean;
  children?: React.ReactNode; // Add support for children (AudioPlayer)
}

const Controls: React.FC<ControlsProps> = ({
  paintings,
  selectedPainting,
  onSelectPainting,
  onUpload,
  config,
  onConfigChange,
  aiData,
  isLoadingAI,
  hasGeminiApiKey,
  children
}) => {
  const [isInsightOpen, setIsInsightOpen] = useState(true);
  
  const updateConfig = (key: keyof ParticleConfig, value: number) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-6 z-10">
      {/* Header / Painting Selector */}
      <div className="pointer-events-auto bg-black/70 backdrop-blur-md p-4 rounded-xl border border-white/10 max-w-md animate-fade-in max-h-[80vh] overflow-y-auto">
        <h1 className="mb-4">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            ArtParticle 3D
          </div>
          <div className="text-sm text-gray-400 font-light tracking-widest uppercase mt-1">
            名画粒子
          </div>
        </h1>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {paintings.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPainting(p)}
              className={`px-3 py-1 text-xs rounded-full border transition-all duration-300 ${
                selectedPainting.id === p.id
                  ? 'bg-white text-black border-white font-bold'
                  : 'bg-transparent text-gray-400 border-gray-600 hover:border-white hover:text-white'
              }`}
            >
              {p.title}
            </button>
          ))}
          <label className="cursor-pointer px-3 py-1 text-xs rounded-full border border-dashed border-gray-500 text-gray-400 hover:border-white hover:text-white transition-all flex items-center gap-1">
             <span>+ Upload</span>
             <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </label>
        </div>

        {/* AI Insight Section */}
        <div className="mt-4 border-t border-white/10 pt-4">
            <button 
                onClick={() => setIsInsightOpen(!isInsightOpen)}
                className="w-full flex items-center justify-between mb-2 group focus:outline-none"
            >
                <div className="flex items-center gap-2">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-400 group-hover:text-purple-300 transition-colors">Gemini Insight</h2>
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-3 w-3 text-purple-400 transition-transform duration-300 ${isInsightOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
                {isLoadingAI && <div className="w-3 h-3 rounded-full border-2 border-t-purple-500 animate-spin"></div>}
            </button>

            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isInsightOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                {!hasGeminiApiKey ? (
                    <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-400/30 px-3 py-2 rounded">
                        未配置 API Key。请在环境变量中设置 GEMINI_API_KEY 以启用 Gemini 分析。
                    </div>
                ) : aiData ? (
                    <div>
                        <p className="text-sm text-gray-200 leading-relaxed mb-2">{aiData.analysis}</p>
                        <div className="inline-block bg-purple-900/50 border border-purple-500/30 text-purple-200 text-xs px-2 py-1 rounded">
                            Mood: {aiData.mood}
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 italic">Analyzing masterpiece...</p>
                )}
            </div>
        </div>
      </div>

      {/* Visual Controls */}
      <div className="pointer-events-auto self-end bg-black/70 backdrop-blur-md p-5 rounded-xl border border-white/10 w-64 space-y-5">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Visualization</h3>
        
        {/* Brightness Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <label>Brightness</label>
            <span>{config.brightness.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={config.brightness}
            onChange={(e) => updateConfig('brightness', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
          />
        </div>

        {/* 3D Depth Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <label>3D Depth</label>
            <span>{config.depth.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="0.5"
            value={config.depth}
            onChange={(e) => updateConfig('depth', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Particle Density Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <label>Point Density</label>
            <span>{config.density.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="1"
            max="6"
            step="0.5"
            value={config.density}
            onChange={(e) => updateConfig('density', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
          <p className="text-[10px] text-gray-500">Higher density may reduce performance</p>
        </div>

        {/* Particle Size Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <label>Particle Size</label>
            <span>{config.size.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={config.size}
            onChange={(e) => updateConfig('size', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Dispersion Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <label>Dispersion</label>
            <span>{config.dispersion.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="0.1"
            value={config.dispersion}
            onChange={(e) => updateConfig('dispersion', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
          />
        </div>
        
        {/* Render Audio Player if provided */}
        {children}

        <div className="text-xs text-gray-500 pt-2 border-t border-white/10 text-center">
           Drag to Rotate • Scroll to Zoom
        </div>
      </div>
    </div>
  );
};

export default Controls;