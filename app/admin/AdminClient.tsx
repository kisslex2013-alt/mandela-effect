'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { updateEffect, deleteEffect, logout, approveSubmission, rejectSubmission, createEffect } from '@/app/actions/admin';
import { generateEffectData, generateEffectImage, restyleImage, fitImageToFormat } from '@/app/actions/generate-content';
import { findNewEffects } from '@/app/actions/find-new-effects';
import { getCategories, createCategory, updateCategory, deleteCategory, type Category } from '@/app/actions/category';
import CustomSelect, { type SelectOption } from '@/components/ui/CustomSelect';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import toast from 'react-hot-toast';
import { CATEGORY_MAP, getCategoryInfo } from '@/lib/constants';
import { 
  LayoutGrid, Inbox, Tags, Plus, Search, LogOut, 
  Edit, Trash2, Eye, EyeOff, Check, X, Save, ArrowLeft, 
  ScrollText, BrainCircuit, Wand2, Loader2, Link as LinkIcon, 
  Zap, ScanSearch, FileText, Image as ImageIcon, Palette, LayoutTemplate,
  CheckSquare, Square, Maximize2, ListChecks,
  // Категории
  Film, Music, Tag, User, Globe, Gamepad2, Baby, Ghost, HelpCircle,
  Atom, FlaskConical, BookOpen, Library, Landmark, History, Hourglass, 
  Rocket, Cpu, Smartphone, Laptop, Tv, Monitor, Car, Plane, 
  ShoppingCart, Utensils, Coffee, Pizza, Apple, Sun, Moon, Cloud, 
  Heart, Skull, Smile, Sparkles
} from 'lucide-react';

const AVAILABLE_COLORS = ['red', 'blue', 'purple', 'pink', 'yellow', 'cyan', 'green', 'amber', 'indigo', 'rose', 'gray'];

// Пресеты для выбора иконок категорий
const ICON_PRESETS = [
  // Основные
  { id: 'films', icon: Film, label: 'Кино' },
  { id: 'music', icon: Music, label: 'Музыка' },
  { id: 'brands', icon: Tag, label: 'Бренды' },
  { id: 'people', icon: User, label: 'Люди' },
  { id: 'geography', icon: Globe, label: 'География' },
  { id: 'games', icon: Gamepad2, label: 'Игры' },
  // Наука и История
  { id: 'science', icon: Atom, label: 'Наука' },
  { id: 'chemistry', icon: FlaskConical, label: 'Химия' },
  { id: 'history', icon: ScrollText, label: 'История' },
  { id: 'landmark', icon: Landmark, label: 'Памятники' },
  { id: 'time', icon: Hourglass, label: 'Время' },
  { id: 'books', icon: BookOpen, label: 'Книги' },
  { id: 'library', icon: Library, label: 'Библиотека' },
  // Технологии
  { id: 'tech', icon: Cpu, label: 'Технологии' },
  { id: 'space', icon: Rocket, label: 'Космос' },
  { id: 'tv', icon: Tv, label: 'ТВ' },
  { id: 'internet', icon: Globe, label: 'Интернет' },
  { id: 'smartphone', icon: Smartphone, label: 'Смартфон' },
  { id: 'laptop', icon: Laptop, label: 'Ноутбук' },
  { id: 'monitor', icon: Monitor, label: 'Монитор' },
  // Еда
  { id: 'food', icon: Utensils, label: 'Еда' },
  { id: 'drink', icon: Coffee, label: 'Напитки' },
  { id: 'fruit', icon: Apple, label: 'Фрукты' },
  { id: 'pizza', icon: Pizza, label: 'Пицца' },
  // Транспорт
  { id: 'cars', icon: Car, label: 'Авто' },
  { id: 'plane', icon: Plane, label: 'Самолет' },
  // Природа
  { id: 'sun', icon: Sun, label: 'Солнце' },
  { id: 'moon', icon: Moon, label: 'Луна' },
  { id: 'cloud', icon: Cloud, label: 'Облако' },
  // Эмоции и символы
  { id: 'heart', icon: Heart, label: 'Сердце' },
  { id: 'horror', icon: Skull, label: 'Ужасы' },
  { id: 'smile', icon: Smile, label: 'Улыбка' },
  { id: 'magic', icon: Sparkles, label: 'Магия' },
  // Разное
  { id: 'popculture', icon: Gamepad2, label: 'Поп-культура' },
  { id: 'childhood', icon: Baby, label: 'Детство' },
  { id: 'russian', icon: Ghost, label: 'Россия/СССР' },
  { id: 'shopping', icon: ShoppingCart, label: 'Покупки' },
  { id: 'unknown', icon: HelpCircle, label: 'Другое' },
];

