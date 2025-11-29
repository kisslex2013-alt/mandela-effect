'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { updateEffect, deleteEffect, logout, approveSubmission, rejectSubmission, createEffect } from '@/app/actions/admin';
import { generateEffectData } from '@/app/actions/generate-content';
import { getCategories, createCategory, updateCategory, deleteCategory, type Category } from '@/app/actions/category';
import { recalculateAllVoteCounters } from '@/app/actions/recalculate-votes';
import CustomSelect, { type SelectOption } from '@/components/ui/CustomSelect';
import EmojiPickerInput from '@/components/ui/EmojiPickerInput';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import toast from 'react-hot-toast';

interface Effect {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  imageUrl: string | null;
  videoUrl: string | null;
  votesFor: number;
  votesAgainst: number;
  views: number;
  residue: string | null;
  residueSource: string | null;
  history: string | null;
  historySource: string | null;
  yearDiscovered: number | null;
  interpretations: Record<string, string> | null;
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

// Типы вкладок
type TabType = 'effects' | 'submissions' | 'categories';

// Цвета для категорий (маппинг color -> tailwind классы)
const colorMap: Record<string, string> = {
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

// Функция для получения цвета категории
function getCategoryColor(color: string | null): string {
  return colorMap[color || 'gray'] || colorMap.gray;
}

// Типы сортировки
type SortType = 'newest' | 'popular' | 'alphabetical' | 'incomplete';

export default function AdminClient({ effects: initialEffects, submissions: initialSubmissions, categories: initialCategories }: AdminClientProps) {
  const router = useRouter();
  
  // Client-Side Only рендеринг (избегаем ошибок гидратации)
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const [effects, setEffects] = useState<Effect[]>(initialEffects);
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingEffect, setEditingEffect] = useState<Effect | null>(null);
  const [approvingSubmission, setApprovingSubmission] = useState<Submission | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkLogs, setBulkLogs] = useState<string[]>([]);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  
  // Быстрая генерация (для кнопок в списке)
  const [quickLoading, setQuickLoading] = useState<{ id: string, type: 'data' | 'image' } | null>(null);
  
  // Модальное окно для увеличения картинки
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  
  // Модальное окно для ручной вставки ссылки
  const [manualImageState, setManualImageState] = useState<{ isOpen: boolean; effect: Effect | null; url: string }>({
    isOpen: false,
    effect: null,
    url: ''
  });
  
