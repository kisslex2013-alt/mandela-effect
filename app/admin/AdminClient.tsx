'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { updateEffect, deleteEffect, logout, approveSubmission, rejectSubmission, createEffect, migrateData } from '@/app/actions/admin';
import { moderateComment } from '@/app/actions/comments';
import { generateEffectData, generateEffectImage, restyleImage, fitImageToFormat } from '@/app/actions/generate-content';
import { findNewEffects } from '@/app/actions/find-new-effects';
import { SECTORS } from '@/lib/constants';
import { createCategory, type Category } from '@/app/actions/category';
import toast from 'react-hot-toast';
import { 
  LayoutGrid, Inbox, Tags, Plus, LogOut, ArrowLeft, 
  Zap, ScanSearch, MessageSquare, ListChecks, Trash2, Eye, EyeOff, FileText, ImageIcon, Loader2, Check, X, Cpu, Database
} from 'lucide-react';

import EffectsTab from '@/components/admin/tabs/EffectsTab';
import dynamic from 'next/dynamic';

const EffectEditorModal = dynamic(() => import('@/components/admin/modals/EffectEditorModal'), { ssr: false });
const ImageUploadModal = dynamic(() => import('@/components/admin/modals/ImageUploadModal'), { ssr: false });
const NeuralLink = dynamic(() => import('@/components/admin/NeuralLink'), { ssr: false });

// Типы
interface Effect { id: string; title: string; description: string; content: string; category: string; imageUrl: string | null; imageSourceType?: any; imageSourceValue?: string | null; votesFor: number; votesAgainst: number; views: number; residue: string | null; residueSource: string | null; history: string | null; historySource: string | null; interpretations: any; isVisible?: boolean; createdAt: string; updatedAt: string; }
interface Submission { id: string; category: string; title: string; question: string; variantA: string; variantB: string; currentState: string | null; sourceLink: string | null; submitterEmail: string | null; interpretations: any; status: string; createdAt: string; }
interface Comment { id: string; effectId: string; effectTitle: string; visitorId: string; type: 'WITNESS' | 'ARCHAEOLOGIST' | 'THEORIST'; text: string; imageUrl: string | null; videoUrl: string | null; audioUrl: string | null; theoryType: string | null; status: 'PENDING' | 'APPROVED' | 'REJECTED'; likes: number; reports: number; createdAt: string; moderatedAt: string | null; }

interface AdminClientProps {
  effects: Effect[]; 
  submissions: Submission[]; 
  categories: Category[];
  comments: Comment[];
}

