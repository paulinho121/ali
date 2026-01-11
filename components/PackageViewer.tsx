
import React, { useState } from 'react';
import { ViralPackageResponse } from '../types';

interface PackageViewerProps {
  pkg: ViralPackageResponse;
}

const PackageViewer: React.FC<PackageViewerProps> = ({ pkg }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Target & Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
          <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Público Alvo</h3>
          <p className="text-slate-200">{pkg.campaign_analysis.target_audience}</p>
        </div>
        <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
          <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Dor Solucionada</h3>
          <p className="text-slate-200">{pkg.campaign_analysis.pain_point_addressed}</p>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Voiceover Script */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="bg-slate-800/50 px-6 py-4 flex justify-between items-center border-b border-slate-800">
              <h3 className="font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
                Script de Locução (Voz UGC)
              </h3>
              <button 
                onClick={() => copyToClipboard(pkg.video_assets.script_voiceover, 'script')}
                className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
              >
                {copied === 'script' ? 'Copiado!' : 'Copiar Script'}
              </button>
            </div>
            <div className="p-6">
              <p className="text-lg leading-relaxed text-slate-300 italic">
                "{pkg.video_assets.script_voiceover}"
              </p>
            </div>
          </div>

          {/* Storyboard */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Roteiro Visual (Storyboard)
            </h3>
            <div className="space-y-4">
              {pkg.video_assets.visual_storyboard.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start p-4 bg-slate-800/30 rounded-2xl border border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                  <div className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded min-w-[50px] text-center">
                    {item.time}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-100 mb-1">{item.visual}</p>
                    <p className="text-xs text-orange-400 font-mono">TEXTO NA TELA: "{item.overlay_text}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Assets */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
             <h3 className="font-bold mb-4 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 012 2v9l-2.333-2.333L10.333 20H4a2 2 0 01-2-2V5z" />
              </svg>
              Legenda Estratégica
            </h3>
            <div className="relative group">
              <textarea 
                readOnly
                value={pkg.metadata.caption}
                className="w-full h-40 bg-slate-800/50 rounded-xl p-4 text-sm text-slate-300 border border-slate-700 focus:outline-none resize-none"
              />
              <button 
                onClick={() => copyToClipboard(pkg.metadata.caption, 'caption')}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700 hover:bg-slate-600 p-2 rounded-lg text-xs"
              >
                {copied === 'caption' ? '✅' : '📋'}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {pkg.metadata.hashtags.map((tag, i) => (
                <span key={i} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Music Vibe */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6">
            <h3 className="font-bold mb-2 text-sm text-indigo-300 uppercase tracking-widest">Vibe da Música</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center animate-pulse">
                 <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.045-3 2.333S3.343 18.667 5 18.667s3-1.045 3-2.334V7.38l8-1.6V11.114A4.369 4.369 0 0015 11c-1.657 0-3 1.045-3 2.333s1.343 2.334 3 2.334s3-1.045 3-2.334V3z" />
                </svg>
              </div>
              <p className="text-indigo-200 font-semibold">{pkg.metadata.recommended_music_vibe}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageViewer;
