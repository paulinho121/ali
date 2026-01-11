
import React, { useState } from 'react';
import { ProductData, ViralPackageResponse } from './types';
import { generateViralPackage } from './services/geminiService';
import Header from './components/Header';
import PackageViewer from './components/PackageViewer';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packageResult, setPackageResult] = useState<ViralPackageResponse | null>(null);
  const [automationStatus, setAutomationStatus] = useState<any>(null);
  const [isRunningAutomation, setIsRunningAutomation] = useState(false);

  const [formData, setFormData] = useState<ProductData>({
    product_name: '',
    product_description: '',
    price_usd: '',
    shipping_info: 'Frete Grátis',
    rating: '4.8',
    video_assets_urls: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await generateViralPackage(formData);
      setPackageResult(result);
    } catch (err: any) {
      setError(err.message || 'Falha ao gerar pacote viral. Verifique sua chave de API.');
    } finally {
      setLoading(false);
    }
  };

  const handleJsonPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    try {
      const pastedText = e.clipboardData.getData('text');
      const jsonData = JSON.parse(pastedText);
      if (jsonData.product_name) {
        setFormData({
          product_name: jsonData.product_name || '',
          product_description: jsonData.product_description || '',
          price_usd: jsonData.price_usd || '',
          shipping_info: jsonData.shipping_info || 'Frete Grátis',
          rating: jsonData.rating || '4.8',
          video_assets_urls: jsonData.video_assets_urls || ''
        });
      }
    } catch (err) {
      // Not a valid JSON or doesn't match schema, ignore and let standard paste happen
    }
  };

  const handleRunAutomation = async () => {
    setIsRunningAutomation(true);
    try {
      const response = await fetch('/api/automation/run', { method: 'POST' });
      const data = await response.json();
      setAutomationStatus(data);
    } catch (err) {
      console.error('Failed to run automation:', err);
    } finally {
      setIsRunningAutomation(false);
    }
  };

  const handleConnectTikTok = () => {
    window.location.href = '/api/auth/tiktok';
  };

  return (
    <div className="min-h-screen pb-20 text-white">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Automation Dashboard Wrapper */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                Agente Viral Automático
              </h3>
              <p className="text-xs text-slate-400">Postagem diária ativa às 09:00</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConnectTikTok}
                className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-slate-700 transition-all border border-slate-700"
              >
                Conectar TikTok
              </button>
              <button
                onClick={handleRunAutomation}
                disabled={isRunningAutomation}
                className="bg-white text-black text-xs font-bold px-4 py-2 rounded-full hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50"
              >
                {isRunningAutomation ? 'Processando...' : 'Rodar Agora'}
              </button>
            </div>
          </div>

          {automationStatus && (
            <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 text-sm">
              <p className="text-slate-500 mb-2 font-mono">Última execução: {new Date().toLocaleTimeString()}</p>
              <div className="flex gap-4">
                <div className="flex items-center gap-1 text-green-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  TikTok: OK
                </div>
                <div className="flex items-center gap-1 text-green-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Instagram: OK
                </div>
              </div>
              <p className="mt-2 font-bold text-orange-500">Produto: {automationStatus.result?.product}</p>
            </div>
          )}
        </section>
        {!packageResult && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">Pronto para Viralizar?</h2>
              <p className="text-slate-400">Insira os dados da API do AliExpress abaixo para gerar seus ativos de marketing.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl shadow-2xl backdrop-blur-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome do Produto</label>
                  <input
                    name="product_name"
                    value={formData.product_name}
                    onChange={handleInputChange}
                    placeholder="Ex: Teclado Mecânico RGB"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Preço (USD)</label>
                  <input
                    name="price_usd"
                    value={formData.price_usd}
                    onChange={handleInputChange}
                    placeholder="Ex: 24.90"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Descrição Bruta (Cole aqui)</label>
                <textarea
                  name="product_description"
                  value={formData.product_description}
                  onChange={handleInputChange}
                  onPaste={handleJsonPaste}
                  placeholder="Cole a descrição ou o JSON completo da API do AliExpress..."
                  className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                  required
                />
                <p className="text-[10px] text-slate-500 italic">Dica: Você pode colar o JSON direto da API aqui!</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Frete</label>
                  <input
                    name="shipping_info"
                    value={formData.shipping_info}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nota</label>
                  <input
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3 transition-all transform active:scale-95"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Otimizando para Viralizar...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.3 1.047a1 1 0 01.897.95l1.046 15.54a1 1 0 01-1.704.706l-4.14-4.14-3.011 3.012a1 1 0 01-1.707-.708V1.707a1 1 0 011.707-.707l3.586 3.586 2.425-3.539z" clipRule="evenodd" />
                    </svg>
                    <span>Gerar Estratégia Viral</span>
                  </>
                )}
              </button>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                  {error}
                </div>
              )}
            </form>
          </div>
        )}

        {packageResult && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <button
                onClick={() => setPackageResult(null)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar
              </button>
              <h2 className="text-2xl font-extrabold text-white">Pacote Gerado: <span className="text-orange-500">{formData.product_name}</span></h2>
              <div className="flex gap-2">
                <button className="bg-slate-800 hover:bg-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors border border-slate-700">Baixar Ativos</button>
                <button className="bg-orange-500 hover:bg-orange-600 text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-orange-500/20">Publicar Agora</button>
              </div>
            </div>

            <PackageViewer pkg={packageResult} />
          </div>
        )}
      </main>

      {/* Persistent CTA on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 border-t border-slate-800 backdrop-blur-lg">
        {!packageResult && !loading && (
          <button
            onClick={() => {
              const form = document.querySelector('form');
              if (form) form.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20"
          >
            Gerar Achadinho 🔥
          </button>
        )}
      </div>
    </div>
  );
};

export default App;