export default function AdminClient({ effects: initialEffects, submissions: initialSubmissions, categories: initialCategories, comments: initialComments }: AdminClientProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  
  const [effects, setEffects] = useState<Effect[]>(initialEffects);
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  
  const [activeTab, setActiveTab] = useState<'effects' | 'submissions' | 'categories' | 'comments'>('effects');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quickLoading, setQuickLoading] = useState<{ id: string, type: string } | null>(null);
  
  const [editorState, setEditorState] = useState<{ isOpen: boolean; effect: any | null }>({ isOpen: false, effect: null });
  const [imageModalState, setImageModalState] = useState<{ isOpen: boolean; effect: Effect | null; url: string }>({ isOpen: false, effect: null, url: '' });
  const [isFinderOpen, setIsFinderOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isNeuralLinkOpen, setIsNeuralLinkOpen] = useState(false);
  
  const [finderLoading, setFinderLoading] = useState(false);
  const [foundEffects, setFoundEffects] = useState<any[]>([]);
  const [selectedSector, setSelectedSector] = useState(SECTORS[0]);
  
  const [bulkInput, setBulkInput] = useState('');
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkLogs, setBulkLogs] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [neuralLogs, setNeuralLogs] = useState<string[]>([]);
  const addNeuralLog = (msg: string) => setNeuralLogs(prev => [...prev, msg]);

  const handleSaveEffect = async (data: any) => {
    const interpretations: Record<string, string> = {};
    if (data.scientificInterpretation) interpretations.scientific = data.scientificInterpretation;
    if (data.scientificSource) interpretations.scientificSource = data.scientificSource;
    if (data.communityInterpretation) interpretations.community = data.communityInterpretation;
    if (data.communitySource) interpretations.communitySource = data.communitySource;
    if (data.sourceLink) interpretations.sourceLink = data.sourceLink;

    const newContent = `Вариант А: ${data.variantA}\nВариант Б: ${data.variantB}${data.currentState ? `\nТекущее состояние: ${data.currentState}` : ''}`;
    const payload = {
      title: data.title, description: data.description, content: newContent, category: data.category,
      imageUrl: data.imageUrl || undefined, 
      currentState: data.currentState || undefined,
      residue: data.residue || undefined, residueSource: data.residueSource || undefined,
      history: data.history || undefined, historySource: data.historySource || undefined,
      interpretations: Object.keys(interpretations).length > 0 ? interpretations : undefined,
    };

    let result;
    if (editorState.effect && editorState.effect.id) {
      result = await updateEffect(editorState.effect.id, payload);
    } else {
      result = await createEffect(payload);
    }

    if (result.success) {
      if (editorState.effect && editorState.effect.id) {
        setEffects(prev => prev.map(e => e.id === editorState.effect!.id ? { ...e, ...data, content: newContent, interpretations, currentState: data.currentState } : e));
        addNeuralLog(`UPDATED EFFECT: ${data.title}`);
      } else {
        router.refresh();
        addNeuralLog(`CREATED EFFECT: ${data.title}`);
      }
      toast.success('Сохранено');
      setEditorState({ isOpen: false, effect: null });
    } else toast.error(result.error || 'Ошибка');
  };

  const handleDeleteEffect = async (id: string) => {
    if (!confirm('Удалить?')) return;
    const result = await deleteEffect(id);
    if (result.success) { 
      setEffects(prev => prev.filter(e => e.id !== id)); 
      toast.success('Удалено'); 
      addNeuralLog(`DELETED EFFECT ID: ${id}`);
    } else toast.error('Ошибка');
  };

  const handleToggleVisibility = async (effect: Effect) => {
    const newStatus = !effect.isVisible;
    const result = await updateEffect(effect.id, { isVisible: newStatus });
    if (result.success) {
      setEffects(prev => prev.map(e => e.id === effect.id ? { ...e, isVisible: newStatus } : e));
      toast.success(newStatus ? 'Опубликован' : 'Скрыт');
      addNeuralLog(`VISIBILITY CHANGED: ${effect.title} -> ${newStatus}`);
    }
  };

  const handleQuickAction = async (effect: Effect, type: 'data' | 'image' | 'restyle' | 'fit') => {
    setQuickLoading({ id: effect.id, type });
    addNeuralLog(`INITIATING ACTION [${type.toUpperCase()}] FOR: ${effect.title}`);
    try {
      if (type === 'data') {
        const contentLines = effect.content.split('\n');
        const vA = contentLines.find(l => l.startsWith('Вариант А:'))?.replace('Вариант А: ', '').trim() || '';
        const vB = contentLines.find(l => l.startsWith('Вариант Б:'))?.replace('Вариант Б: ', '').trim() || '';
        
        const res = await generateEffectData(effect.title, effect.description, vA, vB, { generateImage: false });
        
        if (res.success && res.data) {
          await updateEffect(effect.id, {
            category: res.data.category,
            currentState: res.data.currentState,
            residue: res.data.residue,
            residueSource: res.data.residueSource,
            history: res.data.history,
            historySource: res.data.historySource,
            interpretations: {
              scientific: res.data.scientific,
              scientificSource: res.data.scientificSource,
              community: res.data.community,
              communitySource: res.data.communitySource,
              sourceLink: res.data.sourceLink,
            },
          });

          setEffects(prev => prev.map(e => {
            if (e.id === effect.id) {
              return {
                ...e,
                category: res.data!.category || e.category,
                currentState: res.data!.currentState,
                residue: res.data!.residue,
                residueSource: res.data!.residueSource,
                history: res.data!.history,
                historySource: res.data!.historySource,
                interpretations: {
                  ...(e.interpretations as any || {}),
                  scientific: res.data!.scientific,
                  scientificSource: res.data!.scientificSource,
                  community: res.data!.community,
                  communitySource: res.data!.communitySource,
                  sourceLink: res.data!.sourceLink,
                },
              };
            }
            return e;
          }));
          
          toast.success('Данные обновлены и сохранены');
          addNeuralLog(`DATA GENERATED & SAVED FOR: ${effect.title}`);
        } else {
          toast.error('Ошибка AI');
        }
      } else if (type === 'image') {
        const res = await generateEffectImage(effect.title);
        if (res.success && res.imageUrl) {
          await updateEffect(effect.id, { imageUrl: res.imageUrl });
          setEffects(prev => prev.map(e => e.id === effect.id ? { ...e, imageUrl: res.imageUrl! } : e));
          toast.success('Картинка создана');
          addNeuralLog(`IMAGE GENERATED FOR: ${effect.title}`);
        }
      } else if (type === 'restyle' && effect.imageUrl) {
        const res = await restyleImage(effect.title, effect.imageUrl);
        if (res.success && res.imageUrl) {
          await updateEffect(effect.id, { imageUrl: res.imageUrl });
          setEffects(prev => prev.map(e => e.id === effect.id ? { ...e, imageUrl: res.imageUrl! } : e));
          toast.success('Рестайлинг выполнен');
          addNeuralLog(`RESTYLE COMPLETE FOR: ${effect.title}`);
        }
      } else if (type === 'fit' && effect.imageUrl) {
        const res = await fitImageToFormat(effect.title, effect.imageUrl);
        if (res.success && res.imageUrl) {
          await updateEffect(effect.id, { imageUrl: res.imageUrl });
          setEffects(prev => prev.map(e => e.id === effect.id ? { ...e, imageUrl: res.imageUrl! } : e));
          toast.success('Формат исправлен');
          addNeuralLog(`FORMAT FIXED FOR: ${effect.title}`);
        }
      }
    } catch (e) { toast.error('Ошибка'); } finally { setQuickLoading(null); }
  };

  const handleSaveImage = async (url: string, type: any, value?: string) => {
    if (!imageModalState.effect) return;
    const result = await updateEffect(imageModalState.effect.id, { 
      imageUrl: url, imageSourceType: type, imageSourceValue: value 
    });
    if (result.success) {
      setEffects(prev => prev.map(e => e.id === imageModalState.effect!.id ? { 
        ...e, imageUrl: url, imageSourceType: type, imageSourceValue: value 
      } : e));
      toast.success('Картинка обновлена');
      addNeuralLog(`MANUAL IMAGE UPDATE: ${imageModalState.effect.title}`);
    } else toast.error('Ошибка');
  };

  const handleBulkProcess = async (type: 'data' | 'image' | 'restyle' | 'fit') => {
    if (selectedIds.size === 0 || !confirm(`Обработать ${selectedIds.size} шт?`)) return;
    setBulkLoading(true);
    addNeuralLog(`STARTING BULK PROCESS [${type.toUpperCase()}] FOR ${selectedIds.size} ITEMS`);
    for (const id of Array.from(selectedIds)) {
      const effect = effects.find(e => e.id === id);
      if (effect) await handleQuickAction(effect, type);
    }
    setBulkLoading(false);
    toast.success('Готово');
    addNeuralLog(`BULK PROCESS COMPLETE`);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Удалить ${selectedIds.size} шт?`)) return;
    for (const id of Array.from(selectedIds)) await deleteEffect(id);
    setEffects(prev => prev.filter(e => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
    toast.success('Удалено');
    addNeuralLog(`BULK DELETE EXECUTED`);
  };

  const handleBulkVisibility = async (isVisible: boolean) => {
    setBulkLoading(true);
    for (const id of Array.from(selectedIds)) await updateEffect(id, { isVisible });
    setEffects(prev => prev.map(e => selectedIds.has(e.id) ? { ...e, isVisible } : e));
    setBulkLoading(false);
    toast.success('Обновлено');
    addNeuralLog(`BULK VISIBILITY SET TO: ${isVisible}`);
  };

  const handleApproveSubmission = async (sub: Submission) => {
    const content = `Вариант А: ${sub.variantA}\nВариант Б: ${sub.variantB}${sub.currentState ? `\nТекущее состояние: ${sub.currentState}` : ''}`;
    const result = await approveSubmission(sub.id, { title: sub.title, description: sub.question, content, category: sub.category, interpretations: sub.interpretations });
    if (result.success) { 
      setSubmissions(prev => prev.filter(s => s.id !== sub.id)); 
      toast.success('Одобрено'); 
      router.refresh(); 
      addNeuralLog(`SUBMISSION APPROVED: ${sub.title}`);
    }
  };
  const handleRejectSubmission = async (id: string) => {
    if (await rejectSubmission(id).then(r => r.success)) { 
      setSubmissions(prev => prev.filter(s => s.id !== id)); 
      toast.success('Отклонено'); 
      addNeuralLog(`SUBMISSION REJECTED ID: ${id}`);
    }
  };
  const handleModerateComment = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (await moderateComment(id, status).then(r => r.success)) { 
      setComments(prev => prev.filter(c => c.id !== id)); 
      toast.success(status === 'APPROVED' ? 'Одобрено' : 'Отклонено'); 
      addNeuralLog(`COMMENT MODERATED: ${status}`);
    }
  };

  const handleFindNew = async () => {
    setFinderLoading(true);
    addNeuralLog(`STARTING AGENT SEARCH IN SECTOR: ${selectedSector}...`);
    try {
      const res = await findNewEffects(effects.map(e => e.title), selectedSector);
      if (res.success && res.data) {
        setFoundEffects(res.data);
        addNeuralLog(`AGENT FOUND ${res.data.length} NEW EFFECTS`);
      } else {
        toast.error(res.error || 'Ничего не найдено');
        addNeuralLog(`SEARCH FAILED: ${res.error}`);
      }
    } catch (e) { toast.error('Ошибка поиска'); } finally { setFinderLoading(false); }
  };

  // Функция для переноса найденного эффекта в редактор
  const handleUseFoundEffect = (found: any) => {
    // Формируем контент для парсера
    const content = `Вариант А: ${found.variantA}\nВариант Б: ${found.variantB}`;
    
    // Открываем модалку с предзаполненными данными
    setEditorState({
      isOpen: true,
      effect: {
        title: found.title,
        description: found.question,
        content: content,
        category: found.category,
        residueSource: found.residueSource, // Передаем ссылку на остатки
        interpretations: {
          sourceLink: found.sourceUrl // Передаем источник
        },
        // Сохраняем visualPrompt во временное поле (если нужно будет использовать)
        // В текущей реализации EffectEditorModal не имеет поля для visualPrompt, 
        // но мы можем использовать его при генерации картинки позже
      }
    });
    setIsFinderOpen(false); // Закрываем поиск
  };

  const handleMigration = async () => {
    if (!confirm('Запустить миграцию данных? Это заполнит пустые поля "Факты" из старого контента.')) return;
    const toastId = toast.loading('Миграция...');
    try {
      const res = await migrateData();
      if (res.success) {
        toast.success(`Обновлено эффектов: ${res.count}`, { id: toastId });
        addNeuralLog(`MIGRATION COMPLETE. UPDATED: ${res.count}`);
        router.refresh();
      } else {
        toast.error('Ошибка миграции', { id: toastId });
      }
    } catch (e) {
      toast.error('Ошибка', { id: toastId });
    }
  };

  if (!isMounted) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  const categoryOptions = categories.map(c => ({ value: c.slug, label: c.name, icon: null }));

  return (
    <div className="min-h-screen bg-dark py-6 px-4 font-sans text-light">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-4 mb-8 bg-darkCard/50 p-4 rounded-2xl border border-light/5 backdrop-blur-sm">
          <div className="flex items-center gap-4 w-full xl:w-auto">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20"><LayoutGrid className="text-primary w-6 h-6" /></div>
            <div><h1 className="text-2xl font-bold text-white tracking-tight">Админ-панель</h1><p className="text-light/40 text-xs font-mono">MANDELA_EFFECT // CONTROL_CENTER</p></div>
          </div>
          <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
            <button onClick={() => setIsBulkOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg text-sm font-medium transition-colors border border-purple-500/20 whitespace-nowrap"><Zap className="w-4 h-4" /> Массовая</button>
            <button onClick={() => setIsFinderOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg text-sm font-medium transition-colors border border-cyan-500/20 whitespace-nowrap"><ScanSearch className="w-4 h-4" /> Агент</button>
            <button onClick={handleMigration} className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 rounded-lg text-sm font-medium transition-colors border border-yellow-500/20 whitespace-nowrap"><Database className="w-4 h-4" /> Миграция</button>
            <div className="w-px h-8 bg-light/10 mx-2"></div>
            <button onClick={() => setEditorState({ isOpen: true, effect: null })} className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-sm font-medium transition-colors border border-green-500/20 whitespace-nowrap"><Plus className="w-4 h-4" /> Добавить</button>
            <button onClick={() => setIsNeuralLinkOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors border border-primary/20 whitespace-nowrap animate-pulse"><Cpu className="w-4 h-4" /> Neural Link</button>
            <div className="w-px h-8 bg-light/10 mx-2"></div>
            <Link href="/" className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-light/60 hover:text-light transition-colors" title="На сайт"><ArrowLeft className="w-5 h-5" /></Link>
            <button onClick={() => logout().then(() => router.refresh())} className="p-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Выйти"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-light/10 pb-1 overflow-x-auto items-center">
          <button onClick={() => setActiveTab('effects')} className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-colors whitespace-nowrap font-medium text-sm ${activeTab === 'effects' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-light/60 hover:text-light hover:bg-white/5'}`}><LayoutGrid className="w-4 h-4" /> Эффекты <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full ml-1">{effects.length}</span></button>
          <button onClick={() => setActiveTab('submissions')} className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-colors whitespace-nowrap font-medium text-sm ${activeTab === 'submissions' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-light/60 hover:text-light hover:bg-white/5'}`}><Inbox className="w-4 h-4" /> Заявки <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full ml-1">{submissions.length}</span></button>
          <button onClick={() => setActiveTab('comments')} className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-colors whitespace-nowrap font-medium text-sm ${activeTab === 'comments' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-light/60 hover:text-light hover:bg-white/5'}`}><MessageSquare className="w-4 h-4" /> Комментарии <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full ml-1">{comments.length}</span></button>
          <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-colors whitespace-nowrap font-medium text-sm ${activeTab === 'categories' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-light/60 hover:text-light hover:bg-white/5'}`}><Tags className="w-4 h-4" /> Категории <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full ml-1">{categories.length}</span></button>
        </div>

        {activeTab === 'effects' && (
          <EffectsTab 
            effects={effects} 
            categories={categoryOptions}
            selectedIds={selectedIds}
            onToggleSelection={(id) => { const s = new Set(selectedIds); if (s.has(id)) s.delete(id); else s.add(id); setSelectedIds(s); }}
            onEdit={(effect) => setEditorState({ isOpen: true, effect })}
            onDelete={handleDeleteEffect}
            onToggleVisibility={handleToggleVisibility}
            onQuickAction={handleQuickAction}
            onManualImage={(effect, mode) => setImageModalState({ isOpen: true, effect, url: effect.imageUrl || '' })}
            onSearchImage={(title, engine) => window.open(engine === 'google' ? `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(title + ' mandela effect')}` : `https://yandex.ru/images/search?text=${encodeURIComponent(title + ' mandela effect')}`, '_blank')}
            quickLoading={quickLoading}
          />
        )}

        {activeTab === 'submissions' && (
          <div className="space-y-4">
            {submissions.length === 0 ? <div className="text-center py-20 text-light/40">Нет заявок</div> : submissions.map(sub => (
              <div key={sub.id} className="bg-darkCard border border-light/10 rounded-xl p-6">
                <h3 className="font-bold text-white">{sub.title}</h3>
                <p className="text-sm text-light/60 mb-4">{sub.question}</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-purple-500/10 rounded border border-purple-500/20 text-sm"><div className="text-purple-400 text-xs font-bold mb-1">ВАРИАНТ А</div>{sub.variantA}</div>
                  <div className="p-3 bg-green-500/10 rounded border border-green-500/20 text-sm"><div className="text-green-400 text-xs font-bold mb-1">ВАРИАНТ Б</div>{sub.variantB}</div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => handleApproveSubmission(sub)} className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-sm font-bold flex items-center gap-2"><Check className="w-4 h-4" /> Одобрить</button>
                  <button onClick={() => handleRejectSubmission(sub.id)} className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-bold flex items-center gap-2"><X className="w-4 h-4" /> Отклонить</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            {comments.length === 0 ? <div className="text-center py-20 text-light/40">Нет комментариев</div> : comments.map(comment => (
              <div key={comment.id} className="bg-darkCard border border-light/10 rounded-xl p-6">
                <div className="flex justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${comment.type === 'WITNESS' ? 'bg-blue-500/20 text-blue-400' : comment.type === 'ARCHAEOLOGIST' ? 'bg-purple-500/20 text-purple-400' : 'bg-pink-500/20 text-pink-400'}`}>{comment.type}</span>
                  <Link href={`/effect/${comment.effectId}`} target="_blank" className="text-sm text-primary hover:underline">{comment.effectTitle}</Link>
                </div>
                <p className="text-sm text-light/70 mb-4 whitespace-pre-wrap">{comment.text}</p>
                {comment.imageUrl && <img src={comment.imageUrl} alt="" className="max-w-xs rounded border border-white/10 mb-4" />}
                <div className="flex gap-3">
                  <button onClick={() => handleModerateComment(comment.id, 'APPROVED')} className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm">Одобрить</button>
                  <button onClick={() => handleModerateComment(comment.id, 'REJECTED')} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm">Отклонить</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="text-center py-20 text-light/40">Управление категориями временно недоступно в этом режиме (используйте БД)</div>
        )}

        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-darkCard/90 backdrop-blur border border-light/20 rounded-full px-6 py-3 shadow-2xl flex items-center gap-4 z-40">
              <span className="text-sm font-bold text-primary">{selectedIds.size} выбрано</span>
              <div className="h-4 w-px bg-light/20"></div>
              <button onClick={() => setSelectedIds(new Set(effects.map(e => e.id)))} className="text-xs hover:text-light flex gap-1 items-center"><ListChecks className="w-3 h-3" /> Все</button>
              <button onClick={() => handleBulkProcess('data')} className="text-xs hover:text-light flex gap-1 items-center" disabled={bulkLoading}><FileText className="w-3 h-3" /> Данные</button>
              <button onClick={() => handleBulkProcess('image')} className="text-xs hover:text-light flex gap-1 items-center" disabled={bulkLoading}><ImageIcon className="w-3 h-3" /> Фото</button>
              <button onClick={() => handleBulkVisibility(true)} className="text-xs hover:text-green-400 flex gap-1 items-center" disabled={bulkLoading}><Eye className="w-3 h-3" /> Показать</button>
              <button onClick={() => handleBulkVisibility(false)} className="text-xs hover:text-red-400 flex gap-1 items-center" disabled={bulkLoading}><EyeOff className="w-3 h-3" /> Скрыть</button>
              <div className="h-4 w-px bg-light/20"></div>
              <button onClick={() => setSelectedIds(new Set())} className="text-xs text-light/60 hover:text-light">Сброс</button>
              <button onClick={handleBulkDelete} className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1"><Trash2 className="w-3 h-3" /> Удалить</button>
            </motion.div>
          )}
        </AnimatePresence>

        <EffectEditorModal 
          isOpen={editorState.isOpen} 
          onClose={() => setEditorState({ isOpen: false, effect: null })} 
          onSave={handleSaveEffect} 
          initialData={editorState.effect} 
          categories={categoryOptions} 
        />
        
        <ImageUploadModal 
          isOpen={imageModalState.isOpen} 
          onClose={() => setImageModalState({ isOpen: false, effect: null, url: '' })} 
          onSave={handleSaveImage} 
          initialUrl={imageModalState.url} 
        />

        <NeuralLink 
          isOpen={isNeuralLinkOpen} 
          onClose={() => setIsNeuralLinkOpen(false)} 
          effects={effects}
          logs={neuralLogs}
        />

        {isFinderOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsFinderOpen(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-darkCard w-full max-w-4xl rounded-2xl border border-light/10 p-6 h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><ScanSearch className="text-cyan-400" /> Агент-Поисковик</h2>
              
              {!finderLoading && foundEffects.length === 0 && (
                <div className="mb-6">
                  <label className="block text-xs text-light/50 mb-2 uppercase font-bold">Выберите сектор сканирования</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SECTORS.map((sector) => (
                      <button
                        key={sector}
                        onClick={() => setSelectedSector(sector)}
                        className={`p-3 rounded-lg text-xs text-left transition-colors border ${
                          selectedSector === sector 
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' 
                            : 'bg-white/5 border-transparent text-light/60 hover:bg-white/10'
                        }`}
                      >
                        {sector}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!finderLoading && foundEffects.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <button onClick={handleFindNew} className="px-8 py-4 bg-cyan-500/20 text-cyan-400 rounded-xl font-bold hover:bg-cyan-500/30 transition-colors border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                    Начать сканирование
                  </button>
                </div>
              )}
              
              {finderLoading && (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                </div>
              )}
              
              {foundEffects.length > 0 && (
                <div className="flex-1 overflow-y-auto grid gap-3 p-1">
                  {foundEffects.map((ef, i) => (
                    <div key={i} className="p-4 bg-dark border border-light/10 rounded-xl flex flex-col gap-3 hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-white text-lg">{ef.title}</div>
                          <div className="text-sm text-light/60">{ef.question}</div>
                        </div>
                        <button 
                          className="px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-lg text-sm font-bold transition-colors" 
                          onClick={() => handleUseFoundEffect(ef)}
                        >
                          Создать
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
                          <span className="text-red-400 font-bold block mb-1">ЛОЖЬ (А):</span>
                          <span className="text-light/80">{ef.variantA}</span>
                        </div>
                        <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded">
                          <span className="text-cyan-400 font-bold block mb-1">ПРАВДА (Б):</span>
                          <span className="text-light/80">{ef.variantB}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {isBulkOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsBulkOpen(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-darkCard w-full max-w-2xl rounded-2xl border border-light/10 p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Zap className="text-purple-400" /> Массовая генерация</h2>
              <textarea value={bulkInput} onChange={e => setBulkInput(e.target.value)} rows={10} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-sm font-mono text-light mb-4" placeholder='[{"title": "Effect 1", "variantA": "..."}]' />
              <div className="flex justify-end gap-3"><button onClick={async () => { setBulkRunning(true); setBulkLogs(['🚀 Старт...']); try { const items = JSON.parse(bulkInput); for (const item of items) { setBulkLogs(prev => [...prev, `Генерируем: ${item.title}...`]); await createEffect({ title: item.title, description: item.question, content: `Вариант А: ${item.variantA}\nВариант Б: ${item.variantB}`, category: item.category }); await new Promise(r => setTimeout(r, 1000)); } setBulkLogs(prev => [...prev, '✅ Готово!']); router.refresh(); } catch (e) { setBulkLogs(prev => [...prev, '❌ Ошибка JSON']); } setBulkRunning(false); }} disabled={bulkRunning} className="px-6 py-2 bg-primary text-white rounded-lg font-bold">{bulkRunning ? 'Генерация...' : 'Запуск'}</button></div>
              {bulkLogs.length > 0 && <div className="mt-4 p-4 bg-black/30 rounded-lg max-h-40 overflow-y-auto text-xs font-mono text-light/70">{bulkLogs.map((l, i) => <div key={i}>{l}</div>)}</div>}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
