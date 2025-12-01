'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { updateEffect, deleteEffect, logout, approveSubmission, rejectSubmission } from '@/app/actions/admin';
import { generateEffectData } from '@/app/actions/generate-content';
import { getCategories, createCategory, updateCategory, deleteCategory, type Category } from '@/app/actions/category';
import CustomSelect, { type SelectOption } from '@/components/ui/CustomSelect';
import EmojiPickerInput from '@/components/ui/EmojiPickerInput';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import toast from 'react-hot-toast';
import { CATEGORY_MAP, getCategoryInfo } from '@/lib/constants';
import { 
  LayoutGrid, Inbox, Tags, Plus, Search, LogOut, 
  Edit, Trash2, Eye, EyeOff, Check, X, Save, ArrowLeft, 
  ScrollText, BrainCircuit, Wand2, Loader2, Link as LinkIcon, AlertCircle
} from 'lucide-react';

const AVAILABLE_COLORS = ['red', 'blue', 'purple', 'pink', 'yellow', 'cyan', 'green', 'amber', 'indigo', 'rose', 'gray'];

interface Effect {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  imageUrl: string | null;
  votesFor: number;
  votesAgainst: number;
  views: number;
  residue: string | null;
  residueSource: string | null;
  history: string | null;
  historySource: string | null;
  yearDiscovered: number | null;
  interpretations: Record<string, string> | null;
  isVisible?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Submission {
  id: string;
  category: string;
  title: string;
  question: string;
  variantA: string;
  variantB: string;
  currentState: string | null;
  sourceLink: string | null;
  submitterEmail: string | null;
  interpretations: Record<string, string> | null;
  status: string;
  createdAt: string;
}

interface AdminClientProps {
  effects: Effect[];
  submissions: Submission[];
  categories: Category[];
}

type TabType = 'effects' | 'submissions' | 'categories';

export default function AdminClient({ effects: initialEffects, submissions: initialSubmissions, categories: initialCategories }: AdminClientProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => { setIsMounted(true); }, []);
  
  const [effects, setEffects] = useState<Effect[]>(initialEffects);
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  
  // Состояния редактирования
  const [editingEffect, setEditingEffect] = useState<Effect | null>(null);
  const [isCreatingEffect, setIsCreatingEffect] = useState(false);
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Вкладки и фильтры
  const [activeTab, setActiveTab] = useState<TabType>('effects');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Форма Эффекта
  const [effectForm, setEffectForm] = useState({
    title: '', description: '', category: '', variantA: '', variantB: '',
    currentState: '', sourceLink: '', residue: '', residueSource: '',
    history: '', historySource: '', scientificInterpretation: '', scientificSource: '',
    communityInterpretation: '', communitySource: '', imageUrl: '',
  });

  // Форма Категории
  const [categoryForm, setCategoryForm] = useState({
    slug: '', name: '', emoji: '', color: '', sortOrder: 0,
  });

  // --- ЛОГИКА ЭФФЕКТОВ ---
  const filteredEffects = useMemo(() => {
    let result = [...effects];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => e.title.toLowerCase().includes(query) || e.description.toLowerCase().includes(query));
    }
    if (selectedCategory !== 'all') {
      result = result.filter(e => e.category === selectedCategory);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [effects, searchQuery, selectedCategory]);

  const populateEffectForm = (effect: Effect) => {
    const contentLines = effect.content.split('\n');
    const variantA = contentLines.find(l => l.startsWith('Вариант А:'))?.replace('Вариант А: ', '').trim() || '';
    const variantB = contentLines.find(l => l.startsWith('Вариант Б:'))?.replace('Вариант Б: ', '').trim() || '';
    const currentState = contentLines.find(l => l.includes('Текущее состояние:'))?.replace('Текущее состояние: ', '').trim() || '';
    const interp = effect.interpretations as Record<string, string> | null;

    setEffectForm({
      title: effect.title, description: effect.description, category: effect.category,
      variantA, variantB, currentState, sourceLink: interp?.sourceLink || '',
      residue: effect.residue || '', residueSource: effect.residueSource || '',
      history: effect.history || '', historySource: effect.historySource || '',
      scientificInterpretation: interp?.scientific || '', scientificSource: interp?.scientificSource || '',
      communityInterpretation: interp?.community || '', communitySource: interp?.communitySource || '',
      imageUrl: effect.imageUrl || '',
    });
  };

