'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Loader2, Check, RefreshCw, Brain, Image as ImageIcon, FileText, Terminal, Film, Tv, Camera, Newspaper, Box, ExternalLink, Search } from 'lucide-react';
import { generateEffectData, generateEffectImage } from '@/app/actions/generate-content';
import toast from 'react-hot-toast';

interface GenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: any) => void;
  initialTitle: string;
  initialDescription: string;
  variantA: string;
  variantB: string;
}

const STYLES = [
  { id: 'cinematic', label: 'Кино', icon: Film },
  { id: 'vhs', label: 'VHS 90-х', icon: Tv },
  { id: 'polaroid', label: 'Полароид', icon: Camera },
  { id: 'newspaper', label: 'Газета', icon: Newspaper },
  { id: 'render', label: '3D', icon: Box },
];

// Компонент для отображения одной ссылки
const LinkItem = ({ label, url }: { label: string, url?: string }) => {
  if (!url) return null;
  const isGoogle = url.includes('google.com/search');
  
  return (
    <div className="flex flex-col gap-1 mb-2">
      <span className="text-[10px] font-bold text-white/40 uppercase">{label}</span>
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-colors truncate ${
          isGoogle 
            ? 'bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20' 
            : 'bg-green-500/10 border-green-500/20 text-green-300 hover:bg-green-500/20'
        }`}
      >
        {isGoogle ? <Search className="w-3 h-3 shrink-0" /> : <ExternalLink className="w-3 h-3 shrink-0" />}
        <span className="truncate">{url}</span>
      </a>
    </div>
  );
};

export default function GenerationDialog({ 
  isOpen, onClose, onApply, 
  initialTitle, initialDescription, variantA, variantB 
}: GenerationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'generating' | 'review'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('cinematic');
  
  const [result, setResult] = useState<any>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

  const handleGenerate = async () => {
    setLoading(true);
    setStep('generating');
    setLogs(['ЗАПУСК НЕЙРО-МОДУЛЯ...', `СТИЛЬ ВЫБРАН: ${selectedStyle.toUpperCase()}`]);

    try {
      setTimeout(() => addLog('АНАЛИЗ КОНТЕКСТА...'), 500);
      setTimeout(() => addLog('ПОИСК АРТЕФАКТОВ (EXA.AI)...'), 1500);
      setTimeout(() => addLog('СОЗДАНИЕ ВИЗУАЛЬНОГО ПРОФИЛЯ...'), 2500);

      const res = await generateEffectData(initialTitle, initialDescription, variantA, variantB, { 
        generateImage: true,
        style: selectedStyle 
      });
      
      if (res.success && res.data) {
        setResult(res.data);
        addLog('ДАННЫЕ ПОЛУЧЕНЫ. ГОТОВО К ОБЗОРУ.');
        setStep('review');
      } else {
        addLog(`ОШИБКА: ${res.error}`);
        toast.error('Ошибка генерации');
        setStep('idle');
      }
    } catch (e) {
      addLog('КРИТИЧЕСКИЙ СБОЙ.');
      setStep('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (!result?.imagePrompt) return;
    setImageLoading(true);
    addLog(`ПЕРЕГЕНЕРАЦИЯ ФОТО (СТИЛЬ: ${selectedStyle.toUpperCase()})...`);
    try {
      const res = await generateEffectImage(initialTitle, result.imagePrompt, selectedStyle);
      if (res.success && res.imageUrl) {
        setResult((prev: any) => ({ ...prev, imageUrl: res.imageUrl }));
        addLog('ФОТО ОБНОВЛЕНО.');
        toast.success('Изображение обновлено');
      } else {
        toast.error('Ошибка генерации фото');
      }
    } catch (e) {
      toast.error('Ошибка');
    } finally {
      setImageLoading(false);
    }
  };

  const handleApply = () => {
    onApply(result);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-[#0a0a0a] w-full max-w-6xl h-[90vh] rounded-2xl border border-primary/30 shadow-[0_0_50px_rgba(6,182,212,0.1)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg text-primary"><Brain className="w-5 h-5" /></div>
            <div>
              <h2 className="font-bold text-white tracking-wider">НЕЙРО-СИНТЕЗАТОР</h2>
              <p className="text-[10px] text-primary/60 font-mono">AI CONTENT GENERATION MODULE</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar (Settings & Logs) */}
          <div className="w-80 border-r border-white/10 p-6 bg-black/40 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
            
            {/* Style Selector */}
            <div className="mb-6">
              <label className="text-xs text-white/40 font-bold uppercase mb-2 block">Стиль визуализации</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                      selectedStyle === style.id 
                        ? 'bg-primary/20 border-primary text-white' 
                        : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'
                    }`}
                  >
                    <style.icon className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-bold">{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-white/40 font-bold uppercase mb-2 block">Входные данные</label>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white/80">
                <div className="font-bold text-white mb-1">{initialTitle}</div>
                <div className="text-xs text-white/50 line-clamp-2">{initialDescription}</div>
              </div>
            </div>

            <div className="flex-1 bg-black rounded-lg border border-white/10 p-4 font-mono text-xs text-green-500/80 overflow-y-auto custom-scrollbar min-h-[150px]">
              {logs.map((log, i) => (
                <div key={i} className="mb-1 opacity-80">{log}</div>
              ))}
              {loading && <div className="animate-pulse">_</div>}
            </div>

            {step !== 'review' && (
              <button 
                onClick={handleGenerate} 
                disabled={loading}
                className="mt-6 w-full py-4 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                {loading ? 'Синтез...' : 'Запустить анализ'}
              </button>
            )}
          </div>

          {/* Main Content (Preview) */}
          <div className="flex-1 p-6 overflow-y-auto bg-[#0f0f0f] custom-scrollbar">
            {step === 'idle' || step === 'generating' ? (
              <div className="h-full flex flex-col items-center justify-center text-white/20">
                <Brain className="w-24 h-24 mb-4 opacity-20 animate-pulse" />
                <p>Выберите стиль и запустите анализ...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Left Column: Visuals & Links */}
                <div className="space-y-6">
                  {/* Image Preview */}
                  {result.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-white/10 relative group bg-black">
                      <div className="relative aspect-video w-full">
                        <img src={result.imageUrl} alt="Generated" className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-50' : 'opacity-100'}`} />
                        {imageLoading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={handleRegenerateImage}
                            disabled={imageLoading}
                            className="flex items-center gap-2 px-3 py-2 bg-black/60 hover:bg-primary/80 backdrop-blur-md text-white text-xs font-bold rounded-lg border border-white/20 transition-all"
                          >
                            <RefreshCw className={`w-3 h-3 ${imageLoading ? 'animate-spin' : ''}`} />
                            Обновить фото
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Visual Profiler */}
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <div className="flex items-center gap-2 text-purple-400 mb-2 font-bold text-xs uppercase">
                      <ImageIcon className="w-3 h-3" /> Промпт для фото (Visual Profiler)
                    </div>
                    <textarea 
                      value={result.imagePrompt} 
                      onChange={e => setResult({...result, imagePrompt: e.target.value})}
                      className="w-full bg-black/50 border border-purple-500/20 rounded-lg p-3 text-xs text-purple-200 font-mono h-24 focus:border-purple-500 outline-none resize-none"
                    />
                  </div>

                  {/* Links Section */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-white/60 mb-3 font-bold text-xs uppercase">
                      <ExternalLink className="w-3 h-3" /> Источники и Доказательства
                    </div>
                    <div className="space-y-3">
                      <LinkItem label="Доказательства (Residue)" url={result.residueSource} />
                      <LinkItem label="История" url={result.historySource} />
                      <LinkItem label="Наука" url={result.scientificSource} />
                      <LinkItem label="Сообщество" url={result.communitySource} />
                    </div>
                  </div>
                </div>

                {/* Right Column: Text Content */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-cyan-400 font-bold uppercase mb-1 block">Факты (Current State)</label>
                    <textarea 
                      value={result.currentState} 
                      onChange={e => setResult({...result, currentState: e.target.value})}
                      className="w-full bg-darkCard border border-white/10 rounded-lg p-3 text-sm text-white h-32 focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-red-400 font-bold uppercase mb-1 block">Остатки (Residue)</label>
                    <textarea 
                      value={result.residue} 
                      onChange={e => setResult({...result, residue: e.target.value})}
                      className="w-full bg-darkCard border border-white/10 rounded-lg p-3 text-sm text-white h-32 focus:border-red-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-amber-400 font-bold uppercase mb-1 block">История</label>
                    <textarea 
                      value={result.history} 
                      onChange={e => setResult({...result, history: e.target.value})}
                      className="w-full bg-darkCard border border-white/10 rounded-lg p-3 text-sm text-white h-24 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-pink-400 font-bold uppercase mb-1 block">Наука</label>
                      <textarea 
                        value={result.scientific} 
                        onChange={e => setResult({...result, scientific: e.target.value})}
                        className="w-full bg-darkCard border border-white/10 rounded-lg p-3 text-sm text-white h-24 focus:border-pink-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-pink-400 font-bold uppercase mb-1 block">Сообщество</label>
                      <textarea 
                        value={result.community} 
                        onChange={e => setResult({...result, community: e.target.value})}
                        className="w-full bg-darkCard border border-white/10 rounded-lg p-3 text-sm text-white h-24 focus:border-pink-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        {step === 'review' && (
          <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end gap-3">
            <button 
              onClick={handleGenerate}
              className="px-6 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Перегенерировать
            </button>
            <button 
              onClick={handleApply}
              className="px-8 py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
              <Check className="w-5 h-5" /> Применить данные
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
