'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { m } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { submitEffect, getSubmitCategories } from '@/app/actions/submission';
import { generateEffectData } from '@/app/actions/generate-content';
import CustomSelect, { type SelectOption } from '@/components/ui/CustomSelect';
import GlitchTitle from '@/components/ui/GlitchTitle';
import { useReality } from '@/lib/context/RealityContext';
import { Send, Link as LinkIcon, Mail, MessageSquare, FileText, Sparkles, Brain, Link2, Users, Lightbulb, ChevronRight, List, CheckCircle, Film, Music, Tag, User, Globe, Gamepad2, Baby, Ghost, HelpCircle, Radio, Biohazard, AlertTriangle } from 'lucide-react';

interface Category {
  category: string;
  emoji: string;
  name: string;
}

interface FormData {
  category: string;
  title: string;
  question: string;
  variantA: string;
  variantB: string;
  currentState: string;
  sourceLink: string;
  email: string;
}

interface FormErrors {
  category?: string;
  title?: string;
  question?: string;
  variantA?: string;
  variantB?: string;
  sourceLink?: string;
  scientificSource?: string;
  communitySource?: string;
  email?: string;
  _general?: string;
}

export default function SubmitPage() {
  const { isUpsideDown } = useReality();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    category: '',
    title: '',
    question: '',
    variantA: '',
    variantB: '',
    currentState: '',
    sourceLink: '',
    email: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [interpretations, setInterpretations] = useState({
    scientific: '',
    scientificTheory: '',
    scientificSource: '',
    community: '',
    communitySource: '',
  });
  const [showInterpretations, setShowInterpretations] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Загружаем категории (безопасный вызов Server Action)
  useEffect(() => {
    let isMounted = true;
    
    const fetchCategories = async () => {
      try {
        const data = await getSubmitCategories();
        if (isMounted) {
          setCategories(data);
        }
      } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        // Не показываем toast - категории загрузятся при следующем рендере
      }
    };
    
    fetchCategories();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Функция для получения иконки категории (как в каталоге)
  const getCategoryIcon = (slug: string) => {
    const props = { className: "w-4 h-4 shrink-0" };
    switch (slug) {
      case 'films': return <Film {...props} />;
      case 'music': return <Music {...props} />;
      case 'brands': return <Tag {...props} />;
      case 'people': return <User {...props} />;
      case 'geography': return <Globe {...props} />;
      case 'popculture': return <Gamepad2 {...props} />;
      case 'childhood': return <Baby {...props} />;
      case 'russian': return <Ghost {...props} />;
      default: return <HelpCircle {...props} />;
    }
  };

  // Опции для CustomSelect
  const categoryOptions: SelectOption[] = useMemo(() => {
    return categories.map((cat) => ({
      value: cat.category,
      label: cat.name,
      icon: getCategoryIcon(cat.category),
      emoji: cat.emoji, // Оставляем для совместимости
    }));
  }, [categories]);

  // Валидация URL (должен содержать доменную зону, например .com, .ru)
  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true;
    try {
      const parsed = new URL(url);
      // Проверяем, что hostname содержит точку (доменная зона)
      return parsed.hostname.includes('.');
    } catch {
      // Пробуем с https://
      try {
        const parsed = new URL(`https://${url}`);
        // Проверяем, что hostname содержит точку (доменная зона)
        return parsed.hostname.includes('.');
      } catch {
        return false;
      }
    }
  };

  // Валидация email
  const isValidEmail = (email: string): boolean => {
    if (!email.trim()) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Проверка на спам-паттерны
  const isSpamText = (text: string): boolean => {
    if (!text || text.trim() === '') return false;
    
    // Проверка на повторяющиеся символы (более 5 подряд)
    if (/(.)\1{5,}/i.test(text)) {
      return true;
    }
    
    // Проверка на повторяющиеся слова
    const words = text.toLowerCase().replace(/[^a-zа-яё]/gi, '');
    if (words.length >= 6) {
      for (let len = 1; len <= Math.floor(words.length / 3); len++) {
        const pattern = words.slice(0, len);
        const repeated = pattern.repeat(Math.ceil(words.length / len)).slice(0, words.length);
        if (repeated === words) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Константы валидации
  const MAX_TITLE_LENGTH = 100;
  const MAX_QUESTION_LENGTH = 150;
  const MAX_VARIANT_LENGTH = 100;

  // Валидация поля
  const validateField = (name: keyof FormData, value: string): string | undefined => {
    switch (name) {
      case 'category':
        if (!value) return 'Выберите категорию';
        break;
      case 'title':
        if (!value) return 'Введите название';
        if (value.length < 5) return 'Минимум 5 символов';
        if (value.length > MAX_TITLE_LENGTH) return `Слишком длинный текст (макс. ${MAX_TITLE_LENGTH})`;
        if (isSpamText(value)) return 'Текст выглядит неестественно';
        break;
      case 'question':
        if (!value) return 'Введите вопрос';
        if (value.length < 20) return 'Минимум 20 символов';
        if (value.length > MAX_QUESTION_LENGTH) return `Слишком длинный текст (макс. ${MAX_QUESTION_LENGTH})`;
        if (!value.trim().endsWith('?')) return "Вопрос должен заканчиваться знаком '?'";
        if (isSpamText(value)) return 'Текст выглядит неестественно';
        break;
      case 'variantA':
        if (!value) return 'Введите вариант А';
        if (value.length < 3) return 'Минимум 3 символа';
        if (value.length > MAX_VARIANT_LENGTH) return `Слишком длинный текст (макс. ${MAX_VARIANT_LENGTH})`;
        if (isSpamText(value)) return 'Текст выглядит неестественно';
        break;
      case 'variantB':
        if (!value) return 'Введите вариант Б';
        if (value.length < 3) return 'Минимум 3 символа';
        if (value.length > MAX_VARIANT_LENGTH) return `Слишком длинный текст (макс. ${MAX_VARIANT_LENGTH})`;
        if (value === formData.variantA) return 'Варианты должны быть разными';
        if (isSpamText(value)) return 'Текст выглядит неестественно';
        break;
      case 'sourceLink':
        if (value && !isValidUrl(value)) return 'Введите корректный URL';
        break;
      case 'email':
        if (value && !isValidEmail(value)) return 'Введите корректный email';
        break;
    }
    return undefined;
  };

  // Обработка изменения поля
  const handleChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    if (name === 'variantA' && touched.variantB) {
      const variantBError = validateField('variantB', formData.variantB);
      setErrors((prev) => ({ ...prev, variantB: variantBError }));
    }
  };

  // Обработка blur
  const handleBlur = (name: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Проверка валидности формы
  const isFormValid = (): boolean => {
    return (
      !!formData.category &&
      !!formData.title &&
      formData.title.length >= 5 &&
      !!formData.question &&
      formData.question.length >= 20 &&
      !!formData.variantA &&
      formData.variantA.length >= 3 &&
      !!formData.variantB &&
      formData.variantB.length >= 3 &&
      formData.variantA !== formData.variantB &&
      (!formData.sourceLink || isValidUrl(formData.sourceLink))
    );
  };

  // Очистка формы
  const resetForm = () => {
    setFormData({
      category: '',
      title: '',
      question: '',
      variantA: '',
      variantB: '',
      currentState: '',
      sourceLink: '',
      email: '',
    });
    setErrors({});
    setTouched({});
    setInterpretations({
      scientific: '',
      scientificTheory: '',
      scientificSource: '',
      community: '',
      communitySource: '',
    });
    setShowInterpretations(false);
  };

  // Заполнение формы через AI
  const handleAiFill = async () => {
    // Проверяем обязательные поля перед вызовом AI
    if (!formData.title.trim()) {
      toast.error('Сначала введите название эффекта');
      return;
    }
    
    if (!formData.question.trim()) {
      toast.error('Сначала введите вопрос');
      return;
    }
    
    if (!formData.variantA.trim()) {
      toast.error('Сначала заполните Вариант А');
      return;
    }
    
    if (!formData.variantB.trim()) {
      toast.error('Сначала заполните Вариант Б');
      return;
    }

    setAiLoading(true);

    try {
      console.log('[SubmitPage] Запрос AI генерации для:', formData.title);
      const result = await generateEffectData(
        formData.title,
        formData.question,
        formData.variantA,
        formData.variantB
      );

      if (result.success && result.data) {
        // Проверяем, вернул ли AI ошибку валидации
        if (result.data.error) {
          toast.error(result.data.error);
          console.log('[SubmitPage] AI отклонил запрос:', result.data.error);
          return;
        }

        // Валидные категории
        const validCategories = ['films', 'brands', 'music', 'popculture', 'childhood', 'people', 'geography', 'russian', 'other'];

        // Обновляем formData (НЕ перезаписываем variantA и variantB, так как они уже введены пользователем)
        setFormData((prev) => ({
          ...prev,
          // Категория (с валидацией)
          category: result.data!.category && validCategories.includes(result.data!.category)
            ? result.data!.category
            : prev.category,
          // Текущее состояние и основная ссылка
          currentState: result.data!.currentState || prev.currentState,
          sourceLink: result.data!.sourceLink || prev.sourceLink,
        }));

        // Обновляем interpretations (scientific, community и их ссылки)
        // Примечание: history, residue, historySource, residueSource не используются в форме отправки
        setInterpretations((prev) => ({
          ...prev,
          scientific: result.data!.scientific || prev.scientific,
          scientificSource: result.data!.scientificSource || prev.scientificSource,
          community: result.data!.community || prev.community,
          communitySource: result.data!.communitySource || prev.communitySource,
        }));

        // Раскрываем аккордеон с интерпретациями
        setShowInterpretations(true);

        toast.success('Поля заполнены с помощью AI! ✨');
        console.log('[SubmitPage] AI успешно заполнил поля:', result.data);
      } else {
        toast.error(result.error || 'Не удалось сгенерировать контент');
        console.error('[SubmitPage] Ошибка AI:', result.error);
      }
    } catch (err) {
      console.error('[SubmitPage] Исключение при AI генерации:', err);
      toast.error('Произошла ошибка при обращении к AI');
    } finally {
      setAiLoading(false);
    }
  };

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[SubmitPage] handleSubmit вызван');

    // Помечаем все поля как затронутые
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Валидируем все поля
    const newErrors: FormErrors = {};
    (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
      }
    });
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      console.log('[SubmitPage] Ошибки валидации:', newErrors);
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    if (!isFormValid()) {
      console.log('[SubmitPage] Форма не валидна');
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    console.log('[SubmitPage] Валидация пройдена, отправляем...');
    setIsSubmitting(true);
    
    // Очищаем серверные ошибки перед отправкой
    setErrors({});

    try {
      // Подготовка интерпретаций
      const hasInterpretations =
        interpretations.scientific.trim() || interpretations.community.trim();

      const submitData = {
        category: formData.category,
        title: formData.title,
        question: formData.question,
        variantA: formData.variantA,
        variantB: formData.variantB,
        currentState: formData.currentState || undefined,
        sourceLink: formData.sourceLink || undefined,
        email: formData.email || undefined,
        interpretations: hasInterpretations
          ? {
              scientific: interpretations.scientific.trim() || undefined,
              scientificTheory: interpretations.scientificTheory.trim() || undefined,
              scientificSource: interpretations.scientificSource.trim() || undefined,
              community: interpretations.community.trim() || undefined,
              communitySource: interpretations.communitySource.trim() || undefined,
            }
          : undefined,
      };

      console.log('[SubmitPage] Данные для отправки:', submitData);

      const result = await submitEffect(submitData);

      console.log('[SubmitPage] Результат:', result);

      if (result.success) {
        setIsSubmitted(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: isUpsideDown ? ['#dc2626', '#ef4444'] : ['#3b82f6', '#f59e0b'],
        });
        toast.success(result.message || 'Эффект отправлен на модерацию! ✓');
        resetForm();

        setTimeout(() => {
          setIsSubmitted(false);
        }, 5000);
      } else {
        console.log('[SubmitPage] Ошибка от сервера:', result.message);
        
        // Если сервер вернул ошибки по полям — отображаем их
        if ('errors' in result && result.errors) {
          console.log('[SubmitPage] Ошибки по полям:', result.errors);
          
          // Устанавливаем ошибки по полям
          const serverErrors: FormErrors = {};
          Object.entries(result.errors).forEach(([key, value]) => {
            serverErrors[key as keyof FormErrors] = value;
          });
          setErrors(serverErrors);
          
          // Помечаем все поля с ошибками как touched
          const touchedFields: Record<string, boolean> = {};
          Object.keys(result.errors).forEach((key) => {
            touchedFields[key] = true;
          });
          setTouched((prev) => ({ ...prev, ...touchedFields }));
        }
        
        toast.error(result.message || 'Произошла ошибка при отправке');
      }
    } catch (error) {
      console.error('[SubmitPage] Исключение при отправке:', error);
      toast.error('Что-то пошло не так. Попробуйте снова');
    } finally {
      setIsSubmitting(false);
      console.log('[SubmitPage] Завершено');
    }
  };

  return (
    <main id="main-content" className="min-h-screen bg-dark relative pt-32 pb-16 px-4 overflow-hidden" role="main">
      {/* Фоновая сетка */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className={`absolute top-0 left-0 w-full h-96 bg-gradient-to-b blur-3xl opacity-30 transition-colors duration-1000 ${
          isUpsideDown 
            ? 'from-red-900/20 to-transparent' 
            : 'from-blue-900/10 to-transparent'
        }`} />
      </div>

      <m.div 
        className="max-w-2xl mx-auto relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Заголовок */}
        <div className="text-center mb-12">
          <GlitchTitle text={isUpsideDown ? "ПЕРЕДАТЬ ДАННЫЕ" : "ДОБАВИТЬ ЭФФЕКТ"} />
          <p className={`text-lg mt-4 ${isUpsideDown ? 'font-mono text-red-400' : 'text-light/60'}`}>
            {isUpsideDown 
              ? "Отправь аномалию в Архив Сопротивления" 
              : "Помоги расширить коллекцию эффектов Манделы"}
          </p>
        </div>

        {/* Сообщение об успехе */}
        {isSubmitted && (
          <m.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-6 mb-8 text-center border ${
              isUpsideDown 
                ? 'bg-red-500/20 border-red-500/50 glitch-mirror' 
                : 'bg-green-500/20 border-green-500/50'
            }`}
          >
            <div className="flex justify-center mb-2">
              {isUpsideDown ? (
                <Radio className="w-12 h-12 text-red-400" />
              ) : (
                <CheckCircle className="w-12 h-12 text-green-400" />
              )}
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isUpsideDown ? 'font-mono text-red-400' : 'text-light'}`}>
              {isUpsideDown 
                ? "ДАННЫЕ ПЕРЕХВАЧЕНЫ. Ожидай ответа из Архива."
                : "Спасибо! Эффект отправлен на модерацию"}
            </h3>
            <p className={isUpsideDown ? 'font-mono text-red-300/80' : 'text-light/80'}>
              {isUpsideDown 
                ? "[Статус: В обработке]"
                : "Мы проверим его и добавим в каталог"}
            </p>
          </m.div>
        )}

        {/* Форма */}
        {!isSubmitted && (
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Категория */}
            <CustomSelect
              label={isUpsideDown ? "СЕКТОР *" : "Категория *"}
              value={formData.category}
              onChange={(value) => {
                handleChange('category', value);
                handleBlur('category');
              }}
              options={categoryOptions}
              placeholder={isUpsideDown ? "[ВЫБЕРИ СЕКТОР]" : "Выберите категорию"}
              error={errors.category}
            />

            {/* Название */}
            <div>
              <label htmlFor="title" className={`block text-sm font-semibold mb-2 ${isUpsideDown ? 'font-mono text-red-400' : 'text-light'}`}>
                {isUpsideDown ? "ИДЕНТИФИКАТОР АНОМАЛИИ" : "Название эффекта"} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                onBlur={() => handleBlur('title')}
                placeholder={isUpsideDown ? "// ВВЕДИТЕ КОД АНОМАЛИИ" : "Например: Логотип Volkswagen"}
                className={`w-full p-3 rounded-lg bg-darkCard border text-light placeholder:text-light/40 focus:outline-none transition-colors ${isUpsideDown ? 'font-mono' : ''} ${
                  errors.title 
                    ? 'border-red-500 focus:border-red-500' 
                    : isUpsideDown
                      ? 'border-light/20 focus:border-red-500'
                      : 'border-light/20 focus:border-primary'
                }`}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>

            {/* Вопрос */}
            <div>
              <label htmlFor="question" className={`block text-sm font-semibold mb-2 ${isUpsideDown ? 'font-mono text-red-400' : 'text-light'}`}>
                {isUpsideDown ? "ЗАПРОС ДЛЯ ВЕРИФИКАЦИИ" : "Вопрос для голосования"} <span className="text-red-400">*</span>
              </label>
              <textarea
                id="question"
                value={formData.question}
                onChange={(e) => handleChange('question', e.target.value)}
                onBlur={() => handleBlur('question')}
                rows={3}
                placeholder={isUpsideDown ? "// ОПИШИТЕ РАСХОЖДЕНИЕ В ПАМЯТИ?" : "Как вы помните логотип Volkswagen?"}
                className={`w-full p-3 rounded-lg bg-darkCard border text-light placeholder:text-light/40 focus:outline-none transition-colors resize-none ${isUpsideDown ? 'font-mono' : ''} ${
                  errors.question 
                    ? 'border-red-500 focus:border-red-500' 
                    : isUpsideDown
                      ? 'border-light/20 focus:border-red-500'
                      : 'border-light/20 focus:border-primary'
                }`}
              />
              {errors.question && (
                <p className="text-red-500 text-xs mt-1">{errors.question}</p>
              )}
            </div>

            {/* Варианты */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="variantA" className={`block text-sm font-semibold mb-2 ${isUpsideDown ? 'font-mono text-red-400' : 'text-light'}`}>
                  {isUpsideDown ? "ВАРИАНТ ИСТОРИИ А" : "Вариант А"} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="variantA"
                  value={formData.variantA}
                  onChange={(e) => handleChange('variantA', e.target.value)}
                  onBlur={() => handleBlur('variantA')}
                  placeholder={isUpsideDown ? "> Вариант А (как помнишь)" : "С разрывом между буквами"}
                  className={`w-full p-3 rounded-lg bg-darkCard border text-light placeholder:text-light/40 focus:outline-none transition-colors ${isUpsideDown ? 'font-mono' : ''} ${
                    errors.variantA 
                      ? 'border-red-500 focus:border-red-500' 
                      : isUpsideDown
                        ? 'border-light/20 focus:border-red-500'
                        : 'border-light/20 focus:border-primary'
                  }`}
                />
                {errors.variantA && (
                  <p className="text-red-500 text-xs mt-1">{errors.variantA}</p>
                )}
              </div>
              <div>
                <label htmlFor="variantB" className={`block text-sm font-semibold mb-2 ${isUpsideDown ? 'font-mono text-red-400' : 'text-light'}`}>
                  {isUpsideDown ? "ВАРИАНТ ИСТОРИИ Б" : "Вариант Б"} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="variantB"
                  value={formData.variantB}
                  onChange={(e) => handleChange('variantB', e.target.value)}
                  onBlur={() => handleBlur('variantB')}
                  placeholder={isUpsideDown ? "> Вариант Б (как в матрице)" : "Без разрыва"}
                  className={`w-full p-3 rounded-lg bg-darkCard border text-light placeholder:text-light/40 focus:outline-none transition-colors ${isUpsideDown ? 'font-mono' : ''} ${
                    errors.variantB 
                      ? 'border-red-500 focus:border-red-500' 
                      : isUpsideDown
                        ? 'border-light/20 focus:border-red-500'
                        : 'border-light/20 focus:border-primary'
                  }`}
                />
                {errors.variantB && (
                  <p className="text-red-500 text-xs mt-1">{errors.variantB}</p>
                )}
              </div>
            </div>

            {/* Кнопка AI заполнения */}
            <div className={`p-4 rounded-xl border ${
              isUpsideDown 
                ? 'bg-gradient-to-r from-red-500/10 to-purple-900/10 border-red-500/30' 
                : 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30'
            }`}>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className={`text-sm text-center md:text-left flex-1 flex items-center gap-2 ${isUpsideDown ? 'font-mono text-red-300/80' : 'text-light/80'}`}>
                  {isUpsideDown ? (
                    <Radio className="w-4 h-4 text-red-400 flex-shrink-0" />
                  ) : (
                    <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  )}
                  <span>
                    {isUpsideDown ? (
                      <>
                        <span className="font-medium">ВНИМАНИЕ:</span> AI может сгенерировать ложные данные. Проверяй источники.
                      </>
                    ) : (
                      <>
                        <span className="font-medium">Подсказка:</span> Заполните название, вопрос и варианты, затем нажмите кнопку — AI заполнит остальные поля (историю, факты, ссылки)
                      </>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAiFill}
                  disabled={aiLoading || !formData.title.trim() || !formData.question.trim() || !formData.variantA.trim() || !formData.variantB.trim()}
                  className={`w-full md:w-auto px-6 py-2 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap ${
                    isUpsideDown
                      ? 'bg-gradient-to-r from-red-600 to-purple-900 hover:from-red-700 hover:to-purple-800 font-mono'
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                  }`}
                >
                  {aiLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {isUpsideDown ? "ОБРАБОТКА..." : "Генерация..."}
                    </>
                  ) : (
                    <>
                      {isUpsideDown ? <Radio className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      {isUpsideDown ? "ЗАПОЛНИТЬ ЧЕРЕЗ AI" : "Заполнить через AI"}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Текущее состояние */}
            <div>
              <label htmlFor="currentState" className={`block text-sm font-semibold mb-2 ${isUpsideDown ? 'font-mono text-red-400' : 'text-light'}`}>
                {isUpsideDown ? "ТЕКУЩЕЕ СОСТОЯНИЕ (КАК В МАТРИЦЕ)" : "Текущее состояние (как на самом деле)"}
              </label>
              <textarea
                id="currentState"
                value={formData.currentState}
                onChange={(e) => handleChange('currentState', e.target.value)}
                rows={3}
                placeholder={isUpsideDown ? "// ОПИШИ ОФИЦИАЛЬНУЮ ВЕРСИЮ..." : "Опишите, как это выглядит в реальности..."}
                className={`w-full p-3 rounded-lg bg-darkCard border text-light placeholder:text-light/40 focus:outline-none transition-colors resize-none ${isUpsideDown ? 'font-mono' : ''} ${
                  isUpsideDown
                    ? 'border-light/20 focus:border-red-500'
                    : 'border-light/20 focus:border-primary'
                }`}
              />
              <p className={`text-sm mt-1 ${isUpsideDown ? 'font-mono text-red-400/60' : 'text-light/50'}`}>
                {isUpsideDown ? "[ОПЦИОНАЛЬНО]" : "Необязательное поле"}
              </p>
            </div>

            {/* Ссылка на источник */}
            <div>
              <label htmlFor="sourceLink" className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isUpsideDown ? 'font-mono text-red-400' : 'text-light'}`}>
                <LinkIcon className={`w-4 h-4 ${isUpsideDown ? 'text-red-400' : ''}`} />
                {isUpsideDown ? "ССЫЛКА НА ИСТОЧНИК" : "Ссылка на источник"}
              </label>
              <input
                type="url"
                id="sourceLink"
                value={formData.sourceLink}
                onChange={(e) => handleChange('sourceLink', e.target.value)}
                onBlur={() => handleBlur('sourceLink')}
                placeholder={isUpsideDown ? "// https://... или google.com" : "https://... или google.com"}
                className={`w-full p-3 rounded-lg bg-darkCard border text-light placeholder:text-light/40 focus:outline-none transition-colors ${isUpsideDown ? 'font-mono' : ''} ${
                  errors.sourceLink 
                    ? 'border-red-500 focus:border-red-500' 
                    : isUpsideDown
                      ? 'border-light/20 focus:border-red-500'
                      : 'border-light/20 focus:border-primary'
                }`}
              />
              {errors.sourceLink && (
                <p className="text-red-500 text-xs mt-1">{errors.sourceLink}</p>
              )}
              {!errors.sourceLink && (
                <p className={`text-sm mt-1 ${isUpsideDown ? 'font-mono text-red-400/60' : 'text-light/50'}`}>
                  {isUpsideDown ? "[ОПЦИОНАЛЬНО] (протокол добавится автоматически)" : "Необязательное поле (протокол добавится автоматически)"}
                </p>
              )}
            </div>

            {/* Интерпретации (аккордеон) */}
            <div className={`border rounded-xl overflow-hidden ${isUpsideDown ? 'border-red-500/30' : 'border-light/10'}`}>
              <button
                type="button"
                onClick={() => setShowInterpretations(!showInterpretations)}
                className={`w-full flex items-center justify-between p-4 bg-darkCard hover:bg-darkCard/80 transition-colors ${
                  isUpsideDown ? 'hover:border-red-500/50' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {isUpsideDown ? (
                    <Biohazard className="w-5 h-5 text-red-500" />
                  ) : (
                    <Brain className="w-5 h-5 text-primary" />
                  )}
                  <span className={`font-medium ${isUpsideDown ? 'font-mono text-red-400' : 'text-light'}`}>
                    {isUpsideDown ? "РАСКРЫТЬ ТЕОРИИ ЗАГОВОРА (ОПЦИОНАЛЬНО)" : "Добавить интерпретации (необязательно)"}
                  </span>
                </div>
                <m.svg
                  animate={{ rotate: showInterpretations ? 180 : 0 }}
                  className={`w-5 h-5 ${isUpsideDown ? 'text-red-400/60' : 'text-light/60'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </m.svg>
              </button>

              {showInterpretations && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-4 border-t space-y-4 ${isUpsideDown ? 'border-red-500/30' : 'border-light/10'}`}
                >
                  {/* Научное объяснение */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isUpsideDown ? 'font-mono text-red-400' : 'text-light'}`}>
                      <FileText className={`w-4 h-4 ${isUpsideDown ? 'text-red-500' : 'text-blue-400'}`} />
                      {isUpsideDown ? "ОФИЦИАЛЬНАЯ ВЕРСИЯ" : "Научное объяснение"}
                    </label>
                    <textarea
                      value={interpretations.scientific}
                      onChange={(e) =>
                        setInterpretations((prev) => ({ ...prev, scientific: e.target.value }))
                      }
                      rows={3}
                      placeholder={isUpsideDown ? "// ОФИЦИАЛЬНОЕ ОБЪЯСНЕНИЕ..." : "Психологическое или научное объяснение..."}
                      className={`w-full p-3 rounded-lg bg-dark border text-light placeholder:text-light/40 focus:outline-none transition-colors resize-none ${isUpsideDown ? 'font-mono' : ''} ${
                        isUpsideDown
                          ? 'border-light/20 focus:border-red-500'
                          : 'border-light/20 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  {/* Ссылка на научный источник */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isUpsideDown ? 'font-mono text-red-400' : 'text-light'}`}>
                      <Link2 className={`w-4 h-4 ${isUpsideDown ? 'text-red-500' : 'text-blue-400'}`} />
                      {isUpsideDown ? "ССЫЛКА НА ОФИЦИАЛЬНЫЙ ИСТОЧНИК" : "Ссылка на научный источник"}
                    </label>
                    <input
                      type="url"
                      value={interpretations.scientificSource}
                      onChange={(e) =>
                        setInterpretations((prev) => ({ ...prev, scientificSource: e.target.value }))
                      }
                      placeholder={isUpsideDown ? "// https://... или scholar.google.com" : "https://... или scholar.google.com"}
                      className={`w-full p-3 rounded-lg bg-dark border text-light placeholder:text-light/40 focus:outline-none transition-colors ${isUpsideDown ? 'font-mono' : ''} ${
                        errors.scientificSource 
                          ? 'border-red-500 focus:border-red-500' 
                          : isUpsideDown
                            ? 'border-light/20 focus:border-red-500'
                            : 'border-light/20 focus:border-blue-500'
                      }`}
                    />
                    {errors.scientificSource && (
                      <p className="text-red-500 text-xs mt-1">{errors.scientificSource}</p>
                    )}
                  </div>

                  {/* Версия сообщества */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isUpsideDown ? 'font-mono text-red-400' : 'text-light'}`}>
                      <Users className={`w-4 h-4 ${isUpsideDown ? 'text-red-500' : 'text-orange-400'}`} />
                      {isUpsideDown ? "ВЕРСИЯ СОПРОТИВЛЕНИЯ" : "Версия сообщества"}
                    </label>
                    <textarea
                      value={interpretations.community}
                      onChange={(e) =>
                        setInterpretations((prev) => ({ ...prev, community: e.target.value }))
                      }
                      rows={3}
                      placeholder={isUpsideDown ? "// ЧТО ДУМАЕТ СОПРОТИВЛЕНИЕ..." : "Что думает сообщество об этом эффекте..."}
                      className={`w-full p-3 rounded-lg bg-dark border text-light placeholder:text-light/40 focus:outline-none transition-colors resize-none ${isUpsideDown ? 'font-mono' : ''} ${
                        isUpsideDown
                          ? 'border-light/20 focus:border-red-500'
                          : 'border-light/20 focus:border-orange-500'
                      }`}
                    />
                  </div>

                  {/* Ссылка на источник сообщества */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isUpsideDown ? 'font-mono text-red-400' : 'text-light'}`}>
                      <Link2 className={`w-4 h-4 ${isUpsideDown ? 'text-red-500' : 'text-orange-400'}`} />
                      {isUpsideDown ? "ССЫЛКА НА ИСТОЧНИК СОПРОТИВЛЕНИЯ" : "Ссылка на источник сообщества"}
                    </label>
                    <input
                      type="url"
                      value={interpretations.communitySource}
                      onChange={(e) =>
                        setInterpretations((prev) => ({ ...prev, communitySource: e.target.value }))
                      }
                      placeholder={isUpsideDown ? "// https://... или reddit.com/r/MandelaEffect" : "https://... или reddit.com/r/MandelaEffect"}
                      className={`w-full p-3 rounded-lg bg-dark border text-light placeholder:text-light/40 focus:outline-none transition-colors ${isUpsideDown ? 'font-mono' : ''} ${
                        errors.communitySource 
                          ? 'border-red-500 focus:border-red-500' 
                          : isUpsideDown
                            ? 'border-light/20 focus:border-red-500'
                            : 'border-light/20 focus:border-orange-500'
                      }`}
                    />
                    {errors.communitySource && (
                      <p className="text-red-500 text-xs mt-1">{errors.communitySource}</p>
                    )}
                  </div>
                </m.div>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isUpsideDown ? 'font-mono text-red-400' : 'text-light'}`}>
                <Mail className={`w-4 h-4 ${isUpsideDown ? 'text-red-400' : ''}`} />
                {isUpsideDown ? "ВАШ EMAIL" : "Ваш email"}
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder={isUpsideDown ? "[ДЛЯ ОБРАТНОЙ СВЯЗИ - ОПЦИОНАЛЬНО]" : "для связи (необязательно)"}
                className={`w-full p-3 rounded-lg bg-darkCard border text-light placeholder:text-light/40 focus:outline-none transition-colors ${isUpsideDown ? 'font-mono' : ''} ${
                  errors.email 
                    ? 'border-red-500 focus:border-red-500' 
                    : isUpsideDown
                      ? 'border-light/20 focus:border-red-500'
                      : 'border-light/20 focus:border-primary'
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
              {!errors.email && (
                <p className={`text-sm mt-1 ${isUpsideDown ? 'font-mono text-red-400/60' : 'text-light/50'}`}>
                  {isUpsideDown ? "[ОПЦИОНАЛЬНО]" : "Необязательное поле"}
                </p>
              )}
            </div>

            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full px-6 py-4 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                isUpsideDown
                  ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-600 border-2 border-red-400/80 shadow-[0_0_30px_rgba(239,68,68,1),0_0_60px_rgba(220,38,38,0.5)] font-mono'
                  : 'bg-primary shadow-[0_0_20px_rgba(59,130,246,0.4)]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {isUpsideDown ? "ПЕРЕДАЧА..." : "Отправка..."}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {isUpsideDown ? "ПЕРЕДАТЬ В АРХИВ" : "Отправить на модерацию"}
                </>
              )}
            </button>
          </form>
        )}

        {/* Ссылка на каталог */}
        <div className="mt-12 text-center">
          <Link
            href="/catalog"
            className={`inline-flex items-center gap-2 transition-colors ${
              isUpsideDown 
                ? 'text-red-400 hover:text-red-300 font-mono' 
                : 'text-primary hover:text-secondary'
            }`}
          >
            <List className="w-5 h-5" />
            {isUpsideDown ? "ПРОСМОТР АРХИВА АНОМАЛИЙ" : "Посмотреть каталог эффектов"}
          </Link>
        </div>
      </m.div>
    </main>
  );
}