  const handleEditEffect = (effect: Effect) => {
    setEditingEffect(effect);
    populateEffectForm(effect);
  };

  const handleSaveEffect = async () => {
    if (!editingEffect) return;
    setLoading(true);
    try {
      const interpretations: Record<string, string> = {};
      if (effectForm.scientificInterpretation) interpretations.scientific = effectForm.scientificInterpretation;
      if (effectForm.scientificSource) interpretations.scientificSource = effectForm.scientificSource;
      if (effectForm.communityInterpretation) interpretations.community = effectForm.communityInterpretation;
      if (effectForm.communitySource) interpretations.communitySource = effectForm.communitySource;
      if (effectForm.sourceLink) interpretations.sourceLink = effectForm.sourceLink;

      const newContent = `Вариант А: ${effectForm.variantA}\nВариант Б: ${effectForm.variantB}${effectForm.currentState ? `\nТекущее состояние: ${effectForm.currentState}` : ''}`;

      const result = await updateEffect(editingEffect.id, {
        title: effectForm.title, description: effectForm.description, content: newContent, category: effectForm.category,
        imageUrl: effectForm.imageUrl || undefined, residue: effectForm.residue || undefined, residueSource: effectForm.residueSource || undefined,
        history: effectForm.history || undefined, historySource: effectForm.historySource || undefined,
        interpretations: Object.keys(interpretations).length > 0 ? interpretations : undefined,
      });

      if (result.success) {
        setEffects(prev => prev.map(e => e.id === editingEffect.id ? { ...e, ...effectForm, content: newContent, interpretations } : e));
        setEditingEffect(null);
        toast.success('Эффект обновлен');
      } else toast.error(result.error || 'Ошибка');
    } catch (e) { toast.error('Ошибка сохранения'); } finally { setLoading(false); }
  };

  const handleDeleteEffect = async (id: string) => {
    if (!confirm('Удалить этот эффект?')) return;
    const result = await deleteEffect(id);
    if (result.success) {
      setEffects(prev => prev.filter(e => e.id !== id));
      toast.success('Эффект удален');
    } else toast.error('Ошибка удаления');
  };

  const handleAiFill = async () => {
    if (!effectForm.title) return toast.error('Введите название');
    setAiLoading(true);
    try {
      const result = await generateEffectData(effectForm.title, effectForm.description, effectForm.variantA, effectForm.variantB, { generateImage: true });
      if (result.success && result.data) {
        setEffectForm(prev => ({
          ...prev,
          category: result.data!.category || prev.category,
          currentState: result.data!.currentState || prev.currentState,
          residue: result.data!.residue || prev.residue,
          history: result.data!.history || prev.history,
          scientificInterpretation: result.data!.scientific || prev.scientificInterpretation,
          communityInterpretation: result.data!.community || prev.communityInterpretation,
          sourceLink: result.data!.sourceLink || prev.sourceLink,
          imageUrl: result.data!.imageUrl || prev.imageUrl,
        }));
        toast.success('Данные сгенерированы');
      } else toast.error(result.error || 'Ошибка AI');
    } catch (e) { toast.error('Ошибка AI'); } finally { setAiLoading(false); }
  };

  // --- ЛОГИКА ЗАЯВОК ---
  const handleApproveSubmission = async (sub: Submission) => {
    if(!confirm('Одобрить заявку и создать эффект?')) return;
    setLoading(true);
    try {
        const content = `Вариант А: ${sub.variantA}\nВариант Б: ${sub.variantB}${sub.currentState ? `\nТекущее состояние: ${sub.currentState}` : ''}`;
        const result = await approveSubmission(sub.id, {
            title: sub.title, description: sub.question, content, category: sub.category,
            interpretations: sub.interpretations || undefined
        });
        if (result.success) {
            setSubmissions(prev => prev.filter(s => s.id !== sub.id));
            toast.success('Заявка одобрена');
            router.refresh();
        } else toast.error(result.error || 'Ошибка');
    } catch (e) { toast.error('Ошибка одобрения'); } finally { setLoading(false); }
  };