  // Закрытие модального окна по ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (imageModalUrl) {
          setImageModalUrl(null);
        }
        if (manualImageState.isOpen) {
          setManualImageState({ ...manualImageState, isOpen: false });
        }
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [imageModalUrl, manualImageState]);
  
  // Категории - редактирование
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    slug: '',
    name: '',
    emoji: '',
    color: '',
    sortOrder: 0,
  });
  
  // Вкладки
  const [activeTab, setActiveTab] = useState<TabType>('effects');
  
  // Фильтры
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');

  // Форма редактирования
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    // Варианты
    variantA: '',
    variantB: '',
    // Блок 1: Текущее состояние
    currentState: '',
    sourceLink: '',
    // Блок 2: Остатки
    residue: '',
    residueSource: '',
    // Блок 3: История
    history: '',
    historySource: '',
    // Блок 4: Интерпретации
    scientificInterpretation: '',
    scientificSource: '',
    communityInterpretation: '',
    communitySource: '',
    // Изображение
    imageUrl: '',
    imagePrompt: '',
  });

  // Вычисляем статистику
  const stats = useMemo(() => {
    const totalVotes = effects.reduce((sum, e) => sum + e.votesFor + e.votesAgainst, 0);
    const avgVotes = effects.length > 0 ? Math.round(totalVotes / effects.length) : 0;
    
    // Топ категория
    const categoryCounts: Record<string, number> = {};
    effects.forEach((e) => {
      categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
    
    return {
      totalEffects: effects.length,
      totalVotes,
      avgVotes,
      topCategory: topCategory ? topCategory[0] : 'other',
      topCategoryCount: topCategory ? topCategory[1] : 0,
    };
  }, [effects]);

  // Уникальные категории для фильтра
  const uniqueCategories = useMemo(() => {
    const cats = new Set(effects.map((e) => e.category));
    return Array.from(cats).sort();
  }, [effects]);

  // Маппинг категорий из БД (для отображения)
  const categoryMap = useMemo(() => {
    const map: Record<string, { emoji: string; name: string; color: string }> = {};
    categories.forEach((cat) => {
      map[cat.slug] = {
        emoji: cat.emoji,
        name: cat.name,
        color: getCategoryColor(cat.color),
      };
    });
    return map;
  }, [categories]);

  // Опции для CustomSelect
  const categoryOptions: SelectOption[] = useMemo(() => {
    return categories.map((cat) => ({
      value: cat.slug,
      label: cat.name,
      emoji: cat.emoji,
    }));
  }, [categories]);

  // Опции для фильтра (включая "Все")
  const filterCategoryOptions: SelectOption[] = useMemo(() => {
    return [
      { value: 'all', label: 'Все категории', emoji: '📋' },
      ...categoryOptions,
    ];
  }, [categoryOptions]);

  // Проверка заполненности полей
  const hasCurrentState = (effect: Effect) => {
    const contentLines = effect.content.split('\n');
    const currentStateLine = contentLines.find(line => line.includes('Текущее состояние:'));
    return !!currentStateLine?.replace('Текущее состояние: ', '').trim();
  };

  // Фильтрация и сортировка эффектов
  const filteredEffects = useMemo(() => {
    let result = [...effects];

    // Поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query)
      );
    }

    // Фильтр по категории
    if (selectedCategory !== 'all') {
      result = result.filter((e) => e.category === selectedCategory);
    }

    // Сортировка
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        result.sort((a, b) => (b.votesFor + b.votesAgainst) - (a.votesFor + a.votesAgainst));
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
        break;
      case 'incomplete':
        result.sort((a, b) => {
          const aIncomplete = (!a.residue ? 1 : 0) + (!a.history ? 1 : 0) + (!hasCurrentState(a) ? 1 : 0);
          const bIncomplete = (!b.residue ? 1 : 0) + (!b.history ? 1 : 0) + (!hasCurrentState(b) ? 1 : 0);
          return bIncomplete - aIncomplete;
        });
        break;
    }

    return result;
  }, [effects, searchQuery, selectedCategory, sortBy]);

  // Открыть редактирование
  const handleEdit = (effect: Effect) => {
    setEditingEffect(effect);
    
    // Парсим варианты и currentState из content
    const contentLines = effect.content.split('\n');
    const variantALine = contentLines.find(line => line.startsWith('Вариант А:'));
    const variantBLine = contentLines.find(line => line.startsWith('Вариант Б:'));
    const currentStateLine = contentLines.find(line => line.includes('Текущее состояние:'));
    
    const variantA = variantALine?.replace('Вариант А: ', '').trim() || '';
    const variantB = variantBLine?.replace('Вариант Б: ', '').trim() || '';
    const currentState = currentStateLine?.replace('Текущее состояние: ', '').trim() || '';
    
    // Получаем interpretations как any для доступа к полям
    const interp = effect.interpretations as Record<string, string> | null;
    
    setFormData({
      title: effect.title,
      description: effect.description,
      category: effect.category,
      // Варианты
      variantA: variantA,
      variantB: variantB,
      // Блок 1: Текущее состояние
      currentState: currentState,
      sourceLink: interp?.sourceLink || '',
      // Блок 2: Остатки
      residue: effect.residue || '',
      residueSource: effect.residueSource || '',
      // Блок 3: История
      history: effect.history || '',
      historySource: effect.historySource || '',
      // Блок 4: Интерпретации
      scientificInterpretation: interp?.scientific || '',
      scientificSource: interp?.scientificSource || '',
      communityInterpretation: interp?.community || '',
      communitySource: interp?.communitySource || '',
      // Изображение
      imageUrl: effect.imageUrl || '',
      imagePrompt: '',
    });
  };

  // Сохранить изменения
  const handleSave = async () => {
    if (!editingEffect) return;
    setLoading(true);

    try {
      // Собираем interpretations с источниками
      const interpretations: Record<string, string> = {};
      if (formData.scientificInterpretation) interpretations.scientific = formData.scientificInterpretation;
      if (formData.scientificSource) interpretations.scientificSource = formData.scientificSource;
      if (formData.communityInterpretation) interpretations.community = formData.communityInterpretation;
      if (formData.communitySource) interpretations.communitySource = formData.communitySource;
      if (formData.sourceLink) interpretations.sourceLink = formData.sourceLink;

      // Формируем обновлённый content с вариантами из формы
      const newContent = `Вариант А: ${formData.variantA}\nВариант Б: ${formData.variantB}${
        formData.currentState ? `\nТекущее состояние: ${formData.currentState}` : ''
      }`;

      const result = await updateEffect(editingEffect.id, {
        title: formData.title,
        description: formData.description,
        content: newContent,
        category: formData.category,
        imageUrl: formData.imageUrl || undefined,
        residue: formData.residue || undefined,
        residueSource: formData.residueSource || undefined,
        history: formData.history || undefined,
        historySource: formData.historySource || undefined,
        interpretations: Object.keys(interpretations).length > 0 ? interpretations : undefined,
      });

      if (result.success) {
        // Обновляем локальный стейт НЕМЕДЛЕННО для мгновенного отображения
        const updatedEffect = {
          ...editingEffect,
          title: formData.title,
          description: formData.description,
          content: newContent,
          category: formData.category,
          imageUrl: formData.imageUrl || null,
          residue: formData.residue || null,
          history: formData.history || null,
          interpretations: Object.keys(interpretations).length > 0 ? interpretations : null,
          updatedAt: new Date().toISOString(), // Добавляем timestamp для принудительного обновления
        };

        setEffects((prev) =>
          prev.map((e) => (e.id === editingEffect.id ? updatedEffect : e))
        );
        
        // Закрываем модальное окно сразу
        setEditingEffect(null);
        setLoading(false); // Убираем лоадер немедленно
        
        toast.success('Эффект обновлён!');
      } else {
        toast.error(result.error || 'Ошибка сохранения');
        setLoading(false);
      }
    } catch (error) {
      toast.error('Ошибка сохранения');
      setLoading(false);
    }
  };

  // Удалить эффект
  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот эффект? Это действие нельзя отменить.')) return;
    setLoading(true);

    try {
      const result = await deleteEffect(id);

      if (result.success) {
        setEffects((prev) => prev.filter((e) => e.id !== id));
        toast.success('Эффект удалён');
      } else {
        toast.error(result.error || 'Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка удаления');
    } finally {
      setLoading(false);
    }
  };

  // Быстрая генерация картинки
  const handleQuickGenerateImage = async (effect: Effect) => {
    setQuickLoading({ id: effect.id, type: 'image' });

    try {
      const { generateEffectImage } = await import('@/app/actions/generate-content');
      const result = await generateEffectImage(effect.title);

      if (result.success && result.imageUrl) {
        // Сохраняем в БД
        const updateResult = await updateEffect(effect.id, {
          imageUrl: result.imageUrl
        });

        if (updateResult.success) {
          // Обновляем UI
          setEffects(prev => prev.map(e => 
            e.id === effect.id ? { ...e, imageUrl: result.imageUrl!, updatedAt: new Date().toISOString() } : e
          ));
          toast.success('Картинка обновлена!');
        } else {
          toast.error('Ошибка сохранения в БД');
        }
      } else {
        toast.error(result.error || 'Ошибка генерации');
      }
    } catch (e) {
      toast.error('Ошибка при генерации');
    } finally {
      setQuickLoading(null);
    }
  };

  // Быстрая генерация данных
  const handleQuickGenerateData = async (effect: Effect) => {
    setQuickLoading({ id: effect.id, type: 'data' });

    try {
      // Парсим варианты
      const contentLines = effect.content.split('\n');
      const variantALine = contentLines.find(line => line.startsWith('Вариант А:'));
      const variantBLine = contentLines.find(line => line.startsWith('Вариант Б:'));
      const variantA = variantALine?.replace('Вариант А: ', '').trim() || '';
      const variantB = variantBLine?.replace('Вариант Б: ', '').trim() || '';

      if (!variantA || !variantB) {
        toast.error('Не найдены варианты А и Б в контенте');
        setQuickLoading(null);
        return;
      }

      const result = await generateEffectData(
        effect.title, 
        effect.description, 
        variantA, 
        variantB, 
        { generateImage: false }
      );

      if (result.success && result.data) {
        const aiData = result.data;
        
        // Формируем interpretations
        const interpretations: Record<string, string> = {};
        if (aiData.scientific) interpretations.scientific = aiData.scientific;
        if (aiData.scientificSource) interpretations.scientificSource = aiData.scientificSource;
        if (aiData.community) interpretations.community = aiData.community;
        if (aiData.communitySource) interpretations.communitySource = aiData.communitySource;
        if (aiData.sourceLink) interpretations.sourceLink = aiData.sourceLink;

        // Формируем новый контент (сохраняя варианты, но обновляя currentState)
        const newContent = `Вариант А: ${variantA}\nВариант Б: ${variantB}${
          aiData.currentState ? `\nТекущее состояние: ${aiData.currentState}` : ''
        }`;

        // Обновляем в БД
        const updateResult = await updateEffect(effect.id, {
          content: newContent,
          category: aiData.category && ['films', 'brands', 'music', 'popculture', 'childhood', 'people', 'geography', 'russian', 'other'].includes(aiData.category) ? aiData.category : undefined,
          residue: aiData.residue || undefined,
          residueSource: aiData.residueSource || undefined,
          history: aiData.history || undefined,
          historySource: aiData.historySource || undefined,
          interpretations: Object.keys(interpretations).length > 0 ? interpretations : undefined,
        });

        if (updateResult.success) {
           // Обновляем UI
           setEffects(prev => prev.map(e => 
             e.id === effect.id ? { 
               ...e, 
               content: newContent,
               category: (aiData.category && ['films', 'brands', 'music', 'popculture', 'childhood', 'people', 'geography', 'russian', 'other'].includes(aiData.category)) ? aiData.category : e.category,
               residue: aiData.residue || e.residue,
               history: aiData.history || e.history,
               interpretations: Object.keys(interpretations).length > 0 ? interpretations : e.interpretations,
               updatedAt: new Date().toISOString()
             } : e
           ));
           toast.success('Данные обновлены!');
        } else {
          toast.error('Ошибка сохранения');
        }
      } else {
        toast.error(result.error || 'Ошибка AI');
      }
    } catch (e) {
      toast.error('Критическая ошибка');
      console.error(e);
    } finally {
      setQuickLoading(null);
    }
  };

  // Ручная установка картинки по ссылке
  const handleManualImage = (effect: Effect) => {
    setManualImageState({
      isOpen: true,
      effect: effect,
      url: effect.imageUrl || '' // Предзаполняем, если есть
    });
  };

  // Поиск качественного изображения в Google или Яндекс
  const handleSearchImage = (title: string, engine: 'google' | 'yandex') => {
    const query = encodeURIComponent(`${title} фото высокое качество`);
    let url = '';
    
    if (engine === 'google') {
      url = `https://www.google.com/search?tbm=isch&q=${query}`;
    } else {
      url = `https://yandex.ru/images/search?text=${query}`;
    }
    
    window.open(url, '_blank');
  };

  // Сохранение ссылки на картинку
  const saveManualImage = async () => {
    const { effect, url } = manualImageState;
    if (!effect || !url.trim()) return;

    if (!url.startsWith('http')) {
      toast.error('Ссылка должна начинаться с http:// или https://');
      return;
    }

    const toastId = toast.loading('Сохранение ссылки...');
    try {
      const updateResult = await updateEffect(effect.id, { imageUrl: url });
      
      if (updateResult.success) {
        setEffects(prev => prev.map(e => e.id === effect.id ? { ...e, imageUrl: url, updatedAt: new Date().toISOString() } : e));
        toast.success('Картинка установлена!', { id: toastId });
        setManualImageState({ isOpen: false, effect: null, url: '' }); // Закрываем
      } else {
        toast.error('Ошибка сохранения', { id: toastId });
      }
    } catch (e) {
      toast.error('Ошибка', { id: toastId });
    }
  };

  // Умная стилизация (Img2Img)
  const handleRestyleImage = async (effect: Effect) => {
    if (!effect.imageUrl) return;
    
    // Используем существующий стейт загрузки, можно добавить тип 'restyle' в интерфейс стейта или использовать 'image'
    setQuickLoading({ id: effect.id, type: 'image' }); 
    const toastId = toast.loading('🎨 ИИ подбирает стиль и перерисовывает...');
    
    try {
      const { restyleImage } = await import('@/app/actions/generate-content');
      const result = await restyleImage(effect.title, effect.imageUrl);
      
      if (result.success && result.imageUrl) {
        const updateResult = await updateEffect(effect.id, { imageUrl: result.imageUrl });
        
        if (updateResult.success) {
          setEffects(prev => prev.map(e => e.id === effect.id ? { ...e, imageUrl: result.imageUrl!, updatedAt: new Date().toISOString() } : e));
          toast.success('Стиль применен!', { id: toastId });
        } else {
          toast.error('Ошибка сохранения', { id: toastId });
        }
      } else {
        toast.error('Не удалось стилизовать', { id: toastId });
      }
    } catch (e) {
      toast.error('Ошибка соединения', { id: toastId });
    } finally {
      setQuickLoading(null);
    }
  };

  // Подгонка формата изображения под 16:9
  const handleFitImage = async (effect: Effect) => {
    if (!effect.imageUrl) return;
    
    setQuickLoading({ id: effect.id, type: 'image' }); // Используем тип 'image' для спиннера
    const toastId = toast.loading('📐 Подгоняем формат 16:9...');

    try {
      const { fitImageToFormat } = await import('@/app/actions/generate-content');
      const result = await fitImageToFormat(effect.title, effect.imageUrl);

      if (result.success && result.imageUrl) {
        const updateResult = await updateEffect(effect.id, { imageUrl: result.imageUrl });
        
        if (updateResult.success) {
          setEffects(prev => prev.map(e => e.id === effect.id ? { ...e, imageUrl: result.imageUrl!, updatedAt: new Date().toISOString() } : e));
          toast.success('Формат обновлен!', { id: toastId });
        } else {
          toast.error('Ошибка сохранения', { id: toastId });
        }
      } else {
        toast.error('Не удалось обработать', { id: toastId });
      }
    } catch (e) {
      toast.error('Ошибка соединения', { id: toastId });
    } finally {
      setQuickLoading(null);
    }
  };

  // Выход
  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  // Открыть модальное окно для редактирования заявки перед одобрением
  const handleApprove = (submission: Submission) => {
    setApprovingSubmission(submission);
    
    // Заполняем форму данными из заявки
    const interp = submission.interpretations as Record<string, string> | null;
    
    setFormData({
      title: submission.title,
      description: submission.question,
      category: submission.category,
      // Варианты
      variantA: submission.variantA,
      variantB: submission.variantB,
      // Блок 1: Текущее состояние
      currentState: submission.currentState || '',
      sourceLink: submission.sourceLink || '',
      // Блок 2: Остатки
      residue: '',
      residueSource: '',
      // Блок 3: История
      history: '',
      historySource: '',
      // Блок 4: Интерпретации
      scientificInterpretation: interp?.scientific || '',
      scientificSource: interp?.scientificSource || '',
      communityInterpretation: interp?.community || '',
      communitySource: interp?.communitySource || '',
      // Изображение
      imageUrl: '',
      imagePrompt: '',
    });
  };

  // Сохранить и опубликовать заявку как эффект
  const handlePublishSubmission = async () => {
    if (!approvingSubmission) return;
    setLoading(true);

    try {
      // Собираем interpretations с источниками
      const interpretations: Record<string, string> = {};
      if (formData.scientificInterpretation) interpretations.scientific = formData.scientificInterpretation;
      if (formData.scientificSource) interpretations.scientificSource = formData.scientificSource;
      if (formData.communityInterpretation) interpretations.community = formData.communityInterpretation;
      if (formData.communitySource) interpretations.communitySource = formData.communitySource;
      if (formData.sourceLink) interpretations.sourceLink = formData.sourceLink;

      // Формируем content с вариантами из формы (могут быть отредактированы)
      const content = `Вариант А: ${formData.variantA}\nВариант Б: ${formData.variantB}${
        formData.currentState ? `\nТекущее состояние: ${formData.currentState}` : ''
      }`;

      // Передаём данные формы в approveSubmission
      const result = await approveSubmission(approvingSubmission.id, {
        title: formData.title,
        description: formData.description,
        content: content,
        category: formData.category,
        residue: formData.residue || undefined,
        residueSource: formData.residueSource || undefined,
        history: formData.history || undefined,
        historySource: formData.historySource || undefined,
        interpretations: Object.keys(interpretations).length > 0 ? interpretations : undefined,
      });

      if (result.success) {
        setSubmissions((prev) => prev.filter((s) => s.id !== approvingSubmission.id));
        setApprovingSubmission(null);
        toast.success('Эффект опубликован!');
        router.refresh();
      } else {
        toast.error(result.error || 'Ошибка публикации');
      }
    } catch (error) {
      toast.error('Ошибка публикации');
    } finally {
      setLoading(false);
    }
  };

  // AI заполнение полей
  const handleAiFill = async () => {
    // Проверяем обязательные поля перед вызовом AI
    if (!formData.title.trim()) {
      toast.error('Сначала введите название эффекта');
      return;
    }
    
    if (!formData.variantA.trim() || !formData.variantB.trim()) {
      toast.error('Сначала заполните Варианты А и Б');
      return;
    }

    setAiLoading(true);

    try {
      console.log('[AdminClient] Запрос AI генерации для:', formData.title);
      const result = await generateEffectData(
        formData.title,
        formData.description || `Как вы помните ${formData.title}?`,
        formData.variantA,
        formData.variantB,
        { generateImage: true }
      );

      if (result.success && result.data) {
        // Проверяем, вернул ли AI ошибку валидации
        if (result.data.error) {
          toast.error(result.data.error);
          console.log('[AdminClient] AI отклонил запрос:', result.data.error);
          return;
        }

        // Маппинг полей AI -> formData (НЕ перезаписываем variantA и variantB)
        setFormData((prev) => ({
          ...prev,
          // Категория (если валидна)
          category: result.data!.category && ['films', 'brands', 'music', 'popculture', 'childhood', 'people', 'geography', 'russian', 'other'].includes(result.data!.category)
            ? result.data!.category
            : prev.category,
          // Текстовые поля
          currentState: result.data!.currentState || prev.currentState,
          residue: result.data!.residue || prev.residue,
          history: result.data!.history || prev.history,
          scientificInterpretation: result.data!.scientific || prev.scientificInterpretation,
          communityInterpretation: result.data!.community || prev.communityInterpretation,
          // Поля ссылок
          sourceLink: result.data!.sourceLink || prev.sourceLink,
          residueSource: result.data!.residueSource || prev.residueSource,
          historySource: result.data!.historySource || prev.historySource,
          scientificSource: result.data!.scientificSource || prev.scientificSource,
          communitySource: result.data!.communitySource || prev.communitySource,
          // Изображение
          imageUrl: result.data!.imageUrl || prev.imageUrl,
          imagePrompt: (result.data as any).imagePrompt || prev.imagePrompt,
        }));

        toast.success('Поля заполнены с помощью AI! ✨');
        console.log('[AdminClient] AI успешно заполнил поля:', result.data);
      } else {
        toast.error(result.error || 'Не удалось сгенерировать контент');
        console.error('[AdminClient] Ошибка AI:', result.error);
      }
    } catch (err) {
      console.error('[AdminClient] Исключение при AI генерации:', err);
      toast.error('Произошла ошибка при обращении к AI');
    } finally {
      setAiLoading(false);
    }
  };

  // Генерация только дополнительных данных (без изображения)
  const handleAiFillDataOnly = async () => {
    if (!formData.title.trim()) {
      toast.error('Сначала введите название эффекта');
      return;
    }
    
    if (!formData.variantA.trim() || !formData.variantB.trim()) {
      toast.error('Сначала заполните Варианты А и Б');
      return;
    }

    setAiLoading(true);

    try {
      console.log('[AdminClient] Запрос AI генерации данных (без изображения) для:', formData.title);
      const result = await generateEffectData(
        formData.title,
        formData.description || `Как вы помните ${formData.title}?`,
        formData.variantA,
        formData.variantB,
        { generateImage: false }
      );

      if (result.success && result.data) {
        if (result.data.error) {
          toast.error(result.data.error);
          console.log('[AdminClient] AI отклонил запрос:', result.data.error);
          return;
        }

        setFormData((prev) => ({
          ...prev,
          category: result.data!.category && ['films', 'brands', 'music', 'popculture', 'childhood', 'people', 'geography', 'russian', 'other'].includes(result.data!.category)
            ? result.data!.category
            : prev.category,
          currentState: result.data!.currentState || prev.currentState,
          residue: result.data!.residue || prev.residue,
          history: result.data!.history || prev.history,
          scientificInterpretation: result.data!.scientific || prev.scientificInterpretation,
          communityInterpretation: result.data!.community || prev.communityInterpretation,
          sourceLink: result.data!.sourceLink || prev.sourceLink,
          residueSource: result.data!.residueSource || prev.residueSource,
          historySource: result.data!.historySource || prev.historySource,
          scientificSource: result.data!.scientificSource || prev.scientificSource,
          communitySource: result.data!.communitySource || prev.communitySource,
        }));

        toast.success('Данные заполнены AI (изображение не изменено)! 📝');
        console.log('[AdminClient] AI успешно заполнил данные без изображения:', result.data);
      } else {
        toast.error(result.error || 'Не удалось сгенерировать контент');
        console.error('[AdminClient] Ошибка AI:', result.error);
      }
    } catch (err) {
      console.error('[AdminClient] Исключение при AI генерации:', err);
      toast.error('Произошла ошибка при обращении к AI');
    } finally {
      setAiLoading(false);
    }
  };

  // Генерация только изображения
  const handleAiImageOnly = async () => {
    if (!formData.title.trim()) {
      toast.error('Сначала введите название эффекта');
      return;
    }

    setAiLoading(true);

    try {
      console.log('[AdminClient] Запрос генерации изображения для:', formData.title);
      console.log('[AdminClient] Используется imagePrompt:', formData.imagePrompt || 'не задан, будет использован title');
      const { generateEffectImage } = await import('@/app/actions/generate-content');
      // Передаём imagePrompt, если он есть (после AI генерации данных)
      const result = await generateEffectImage(formData.title, formData.imagePrompt || undefined);

      if (result.success && result.imageUrl) {
        setFormData((prev) => ({
          ...prev,
          imageUrl: result.imageUrl || prev.imageUrl,
        }));

        toast.success('Изображение сгенерировано! 🖼️');
        console.log('[AdminClient] Изображение успешно сгенерировано:', result.imageUrl);
      } else {
        toast.error(result.error || 'Не удалось сгенерировать изображение');
        console.error('[AdminClient] Ошибка генерации изображения:', result.error);
      }
    } catch (err) {
      console.error('[AdminClient] Исключение при генерации изображения:', err);
      toast.error('Произошла ошибка при генерации изображения');
    } finally {
      setAiLoading(false);
    }
  };

  // Создать новый эффект
  const handleCreateEffect = async () => {
    if (!formData.title.trim()) {
      toast.error('Введите название эффекта');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Введите описание (вопрос)');
      return;
    }
    if (!formData.variantA.trim() || !formData.variantB.trim()) {
      toast.error('Введите оба варианта ответа');
      return;
    }
    if (!formData.category.trim()) {
      toast.error('Выберите категорию');
      return;
    }

    setLoading(true);
    try {
      // Собираем интерпретации
      const interpretations: Record<string, string> = {};
      if (formData.scientificInterpretation) interpretations.scientific = formData.scientificInterpretation;
      if (formData.scientificSource) interpretations.scientificSource = formData.scientificSource;
      if (formData.communityInterpretation) interpretations.community = formData.communityInterpretation;
      if (formData.communitySource) interpretations.communitySource = formData.communitySource;
      if (formData.sourceLink) interpretations.sourceLink = formData.sourceLink;

      // Формируем content с вариантами
      const newContent = `Вариант А: ${formData.variantA}\nВариант Б: ${formData.variantB}${
        formData.currentState ? `\nТекущее состояние: ${formData.currentState}` : ''
      }`;

      const result = await createEffect({
        title: formData.title,
        description: formData.description,
        content: newContent,
        category: formData.category,
        residue: formData.residue || undefined,
        residueSource: formData.residueSource || undefined,
        history: formData.history || undefined,
        historySource: formData.historySource || undefined,
        interpretations: Object.keys(interpretations).length > 0 ? interpretations : undefined,
      });

      if (result.success && result.id) {
        // Добавляем новый эффект в локальный стейт
        const newEffect: Effect = {
          id: result.id,
          title: formData.title,
          description: formData.description,
          content: newContent,
          category: formData.category,
          imageUrl: null,
          videoUrl: null,
          residue: formData.residue || null,
          history: formData.history || null,
          interpretations: Object.keys(interpretations).length > 0 ? interpretations : null,
          votesFor: 0,
          votesAgainst: 0,
          views: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          residueSource: formData.residueSource || null,
          historySource: formData.historySource || null,
          yearDiscovered: null,
        };
        setEffects((prev) => [newEffect, ...prev]);
        setIsCreating(false);
        toast.success('Эффект успешно создан! ✨');
      } else {
        toast.error(result.error || 'Не удалось создать эффект');
      }
    } catch (err) {
      console.error('Ошибка при создании эффекта:', err);
      toast.error('Произошла ошибка при создании');
    } finally {
      setLoading(false);
    }
  };

  // Отклонить заявку
  const handleReject = async (id: string) => {
    if (!confirm('Отклонить эту заявку?')) return;
    setLoading(true);

    try {
      const result = await rejectSubmission(id);

      if (result.success) {
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
        toast.success('Заявка отклонена');
      } else {
        toast.error(result.error || 'Ошибка отклонения');
      }
    } catch (error) {
      toast.error('Ошибка отклонения');
    } finally {
      setLoading(false);
    }
  };

  // === КАТЕГОРИИ ===
  
  // Открыть форму создания категории
  const handleCreateCategory = () => {
    setCategoryForm({ slug: '', name: '', emoji: '', color: '', sortOrder: categories.length + 1 });
    setIsCreatingCategory(true);
    setEditingCategory(null);
  };

  // Открыть форму редактирования категории
  const handleEditCategory = (category: Category) => {
    setCategoryForm({
      slug: category.slug,
      name: category.name,
      emoji: category.emoji,
      color: category.color || '',
      sortOrder: category.sortOrder,
    });
    setEditingCategory(category);
    setIsCreatingCategory(false);
  };

  // Сохранить категорию (создание или обновление)
  const handleSaveCategory = async () => {
    if (!categoryForm.slug.trim() || !categoryForm.name.trim() || !categoryForm.emoji.trim()) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setLoading(true);
    try {
      if (editingCategory) {
        // Обновление
        const result = await updateCategory(editingCategory.id, {
          slug: categoryForm.slug,
          name: categoryForm.name,
          emoji: categoryForm.emoji,
          color: categoryForm.color || null,
          sortOrder: categoryForm.sortOrder,
        });

        if (result.success && result.category) {
          setCategories((prev) =>
            prev.map((c) => (c.id === editingCategory.id ? result.category! : c))
          );
          setEditingCategory(null);
          toast.success('Категория обновлена!');
        } else {
          toast.error(result.error || 'Ошибка обновления');
        }
      } else {
        // Создание
        const result = await createCategory({
          slug: categoryForm.slug,
          name: categoryForm.name,
          emoji: categoryForm.emoji,
          color: categoryForm.color || null,
          sortOrder: categoryForm.sortOrder,
        });

        if (result.success && result.category) {
          setCategories((prev) => [...prev, result.category!].sort((a, b) => a.sortOrder - b.sortOrder));
          setIsCreatingCategory(false);
          toast.success('Категория создана!');
        } else {
          toast.error(result.error || 'Ошибка создания');
        }
      }
    } catch (err) {
      toast.error('Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  // Удалить категорию
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Удалить эту категорию?')) return;

    setLoading(true);
    try {
      const result = await deleteCategory(id);

      if (result.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast.success('Категория удалена');
      } else {
        toast.error(result.error || 'Ошибка удаления');
      }
    } catch (err) {
      toast.error('Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  // Массовая генерация эффектов через AI
  const handleBulkGenerate = async () => {
    // Умный парсинг JSON с очисткой от Markdown и форматирования
    let items: Array<{ title: string; question?: string; category?: string; variantA: string; variantB: string }>;
    try {
      // 1. Очистка от пробелов
      let cleanJson = bulkInput.trim();
      
      // 2. Удаляем маркеры кода Markdown
      cleanJson = cleanJson.replace(/```json/gi, '').replace(/```/g, '');
      
      // 3. Ищем границы массива (первая [ и последняя ])
      const firstBracket = cleanJson.indexOf('[');
      const lastBracket = cleanJson.lastIndexOf(']');
      
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        // 4. Обрезаем строку только до границ массива
        cleanJson = cleanJson.substring(firstBracket, lastBracket + 1);
      } else {
        // Если скобки не найдены, пробуем парсить как есть
        // (может быть уже чистый JSON)
      }
      
      // 5. Парсим очищенный JSON
      items = JSON.parse(cleanJson);
      
      if (!Array.isArray(items)) {
        toast.error('Ожидается JSON массив');
        return;
      }
    } catch (error) {
      console.error('[handleBulkGenerate] Ошибка парсинга JSON:', error);
      toast.error('Некорректный JSON формат. Проверьте синтаксис и попробуйте снова.');
      return;
    }

    if (items.length === 0) {
      toast.error('Массив пустой');
      return;
    }

    setBulkRunning(true);
    setBulkLogs([`🚀 Начинаем генерацию ${items.length} эффектов...`, '']);

    const addLog = (message: string) => {
      setBulkLogs((prev) => [...prev, message]);
    };

    addLog(`📋 В базе уже ${effects.length} эффектов`);
    addLog('');

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const progress = `[${i + 1}/${items.length}]`;

      if (!item.title) {
        addLog(`${progress} ❌ Пропущен: нет title`);
        errorCount++;
        continue;
      }

      // Проверка на дубли (нечеткий поиск)
      // Нормализуем текущий заголовок из JSON
      const currentNorm = normalizeText(item.title);

      // Ищем совпадение в УЖЕ существующих эффектах (из стейта effects)
      const isDuplicate = effects.some(e => {
        const existingNorm = normalizeText(e.title);
        // Проверяем вхождение одной строки в другую (в обе стороны)
        return existingNorm.includes(currentNorm) || currentNorm.includes(existingNorm);
      });

      if (isDuplicate) {
        addLog(`${progress} ⚠️ "${item.title}" похож на существующий эффект, пропускаем`);
        skippedCount++;
        continue;
      }

      addLog(`${progress} 🔄 Генерируем "${item.title}"...`);

      // Проверяем наличие обязательных полей для AI
      if (!item.variantA?.trim() || !item.variantB?.trim()) {
        addLog(`${progress} ⚠️ Пропущен: нет вариантов А/Б`);
        errorCount++;
        continue;
      }

      try {
        // 1. Генерируем контент через AI (передаем variantA и variantB)
        const aiResult = await generateEffectData(
          item.title,
          item.question || `Как вы помните ${item.title}?`,
          item.variantA.trim(),
          item.variantB.trim()
        );

        if (!aiResult.success || !aiResult.data) {
          addLog(`${progress} ⚠️ AI не смог сгенерировать: ${aiResult.error || 'неизвестная ошибка'}`);
          errorCount++;
          // Задержка даже при ошибке
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }

        // Проверяем на ошибку валидации от AI
        if (aiResult.data.error) {
          addLog(`${progress} ⚠️ AI отклонил: ${aiResult.data.error}`);
          errorCount++;
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }

        const aiData = aiResult.data;

        // 2. Формируем данные для создания эффекта
        // Приоритет: категория из JSON > категория от AI > 'other'
        const validCategories = ['films', 'music', 'brands', 'people', 'popculture', 'geography', 'childhood', 'russian', 'history', 'science', 'other'];
        let categoryToSave = (item.category || aiData.category || 'other').toLowerCase().trim();
        if (!validCategories.includes(categoryToSave)) {
          categoryToSave = 'other';
        }
        // Используем варианты из JSON (они обязательны)
        const variantA = item.variantA.trim();
        const variantB = item.variantB.trim();

        const interpretations: Record<string, string> = {};
        if (aiData.scientific) interpretations.scientific = aiData.scientific;
        if (aiData.scientificSource) interpretations.scientificSource = aiData.scientificSource;
        if (aiData.community) interpretations.community = aiData.community;
        if (aiData.communitySource) interpretations.communitySource = aiData.communitySource;
        if (aiData.sourceLink) interpretations.sourceLink = aiData.sourceLink;

        const content = `Вариант А: ${variantA}\nВариант Б: ${variantB}${
          aiData.currentState ? `\nТекущее состояние: ${aiData.currentState}` : ''
        }`;

        // 3. Создаём эффект в базе
        const createResult = await createEffect({
          title: item.title,
          description: item.question || `Как вы помните ${item.title}?`,
          content,
          category: categoryToSave,
          imageUrl: aiData.imageUrl || undefined,
          residue: aiData.residue || undefined,
          residueSource: aiData.residueSource || undefined,
          history: aiData.history || undefined,
          historySource: aiData.historySource || undefined,
          interpretations: Object.keys(interpretations).length > 0 ? interpretations : undefined,
        });

        if (createResult.success && createResult.id) {
          // Логируем, если картинка была сгенерирована
          if (aiData.imageUrl) {
            addLog(`${progress} 🖼️ Картинка сгенерирована`);
          }

          // Добавляем в локальный стейт
          const newEffect: Effect = {
            id: createResult.id,
            title: item.title,
            description: item.question || `Как вы помните ${item.title}?`,
            content,
            category: categoryToSave,
            imageUrl: aiData.imageUrl || null,
            videoUrl: null,
            residue: aiData.residue || null,
            residueSource: aiData.residueSource || null,
            history: aiData.history || null,
            historySource: aiData.historySource || null,
            yearDiscovered: null,
            interpretations: Object.keys(interpretations).length > 0 ? interpretations : null,
            votesFor: 0,
            votesAgainst: 0,
            views: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setEffects((prev) => [newEffect, ...prev]);
          addLog(`${progress} ✅ "${item.title}" создан! (категория: ${categoryToSave})`);
          successCount++;
        } else {
          addLog(`${progress} ❌ Ошибка сохранения: ${createResult.error || 'неизвестно'}`);
          errorCount++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'неизвестная ошибка';
        addLog(`${progress} ❌ Исключение: ${errorMessage}`);
        errorCount++;
        // Задержка даже при исключении, чтобы не спамить API
        if (i < items.length - 1) {
          await new Promise((r) => setTimeout(r, 1500));
        }
        continue; // Переходим к следующему эффекту
      }

      // 4. Задержка между запросами (чтобы не получить 429)
      if (i < items.length - 1) {
        addLog(`   ⏳ Пауза 2 секунды...`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    addLog('');
    addLog('═'.repeat(40));
    addLog(`🎉 Генерация завершена!`);
    addLog(`   ✅ Создано: ${successCount}`);
    addLog(`   ⚠️ Пропущено (дубли): ${skippedCount}`);
    addLog(`   ❌ Ошибок: ${errorCount}`);
    addLog('═'.repeat(40));

    setBulkRunning(false);
    if (successCount > 0) {
      toast.success(`Создано ${successCount} эффектов!`);
    } else if (skippedCount > 0) {
      toast.error(`Все эффекты уже есть в базе (${skippedCount} дублей)`);
    } else {
      toast.error('Не удалось создать ни одного эффекта');
    }
  };

  // Функция нормализации: убирает спецсимволы, пробелы и приводит к нижнему регистру
  const normalizeText = (text: string) => text.toLowerCase().replace(/[^a-zа-яё0-9]/g, '');

  const findDuplicate = (submissionTitle: string) => {
    const cleanSubmission = normalizeText(submissionTitle);
    if (cleanSubmission.length < 3) return null; // Слишком короткие не проверяем

    return effects.find(effect => {
      const cleanEffect = normalizeText(effect.title);
      // Проверяем полное совпадение или вхождение
      return cleanEffect.includes(cleanSubmission) || cleanSubmission.includes(cleanEffect);
    });
  };

  return (
    <div className="min-h-screen bg-dark py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Client-Side Only: показываем загрузку до монтирования */}
        {!isMounted ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <div className="text-light/50">Загрузка панели...</div>
            </div>
          </div>
        ) : (
        <>
        {/* Шапка */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Админ-панель
            </h1>
            <p className="text-light/60 mt-1">Управление эффектами Манделы</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-4 py-2 text-light/60 hover:text-light transition-colors"
            >
              ← На главную
            </Link>
            <button
              onClick={() => {
                // Очищаем форму для создания нового эффекта
                setFormData({
                  title: '',
                  description: '',
                  variantA: '',
                  variantB: '',
                  currentState: '',
                  category: '',
                  residue: '',
                  residueSource: '',
                  history: '',
                  historySource: '',
                  scientificInterpretation: '',
                  scientificSource: '',
                  communityInterpretation: '',
                  communitySource: '',
                  sourceLink: '',
                  // Изображение
                  imageUrl: '',
                  imagePrompt: '',
                });
                setIsCreating(true);
              }}
              className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2"
            >
              <span>➕</span>
              Добавить эффект
            </button>
            <button
              onClick={async () => {
                if (confirm('Пересчитать счетчики голосов для всех эффектов из таблицы Vote? Это может занять некоторое время.')) {
                  setRecalculating(true);
                  try {
                    const result = await recalculateAllVoteCounters();
                    if (result.success) {
                      toast.success(`✅ ${result.message}`);
                      // Обновляем страницу для отображения новых данных
                      router.refresh();
                    } else {
                      toast.error(`❌ Ошибка: ${result.message}`);
                    }
                  } catch (error) {
                    console.error('[Admin] Ошибка пересчета:', error);
                    toast.error('Ошибка при пересчете счетчиков');
                  } finally {
                    setRecalculating(false);
                  }
                }
              }}
              disabled={recalculating}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {recalculating ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Пересчет...
                </>
              ) : (
                <>
                  <span>🔄</span>
                  Пересчитать голоса
                </>
              )}
            </button>
            <button
              onClick={() => {
                setBulkInput('');
                setBulkLogs([]);
                setIsBulkGenerating(true);
              }}
              className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center gap-2"
            >
              <span>⚡</span>
              Массовая генерация
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('effects')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'effects'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-darkCard text-light/70 hover:text-light hover:bg-darkCard/80'
            }`}
          >
            📊 Активные эффекты
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm">
              {effects.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'submissions'
                ? 'bg-secondary text-white shadow-lg shadow-secondary/30'
                : 'bg-darkCard text-light/70 hover:text-light hover:bg-darkCard/80'
            }`}
          >
            📥 Входящие заявки
            {submissions.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-sm animate-pulse">
                {submissions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'categories'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                : 'bg-darkCard text-light/70 hover:text-light hover:bg-darkCard/80'
            }`}
          >
            🏷️ Категории
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm">
              {categories.length}
            </span>
          </button>
        </div>

        {/* Контент вкладки "Эффекты" */}
        {activeTab === 'effects' && (
          <>
        {/* Дашборд - Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-darkCard p-5 rounded-xl border border-light/10 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div className="text-3xl font-bold text-light">{stats.totalEffects}</div>
            </div>
            <div className="text-sm text-light/60">Всего эффектов</div>
          </div>
          
          <div className="bg-darkCard p-5 rounded-xl border border-light/10 hover:border-secondary/30 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <span className="text-xl">🗳️</span>
              </div>
              <div className="text-3xl font-bold text-secondary">{stats.totalVotes.toLocaleString('ru-RU')}</div>
            </div>
            <div className="text-sm text-light/60">Всего голосов</div>
          </div>
          
          <div className="bg-darkCard p-5 rounded-xl border border-light/10 hover:border-green-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="text-xl">{categoryMap[stats.topCategory]?.emoji || '❓'}</span>
              </div>
              <div className="text-3xl font-bold text-green-400">{stats.topCategoryCount}</div>
            </div>
            <div className="text-sm text-light/60">
              Топ: {categoryMap[stats.topCategory]?.name || 'Другое'}
            </div>
          </div>
          
          <div className="bg-darkCard p-5 rounded-xl border border-light/10 hover:border-purple-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <span className="text-xl">📈</span>
              </div>
              <div className="text-3xl font-bold text-purple-400">{stats.avgVotes}</div>
            </div>
            <div className="text-sm text-light/60">Среднее голосов/эффект</div>
          </div>
        </div>

        {/* Панель управления (Control Bar) */}
        <div className="bg-darkCard p-4 rounded-xl border border-light/10 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Поиск */}
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-light/40">🔍</span>
                <input
                  type="text"
                  placeholder="Поиск эффектов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark border border-light/10 rounded-lg text-light focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Фильтр категории */}
            <div className="md:w-56">
              <CustomSelect
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={filterCategoryOptions}
                placeholder="Все категории"
              />
            </div>

            {/* Сортировка */}
            <div className="md:w-56">
              <CustomSelect
                value={sortBy}
                onChange={(value) => setSortBy(value as SortType)}
                options={[
                  { value: 'newest', label: 'Сначала новые', emoji: '⏰' },
                  { value: 'popular', label: 'Популярные', emoji: '🔥' },
                  { value: 'alphabetical', label: 'По алфавиту', emoji: '🔤' },
                  { value: 'incomplete', label: 'Требуют заполнения', emoji: '⚠️' },
                ]}
                placeholder="Сортировка"
              />
            </div>
          </div>

          {/* Результаты фильтрации */}
          <div className="mt-3 pt-3 border-t border-light/5 flex items-center justify-between text-sm">
            <span className="text-light/50">
              Найдено: <span className="text-light font-medium">{filteredEffects.length}</span> эффектов
            </span>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        </div>

        {/* Список эффектов */}
        <div className="space-y-3">
          {filteredEffects.length === 0 ? (
            <div className="bg-darkCard rounded-xl border border-light/10 p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <div className="text-light/60">Эффекты не найдены</div>
              <div className="text-sm text-light/40 mt-2">Попробуйте изменить параметры поиска</div>
            </div>
          ) : (
            filteredEffects.map((effect) => {
              const catInfo = categoryMap[effect.category] || { emoji: '❓', name: effect.category, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
              const totalVotes = effect.votesFor + effect.votesAgainst;
              const percentA = totalVotes > 0 ? Math.round((effect.votesFor / totalVotes) * 100) : 50;
              
              // Проверка заполненности
              const hasCS = hasCurrentState(effect);
              const hasRes = !!effect.residue?.trim();
              const hasHist = !!effect.history?.trim();
              const completeness = [hasCS, hasRes, hasHist].filter(Boolean).length;

              return (
                <motion.div
                  key={effect.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-darkCard rounded-xl border border-light/10 hover:border-light/20 transition-all duration-200 overflow-hidden"
                >
                  <div className="p-4 md:p-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Основная информация */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          {/* Миниатюра картинки */}
                          <div 
                            className="flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden border border-light/10 cursor-pointer hover:border-primary/50 transition-all"
                            onClick={() => effect.imageUrl && setImageModalUrl(effect.imageUrl)}
                            title="Нажмите для увеличения"
                          >
                            <ImageWithSkeleton
                              key={`${effect.id}-${effect.imageUrl || 'no-image'}-${effect.updatedAt || ''}`}
                              src={effect.imageUrl}
                              alt={effect.title}
                              width={64}
                              height={40}
                              objectFit="cover"
                            />
                          </div>
                          <span className="text-2xl flex-shrink-0">{catInfo.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-light truncate">{effect.title}</h3>
                              <span className={`px-2 py-0.5 text-xs rounded-full border ${catInfo.color}`}>
                                {catInfo.name}
                              </span>
                            </div>
                            <p className="text-sm text-light/50 line-clamp-1 mt-1">{effect.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Статистика голосов */}
                      <div className="flex items-center gap-4 md:gap-6">
                        {/* Мини-бар голосов */}
                        <div className="hidden sm:block w-32">
                          <div className="flex items-center justify-between text-xs text-light/50 mb-1">
                            <span>{effect.votesFor}</span>
                            <span>{effect.votesAgainst}</span>
                          </div>
                          <div className="h-2 bg-dark rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${percentA}%` }}
                            />
                            <div
                              className="h-full bg-secondary transition-all"
                              style={{ width: `${100 - percentA}%` }}
                            />
                          </div>
                          <div className="text-xs text-light/40 text-center mt-1">
                            {totalVotes.toLocaleString('ru-RU')} голосов
                          </div>
                        </div>

                        {/* Индикаторы заполненности */}
                        <div className="flex items-center gap-1" title="Заполненность контента">
                          <span
                            className={`text-lg ${hasCS ? 'opacity-100' : 'opacity-30'}`}
                            title={hasCS ? 'Текущее состояние ✓' : 'Текущее состояние ✗'}
                          >
                            👁️
                          </span>
                          <span
                            className={`text-lg ${hasRes ? 'opacity-100' : 'opacity-30'}`}
                            title={hasRes ? 'Остатки ✓' : 'Остатки ✗'}
                          >
                            🔍
                          </span>
                          <span
                            className={`text-lg ${hasHist ? 'opacity-100' : 'opacity-30'}`}
                            title={hasHist ? 'История ✓' : 'История ✗'}
                          >
                            📜
                          </span>
                          {completeness < 3 && (
                            <span className="ml-1 text-xs text-amber-400">
                              {completeness}/3
                            </span>
                          )}
                        </div>

                        {/* Кнопки действий */}
                        <div className="flex items-center gap-2">
                          {/* Быстрая генерация данных */}
                          <button
                            onClick={() => handleQuickGenerateData(effect)}
                            disabled={quickLoading?.id === effect.id && quickLoading?.type === 'data'}
                            className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Быстрая генерация данных"
                          >
                            {quickLoading?.id === effect.id && quickLoading?.type === 'data' ? (
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              '📝'
                            )}
                          </button>
                          {/* Быстрая генерация картинки */}
                          <button
                            onClick={() => handleQuickGenerateImage(effect)}
                            disabled={quickLoading?.id === effect.id && quickLoading?.type === 'image'}
                            className="px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Быстрая генерация картинки"
                          >
                            {quickLoading?.id === effect.id && quickLoading?.type === 'image' ? (
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              '🖼️'
                            )}
                          </button>
                          {/* Группа кнопок поиска */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSearchImage(effect.title, 'google')}
                              className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20 transition-colors text-sm font-bold min-w-[28px]"
                              title="Найти в Google Картинках"
                            >
                              G
                            </button>
                            <button
                              onClick={() => handleSearchImage(effect.title, 'yandex')}
                              className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500/20 transition-colors text-sm font-bold min-w-[28px]"
                              title="Найти в Яндекс Картинках"
                            >
                              Я
                            </button>
                          </div>
                          {/* Вставить ссылку на картинку */}
                          <button
                            onClick={() => handleManualImage(effect)}
                            className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm font-medium"
                            title="Вставить ссылку на картинку"
                          >
                            🔗
                          </button>
                          {/* Умная стилизация (Img2Img) - показывается только если есть картинка */}
                          {effect.imageUrl && (
                            <button
                              onClick={() => handleRestyleImage(effect)}
                              disabled={quickLoading?.id === effect.id && quickLoading?.type === 'image'}
                              className="px-3 py-2 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Умная стилизация изображения"
                            >
                              {quickLoading?.id === effect.id && quickLoading?.type === 'image' ? (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                '🎨'
                              )}
                            </button>
                          )}
                          {/* Подгонка формата под 16:9 - показывается только если есть картинка */}
                          {effect.imageUrl && (
                            <button
                              onClick={() => handleFitImage(effect)}
                              disabled={quickLoading?.id === effect.id && quickLoading?.type === 'image'}
                              className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Подгнать под 16:9 (Fit)"
                            >
                              {quickLoading?.id === effect.id && quickLoading?.type === 'image' ? (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                '📐'
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(effect)}
                            className="px-3 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors text-sm font-medium"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(effect.id)}
                            className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
          </>
        )}

        {/* Контент вкладки "Заявки" */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="bg-darkCard rounded-xl border border-light/10 p-12 text-center">
                <div className="text-4xl mb-4">✅</div>
                <div className="text-light/60 text-lg">Нет заявок на модерацию</div>
                <div className="text-sm text-light/40 mt-2">Все заявки обработаны</div>
              </div>
            ) : (
              submissions.map((submission) => {
                const catInfo = categoryMap[submission.category] || {
                  emoji: '❓',
                  name: submission.category,
                  color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
                };

                return (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-darkCard rounded-xl border border-secondary/30 hover:border-secondary/50 transition-all duration-200 overflow-hidden"
                  >
                    <div className="p-5">
                      {/* Заголовок */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">{catInfo.emoji}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-light text-lg">{submission.title}</h3>
                              <span className={`px-2 py-0.5 text-xs rounded-full border ${catInfo.color}`}>
                                {catInfo.name}
                              </span>
                            </div>
                            <p className="text-light/60 mt-1">{submission.question}</p>
                          </div>
                        </div>
                        <div className="text-xs text-light/40 whitespace-nowrap">
                          {new Date(submission.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>

                      {/* Варианты */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <div className="text-xs text-primary mb-1 font-medium">Вариант А</div>
                          <div className="text-light">{submission.variantA}</div>
                        </div>
                        <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                          <div className="text-xs text-secondary mb-1 font-medium">Вариант Б</div>
                          <div className="text-light">{submission.variantB}</div>
                        </div>
                      </div>

                      {/* Дополнительная информация */}
                      {(submission.currentState || submission.sourceLink || submission.submitterEmail) && (
                        <div className="p-3 bg-dark/50 rounded-lg mb-4 space-y-2 text-sm">
                          {submission.currentState && (
                            <div>
                              <span className="text-light/50">Текущее состояние: </span>
                              <span className="text-light">{submission.currentState}</span>
                            </div>
                          )}
                          {submission.sourceLink && (
                            <div>
                              <span className="text-light/50">Источник: </span>
                              <a
                                href={submission.sourceLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                {submission.sourceLink}
                              </a>
                            </div>
                          )}
                          {submission.submitterEmail && (
                            <div>
                              <span className="text-light/50">Email автора: </span>
                              <span className="text-light">{submission.submitterEmail}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Проверка на дубликаты */}
                      {(() => {
                        const duplicate = findDuplicate(submission.title);
                        return duplicate ? (
                          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                              <div className="font-bold text-red-400">Найден возможный дубликат!</div>
                              <div className="text-sm text-light/70 mt-1">
                                В базе уже есть эффект: <span className="text-light font-medium">"{duplicate.title}"</span>
                              </div>
                              <div className="text-xs text-light/50 mt-1">
                                ID: {duplicate.id} • Категория: {duplicate.category}
                              </div>
                            </div>
                            <Link 
                              href={`/effect/${duplicate.id}`} 
                              target="_blank"
                              className="ml-auto px-3 py-1.5 bg-dark/50 hover:bg-dark text-xs rounded border border-light/10 text-light transition-colors"
                            >
                              Открыть ↗
                            </Link>
                          </div>
                        ) : null;
                      })()}

                      {/* Кнопки действий */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleApprove(submission)}
                          disabled={loading}
                          className="flex-1 px-4 py-3 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <span>✅</span>
                          <span>Редактировать и опубликовать</span>
                        </button>
                        <button
                          onClick={() => handleReject(submission.id)}
                          disabled={loading}
                          className="flex-1 px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <span>❌</span>
                          <span>Отклонить</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Контент вкладки "Категории" */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            {/* Кнопка добавления */}
            <div className="flex justify-end">
              <button
                onClick={handleCreateCategory}
                className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2"
              >
                <span>➕</span>
                Добавить категорию
              </button>
            </div>

            {/* Список категорий */}
            <div className="grid gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-darkCard rounded-xl border border-light/10 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{category.emoji}</span>
                    <div>
                      <div className="text-light font-medium">{category.name}</div>
                      <div className="text-light/40 text-sm">
                        slug: <code className="bg-dark px-1 rounded">{category.slug}</code>
                        {category.color && (
                          <span className="ml-2">
                            цвет: <span className={`px-2 py-0.5 rounded ${getCategoryColor(category.color)}`}>{category.color}</span>
                          </span>
                        )}
                        <span className="ml-2">порядок: {category.sortOrder}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                    >
                      ✏️ Редактировать
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                    >
                      🗑️ Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Форма создания/редактирования категории */}
            <AnimatePresence>
              {(isCreatingCategory || editingCategory) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-darkCard rounded-xl border border-light/10 p-6"
                >
                  <h3 className="text-xl font-bold text-light mb-4">
                    {editingCategory ? '✏️ Редактирование категории' : '➕ Новая категория'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-light/80 mb-2">
                        Slug (латиница) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={categoryForm.slug}
                        onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                        placeholder="films"
                        className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-light/80 mb-2">
                        Название <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        placeholder="Фильмы и сериалы"
                        className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <EmojiPickerInput
                        label="Эмодзи *"
                        value={categoryForm.emoji}
                        onChange={(emoji) => setCategoryForm({ ...categoryForm, emoji })}
                      />
                    </div>
                    <div>
                      <CustomSelect
                        label="Цвет"
                        value={categoryForm.color}
                        onChange={(val) => setCategoryForm({ ...categoryForm, color: val })}
                        options={[
                          { value: '', label: 'Без цвета' },
                          ...Object.keys(colorMap).map((color) => ({
                            value: color,
                            label: color.charAt(0).toUpperCase() + color.slice(1),
                          })),
                        ]}
                        placeholder="Выберите цвет"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-light/80 mb-2">
                        Порядок сортировки
                      </label>
                      <input
                        type="number"
                        value={categoryForm.sortOrder}
                        onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handleSaveCategory}
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
                    >
                      {loading ? 'Сохранение...' : '💾 Сохранить'}
                    </button>
                    <button
                      onClick={() => {
                        setIsCreatingCategory(false);
                        setEditingCategory(null);
                      }}
                      className="px-6 py-3 bg-light/10 text-light rounded-xl hover:bg-light/20"
                    >
                      Отмена
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Модальное окно редактирования заявки перед публикацией */}
        <AnimatePresence>
          {approvingSubmission && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto"
              onClick={() => setApprovingSubmission(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-darkCard p-6 md:p-8 rounded-2xl border border-secondary/30 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-light mb-2 flex items-center gap-3">
                  <span>📝</span>
                  Редактирование перед публикацией
                </h2>
                <p className="text-light/60 mb-4">
                  Проверьте и отредактируйте данные перед созданием эффекта
                </p>

                {/* Кнопка AI заполнения */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl mb-6">
                  <div>
                    <h4 className="text-light font-medium flex items-center gap-2">
                      ✨ AI-помощник
                    </h4>
                    <p className="text-light/60 text-sm">
                      Автоматически заполнит все дополнительные поля
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAiFill}
                    disabled={aiLoading || !formData.title.trim() || !formData.variantA.trim() || !formData.variantB.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {aiLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Генерация...
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        Заполнить через AI
                      </>
                    )}
                  </button>
                </div>

                {/* Редактируемые варианты */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-primary">
                      Вариант А
                    </label>
                    <input
                      type="text"
                      value={formData.variantA}
                      onChange={(e) => setFormData({ ...formData, variantA: e.target.value })}
                      className="w-full px-4 py-3 bg-primary/10 border border-primary/30 rounded-xl text-light placeholder:text-light/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Как многие помнят..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-secondary">
                      Вариант Б
                    </label>
                    <input
                      type="text"
                      value={formData.variantB}
                      onChange={(e) => setFormData({ ...formData, variantB: e.target.value })}
                      className="w-full px-4 py-3 bg-secondary/10 border border-secondary/30 rounded-xl text-light placeholder:text-light/30 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                      placeholder="Как на самом деле..."
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Название */}
                  <div>
                    <label className="block text-sm font-medium text-light/80 mb-2">
                      Название
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Описание */}
                  <div>
                    <label className="block text-sm font-medium text-light/80 mb-2">
                      Описание (вопрос)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-primary focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Категория */}
                  <CustomSelect
                    label="Категория"
                    value={formData.category}
                    onChange={(value) => setFormData({ ...formData, category: value })}
                    options={categoryOptions}
                    placeholder="Выберите категорию"
                  />

                  {/* Разделитель */}
                  <div className="border-t border-light/10 pt-6">
                    <h3 className="text-lg font-semibold text-light mb-4">📚 Дополнительная информация</h3>
                  </div>

                  {/* Блок 1: Текущее состояние (Факты) */}
                  <div className="bg-dark/30 p-4 rounded-xl border border-green-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-green-400 font-medium">
                      <span className="text-lg">👁️</span>
                      <span>Текущее состояние (Факты)</span>
                    </div>
                    <textarea
                      value={formData.currentState}
                      onChange={(e) => setFormData({ ...formData, currentState: e.target.value })}
                      rows={3}
                      placeholder="Как это есть на самом деле..."
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-green-500 focus:outline-none transition-colors resize-none placeholder:text-light/30"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-light/40 text-sm">🔗</span>
                      <input
                        type="url"
                        value={formData.sourceLink}
                        onChange={(e) => setFormData({ ...formData, sourceLink: e.target.value })}
                        placeholder="Ссылка на факт..."
                        className="flex-1 px-3 py-2 bg-dark border border-light/10 rounded-lg text-light text-sm focus:border-green-500 focus:outline-none transition-colors placeholder:text-light/30"
                      />
                    </div>
                  </div>

                  {/* Блок 2: Остатки (Residue) */}
                  <div className="bg-dark/30 p-4 rounded-xl border border-purple-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-purple-400 font-medium">
                      <span className="text-lg">🔍</span>
                      <span>Остатки / Культурные следы</span>
                    </div>
                    <textarea
                      value={formData.residue}
                      onChange={(e) => setFormData({ ...formData, residue: e.target.value })}
                      rows={3}
                      placeholder="Почему мы помним иначе, примеры..."
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-purple-500 focus:outline-none transition-colors resize-none placeholder:text-light/30"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-light/40 text-sm">🔗</span>
                      <input
                        type="url"
                        value={formData.residueSource}
                        onChange={(e) => setFormData({ ...formData, residueSource: e.target.value })}
                        placeholder="Ссылка на пример остатка..."
                        className="flex-1 px-3 py-2 bg-dark border border-light/10 rounded-lg text-light text-sm focus:border-purple-500 focus:outline-none transition-colors placeholder:text-light/30"
                      />
                    </div>
                  </div>

                  {/* Блок 3: История (Timeline) */}
                  <div className="bg-dark/30 p-4 rounded-xl border border-amber-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-medium">
                      <span className="text-lg">📜</span>
                      <span>История / Временная шкала</span>
                    </div>
                    <textarea
                      value={formData.history}
                      onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                      rows={3}
                      placeholder="Хронология эффекта, ключевые даты..."
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-amber-500 focus:outline-none transition-colors resize-none placeholder:text-light/30"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-light/40 text-sm">🔗</span>
                      <input
                        type="url"
                        value={formData.historySource}
                        onChange={(e) => setFormData({ ...formData, historySource: e.target.value })}
                        placeholder="Ссылка на историю..."
                        className="flex-1 px-3 py-2 bg-dark border border-light/10 rounded-lg text-light text-sm focus:border-amber-500 focus:outline-none transition-colors placeholder:text-light/30"
                      />
                    </div>
                  </div>

                  {/* Разделитель */}
                  <div className="border-t border-light/10 pt-6">
                    <h3 className="text-lg font-semibold text-light mb-4">🧠 Интерпретации</h3>
                  </div>

                  {/* Блок 4a: Научное объяснение */}
                  <div className="bg-dark/30 p-4 rounded-xl border border-blue-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-blue-400 font-medium">
                      <span className="text-lg">🔬</span>
                      <span>Научное объяснение</span>
                    </div>
                    <textarea
                      value={formData.scientificInterpretation}
                      onChange={(e) => setFormData({ ...formData, scientificInterpretation: e.target.value })}
                      rows={3}
                      placeholder="Психологическое или научное объяснение эффекта..."
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-blue-500 focus:outline-none transition-colors resize-none placeholder:text-light/30"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-light/40 text-sm">🔗</span>
                      <input
                        type="url"
                        value={formData.scientificSource}
                        onChange={(e) => setFormData({ ...formData, scientificSource: e.target.value })}
                        placeholder="Ссылка на научный источник..."
                        className="flex-1 px-3 py-2 bg-dark border border-light/10 rounded-lg text-light text-sm focus:border-blue-500 focus:outline-none transition-colors placeholder:text-light/30"
                      />
                    </div>
                  </div>

                  {/* Блок 4b: Версия сообщества */}
                  <div className="bg-dark/30 p-4 rounded-xl border border-orange-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-orange-400 font-medium">
                      <span className="text-lg">👥</span>
                      <span>Версия сообщества</span>
                    </div>
                    <textarea
                      value={formData.communityInterpretation}
                      onChange={(e) => setFormData({ ...formData, communityInterpretation: e.target.value })}
                      rows={3}
                      placeholder="Что думает сообщество об этом эффекте..."
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-orange-500 focus:outline-none transition-colors resize-none placeholder:text-light/30"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-light/40 text-sm">🔗</span>
                      <input
                        type="url"
                        value={formData.communitySource}
                        onChange={(e) => setFormData({ ...formData, communitySource: e.target.value })}
                        placeholder="Ссылка на обсуждение..."
                        className="flex-1 px-3 py-2 bg-dark border border-light/10 rounded-lg text-light text-sm focus:border-orange-500 focus:outline-none transition-colors placeholder:text-light/30"
                      />
                    </div>
                  </div>

                  {/* Кнопки */}
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handlePublishSubmission}
                      disabled={loading}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Публикация...
                        </>
                      ) : (
                        <>🚀 Опубликовать эффект</>
                      )}
                    </button>
                    <button
                      onClick={() => setApprovingSubmission(null)}
                      className="px-6 py-4 bg-light/10 text-light font-semibold rounded-xl hover:bg-light/20 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Модальное окно редактирования */}
        <AnimatePresence>
          {editingEffect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto"
              onClick={() => setEditingEffect(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-darkCard p-6 md:p-8 rounded-2xl border border-light/10 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-light mb-4 flex items-center gap-3">
                  <span>✏️</span>
                  Редактирование эффекта
                </h2>

                {/* Кнопки AI */}
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-light font-medium flex items-center gap-2">
                        ✨ AI-помощник
                      </h4>
                      <p className="text-light/60 text-sm">
                        Автоматически заполнит все дополнительные поля
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAiFill}
                      disabled={aiLoading || !formData.title.trim() || !formData.variantA.trim() || !formData.variantB.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {aiLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Генерация...
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          Заполнить всё
                        </>
                      )}
                    </button>
                  </div>

                  {/* Дополнительные кнопки */}
                  <div className="flex gap-2 pt-3 border-t border-purple-500/20">
                    <button
                      type="button"
                      onClick={handleAiFillDataOnly}
                      disabled={aiLoading || !formData.title.trim() || !formData.variantA.trim() || !formData.variantB.trim()}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-light border border-blue-500/30 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      {aiLoading ? (
                        <>
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span className="hidden sm:inline">Генерация...</span>
                        </>
                      ) : (
                        <>
                          <span>📝</span>
                          <span className="hidden sm:inline">Только данные</span>
                          <span className="sm:hidden">Данные</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleAiImageOnly}
                      disabled={aiLoading || !formData.title.trim()}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 hover:from-orange-500/30 hover:to-pink-500/30 text-light border border-orange-500/30 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      {aiLoading ? (
                        <>
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span className="hidden sm:inline">Генерация...</span>
                        </>
                      ) : (
                        <>
                          <span>🖼️</span>
                          <span className="hidden sm:inline">Только картинка</span>
                          <span className="sm:hidden">Картинка</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Название */}
                  <div>
                    <label className="block text-sm font-medium text-light/80 mb-2">
                      Название
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Редактируемые варианты */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-primary">
                        Вариант А
                      </label>
                      <input
                        type="text"
                        value={formData.variantA}
                        onChange={(e) => setFormData({ ...formData, variantA: e.target.value })}
                        className="w-full px-4 py-3 bg-primary/10 border border-primary/30 rounded-xl text-light placeholder:text-light/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Как многие помнят..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-secondary">
                        Вариант Б
                      </label>
                      <input
                        type="text"
                        value={formData.variantB}
                        onChange={(e) => setFormData({ ...formData, variantB: e.target.value })}
                        className="w-full px-4 py-3 bg-secondary/10 border border-secondary/30 rounded-xl text-light placeholder:text-light/30 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                        placeholder="Как на самом деле..."
                      />
                    </div>
                  </div>

                  {/* Описание */}
                  <div>
                    <label className="block text-sm font-medium text-light/80 mb-2">
                      Описание (вопрос)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-primary focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Категория */}
                  <CustomSelect
                    label="Категория"
                    value={formData.category}
                    onChange={(value) => setFormData({ ...formData, category: value })}
                    options={categoryOptions}
                    placeholder="Выберите категорию"
                  />

                  {/* Разделитель */}
                  <div className="border-t border-light/10 pt-6">
                    <h3 className="text-lg font-semibold text-light mb-4">📚 Дополнительная информация</h3>
                  </div>

                  {/* Блок 1: Текущее состояние (Факты) */}
                  <div className="bg-dark/30 p-4 rounded-xl border border-green-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-green-400 font-medium">
                      <span className="text-lg">👁️</span>
                      <span>Текущее состояние (Факты)</span>
                    </div>
                    <textarea
                      value={formData.currentState}
                      onChange={(e) => setFormData({ ...formData, currentState: e.target.value })}
                      rows={3}
                      placeholder="Как это есть на самом деле..."
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-green-500 focus:outline-none transition-colors resize-none placeholder:text-light/30"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-light/40 text-sm">🔗</span>
                      <input
                        type="url"
                        value={formData.sourceLink}
                        onChange={(e) => setFormData({ ...formData, sourceLink: e.target.value })}
                        placeholder="Ссылка на факт..."
                        className="flex-1 px-3 py-2 bg-dark border border-light/10 rounded-lg text-light text-sm focus:border-green-500 focus:outline-none transition-colors placeholder:text-light/30"
                      />
                    </div>
                  </div>

                  {/* Блок 2: Остатки (Residue) */}
                  <div className="bg-dark/30 p-4 rounded-xl border border-purple-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-purple-400 font-medium">
                      <span className="text-lg">🔍</span>
                      <span>Остатки / Культурные следы</span>
                    </div>
                    <textarea
                      value={formData.residue}
                      onChange={(e) => setFormData({ ...formData, residue: e.target.value })}
                      rows={3}
                      placeholder="Почему мы помним иначе, примеры..."
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-purple-500 focus:outline-none transition-colors resize-none placeholder:text-light/30"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-light/40 text-sm">🔗</span>
                      <input
                        type="url"
                        value={formData.residueSource}
                        onChange={(e) => setFormData({ ...formData, residueSource: e.target.value })}
                        placeholder="Ссылка на пример остатка..."
                        className="flex-1 px-3 py-2 bg-dark border border-light/10 rounded-lg text-light text-sm focus:border-purple-500 focus:outline-none transition-colors placeholder:text-light/30"
                      />
                    </div>
                  </div>

                  {/* Блок 3: История (Timeline) */}
                  <div className="bg-dark/30 p-4 rounded-xl border border-amber-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-medium">
                      <span className="text-lg">📜</span>
                      <span>История / Временная шкала</span>
                    </div>
                    <textarea
                      value={formData.history}
                      onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                      rows={3}
                      placeholder="Хронология эффекта, ключевые даты..."
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-amber-500 focus:outline-none transition-colors resize-none placeholder:text-light/30"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-light/40 text-sm">🔗</span>
                      <input
                        type="url"
                        value={formData.historySource}
                        onChange={(e) => setFormData({ ...formData, historySource: e.target.value })}
                        placeholder="Ссылка на историю..."
                        className="flex-1 px-3 py-2 bg-dark border border-light/10 rounded-lg text-light text-sm focus:border-amber-500 focus:outline-none transition-colors placeholder:text-light/30"
                      />
                    </div>
                  </div>

                  {/* Разделитель */}
                  <div className="border-t border-light/10 pt-6">
                    <h3 className="text-lg font-semibold text-light mb-4">🧠 Интерпретации</h3>
                  </div>

                  {/* Блок 4a: Научное объяснение */}
                  <div className="bg-dark/30 p-4 rounded-xl border border-blue-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-blue-400 font-medium">
                      <span className="text-lg">🔬</span>
                      <span>Научное объяснение</span>
                    </div>
                    <textarea
                      value={formData.scientificInterpretation}
                      onChange={(e) => setFormData({ ...formData, scientificInterpretation: e.target.value })}
                      rows={3}
                      placeholder="Психологическое или научное объяснение эффекта..."
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-blue-500 focus:outline-none transition-colors resize-none placeholder:text-light/30"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-light/40 text-sm">🔗</span>
                      <input
                        type="url"
                        value={formData.scientificSource}
                        onChange={(e) => setFormData({ ...formData, scientificSource: e.target.value })}
                        placeholder="Ссылка на научный источник..."
                        className="flex-1 px-3 py-2 bg-dark border border-light/10 rounded-lg text-light text-sm focus:border-blue-500 focus:outline-none transition-colors placeholder:text-light/30"
                      />
                    </div>
                  </div>

                  {/* Блок 4b: Версия сообщества */}
                  <div className="bg-dark/30 p-4 rounded-xl border border-orange-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-orange-400 font-medium">
                      <span className="text-lg">👥</span>
                      <span>Версия сообщества</span>
                    </div>
                    <textarea
                      value={formData.communityInterpretation}
                      onChange={(e) => setFormData({ ...formData, communityInterpretation: e.target.value })}
                      rows={3}
                      placeholder="Что думает сообщество об этом эффекте..."
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-orange-500 focus:outline-none transition-colors resize-none placeholder:text-light/30"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-light/40 text-sm">🔗</span>
                      <input
                        type="url"
                        value={formData.communitySource}
                        onChange={(e) => setFormData({ ...formData, communitySource: e.target.value })}
                        placeholder="Ссылка на обсуждение..."
                        className="flex-1 px-3 py-2 bg-dark border border-light/10 rounded-lg text-light text-sm focus:border-orange-500 focus:outline-none transition-colors placeholder:text-light/30"
                      />
                    </div>
                  </div>

                  {/* Кнопки */}
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Сохранение...
                        </>
                      ) : (
                        <>💾 Сохранить</>
                      )}
                    </button>
                    <button
                      onClick={() => setEditingEffect(null)}
                      className="px-6 py-4 bg-light/10 text-light font-semibold rounded-xl hover:bg-light/20 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Модальное окно создания нового эффекта */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto"
              onClick={() => setIsCreating(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-darkCard p-6 md:p-8 rounded-2xl border border-light/10 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-light mb-4 flex items-center gap-3">
                  <span>➕</span>
                  Создание нового эффекта
                </h2>

                {/* Кнопки AI */}
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-light font-medium flex items-center gap-2">
                        ✨ AI-помощник
                      </h4>
                      <p className="text-light/60 text-sm">
                        Автоматически заполнит все дополнительные поля
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAiFill}
                      disabled={aiLoading || !formData.title.trim() || !formData.variantA.trim() || !formData.variantB.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {aiLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Генерация...
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          Заполнить всё
                        </>
                      )}
                    </button>
                  </div>

                  {/* Дополнительные кнопки */}
                  <div className="flex gap-2 pt-3 border-t border-purple-500/20">
                    <button
                      type="button"
                      onClick={handleAiFillDataOnly}
                      disabled={aiLoading || !formData.title.trim() || !formData.variantA.trim() || !formData.variantB.trim()}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-light border border-blue-500/30 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      {aiLoading ? (
                        <>
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span className="hidden sm:inline">Генерация...</span>
                        </>
                      ) : (
                        <>
                          <span>📝</span>
                          <span className="hidden sm:inline">Только данные</span>
                          <span className="sm:hidden">Данные</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleAiImageOnly}
                      disabled={aiLoading || !formData.title.trim()}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 hover:from-orange-500/30 hover:to-pink-500/30 text-light border border-orange-500/30 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      {aiLoading ? (
                        <>
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span className="hidden sm:inline">Генерация...</span>
                        </>
                      ) : (
                        <>
                          <span>🖼️</span>
                          <span className="hidden sm:inline">Только картинка</span>
                          <span className="sm:hidden">Картинка</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Название */}
                  <div>
                    <label className="block text-sm font-medium text-light/80 mb-2">
                      Название <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Например: Логотип Volkswagen"
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-primary focus:outline-none transition-colors placeholder:text-light/30"
                    />
                  </div>

                  {/* Варианты */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-primary">
                        Вариант А <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.variantA}
                        onChange={(e) => setFormData({ ...formData, variantA: e.target.value })}
                        className="w-full px-4 py-3 bg-primary/10 border border-primary/30 rounded-xl text-light placeholder:text-light/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Как многие помнят..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-secondary">
                        Вариант Б <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.variantB}
                        onChange={(e) => setFormData({ ...formData, variantB: e.target.value })}
                        className="w-full px-4 py-3 bg-secondary/10 border border-secondary/30 rounded-xl text-light placeholder:text-light/30 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                        placeholder="Как на самом деле..."
                      />
                    </div>
                  </div>

                  {/* Описание */}
                  <div>
                    <label className="block text-sm font-medium text-light/80 mb-2">
                      Описание (вопрос) <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Как вы помните этот логотип?"
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-primary focus:outline-none transition-colors resize-none placeholder:text-light/30"
                    />
                  </div>

                  {/* Категория */}
                  <CustomSelect
                    label="Категория *"
                    value={formData.category}
                    onChange={(value) => setFormData({ ...formData, category: value })}
                    options={categoryOptions}
                    placeholder="Выберите категорию"
                  />

                  {/* Разделитель */}
                  <div className="border-t border-light/10 pt-6">
                    <h3 className="text-lg font-semibold text-light mb-4">📚 Дополнительная информация</h3>
                  </div>

                  {/* Блок 1: Текущее состояние (Факты) */}
                  <div className="bg-dark/30 p-4 rounded-xl border border-green-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-green-400 font-medium">
                      <span className="text-lg">👁️</span>
                      <span>Текущее состояние (Факты)</span>
                    </div>
                    <textarea
                      value={formData.currentState}
                      onChange={(e) => setFormData({ ...formData, currentState: e.target.value })}
                      rows={3}
                      placeholder="Как это есть на самом деле..."
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-green-500 focus:outline-none transition-colors resize-none placeholder:text-light/30"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-light/40 text-sm">🔗</span>
                      <input
                        type="url"
                        value={formData.sourceLink}
                        onChange={(e) => setFormData({ ...formData, sourceLink: e.target.value })}
                        placeholder="Ссылка на факт..."
                        className="flex-1 px-3 py-2 bg-dark border border-light/10 rounded-lg text-light text-sm focus:border-green-500 focus:outline-none transition-colors placeholder:text-light/30"
                      />
                    </div>
                  </div>

                  {/* Блок 2: Остатки (Residue) */}
                  <div className="bg-dark/30 p-4 rounded-xl border border-purple-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-purple-400 font-medium">
                      <span className="text-lg">🔍</span>
                      <span>Остатки / Культурные следы</span>
                    </div>
                    <textarea
                      value={formData.residue}
                      onChange={(e) => setFormData({ ...formData, residue: e.target.value })}
                      rows={3}
                      placeholder="Почему мы помним иначе, примеры..."
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-purple-500 focus:outline-none transition-colors resize-none placeholder:text-light/30"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-light/40 text-sm">🔗</span>
                      <input
                        type="url"
                        value={formData.residueSource}
                        onChange={(e) => setFormData({ ...formData, residueSource: e.target.value })}
                        placeholder="Ссылка на пример остатка..."
                        className="flex-1 px-3 py-2 bg-dark border border-light/10 rounded-lg text-light text-sm focus:border-purple-500 focus:outline-none transition-colors placeholder:text-light/30"
                      />
                    </div>
                  </div>

                  {/* Блок 3: История (Timeline) */}
                  <div className="bg-dark/30 p-4 rounded-xl border border-amber-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-medium">
                      <span className="text-lg">📜</span>
                      <span>История / Временная шкала</span>
                    </div>
                    <textarea
                      value={formData.history}
                      onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                      rows={3}
                      placeholder="Хронология эффекта, ключевые даты..."
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-amber-500 focus:outline-none transition-colors resize-none placeholder:text-light/30"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-light/40 text-sm">🔗</span>
                      <input
                        type="url"
                        value={formData.historySource}
                        onChange={(e) => setFormData({ ...formData, historySource: e.target.value })}
                        placeholder="Ссылка на историю..."
                        className="flex-1 px-3 py-2 bg-dark border border-light/10 rounded-lg text-light text-sm focus:border-amber-500 focus:outline-none transition-colors placeholder:text-light/30"
                      />
                    </div>
                  </div>

                  {/* Разделитель */}
                  <div className="border-t border-light/10 pt-6">
                    <h3 className="text-lg font-semibold text-light mb-4">🧠 Интерпретации</h3>
                  </div>

                  {/* Блок 4a: Научное объяснение */}
                  <div className="bg-dark/30 p-4 rounded-xl border border-blue-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-blue-400 font-medium">
                      <span className="text-lg">🔬</span>
                      <span>Научное объяснение</span>
                    </div>
                    <textarea
                      value={formData.scientificInterpretation}
                      onChange={(e) => setFormData({ ...formData, scientificInterpretation: e.target.value })}
                      rows={3}
                      placeholder="Психологическое или научное объяснение эффекта..."
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-blue-500 focus:outline-none transition-colors resize-none placeholder:text-light/30"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-light/40 text-sm">🔗</span>
                      <input
                        type="url"
                        value={formData.scientificSource}
                        onChange={(e) => setFormData({ ...formData, scientificSource: e.target.value })}
                        placeholder="Ссылка на научный источник..."
                        className="flex-1 px-3 py-2 bg-dark border border-light/10 rounded-lg text-light text-sm focus:border-blue-500 focus:outline-none transition-colors placeholder:text-light/30"
                      />
                    </div>
                  </div>

                  {/* Блок 4b: Версия сообщества */}
                  <div className="bg-dark/30 p-4 rounded-xl border border-orange-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-orange-400 font-medium">
                      <span className="text-lg">👥</span>
                      <span>Версия сообщества</span>
                    </div>
                    <textarea
                      value={formData.communityInterpretation}
                      onChange={(e) => setFormData({ ...formData, communityInterpretation: e.target.value })}
                      rows={3}
                      placeholder="Что думает сообщество об этом эффекте..."
                      className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-orange-500 focus:outline-none transition-colors resize-none placeholder:text-light/30"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-light/40 text-sm">🔗</span>
                      <input
                        type="url"
                        value={formData.communitySource}
                        onChange={(e) => setFormData({ ...formData, communitySource: e.target.value })}
                        placeholder="Ссылка на обсуждение..."
                        className="flex-1 px-3 py-2 bg-dark border border-light/10 rounded-lg text-light text-sm focus:border-orange-500 focus:outline-none transition-colors placeholder:text-light/30"
                      />
                    </div>
                  </div>

                  {/* Кнопки */}
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleCreateEffect}
                      disabled={loading}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Создание...
                        </>
                      ) : (
                        <>➕ Создать</>
                      )}
                    </button>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="px-6 py-4 bg-light/10 text-light font-semibold rounded-xl hover:bg-light/20 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Модальное окно массовой генерации */}
        <AnimatePresence>
          {isBulkGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto"
              onClick={() => !bulkRunning && setIsBulkGenerating(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-darkCard p-6 md:p-8 rounded-2xl border border-light/10 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-light mb-4 flex items-center gap-3">
                  <span>⚡</span>
                  Массовая генерация эффектов
                </h2>

                <p className="text-light/60 mb-4">
                  Вставьте JSON массив с объектами. Каждый объект должен содержать <code className="text-purple-400">title</code> (обязательно) и <code className="text-purple-400">question</code> (опционально).
                </p>

                {/* Пример */}
                <div className="bg-dark/50 p-4 rounded-xl mb-4 border border-light/10">
                  <p className="text-light/40 text-sm mb-2">Пример формата:</p>
                  <pre className="text-green-400 text-sm overflow-x-auto">
{`[
  { "title": "Логотип Apple", "question": "Был ли надкус справа или слева?" },
  { "title": "Пикачу", "question": "Какого цвета кончик хвоста?" },
  { "title": "Монополия", "category": "popculture" }
]`}
                  </pre>
                </div>

                {/* Текстовое поле */}
                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  disabled={bulkRunning}
                  rows={8}
                  placeholder='[{ "title": "...", "question": "...", "variantA": "...", "variantB": "..." }]'
                  className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light font-mono text-sm focus:border-purple-500 focus:outline-none transition-colors resize-none placeholder:text-light/30 mb-4 disabled:opacity-50"
                />

                {/* Кнопка запуска */}
                <button
                  onClick={handleBulkGenerate}
                  disabled={bulkRunning || !bulkInput.trim()}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
                >
                  {bulkRunning ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Генерация в процессе...
                    </>
                  ) : (
                    <>🚀 Запустить конвейер</>
                  )}
                </button>

                {/* Область логов */}
                {bulkLogs.length > 0 && (
                  <div className="bg-dark/80 border border-light/10 rounded-xl p-4 max-h-80 overflow-y-auto">
                    <h4 className="text-light/60 text-sm mb-2 font-medium">📋 Лог выполнения:</h4>
                    <div className="font-mono text-sm space-y-1">
                      {bulkLogs.map((log, index) => (
                        <div
                          key={index}
                          className={`${
                            log.includes('✅') ? 'text-green-400' :
                            log.includes('❌') ? 'text-red-400' :
                            log.includes('⚠️') ? 'text-yellow-400' :
                            log.includes('🔄') ? 'text-blue-400' :
                            log.includes('🎉') ? 'text-purple-400' :
                            log.includes('═') ? 'text-light/40' :
                            'text-light/70'
                          }`}
                        >
                          {log || '\u00A0'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Кнопка закрытия */}
                {!bulkRunning && (
                  <button
                    onClick={() => setIsBulkGenerating(false)}
                    className="w-full mt-4 px-6 py-3 bg-light/10 text-light font-medium rounded-xl hover:bg-light/20 transition-colors"
                  >
                    Закрыть
                  </button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Модальное окно для увеличения картинки */}
        <AnimatePresence>
          {imageModalUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
              onClick={() => setImageModalUrl(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative w-full max-w-5xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Кнопка закрытия */}
                <button
                  onClick={() => setImageModalUrl(null)}
                  className="absolute -top-12 right-0 text-white/80 hover:text-white text-4xl font-light transition-colors z-10"
                  title="Закрыть (ESC)"
                >
                  ×
                </button>
                
                {/* Изображение с фиксированным aspect ratio */}
                <div className="relative w-full aspect-video bg-dark rounded-xl overflow-hidden border border-light/20 shadow-2xl">
                  <ImageWithSkeleton
                    src={imageModalUrl}
                    alt="Увеличенное изображение"
                    fill
                    objectFit="contain"
                    priority
                  />
                </div>
                
                {/* Подсказка */}
                <div className="text-center text-white/60 text-sm mt-4">
                  Нажмите ESC или кликните вне изображения для закрытия
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Модальное окно ручной вставки ссылки */}
        <AnimatePresence>
          {manualImageState.isOpen && manualImageState.effect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]"
              onClick={() => setManualImageState({ ...manualImageState, isOpen: false })}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-darkCard p-6 rounded-2xl border border-light/10 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-light mb-4">Вставить ссылку на изображение</h3>
                
                <div className="mb-4">
                  <label className="block text-sm text-light/60 mb-2">Прямая ссылка (JPG/PNG/WEBP)</label>
                  <input
                    type="url"
                    value={manualImageState.url}
                    onChange={(e) => setManualImageState({ ...manualImageState, url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 bg-dark border border-light/10 rounded-xl text-light focus:border-primary focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveManualImage();
                      if (e.key === 'Escape') setManualImageState({ ...manualImageState, isOpen: false });
                    }}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={saveManualImage}
                    disabled={!manualImageState.url.trim()}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => setManualImageState({ ...manualImageState, isOpen: false })}
                    className="flex-1 px-4 py-2 bg-light/10 text-light rounded-lg hover:bg-light/20 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </>
        )}
      </div>
    </div>
  );
}

