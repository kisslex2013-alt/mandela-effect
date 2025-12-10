'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Check, RefreshCw, Brain, Image as ImageIcon, FileText, Terminal, Film, Tv, Camera, Newspaper, Box, ExternalLink, Search, Archive, Maximize2 } from 'lucide-react';
import { generateEffectData, generateEffectImage } from '@/app/actions/generate-content';
import { generateResidueDorks, DorkLink } from '@/lib/dorks';
import { searchWaybackImages } from '@/app/actions/wayback-search';
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

export default function GenerationDialog({
  isOpen,
  onClose,
  onApply,
  initialTitle,
  initialDescription,
  variantA: initVariantA,
  variantB: initVariantB
}: GenerationDialogProps) {
  const [step, setStep] = useState<'input' | 'processing' | 'review'>('input');
  const [logs, setLogs] = useState<string[]>([]);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [selectedStyle, setSelectedStyle] = useState('cinematic');
  
  // Input states
  const [title, setTitle] = useState(initialTitle);
  const [question, setQuestion] = useState(initialDescription);
  const [variantA, setVariantA] = useState(initVariantA);
  const [variantB, setVariantB] = useState(initVariantB);

  // OSINT States
  const [dorks, setDorks] = useState<DorkLink[]>([]);
  const [waybackImages, setWaybackImages] = useState<any[]>([]);
  const [waybackLogs, setWaybackLogs] = useState<string[]>([]);
  const [osintTab, setOsintTab] = useState<'dorks' | 'wayback'>('dorks');
  const [isSearchingWayback, setIsSearchingWayback] = useState(false);
  
  // Lightbox State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setQuestion(initialDescription);
      setVariantA(initVariantA);
      setVariantB(initVariantB);
      setStep('input');
      setLogs([]);
      setGeneratedData(null);
      setWaybackImages([]);
      setWaybackLogs([]);
      setSelectedImage(null);
      if (initialTitle) setDorks(generateResidueDorks(initialTitle));
    }
  }, [isOpen, initialTitle, initialDescription, initVariantA, initVariantB]);

  useEffect(() => {
    if (title) setDorks(generateResidueDorks(title));
  }, [title]);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleWaybackSearch = async () => {
    if (!title) return;
    setIsSearchingWayback(true);
    setWaybackLogs(['⏳ Запуск поиска...']);
    setWaybackImages([]);

    const query = title.split(' ').find(w => /^[a-zA-Z0-9]+$/.test(w)) || title.split(' ')[0];
    setWaybackLogs(prev => [...prev, `🔎 Query extracted: "${query}"`]);

    try {
      const res = await searchWaybackImages(query);
      if (res.logs) setWaybackLogs(prev => [...prev, ...res.logs]);

      if (res.success) {
        setWaybackImages(res.images);
        if (res.images.length === 0) {
           toast('Ничего не найдено (см. логи)');
           setWaybackLogs(prev => [...prev, '⚠️ Результат пуст']);
        } else {
           setWaybackLogs(prev => [...prev, `✅ Загружено ${res.images.length} фото`]);
        }
      } else {
        toast.error('Ошибка Wayback API');
      }
    } catch (e: any) {
      console.error(e);
      setWaybackLogs(prev => [...prev, `❌ Error: ${e.message}`]);
    } finally {
      setIsSearchingWayback(false);
    }
  };

  const handleGenerate = async () => {
    setStep('processing');
    addLog('🚀 Запуск нейро-синтезатора...');
    addLog(`🔍 Анализ объекта: ${title}`);

    try {
      addLog('📡 Поиск следов (Exa.ai + RAG)...');
      const result = await generateEffectData(title, question, variantA, variantB, { style: selectedStyle });

      if (result.success && result.data) {
        addLog(`✅ Данные получены (Модель: ${result.usedModel})`);
        if (result.data.imageUrl) addLog('🎨 Изображение сгенерировано (Flux)');
        setGeneratedData(result.data);
        setStep('review');
      } else {
        addLog(`❌ Ошибка: ${result.error}`);
        toast.error('Ошибка генерации');
        setTimeout(() => setStep('input'), 3000);
      }
    } catch (e) {
      addLog('❌ Критическая ошибка генерации');
      console.error(e);
      setStep('input');
    }
  };

  const handleRegenerateImage = async () => {
    if (!generatedData) return;
    addLog('🎨 Перегенерация изображения...');
    const toastId = toast.loading('Генерируем картинку...');
    try {
      const res = await generateEffectImage(title, generatedData.imagePrompt, selectedStyle);
      if (res.success && res.imageUrl) {
        setGeneratedData({ ...generatedData, imageUrl: res.imageUrl });
        addLog('✅ Новое изображение готово');
        toast.success('Изображение обновлено', { id: toastId });
      } else {
        toast.error('Ошибка генерации', { id: toastId });
      }
    } catch (e) {
      toast.error('Ошибка сети', { id: toastId });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#1a1a1a] border border-white/10 w-full max-w-7xl h-[95vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden relative"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Brain size={18} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Нейро-Синтезатор <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">v2.4 PRO</span>
                </h2>
                <p className="text-xs text-gray-400">AI Content Generation Module</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-hidden relative flex flex-col">
            
            {/* STEP 1: INPUT */}
            {step === 'input' && (
              <motion.div 
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 p-6 overflow-hidden"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                  {/* Left: Form (6 cols) */}
                  <div className="lg:col-span-6 space-y-6 overflow-y-auto custom-scrollbar pr-2 h-full pb-20">
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-400">Название эффекта</label>
                      <input 
                        value={title} 
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none transition"
                        placeholder="Например: Люк, я твой отец"
                      />
                      
                      <label className="block text-sm font-medium text-gray-400">Вопрос / Описание</label>
                      <textarea 
                        value={question} 
                        onChange={e => setQuestion(e.target.value)}
                        rows={3}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none transition resize-none"
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-red-400 uppercase mb-2">Ложное воспоминание (A)</label>
                          <input 
                            value={variantA} 
                            onChange={e => setVariantA(e.target.value)}
                            className="w-full bg-black/40 border border-red-500/30 rounded-lg p-3 text-white focus:border-red-500 outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-green-400 uppercase mb-2">Реальность (B)</label>
                          <input 
                            value={variantB} 
                            onChange={e => setVariantB(e.target.value)}
                            className="w-full bg-black/40 border border-green-500/30 rounded-lg p-3 text-white focus:border-green-500 outline-none transition"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-400">Стиль визуализации</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {STYLES.map(style => (
                          <button
                            key={style.id}
                            onClick={() => setSelectedStyle(style.id)}
                            className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition ${
                              selectedStyle === style.id 
                                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' 
                                : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            <style.icon size={20} />
                            <span className="text-xs font-medium">{style.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: OSINT Tools (6 cols - FULL HEIGHT) */}
                  <div className="lg:col-span-6 bg-black/20 rounded-xl border border-white/5 p-4 flex flex-col h-full overflow-hidden">
                     <div className="flex items-center justify-between mb-4 shrink-0">
                        <div className="flex items-center gap-2 text-cyan-400">
                          <Search size={18} />
                          <span className="text-sm font-bold uppercase tracking-wider">Разведка</span>
                        </div>
                        <div className="flex bg-black/40 rounded-lg p-1">
                          <button 
                            onClick={() => setOsintTab('dorks')}
                            className={`px-3 py-1 text-xs rounded-md transition ${osintTab === 'dorks' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-white'}`}
                          >
                            Dorks
                          </button>
                          <button 
                            onClick={() => setOsintTab('wayback')}
                            className={`px-3 py-1 text-xs rounded-md transition ${osintTab === 'wayback' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-white'}`}
                          >
                            Wayback
                          </button>
                        </div>
                      </div>

                      {/* TABS CONTENT - FULL HEIGHT */}
                      <div className="flex-1 overflow-hidden relative flex flex-col">
                        
                        {/* DORKS TAB */}
                        {osintTab === 'dorks' && (
                          <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar h-full">
                            {dorks.length > 0 ? (
                              dorks.map((link, idx) => (
                                <a
                                  key={idx}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition group"
                                >
                                  <div className="flex flex-col gap-1">
                                    <span className="text-sm text-gray-200 font-bold group-hover:text-cyan-400 transition">{link.title}</span>
                                    <span className="text-xs text-gray-500">{link.description}</span>
                                  </div>
                                  <ExternalLink size={16} className="text-gray-600 group-hover:text-cyan-400 transition" />
                                </a>
                              ))
                            ) : (
                               <div className="text-center text-gray-600 py-20 text-sm">Введите название эффекта</div>
                            )}
                          </div>
                        )}

                        {/* WAYBACK TAB */}
                        {osintTab === 'wayback' && (
                          <div className="flex flex-col h-full gap-4">
                            <div className="flex justify-between items-center shrink-0">
                               <p className="text-xs text-gray-500">Поиск архивных фото (1995-2010)</p>
                               <button 
                                  onClick={handleWaybackSearch}
                                  disabled={isSearchingWayback}
                                  className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded transition disabled:opacity-50 font-bold"
                               >
                                 {isSearchingWayback ? 'Ищем...' : 'Сканировать Архив'}
                               </button>
                            </div>
                            
                            {/* Images Grid - Максимальная высота */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 bg-black/20 rounded-lg p-2 border border-white/5">
                               {waybackImages.length > 0 ? (
                                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                   {waybackImages.map((img, i) => (
                                     <div 
                                       key={i} 
                                       className="aspect-square bg-black/40 rounded border border-white/10 overflow-hidden hover:border-purple-500 transition relative group cursor-pointer"
                                       onClick={() => setSelectedImage(img.archiveUrl)}
                                     >
                                        <img src={img.archiveUrl} alt="Archive" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                            <Maximize2 className="text-white" size={24} />
                                        </div>
                                        <span className="absolute bottom-1 right-1 text-[10px] bg-black/80 text-white px-1 rounded font-mono">{img.timestamp}</span>
                                     </div>
                                   ))}
                                 </div>
                               ) : (
                                 <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                                   <Archive size={32} className="opacity-20" />
                                   <div className="text-xs text-center max-w-[200px]">
                                      {!isSearchingWayback ? 'Нажмите "Сканировать", чтобы найти старые версии сайтов.' : 'Идет поиск по архивам интернета...'}
                                   </div>
                                 </div>
                               )}
                            </div>

                            {/* LOGS - фиксированная высота внизу */}
                            <div className="h-[120px] shrink-0 bg-black/40 rounded p-2 text-[10px] font-mono text-gray-500 overflow-y-auto border border-white/5 custom-scrollbar">
                               <div className="mb-1 text-purple-400 font-bold sticky top-0 bg-black/90 pb-1 border-b border-white/5 w-full">SYSTEM LOGS:</div>
                               {waybackLogs.map((l, i) => (
                                 <div key={i} className="whitespace-nowrap">{l}</div>
                               ))}
                            </div>
                          </div>
                        )}
                      </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* LIGHTBOX OVERLAY */}
            <AnimatePresence>
              {selectedImage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-8 backdrop-blur-md"
                  onClick={() => setSelectedImage(null)}
                >
                  <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition">
                    <X size={24} />
                  </button>
                  <img 
                    src={selectedImage} 
                    alt="Full size" 
                    className="max-w-full max-h-full object-contain rounded shadow-2xl border border-white/10" 
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <a 
                      href={selectedImage} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Открыть оригинал <ExternalLink size={14} />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PROCESSING STEP */}
            {step === 'processing' && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full space-y-8"
              >
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full animate-ping" />
                  <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain size={48} className="text-cyan-500 animate-pulse" />
                  </div>
                </div>
                
                <div className="w-full max-w-lg bg-black/50 rounded-xl border border-white/10 overflow-hidden">
                   <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center gap-2">
                    <Terminal size={14} className="text-gray-400" />
                    <span className="text-xs font-mono text-gray-400">SYSTEM_LOGS</span>
                  </div>
                   <div className="p-4 font-mono text-xs h-48 overflow-y-auto custom-scrollbar space-y-2">
                    {logs.map((log, i) => (
                      <div key={i} className="text-green-400/80 border-l-2 border-green-500/30 pl-2">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* REVIEW STEP */}
            {step === 'review' && generatedData && (
              <motion.div 
                key="review"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto p-6 custom-scrollbar pb-20"
              >
                   <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                      {/* Image Block */}
                      <div className="xl:col-span-4 space-y-6">
                        <div className="bg-black/40 rounded-xl border border-white/10 p-4 space-y-4">
                           <div className="flex items-center gap-2 text-cyan-400 mb-2">
                              <ImageIcon size={18} />
                              <span className="text-xs font-bold uppercase">Визуализация (Flux)</span>
                           </div>
                           <img src={generatedData.imageUrl} className="w-full rounded-lg" />
                           <button onClick={handleRegenerateImage} className="w-full p-2 bg-white/10 rounded text-sm hover:bg-white/20">Перегенерировать</button>
                        </div>
                        {/* Sources */}
                         <div className="bg-black/40 rounded-xl border border-white/10 p-4 space-y-4">
                           <label className="text-xs text-purple-400 font-bold uppercase">Residue Link</label>
                           <input value={generatedData.residueSource} onChange={e => setGeneratedData({...generatedData, residueSource: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs text-white" />
                           <label className="text-xs text-yellow-400 font-bold uppercase mt-2 block">History Link</label>
                           <input value={generatedData.historySource} onChange={e => setGeneratedData({...generatedData, historySource: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs text-white" />
                         </div>
                      </div>
                      
                      {/* Text Blocks */}
                      <div className="xl:col-span-8 space-y-6">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="text-xs font-bold text-green-500 uppercase block mb-1">Факты</label>
                               <textarea value={generatedData.currentState} onChange={e => setGeneratedData({...generatedData, currentState: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-4 text-sm text-white h-40 resize-none" />
                            </div>
                            <div>
                               <label className="text-xs font-bold text-purple-500 uppercase block mb-1">Residue</label>
                               <textarea value={generatedData.residue} onChange={e => setGeneratedData({...generatedData, residue: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-4 text-sm text-white h-40 resize-none" />
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="text-xs font-bold text-blue-500 uppercase block mb-1">Наука</label>
                               <textarea value={generatedData.scientific} onChange={e => setGeneratedData({...generatedData, scientific: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-4 text-sm text-white h-32 resize-none" />
                            </div>
                            <div>
                               <label className="text-xs font-bold text-orange-500 uppercase block mb-1">Сообщество</label>
                               <textarea value={generatedData.community} onChange={e => setGeneratedData({...generatedData, community: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded p-4 text-sm text-white h-32 resize-none" />
                            </div>
                         </div>
                      </div>
                   </div>
              </motion.div>
            )}

          </div>
          
           {/* Footer */}
           <div className="p-4 border-t border-white/10 bg-[#1a1a1a] flex justify-end gap-3 z-10 shrink-0">
             {step === 'review' ? (
                <>
                  <button 
                    onClick={() => setStep('input')}
                    className="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/10 transition text-sm"
                  >
                    Назад
                  </button>
                  <button 
                    onClick={() => onApply(generatedData)}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold transition flex items-center gap-2 text-sm"
                  >
                    <Check size={18} /> Применить данные
                  </button>
                </>
             ) : (
                step === 'input' && (
                  <button 
                    onClick={handleGenerate}
                    disabled={!title}
                    className="px-6 py-2 rounded-lg bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition disabled:opacity-50"
                  >
                    <Wand2 size={18} className="inline mr-2" /> Запустить Синтез
                  </button>
                )
             )}
           </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