  const handleRejectSubmission = async (id: string) => {
    if(!confirm('Отклонить заявку?')) return;
    const result = await rejectSubmission(id);
    if (result.success) {
        setSubmissions(prev => prev.filter(s => s.id !== id));
        toast.success('Заявка отклонена');
    } else toast.error('Ошибка отклонения');
  };

  // --- ЛОГИКА КАТЕГОРИЙ ---
  const handleEditCategory = (cat: Category) => {
    setCategoryForm({ slug: cat.slug, name: cat.name, emoji: cat.emoji, color: cat.color || '', sortOrder: cat.sortOrder });
    setEditingCategory(cat);
    setIsCreatingCategory(false);
  };

  const handleSaveCategory = async () => {
    setLoading(true);
    try {
        if (editingCategory) {
            const result = await updateCategory(editingCategory.id, { ...categoryForm, color: categoryForm.color || null });
            if (result.success) {
                setCategories(prev => prev.map(c => c.id === editingCategory.id ? result.category! : c));
                setEditingCategory(null);
                toast.success('Категория обновлена');
            } else toast.error(result.error);
        } else {
            const result = await createCategory({ ...categoryForm, color: categoryForm.color || null });
            if (result.success) {
                setCategories(prev => [...prev, result.category!]);
                setIsCreatingCategory(false);
                toast.success('Категория создана');
            } else toast.error(result.error);
        }
    } catch(e) { toast.error('Ошибка сохранения'); } finally { setLoading(false); }
  };

  const handleDeleteCategory = async (id: string) => {
    if(!confirm('Удалить категорию?')) return;
    const result = await deleteCategory(id);
    if(result.success) {
        setCategories(prev => prev.filter(c => c.id !== id));
        toast.success('Категория удалена');
    } else toast.error(result.error);
  };

  const handleLogout = async () => { await logout(); router.refresh(); };

  if (!isMounted) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  const categoryOptions = categories.map(c => ({ value: c.slug, label: c.name, emoji: c.emoji }));