interface Effect {
  id: string; title: string; description: string; content: string; category: string; imageUrl: string | null;
  votesFor: number; votesAgainst: number; views: number; residue: string | null; residueSource: string | null;
  history: string | null; historySource: string | null; yearDiscovered: number | null;
  interpretations: Record<string, string> | null; isVisible?: boolean; createdAt: string; updatedAt: string;
}

interface Submission {
  id: string; category: string; title: string; question: string; variantA: string; variantB: string;
  currentState: string | null; sourceLink: string | null; submitterEmail: string | null;
  interpretations: Record<string, string> | null; status: string; createdAt: string;
}

interface AdminClientProps {
  effects: Effect[]; submissions: Submission[]; categories: Category[];
}

type TabType = 'effects' | 'submissions' | 'categories';

export default function AdminClient({ effects: initialEffects, submissions: initialSubmissions, categories: initialCategories }: AdminClientProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  
  const [effects, setEffects] = useState<Effect[]>(initialEffects);
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  
  const [activeTab, setActiveTab] = useState<TabType>('effects');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [editingEffect, setEditingEffect] = useState<Effect | null>(null);
  const [isCreatingEffect, setIsCreatingEffect] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quickLoading, setQuickLoading] = useState<{ id: string, type: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  
  const [manualImageState, setManualImageState] = useState<{ isOpen: boolean; effect: Effect | null; url: string }>({ isOpen: false, effect: null, url: '' });
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [isFinderOpen, setIsFinderOpen] = useState(false);
  const [finderLoading, setFinderLoading] = useState(false);
  const [foundEffects, setFoundEffects] = useState<any[]>([]);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkLogs, setBulkLogs] = useState<string[]>([]);

  const [effectForm, setEffectForm] = useState({
    title: '', description: '', category: '', variantA: '', variantB: '',
    currentState: '', sourceLink: '', residue: '', residueSource: '',
    history: '', historySource: '', scientificInterpretation: '', scientificSource: '',
    communityInterpretation: '', communitySource: '', imageUrl: '',
  });

  const [categoryForm, setCategoryForm] = useState({ slug: '', name: '', emoji: '', color: '', sortOrder: 0 });

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    effects.forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1; });
    return counts;
  }, [effects]);

  const filteredEffects = useMemo(() => {
    let result = [...effects];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => e.title.toLowerCase().includes(query) || e.description.toLowerCase().includes(query));
    }
    if (selectedCategory !== 'all') result = result.filter(e => e.category === selectedCategory);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [effects, searchQuery, selectedCategory]);

  const getCategoryIcon = (slug: string, className = "w-5 h-5") => {
    // Пытаемся найти иконку в пресетах по совпадению slug или id
    const preset = ICON_PRESETS.find(p => p.id === slug) || ICON_PRESETS.find(p => slug.includes(p.id));
    if (preset) {
        const Icon = preset.icon;
        return <Icon className={className} />;
    }
    // Дефолтные фоллбеки для старых категорий
    switch (slug) {
      case 'popculture': return <Gamepad2 className={className} />;
      case 'childhood': return <Baby className={className} />;
      case 'russian': return <Ghost className={className} />;
      default: return <HelpCircle className={className} />;
    }
  };

  const categoryOptions: SelectOption[] = useMemo(() => categories.map(c => ({ 
    value: c.slug, 
    label: c.name, 
    icon: getCategoryIcon(c.slug, "w-4 h-4") 
  })), [categories]);

  const hiddenCount = useMemo(() => effects.filter(e => !e.isVisible).length, [effects]);

  // Helpers
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

  // Handlers
  const handleEditEffect = (effect: Effect) => { setEditingEffect(effect); populateEffectForm(effect); };
  
  const handleToggleVisibility = async (effect: Effect) => {
    const newStatus = !effect.isVisible;
    try {
        const result = await updateEffect(effect.id, { isVisible: newStatus });
        if (result.success) {
            setEffects(prev => prev.map(e => e.id === effect.id ? { ...e, isVisible: newStatus } : e));
            toast.success(newStatus ? 'Эффект опубликован' : 'Эффект скрыт');
        } else toast.error('Ошибка');
    } catch (e) { toast.error('Ошибка'); }
  };

  const handleSaveEffect = async () => {
    setLoading(true);
    try {
      const interpretations: Record<string, string> = {};
      if (effectForm.scientificInterpretation) interpretations.scientific = effectForm.scientificInterpretation;
      if (effectForm.scientificSource) interpretations.scientificSource = effectForm.scientificSource;
      if (effectForm.communityInterpretation) interpretations.community = effectForm.communityInterpretation;
      if (effectForm.communitySource) interpretations.communitySource = effectForm.communitySource;
      if (effectForm.sourceLink) interpretations.sourceLink = effectForm.sourceLink;

      const newContent = `Вариант А: ${effectForm.variantA}\nВариант Б: ${effectForm.variantB}${effectForm.currentState ? `\nТекущее состояние: ${effectForm.currentState}` : ''}`;
      const payload = {
        title: effectForm.title, description: effectForm.description, content: newContent, category: effectForm.category,
        imageUrl: effectForm.imageUrl || undefined, residue: effectForm.residue || undefined, residueSource: effectForm.residueSource || undefined,
        history: effectForm.history || undefined, historySource: effectForm.historySource || undefined,
        interpretations: Object.keys(interpretations).length > 0 ? interpretations : undefined,
      };

      let result;
      if (editingEffect) result = await updateEffect(editingEffect.id, payload);
      else result = await createEffect(payload);

      if (result.success) {
        if (editingEffect) setEffects(prev => prev.map(e => e.id === editingEffect.id ? { ...e, ...effectForm, content: newContent, interpretations } : e));
        else router.refresh();
        setEditingEffect(null); setIsCreatingEffect(false); toast.success('Сохранено');
      } else toast.error(result.error || 'Ошибка');
    } catch (e) { toast.error('Ошибка сохранения'); } finally { setLoading(false); }
  };

  const handleDeleteEffect = async (id: string) => {
    if (!confirm('Удалить?')) return;
    const result = await deleteEffect(id);
    if (result.success) { setEffects(prev => prev.filter(e => e.id !== id)); toast.success('Удалено'); } 
    else toast.error('Ошибка');
  };

  const handleSearchImage = (title: string, engine: 'google' | 'yandex') => {
    const query = encodeURIComponent(`${title} mandela effect`);
    const url = engine === 'google' ? `https://www.google.com/search?tbm=isch&q=${query}` : `https://yandex.ru/images/search?text=${query}`;
    window.open(url, '_blank');
  };

  const handleManualImage = (effect: Effect) => { setManualImageState({ isOpen: true, effect, url: effect.imageUrl || '' }); };

  const saveManualImage = async () => {
    const { effect, url } = manualImageState;
    if (!effect || !url.trim()) return;
    try {
        const result = await updateEffect(effect.id, { imageUrl: url });
        if (result.success) {
            setEffects(prev => prev.map(e => e.id === effect.id ? { ...e, imageUrl: url } : e));
            toast.success('Картинка обновлена');
            setManualImageState({ isOpen: false, effect: null, url: '' });
        } else toast.error('Ошибка');
    } catch (e) { toast.error('Ошибка'); }
  };

  const handleQuickAction = async (effect: Effect, type: 'data' | 'image' | 'restyle' | 'fit') => {
    setQuickLoading({ id: effect.id, type });

    try {
        if (type === 'data') {
            const contentLines = effect.content.split('\n');
            const vA = contentLines.find(l => l.startsWith('Вариант А:'))?.replace('Вариант А: ', '').trim() || '';
            const vB = contentLines.find(l => l.startsWith('Вариант Б:'))?.replace('Вариант Б: ', '').trim() || '';
            const res = await generateEffectData(effect.title, effect.description, vA, vB, { generateImage: false });
            if (res.success) toast.success('Данные обновлены (F5)'); else toast.error('Ошибка AI');
        } 
        else if (type === 'image') {
            const res = await generateEffectImage(effect.title);
            if (res.success && res.imageUrl) {
                await updateEffect(effect.id, { imageUrl: res.imageUrl });
                setEffects(prev => prev.map(e => e.id === effect.id ? { ...e, imageUrl: res.imageUrl! } : e));
                toast.success('Картинка создана');
            } else toast.error('Ошибка генерации');
        }
        else if (type === 'restyle' && effect.imageUrl) {
            const res = await restyleImage(effect.title, effect.imageUrl);
            if (res.success && res.imageUrl) {
                await updateEffect(effect.id, { imageUrl: res.imageUrl });
                setEffects(prev => prev.map(e => e.id === effect.id ? { ...e, imageUrl: res.imageUrl! } : e));
                toast.success('Рестайлинг выполнен');
            }
        }
        else if (type === 'fit' && effect.imageUrl) {
            const res = await fitImageToFormat(effect.title, effect.imageUrl);
            if (res.success && res.imageUrl) {
                await updateEffect(effect.id, { imageUrl: res.imageUrl });
                setEffects(prev => prev.map(e => e.id === effect.id ? { ...e, imageUrl: res.imageUrl! } : e));
                toast.success('Формат исправлен');
            }
        }
    } catch (e) { toast.error('Ошибка действия'); } finally { setQuickLoading(null); }
  };

  const handleAiFill = async () => {
    if (!effectForm.title) return toast.error('Нужен заголовок');
    setAiLoading(true);
    try {
      const result = await generateEffectData(effectForm.title, effectForm.description, effectForm.variantA, effectForm.variantB, { generateImage: true });
      if (result.success && result.data) {
        setEffectForm(prev => ({ ...prev, category: result.data!.category || prev.category, currentState: result.data!.currentState || prev.currentState, residue: result.data!.residue || prev.residue, history: result.data!.history || prev.history, scientificInterpretation: result.data!.scientific || prev.scientificInterpretation, communityInterpretation: result.data!.community || prev.communityInterpretation, sourceLink: result.data!.sourceLink || prev.sourceLink, imageUrl: result.data!.imageUrl || prev.imageUrl }));
        toast.success('AI данные получены');
      } else toast.error(result.error || 'Ошибка AI');
    } catch (e) { toast.error('Ошибка AI'); } finally { setAiLoading(false); }
  };

  // --- МАССОВЫЕ ОПЕРАЦИИ ---
  const toggleSelection = (id: string) => { const newSet = new Set(selectedIds); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setSelectedIds(newSet); };
  const handleSelectAll = () => { setSelectedIds(new Set(filteredEffects.map(e => e.id))); };
  
  const handleBulkDelete = async () => { if (!confirm(`Удалить ${selectedIds.size} шт?`)) return; for (const id of Array.from(selectedIds)) await deleteEffect(id); setEffects(prev => prev.filter(e => !selectedIds.has(e.id))); setSelectedIds(new Set()); toast.success('Удалено'); };
  
  const handleBulkVisibility = async (isVisible: boolean) => {
      setBulkLoading(true);
      for (const id of Array.from(selectedIds)) {
          await updateEffect(id, { isVisible });
      }
      setEffects(prev => prev.map(e => selectedIds.has(e.id) ? { ...e, isVisible } : e));
      setBulkLoading(false);
      toast.success(isVisible ? 'Все показаны' : 'Все скрыты');
  };

  const handleBulkProcess = async (type: 'data' | 'image' | 'restyle' | 'fit') => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Обработать ${selectedIds.size} элементов (${type})?`)) return;
    
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    let success = 0;

    for (const id of ids) {
        const effect = effects.find(e => e.id === id);
        if (!effect) continue;

        try {
            if (type === 'data') {
                const contentLines = effect.content.split('\n');
                const vA = contentLines.find(l => l.startsWith('Вариант А:'))?.replace('Вариант А: ', '').trim() || '';
                const vB = contentLines.find(l => l.startsWith('Вариант Б:'))?.replace('Вариант Б: ', '').trim() || '';
                await generateEffectData(effect.title, effect.description, vA, vB, { generateImage: false });
            } else if (type === 'image') {
                const res = await generateEffectImage(effect.title);
                if (res.success && res.imageUrl) {
                    await updateEffect(effect.id, { imageUrl: res.imageUrl });
                    setEffects(prev => prev.map(e => e.id === effect.id ? { ...e, imageUrl: res.imageUrl! } : e));
                }
            } else if (type === 'restyle' && effect.imageUrl) {
                const res = await restyleImage(effect.title, effect.imageUrl);
                if (res.success && res.imageUrl) {
                    await updateEffect(effect.id, { imageUrl: res.imageUrl });
                    setEffects(prev => prev.map(e => e.id === effect.id ? { ...e, imageUrl: res.imageUrl! } : e));
                }
            } else if (type === 'fit' && effect.imageUrl) {
                const res = await fitImageToFormat(effect.title, effect.imageUrl);
                if (res.success && res.imageUrl) {
                    await updateEffect(effect.id, { imageUrl: res.imageUrl });
                    setEffects(prev => prev.map(e => e.id === effect.id ? { ...e, imageUrl: res.imageUrl! } : e));
                }
            }
            success++;
        } catch (e) { console.error(e); }
    }
    setBulkLoading(false);
    toast.success(`Обработано: ${success}`);
  };

  const handleFindNew = async () => { setFinderLoading(true); try { const res = await findNewEffects(effects.map(e => e.title)); if (res.success && res.data) { setFoundEffects(res.data); } else toast.error('Ничего не найдено'); } catch (e) { toast.error('Ошибка поиска'); } finally { setFinderLoading(false); } };
  const handleBulkGenerate = async () => { setBulkRunning(true); setBulkLogs(['🚀 Старт...']); try { const items = JSON.parse(bulkInput); if (!Array.isArray(items)) throw new Error('Не массив'); for (const item of items) { setBulkLogs(prev => [...prev, `Генерируем: ${item.title}...`]); await new Promise(r => setTimeout(r, 1000)); } setBulkLogs(prev => [...prev, '✅ Готово!']); } catch (e) { setBulkLogs(prev => [...prev, '❌ Ошибка JSON']); } setBulkRunning(false); };
  const handleLogout = async () => { await logout(); router.refresh(); };
  
  // --- КАТЕГОРИИ ---
  const handleEditCategory = (cat: Category) => { setCategoryForm({ slug: cat.slug, name: cat.name, emoji: cat.emoji, color: cat.color || '', sortOrder: cat.sortOrder }); setEditingCategory(cat); setIsCreatingCategory(false); };
  const handleSaveCategory = async () => { setLoading(true); try { if (editingCategory) { const result = await updateCategory(editingCategory.id, { ...categoryForm, color: categoryForm.color || null }); if (result.success) { setCategories(prev => prev.map(c => c.id === editingCategory.id ? result.category! : c)); setEditingCategory(null); toast.success('Категория обновлена'); } else toast.error(result.error || 'Ошибка'); } else { const result = await createCategory({ ...categoryForm, color: categoryForm.color || null }); if (result.success) { setCategories(prev => [...prev, result.category!]); setIsCreatingCategory(false); toast.success('Категория создана'); } else toast.error(result.error || 'Ошибка'); } } catch(e) { toast.error('Ошибка сохранения'); } finally { setLoading(false); } };
  const handleDeleteCategory = async (id: string) => { if(!confirm('Удалить категорию?')) return; const result = await deleteCategory(id); if(result.success) { setCategories(prev => prev.filter(c => c.id !== id)); toast.success('Категория удалена'); } else toast.error(result.error || 'Ошибка'); };

  // --- ОБРАБОТКА ЗАЯВОК ---
  const handleApproveSubmission = async (sub: Submission) => {
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
      } else {
        toast.error(result.error || 'Ошибка');
      }
    } catch (e) {
      toast.error('Ошибка одобрения');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmission = async (id: string) => {
    setLoading(true);
    try {
      const result = await rejectSubmission(id);
      if (result.success) {
        setSubmissions(prev => prev.filter(s => s.id !== id));
        toast.success('Заявка отклонена');
      } else {
        toast.error(result.error || 'Ошибка');
      }
    } catch (e) {
      toast.error('Ошибка отклонения');
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-dark py-8 px-4 font-sans text-light">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div><h1 className="text-3xl font-bold text-white flex items-center gap-2"><LayoutGrid className="text-primary w-8 h-8" /> Админ-панель</h1><p className="text-light/60 text-sm mt-1 ml-10">Управление контентом и реальностью</p></div>
          <div className="flex gap-3">
            <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"><ArrowLeft className="w-4 h-4" /> На сайт</Link>
            <button onClick={() => { setEffectForm({ title: '', description: '', variantA: '', variantB: '', category: '', currentState: '', residue: '', history: '', scientificInterpretation: '', communityInterpretation: '', sourceLink: '', residueSource: '', historySource: '', scientificSource: '', communitySource: '', imageUrl: '' }); setIsCreatingEffect(true); }} className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-sm transition-colors"><Plus className="w-4 h-4" /> Добавить</button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm transition-colors"><LogOut className="w-4 h-4" /> Выйти</button>
          </div>
        </div>

        <div className="flex gap-3 mb-6"><button onClick={() => setIsBulkOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg text-sm transition-colors border border-purple-500/20"><Zap className="w-4 h-4" /> Массовая</button><button onClick={() => setIsFinderOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg text-sm transition-colors border border-cyan-500/20"><ScanSearch className="w-4 h-4" /> Агент-Поисковик</button></div>

        <div className="flex gap-2 mb-6 border-b border-light/10 pb-1 overflow-x-auto items-center">
          <button onClick={() => setActiveTab('effects')} className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'effects' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-light/60 hover:text-light hover:bg-white/5'}`}><LayoutGrid className="w-4 h-4" /> Эффекты <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full ml-1">{effects.length}</span></button>
          <button onClick={() => setActiveTab('submissions')} className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'submissions' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-light/60 hover:text-light hover:bg-white/5'}`}><Inbox className="w-4 h-4" /> Заявки <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full ml-1">{submissions.length}</span></button>
          <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'categories' ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-light/60 hover:text-light hover:bg-white/5'}`}><Tags className="w-4 h-4" /> Категории <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full ml-1">{categories.length}</span></button>
          <div className="ml-auto px-3 py-1 bg-white/5 rounded text-xs text-light/40">Скрыто: <span className="text-red-400 font-bold">{hiddenCount}</span></div>
        </div>

        {activeTab === 'effects' && (
          <div className="space-y-4">
            <div className="flex gap-4 mb-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light/40" /><input type="text" placeholder="Поиск..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-darkCard border border-light/10 rounded-lg text-sm text-light focus:outline-none focus:border-primary" /></div><div className="w-48"><CustomSelect value={selectedCategory} onChange={setSelectedCategory} options={[{ value: 'all', label: 'Все', icon: <LayoutGrid className="w-4 h-4" /> }, ...categoryOptions]} placeholder="Категория" /></div></div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredEffects.map(effect => (
                <div key={effect.id} className={`bg-darkCard border rounded-xl p-4 transition-all group relative flex flex-col ${selectedIds.has(effect.id) ? 'border-primary/50 bg-primary/5' : 'border-light/10 hover:border-primary/30'}`}>
                  <button onClick={() => toggleSelection(effect.id)} className="absolute top-2 left-2 z-20 p-1 bg-black/60 backdrop-blur-md rounded hover:bg-primary/20 transition-colors text-primary">{selectedIds.has(effect.id) ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6 text-white/50" />}</button>

                  <div className="flex gap-4 mb-3">
                    <div className="w-24 flex-shrink-0 flex flex-col gap-2 mt-1">
                      <div className="w-24 h-20 rounded-lg bg-black/20 overflow-hidden relative group/img cursor-pointer" onClick={() => effect.imageUrl && setImageModalUrl(effect.imageUrl)}>
                        {effect.imageUrl ? <ImageWithSkeleton src={effect.imageUrl} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🖼️</div>}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity"><Maximize2 className="w-5 h-5 text-white" /></div>
                      </div>
                      <div className="flex justify-between w-full gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleManualImage(effect); }} className="h-7 w-7 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded text-light/60 hover:text-light transition-colors" title="Вставить ссылку"><LinkIcon className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleSearchImage(effect.title, 'google'); }} className="h-7 w-7 flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 rounded text-blue-400 transition-colors font-bold text-[10px]" title="Google">G</button>
                        <button onClick={(e) => { e.stopPropagation(); handleSearchImage(effect.title, 'yandex'); }} className="h-7 w-7 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 rounded text-red-400 transition-colors font-bold text-[10px]" title="Yandex">Y</button>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                            <div className="flex flex-wrap gap-2 items-center">
                                <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase font-bold rounded ${getCategoryInfo(effect.category).color} bg-opacity-10 border border-opacity-20`}>
                                    {getCategoryIcon(effect.category, "w-3 h-3")} {getCategoryInfo(effect.category).name}
                                </span>
                                {!effect.isVisible && (
                                    <span className="text-[10px] text-red-400 flex items-center gap-1 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20"><EyeOff className="w-3 h-3" /> Скрыт</span>
                                )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <button onClick={() => handleToggleVisibility(effect)} className={`p-1 rounded transition-colors ${!effect.isVisible ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'text-light/40 hover:text-light hover:bg-white/10'}`} title={effect.isVisible ? "Скрыть" : "Опубликовать"}>{!effect.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                                <button onClick={() => handleEditEffect(effect)} className="p-1 hover:bg-white/10 rounded text-blue-400"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteEffect(effect.id)} className="p-1 hover:bg-white/10 rounded text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <h3 className="font-bold text-light truncate text-sm mb-1" title={effect.title}>{effect.title}</h3>
                        <p className="text-xs text-light/50 line-clamp-2 mb-2">{effect.description}</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-3 border-t border-light/5 flex justify-between items-center gap-1">
                    <button onClick={() => handleQuickAction(effect, 'data')} disabled={!!quickLoading} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs text-light/70 flex items-center justify-center gap-1"><FileText className="w-3 h-3" /> Данные</button>
                    <button onClick={() => handleQuickAction(effect, 'image')} disabled={!!quickLoading} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs text-light/70 flex items-center justify-center gap-1"><ImageIcon className="w-3 h-3" /> Фото</button>
                    <button onClick={() => handleQuickAction(effect, 'restyle')} disabled={!!quickLoading} className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-light/70"><Palette className="w-3 h-3" /></button>
                    <button onClick={() => handleQuickAction(effect, 'fit')} disabled={!!quickLoading} className="p-1.5 bg-white/5 hover:bg-white/10 rounded text-light/70"><LayoutTemplate className="w-3 h-3" /></button>
                  </div>
                  {quickLoading?.id === effect.id && <div className="absolute inset-0 bg-dark/80 backdrop-blur-sm flex items-center justify-center rounded-xl z-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}
                </div>
              ))}
            </div>
          </div>
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

        {activeTab === 'categories' && (
            <div className="space-y-6">
                <div className="flex justify-end"><button onClick={() => { setIsCreatingCategory(true); }} className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm"><Plus className="w-4 h-4" /> Добавить категорию</button></div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{categories.map(cat => (
                    <div key={cat.id} className="bg-darkCard border border-light/10 rounded-xl p-4 flex flex-col justify-between h-full hover:border-primary/30 transition-colors group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-white/5 rounded-xl text-primary">{getCategoryIcon(cat.slug, "w-6 h-6")}</div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditCategory(cat)} className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-light text-lg mb-1">{cat.name}</div>
                            <div className="text-light/40 text-xs font-mono flex justify-between items-center">
                                <span>/{cat.slug}</span>
                                <span className="bg-white/10 px-2 py-0.5 rounded-full">{categoryCounts[cat.slug] || 0} эффектов</span>
                            </div>
                        </div>
                    </div>
                ))}</div>
            </div>
        )}

        <AnimatePresence>
            {selectedIds.size > 0 && (
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-darkCard/90 backdrop-blur border border-light/20 rounded-full px-6 py-3 shadow-2xl flex items-center gap-4 z-40">
                    <span className="text-sm font-bold text-primary">{selectedIds.size} выбрано</span>
                    <div className="h-4 w-px bg-light/20"></div>
                    <button onClick={handleSelectAll} className="text-xs hover:text-light flex gap-1 items-center"><ListChecks className="w-3 h-3" /> Все</button>
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

        <AnimatePresence>
            {manualImageState.isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setManualImageState({ ...manualImageState, isOpen: false })}>
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-darkCard w-full max-w-md rounded-2xl border border-light/10 p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4">Ссылка на фото</h3>
                        <input type="text" value={manualImageState.url} onChange={e => setManualImageState({ ...manualImageState, url: e.target.value })} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white mb-4 outline-none focus:border-primary" autoFocus />
                        <div className="flex justify-end gap-3"><button onClick={() => setManualImageState({ ...manualImageState, isOpen: false })} className="px-4 py-2 rounded-lg hover:bg-white/5 text-sm">Отмена</button><button onClick={saveManualImage} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold">Сохранить</button></div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {imageModalUrl && (
                <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setImageModalUrl(null)}>
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setImageModalUrl(null)} className="absolute -top-12 right-0 text-white hover:text-white/70"><X className="w-8 h-8" /></button>
                        <div className="relative aspect-video bg-dark rounded-xl overflow-hidden shadow-2xl"><ImageWithSkeleton src={imageModalUrl} alt="" fill className="object-contain" /></div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {isBulkOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsBulkOpen(false)}>
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-darkCard w-full max-w-2xl rounded-2xl border border-light/10 p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Zap className="text-purple-400" /> Массовая генерация</h2>
                        <textarea value={bulkInput} onChange={e => setBulkInput(e.target.value)} rows={10} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-sm font-mono text-light mb-4" placeholder='[{"title": "Effect 1", "variantA": "..."}]' />
                        <div className="flex justify-end gap-3"><button onClick={handleBulkGenerate} disabled={bulkRunning} className="px-6 py-2 bg-primary text-white rounded-lg font-bold">{bulkRunning ? 'Генерация...' : 'Запуск'}</button></div>
                        {bulkLogs.length > 0 && <div className="mt-4 p-4 bg-black/30 rounded-lg max-h-40 overflow-y-auto text-xs font-mono text-light/70">{bulkLogs.map((l, i) => <div key={i}>{l}</div>)}</div>}
                    </motion.div>
                </div>
            )}
            
            {isFinderOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsFinderOpen(false)}>
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-darkCard w-full max-w-4xl rounded-2xl border border-light/10 p-6 h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><ScanSearch className="text-cyan-400" /> Агент-Поисковик</h2>
                        {!finderLoading && foundEffects.length === 0 && <div className="flex-1 flex items-center justify-center"><button onClick={handleFindNew} className="px-8 py-4 bg-cyan-500/20 text-cyan-400 rounded-xl font-bold hover:bg-cyan-500/30 transition-colors">Начать сканирование</button></div>}
                        {finderLoading && <div className="flex-1 flex items-center justify-center"><Loader2 className="w-12 h-12 text-cyan-400 animate-spin" /></div>}
                        {foundEffects.length > 0 && <div className="flex-1 overflow-y-auto grid gap-2">{foundEffects.map((ef, i) => <div key={i} className="p-3 bg-dark border border-light/10 rounded flex justify-between items-center"><div className="font-bold text-light">{ef.title}</div><button className="px-3 py-1 bg-white/10 rounded text-xs" onClick={() => setBulkInput(JSON.stringify([ef]))}>В генератор</button></div>)}</div>}
                    </motion.div>
                </div>
            )}

            {(editingEffect || isCreatingEffect) && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setEditingEffect(null); setIsCreatingEffect(false); }}>
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-darkCard w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-light/10 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">{editingEffect ? <Edit className="w-5 h-5 text-blue-400" /> : <Plus className="w-5 h-5 text-green-400" />} {editingEffect ? 'Редактирование' : 'Новый эффект'}</h2>
                            <div className="flex gap-2">
                                <button onClick={handleAiFill} disabled={aiLoading} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm flex items-center gap-2">{aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} AI</button>
                                <button onClick={() => { setEditingEffect(null); setIsCreatingEffect(false); }} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <input type="text" value={effectForm.title} onChange={e => setEffectForm({...effectForm, title: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-primary outline-none" placeholder="Название" />
                            <textarea rows={3} value={effectForm.description} onChange={e => setEffectForm({...effectForm, description: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-primary outline-none resize-none" placeholder="Описание" />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" value={effectForm.variantA} onChange={e => setEffectForm({...effectForm, variantA: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" placeholder="Вариант А" />
                                <input type="text" value={effectForm.variantB} onChange={e => setEffectForm({...effectForm, variantB: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-green-500 outline-none" placeholder="Вариант Б" />
                            </div>
                            <CustomSelect label="Категория" value={effectForm.category} onChange={val => setEffectForm({...effectForm, category: val})} options={categoryOptions} />
                            <input type="text" value={effectForm.imageUrl} onChange={e => setEffectForm({...effectForm, imageUrl: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white text-xs" placeholder="URL картинки" />
                            <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-4"><h3 className="text-green-400 font-bold flex items-center gap-2 mb-2"><Eye className="w-4 h-4" /> Факты</h3><textarea rows={2} value={effectForm.currentState} onChange={e => setEffectForm({...effectForm, currentState: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-2 text-sm text-light outline-none" /></div>
                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4"><h3 className="text-blue-400 font-bold flex items-center gap-2 mb-2"><Search className="w-4 h-4" /> Остатки</h3><textarea rows={2} value={effectForm.residue} onChange={e => setEffectForm({...effectForm, residue: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-2 text-sm text-light outline-none" /></div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={handleSaveEffect} disabled={loading} className="px-6 py-2 bg-primary text-white rounded-lg font-bold flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Сохранить</button>
                        </div>
                    </motion.div>
                </div>
            )}

            {(editingCategory || isCreatingCategory) && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setEditingCategory(null); setIsCreatingCategory(false); }}>
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-darkCard w-full max-w-2xl rounded-2xl border border-light/10 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">{editingCategory ? <Edit className="w-5 h-5 text-blue-400" /> : <Plus className="w-5 h-5 text-green-400" />} {editingCategory ? 'Редактировать' : 'Новая категория'}</h2>
                            <button onClick={() => { setEditingCategory(null); setIsCreatingCategory(false); }}><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-light/40 uppercase mb-1">Название</label><input type="text" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-primary outline-none" placeholder="Фильмы" /></div>
                                <div><label className="block text-xs font-bold text-light/40 uppercase mb-1">Slug (ID)</label><input type="text" value={categoryForm.slug} onChange={e => setCategoryForm({...categoryForm, slug: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white font-mono focus:border-primary outline-none" placeholder="films" /></div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-light/40 uppercase mb-2">Выберите иконку</label>
                                <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
                                    {ICON_PRESETS.map((preset) => {
                                        const IconComponent = preset.icon;
                                        return (
                                            <button 
                                                key={preset.id} 
                                                onClick={() => setCategoryForm({ ...categoryForm, slug: categoryForm.slug || preset.id, name: categoryForm.name || preset.label })}
                                                className={`p-2 rounded-lg border flex items-center justify-center transition-all aspect-square ${
                                                    (categoryForm.slug === preset.id || categoryForm.slug?.includes(preset.id))
                                                        ? 'bg-primary/20 border-primary text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                                                        : 'bg-white/5 border-transparent text-light/50 hover:bg-white/10 hover:text-light'
                                                }`}
                                                title={preset.label}
                                            >
                                                <IconComponent className="w-5 h-5" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <CustomSelect label="Цвет" value={categoryForm.color} onChange={val => setCategoryForm({...categoryForm, color: val})} options={AVAILABLE_COLORS.map(c => ({ value: c, label: c, icon: <div className={`w-3 h-3 rounded-full bg-${c}-500`}></div> }))} placeholder="Цвет" />
                                <div><label className="block text-xs font-bold text-light/40 uppercase mb-1">Сортировка</label><input type="number" value={categoryForm.sortOrder} onChange={e => setCategoryForm({...categoryForm, sortOrder: parseInt(e.target.value) || 0})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-primary outline-none" /></div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={handleSaveCategory} disabled={loading} className="px-6 py-2 bg-primary text-white rounded-lg font-bold flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Сохранить</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
