'use client';

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { generateEffectInfo } from '@/app/actions/generate-content';
import { getCategories, type Category } from '@/app/actions/category';
import CustomSelect, { type SelectOption } from '@/components/ui/CustomSelect';

interface EffectFormData {
  category: string;
  title: string;
  question: string;
  variantA: string;
  variantADescription: string;
  variantB: string;
  variantBDescription: string;
  currentState?: string;
  sourceLink?: string;
  history?: string;
  residue?: string;
  interpretations?: {
    scientific: string;
    scientificTheory: string;
    scientificSource: string;
    community: string;
    communitySource: string;
  };
}

interface EffectFormProps {
  initialData?: EffectFormData;
  onSubmit: (data: EffectFormData) => Promise<void>;
  onCancel?: () => void;
  submitButtonText?: string;
  isModal?: boolean;
}

export default function EffectForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  submitButtonText = 'Отправить',
  isModal = false
}: EffectFormProps) {
  const [category, setCategory] = useState(initialData?.category || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [question, setQuestion] = useState(initialData?.question || '');
  const [variantA, setVariantA] = useState(initialData?.variantA || '');
  const [variantADescription, setVariantADescription] = useState(initialData?.variantADescription || '');
  const [variantB, setVariantB] = useState(initialData?.variantB || '');
  const [variantBDescription, setVariantBDescription] = useState(initialData?.variantBDescription || '');
  const [currentState, setCurrentState] = useState(initialData?.currentState || '');
  const [sourceLink, setSourceLink] = useState(initialData?.sourceLink || '');
  const [history, setHistory] = useState(initialData?.history || '');
  const [residue, setResidue] = useState(initialData?.residue || '');
  const [interpretations, setInterpretations] = useState({
    scientific: initialData?.interpretations?.scientific || '',
    scientificTheory: initialData?.interpretations?.scientificTheory || '',
    scientificSource: initialData?.interpretations?.scientificSource || '',
    community: initialData?.interpretations?.community || '',
    communitySource: initialData?.interpretations?.communitySource || '',
  });

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  // Загружаем категории из БД (безопасный вызов Server Action)
  useEffect(() => {
    let isMounted = true;
    
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        if (isMounted) {
          setCategories(data);
        }
      } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
      }
    };
    
    fetchCategories();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Опции для CustomSelect
  const categoryOptions: SelectOption[] = useMemo(() => {
    return categories.map((cat) => ({
      value: cat.slug,
      label: cat.name,
      emoji: cat.emoji,
    }));
  }, [categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data: EffectFormData = {
        category,
        title,
        question,
        variantA,
        variantADescription,
        variantB,
        variantBDescription,
        currentState,
        sourceLink,
        history,
        residue,
      };

      // Добавляем интерпретации только если заполнены
      const hasInterpretations = 
        interpretations.scientific.trim() || 
        interpretations.community.trim();

      if (hasInterpretations) {
        data.interpretations = {
          scientific: interpretations.scientific.trim(),
          scientificTheory: interpretations.scientificTheory.trim(),
          scientificSource: interpretations.scientificSource.trim(),
          community: interpretations.community.trim(),
          communitySource: interpretations.communitySource.trim(),
        };
      }

      await onSubmit(data);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  // Функция для AI заполнения полей
  const handleAiFill = async () => {
    if (!title.trim()) {
      toast.error('Сначала введите название эффекта');
      return;
    }

    setAiLoading(true);
    
    try {
      console.log('[EffectForm] Запрос AI генерации для:', title);
      const result = await generateEffectInfo(title, question);
      
      if (result.success && result.data) {
        // Заполняем поля данными от AI
        if (result.data.currentState) setCurrentState(result.data.currentState);
        if (result.data.history) setHistory(result.data.history);
        if (result.data.residue) setResidue(result.data.residue);
        if (result.data.scientific) {
          setInterpretations(prev => ({ ...prev, scientific: result.data!.scientific }));
        }
        if (result.data.community) {
          setInterpretations(prev => ({ ...prev, community: result.data!.community }));
        }
        
        toast.success('Поля заполнены с помощью AI! ✨');
        console.log('[EffectForm] AI успешно заполнил поля:', result.data);
      } else {
        toast.error(result.error || 'Не удалось сгенерировать контент');
        console.error('[EffectForm] Ошибка AI:', result.error);
      }
    } catch (err) {
      console.error('[EffectForm] Исключение при AI генерации:', err);
      toast.error('Произошла ошибка при обращении к AI');
    } finally {
      setAiLoading(false);
    }
  };

  const containerClass = isModal 
    ? "max-h-[80vh] overflow-y-auto" 
    : "max-w-4xl mx-auto";

  return (
    <form onSubmit={handleSubmit} className={containerClass}>
      <div className="space-y-6">
        {/* Кнопка AI заполнения */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl">
          <div>
            <h4 className="text-light font-medium flex items-center gap-2">
              ✨ AI-помощник
            </h4>
            <p className="text-light/60 text-sm">
              Заполнит дополнительные поля автоматически на основе названия
            </p>
          </div>
          <button
            type="button"
            onClick={handleAiFill}
            disabled={aiLoading || !title.trim()}
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

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Категория */}
        <CustomSelect
          label="Категория *"
          value={category}
          onChange={setCategory}
          options={categoryOptions}
          placeholder="Выберите категорию"
        />

        {/* Название */}
        <div>
          <label htmlFor="title" className="block text-light font-medium mb-2">
            Название эффекта *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Фраза Дарта Вейдера"
            required
            minLength={5}
            className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light placeholder-light/40 focus:border-primary focus:outline-none"
          />
        </div>

        {/* Вопрос */}
        <div>
          <label htmlFor="question" className="block text-light font-medium mb-2">
            Вопрос для голосования *
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Например: Как Дарт Вейдер обращается к Люку Скайуокеру?"
            required
            minLength={20}
            rows={3}
            className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light placeholder-light/40 focus:border-primary focus:outline-none resize-none"
          />
        </div>

        {/* Варианты */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="variantA" className="block text-light font-medium mb-2">
              Вариант А (текст) *
            </label>
            <input
              id="variantA"
              type="text"
              value={variantA}
              onChange={(e) => setVariantA(e.target.value)}
              placeholder="Например: Люк, я твой отец"
              required
              minLength={3}
              className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light placeholder-light/40 focus:border-primary focus:outline-none mb-3"
            />
            <label htmlFor="variantADescription" className="block text-light font-medium mb-2">
              Описание варианта А
            </label>
            <textarea
              id="variantADescription"
              value={variantADescription}
              onChange={(e) => setVariantADescription(e.target.value)}
              placeholder="Дополнительное описание"
              rows={3}
              className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light placeholder-light/40 focus:border-primary focus:outline-none resize-none"
            />
          </div>

          <div>
            <label htmlFor="variantB" className="block text-light font-medium mb-2">
              Вариант Б (текст) *
            </label>
            <input
              id="variantB"
              type="text"
              value={variantB}
              onChange={(e) => setVariantB(e.target.value)}
              placeholder="Например: Нет, я твой отец"
              required
              minLength={3}
              className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light placeholder-light/40 focus:border-primary focus:outline-none mb-3"
            />
            <label htmlFor="variantBDescription" className="block text-light font-medium mb-2">
              Описание варианта Б
            </label>
            <textarea
              id="variantBDescription"
              value={variantBDescription}
              onChange={(e) => setVariantBDescription(e.target.value)}
              placeholder="Дополнительное описание"
              rows={3}
              className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light placeholder-light/40 focus:border-primary focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Дополнительные поля */}
        <div>
          <label htmlFor="currentState" className="block text-light font-medium mb-2">
            📖 Текущее состояние <span className="text-light/40 text-sm">(необязательно)</span>
          </label>
          <textarea
            id="currentState"
            value={currentState}
            onChange={(e) => setCurrentState(e.target.value)}
            placeholder="Как это выглядит сейчас в оригинале"
            rows={3}
            className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light placeholder-light/40 focus:border-primary focus:outline-none resize-none"
          />
        </div>

        <div>
          <label htmlFor="sourceLink" className="block text-light font-medium mb-2">
            🔗 Ссылка на источник <span className="text-light/40 text-sm">(необязательно)</span>
          </label>
          <input
            id="sourceLink"
            type="url"
            value={sourceLink}
            onChange={(e) => setSourceLink(e.target.value)}
            placeholder="https://example.com/source"
            className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light placeholder-light/40 focus:border-primary focus:outline-none"
          />
        </div>

        {/* История */}
        <div>
          <label htmlFor="history" className="block text-light font-medium mb-2">
            📜 История / Таймлайн <span className="text-light/40 text-sm">(необязательно)</span>
          </label>
          <textarea
            id="history"
            value={history}
            onChange={(e) => setHistory(e.target.value)}
            placeholder="Когда появился этот эффект, ключевые даты и события..."
            rows={3}
            className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light placeholder-light/40 focus:border-primary focus:outline-none resize-none"
          />
        </div>

        {/* Остатки / Residue */}
        <div>
          <label htmlFor="residue" className="block text-light font-medium mb-2">
            🔍 Остатки / Культурные следы <span className="text-light/40 text-sm">(необязательно)</span>
          </label>
          <textarea
            id="residue"
            value={residue}
            onChange={(e) => setResidue(e.target.value)}
            placeholder="Примеры 'доказательств' альтернативной версии, культурные следы..."
            rows={3}
            className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light placeholder-light/40 focus:border-primary focus:outline-none resize-none"
          />
        </div>

        {/* Интерпретации */}
        <div className="p-6 bg-darkCard/50 rounded-xl border border-light/10">
          <h3 className="text-xl font-bold text-light mb-2 flex items-center gap-2">
            📚 Интерпретации <span className="text-sm font-normal text-light/60">(необязательно)</span>
          </h3>
          <p className="text-light/60 text-sm mb-6">
            Эти поля можно оставить пустыми. Интерпретации помогут пользователям понять природу эффекта.
          </p>

          {/* Научное объяснение */}
          <div className="mb-6">
            <label htmlFor="scientific" className="block text-light font-medium mb-2">
              🔬 Научное объяснение
            </label>
            <textarea
              id="scientific"
              value={interpretations.scientific}
              onChange={(e) => setInterpretations({...interpretations, scientific: e.target.value})}
              placeholder="Пример: Это ошибка памяти из-за визуальной экстраполяции паттернов..."
              className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light placeholder-light/40 focus:border-primary focus:outline-none resize-none"
              rows={4}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="scientificTheory" className="block text-light font-medium mb-2">
              📖 Научная теория <span className="text-xs text-light/40">(опционально)</span>
            </label>
            <input
              id="scientificTheory"
              type="text"
              value={interpretations.scientificTheory}
              onChange={(e) => setInterpretations({...interpretations, scientificTheory: e.target.value})}
              placeholder="Пример: Визуальная экстраполяция паттернов"
              className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light placeholder-light/40 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="scientificSource" className="block text-light font-medium mb-2">
              🔗 Научный источник <span className="text-xs text-light/40">(опционально)</span>
            </label>
            <input
              id="scientificSource"
              type="text"
              value={interpretations.scientificSource}
              onChange={(e) => setInterpretations({...interpretations, scientificSource: e.target.value})}
              placeholder="Пример: Brain Bridge Lab (UChicago)"
              className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light placeholder-light/40 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="h-px bg-light/10 my-6"></div>

          <div className="mb-6">
            <label htmlFor="community" className="block text-light font-medium mb-2">
              🌐 Версия сообществ
            </label>
            <textarea
              id="community"
              value={interpretations.community}
              onChange={(e) => setInterpretations({...interpretations, community: e.target.value})}
              placeholder="Пример: Многие художники клянутся что помнят иначе..."
              className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light placeholder-light/40 focus:border-primary focus:outline-none resize-none"
              rows={4}
            />
          </div>

          <div>
            <label htmlFor="communitySource" className="block text-light font-medium mb-2">
              🔗 Источник сообществ <span className="text-xs text-light/40">(опционально)</span>
            </label>
            <input
              id="communitySource"
              type="text"
              value={interpretations.communitySource}
              onChange={(e) => setInterpretations({...interpretations, communitySource: e.target.value})}
              placeholder="Пример: r/MandelaEffect"
              className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light placeholder-light/40 focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-primary hover:bg-primary/80 text-light rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : submitButtonText}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
            >
              Отмена
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