  return (
    <div className="min-h-screen bg-dark py-8 px-4 font-sans text-light">
      <div className="max-w-7xl mx-auto">
        {/* Хедер */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <LayoutGrid className="text-primary w-8 h-8" /> Админ-панель
            </h1>
            <p className="text-light/60 text-sm mt-1 ml-10">Управление контентом и реальностью</p>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> На сайт
            </Link>
            <button onClick={() => {
                setEffectForm({ title: '', description: '', variantA: '', variantB: '', category: '', currentState: '', residue: '', history: '', scientificInterpretation: '', communityInterpretation: '', sourceLink: '', residueSource: '', historySource: '', scientificSource: '', communitySource: '', imageUrl: '' });
                setIsCreatingEffect(true);
            }} className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-sm transition-colors">
              <Plus className="w-4 h-4" /> Добавить эффект
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm transition-colors">
              <LogOut className="w-4 h-4" /> Выйти
            </button>
          </div>
        </div>

        {/* Навигация */}
        <div className="flex gap-2 mb-6 border-b border-light/10 pb-1 overflow-x-auto">
          <button onClick={() => setActiveTab('effects')} className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'effects' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-light/60 hover:text-light hover:bg-white/5'}`}>
            <LayoutGrid className="w-4 h-4" /> Эффекты <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full ml-1">{effects.length}</span>
          </button>
          <button onClick={() => setActiveTab('submissions')} className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'submissions' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-light/60 hover:text-light hover:bg-white/5'}`}>
            <Inbox className="w-4 h-4" /> Заявки <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full ml-1">{submissions.length}</span>
          </button>
          <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'categories' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-light/60 hover:text-light hover:bg-white/5'}`}>
            <Tags className="w-4 h-4" /> Категории
          </button>
        </div>

        {/* 1. ЭФФЕКТЫ */}
        {activeTab === 'effects' && (
          <div className="space-y-4">
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light/40" />
                <input type="text" placeholder="Поиск эффектов..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-darkCard border border-light/10 rounded-lg text-sm text-light focus:outline-none focus:border-primary" />
              </div>
              <div className="w-48">
                <CustomSelect value={selectedCategory} onChange={setSelectedCategory} options={[{ value: 'all', label: 'Все категории', emoji: '📋' }, ...categoryOptions]} placeholder="Категория" />
              </div>
            </div>

            <div className="grid gap-3">
              {filteredEffects.map(effect => (
                <div key={effect.id} className="bg-darkCard border border-light/10 rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors group">
                  <div className="w-16 h-16 rounded-lg bg-black/20 overflow-hidden relative shrink-0">
                    {effect.imageUrl ? <ImageWithSkeleton src={effect.imageUrl} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🖼️</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-light truncate">{effect.title}</h3>
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${getCategoryInfo(effect.category).color} bg-opacity-10 border border-opacity-20`}>{getCategoryInfo(effect.category).name}</span>
                      {!effect.isVisible && <span className="text-xs text-red-400 flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded"><EyeOff className="w-3 h-3" /> Скрыт</span>}
                    </div>
                    <p className="text-xs text-light/60 truncate">{effect.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-light/40">
                        <span className="flex items-center gap-1"><Check className="w-3 h-3 text-purple-400" /> {effect.votesFor}</span>
                        <span className="flex items-center gap-1"><X className="w-3 h-3 text-green-400" /> {effect.votesAgainst}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {effect.views}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditEffect(effect)} className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors" title="Редактировать"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteEffect(effect.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors" title="Удалить"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. ЗАЯВКИ */}
        {activeTab === 'submissions' && (
            <div className="space-y-4">
                {submissions.length === 0 ? (
                    <div className="text-center py-20 bg-darkCard border border-light/10 rounded-xl">
                        <Inbox className="w-12 h-12 text-light/20 mx-auto mb-3" />
                        <p className="text-light/40">Нет новых заявок</p>
                    </div>
                ) : (
                    submissions.map(sub => (
                        <div key={sub.id} className="bg-darkCard border border-light/10 rounded-xl p-6 hover:border-light/20 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-white/5 rounded-lg text-2xl">{getCategoryInfo(sub.category).emoji}</div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{sub.title}</h3>
                                        <p className="text-sm text-light/60">{sub.question}</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-white/5 rounded text-xs text-light/50 font-mono">{new Date(sub.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/20 text-sm">
                                    <div className="text-purple-400 text-xs font-bold mb-1 uppercase tracking-wider">Вариант А</div>
                                    {sub.variantA}
                                </div>
                                <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20 text-sm">
                                    <div className="text-green-400 text-xs font-bold mb-1 uppercase tracking-wider">Вариант Б</div>
                                    {sub.variantB}
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => handleApproveSubmission(sub)} className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 flex items-center gap-2 text-sm font-bold transition-colors"><Check className="w-4 h-4" /> Одобрить</button>
                                <button onClick={() => handleRejectSubmission(sub.id)} className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 flex items-center gap-2 text-sm font-bold transition-colors"><X className="w-4 h-4" /> Отклонить</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* 3. КАТЕГОРИИ */}
        {activeTab === 'categories' && (
            <div className="space-y-6">
                <div className="flex justify-end">
                    <button onClick={() => {
                        setCategoryForm({ slug: '', name: '', emoji: '', color: '', sortOrder: categories.length + 1 });
                        setIsCreatingCategory(true);
                        setEditingCategory(null);
                    }} className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-sm transition-colors">
                        <Plus className="w-4 h-4" /> Добавить категорию
                    </button>
                </div>
                <div className="grid gap-3">
                    {categories.map(cat => (
                        <div key={cat.id} className="bg-darkCard border border-light/10 rounded-xl p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="text-3xl w-12 h-12 flex items-center justify-center bg-white/5 rounded-lg">{cat.emoji}</div>
                                <div>
                                    <div className="text-light font-bold flex items-center gap-2">
                                        {cat.name} 
                                        {cat.color && <span className={`w-3 h-3 rounded-full bg-${cat.color}-500 inline-block`}></span>}
                                    </div>
                                    <div className="text-light/40 text-xs font-mono mt-1">
                                        slug: <span className="text-light/60">{cat.slug}</span> • sort: {cat.sortOrder}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditCategory(cat)} className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* МОДАЛКА ЭФФЕКТОВ */}
        <AnimatePresence>
          {(editingEffect || isCreatingEffect) && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-darkCard w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-light/10 shadow-2xl">
                <div className="sticky top-0 bg-darkCard/95 backdrop-blur z-10 border-b border-light/10 p-6 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {editingEffect ? <Edit className="w-5 h-5 text-blue-400" /> : <Plus className="w-5 h-5 text-green-400" />}
                    {editingEffect ? 'Редактирование' : 'Новый эффект'}
                  </h2>
                  <div className="flex gap-2">
                    <button onClick={handleAiFill} disabled={aiLoading} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg text-sm flex items-center gap-2 transition-colors">
                        {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} AI-Заполнение
                    </button>
                    <button onClick={() => { setEditingEffect(null); setIsCreatingEffect(false); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div><label className="block text-xs font-bold text-light/40 uppercase mb-1">Название</label><input type="text" value={effectForm.title} onChange={e => setEffectForm({...effectForm, title: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-primary outline-none" /></div>
                            <div><label className="block text-xs font-bold text-light/40 uppercase mb-1">Вопрос / Описание</label><textarea rows={3} value={effectForm.description} onChange={e => setEffectForm({...effectForm, description: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-primary outline-none resize-none" /></div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="block text-xs font-bold text-purple-400 uppercase mb-1">Вариант А (Миф)</label><input type="text" value={effectForm.variantA} onChange={e => setEffectForm({...effectForm, variantA: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" /></div>
                                <div><label className="block text-xs font-bold text-green-400 uppercase mb-1">Вариант Б (Факт)</label><input type="text" value={effectForm.variantB} onChange={e => setEffectForm({...effectForm, variantB: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-green-500 outline-none" /></div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <CustomSelect label="Категория" value={effectForm.category} onChange={val => setEffectForm({...effectForm, category: val})} options={categoryOptions} />
                            <div><label className="block text-xs font-bold text-light/40 uppercase mb-1">Картинка (URL)</label><input type="text" value={effectForm.imageUrl} onChange={e => setEffectForm({...effectForm, imageUrl: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white text-xs" />
                            {effectForm.imageUrl && <div className="mt-2 relative h-32 rounded-lg overflow-hidden border border-light/10"><ImageWithSkeleton src={effectForm.imageUrl} alt="" fill className="object-cover" /></div>}</div>
                        </div>
                    </div>
                    <div className="border-t border-light/10 my-4"></div>
                    <div className="space-y-4">
                        <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-4"><h3 className="text-green-400 font-bold flex items-center gap-2 mb-3"><Eye className="w-4 h-4" /> Текущее состояние</h3><textarea rows={2} value={effectForm.currentState} onChange={e => setEffectForm({...effectForm, currentState: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-sm text-light focus:border-green-500 outline-none mb-2" placeholder="Описание факта..." /><input type="text" value={effectForm.sourceLink} onChange={e => setEffectForm({...effectForm, sourceLink: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-2 text-xs text-light" placeholder="Ссылка на источник..." /></div>
                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4"><h3 className="text-blue-400 font-bold flex items-center gap-2 mb-3"><Search className="w-4 h-4" /> Остатки</h3><textarea rows={2} value={effectForm.residue} onChange={e => setEffectForm({...effectForm, residue: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-sm text-light focus:border-blue-500 outline-none mb-2" placeholder="Примеры..." /><input type="text" value={effectForm.residueSource} onChange={e => setEffectForm({...effectForm, residueSource: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-2 text-xs text-light" placeholder="Ссылка..." /></div>
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4"><h3 className="text-amber-400 font-bold flex items-center gap-2 mb-3"><ScrollText className="w-4 h-4" /> История</h3><textarea rows={2} value={effectForm.history} onChange={e => setEffectForm({...effectForm, history: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-sm text-light focus:border-amber-500 outline-none mb-2" placeholder="История..." /><input type="text" value={effectForm.historySource} onChange={e => setEffectForm({...effectForm, historySource: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-2 text-xs text-light" placeholder="Источник..." /></div>
                        <div className="bg-pink-500/5 border border-pink-500/10 rounded-xl p-4"><h3 className="text-pink-400 font-bold flex items-center gap-2 mb-3"><BrainCircuit className="w-4 h-4" /> Теории</h3><div className="grid md:grid-cols-2 gap-4"><div><label className="text-[10px] font-bold text-pink-400/60 uppercase">Наука</label><textarea rows={2} value={effectForm.scientificInterpretation} onChange={e => setEffectForm({...effectForm, scientificInterpretation: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-2 text-xs text-light focus:border-pink-500 outline-none" /><input type="text" value={effectForm.scientificSource} onChange={e => setEffectForm({...effectForm, scientificSource: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-1.5 text-[10px] text-light mt-1" placeholder="Источник..." /></div><div><label className="text-[10px] font-bold text-pink-400/60 uppercase">Сообщество</label><textarea rows={2} value={effectForm.communityInterpretation} onChange={e => setEffectForm({...effectForm, communityInterpretation: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-2 text-xs text-light focus:border-pink-500 outline-none" /><input type="text" value={effectForm.communitySource} onChange={e => setEffectForm({...effectForm, communitySource: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-1.5 text-[10px] text-light mt-1" placeholder="Источник..." /></div></div></div>
                    </div>
                </div>
                <div className="p-6 border-t border-light/10 flex justify-end gap-3 bg-darkCard/95 backdrop-blur sticky bottom-0">
                    <button onClick={() => { setEditingEffect(null); setIsCreatingEffect(false); }} className="px-6 py-2 rounded-lg hover:bg-white/5 transition-colors">Отмена</button>
                    <button onClick={handleSaveEffect} disabled={loading} className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Сохранить</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* МОДАЛКА КАТЕГОРИЙ */}
        <AnimatePresence>
          {(editingCategory || isCreatingCategory) && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-darkCard w-full max-w-lg rounded-2xl border border-light/10 shadow-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    {editingCategory ? <Edit className="w-5 h-5 text-blue-400" /> : <Plus className="w-5 h-5 text-green-400" />}
                    {editingCategory ? 'Редактировать категорию' : 'Новая категория'}
                </h2>
                <div className="space-y-4">
                    <div><label className="block text-xs font-bold text-light/40 uppercase mb-1">Slug (ID)</label><input type="text" value={categoryForm.slug} onChange={e => setCategoryForm({...categoryForm, slug: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-primary outline-none font-mono" placeholder="films" /></div>
                    <div><label className="block text-xs font-bold text-light/40 uppercase mb-1">Название</label><input type="text" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-primary outline-none" placeholder="Фильмы" /></div>
                    <EmojiPickerInput label="Эмодзи" value={categoryForm.emoji} onChange={val => setCategoryForm({...categoryForm, emoji: val})} />
                    <CustomSelect label="Цвет" value={categoryForm.color} onChange={val => setCategoryForm({...categoryForm, color: val})} options={AVAILABLE_COLORS.map(c => ({ value: c, label: c, emoji: '🎨' }))} placeholder="Выберите цвет" />
                    <div><label className="block text-xs font-bold text-light/40 uppercase mb-1">Сортировка</label><input type="number" value={categoryForm.sortOrder} onChange={e => setCategoryForm({...categoryForm, sortOrder: parseInt(e.target.value) || 0})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-primary outline-none" /></div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={() => { setEditingCategory(null); setIsCreatingCategory(false); }} className="px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">Отмена</button>
                    <button onClick={handleSaveCategory} disabled={loading} className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Сохранить</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
