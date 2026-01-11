
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-6 px-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-lg shadow-lg shadow-orange-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">ViralCommerce AI</h1>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Agente Viral AliExpress 2026</p>
          </div>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-orange-400 transition-colors">Dashboard</a>
          <a href="#" className="hover:text-orange-400 transition-colors">Histórico</a>
          <a href="#" className="hover:text-orange-400 transition-colors">Suporte</a>
        </div>
      </div>
    </header>
  );
};

export default Header;
