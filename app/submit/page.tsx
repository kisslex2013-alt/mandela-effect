'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

interface Category {
  category: string;
  emoji: string;
  name: string;
  count: number;
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
}

export default function SubmitPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  // Загружаем категории
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
      }
    };
    fetchCategories();
  }, []);

  // Валидация URL
  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Пустой URL валиден (опциональное поле)
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Валидация поля
  const validateField = (name: keyof FormData, value: string): string | undefined => {
    switch (name) {
      case 'category':
        if (!value) return 'Это поле обязательно';
        break;
      case 'title':
        if (!value) return 'Это поле обязательно';
        if (value.length < 5) return 'Минимум 5 символов';
        break;
      case 'question':
        if (!value) return 'Это поле обязательно';
        if (value.length < 20) return 'Минимум 20 символов';
        break;
      case 'variantA':
        if (!value) return 'Это поле обязательно';
        if (value.length < 3) return 'Минимум 3 символа';
        break;
      case 'variantB':
        if (!value) return 'Это поле обязательно';
        if (value.length < 3) return 'Минимум 3 символа';
        if (value === formData.variantA) return 'Варианты должны быть разными';
        break;
      case 'sourceLink':
        if (value && !isValidUrl(value)) return 'Введите корректный URL';
        break;
      default:
        break;
    }
    return undefined;
  };

  // Обработка изменения поля
  const handleChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Если поле было затронуто, валидируем его
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    // Специальная валидация для variantB при изменении variantA
    if (name === 'variantA' && touched.variantB) {
      const variantBError = validateField('variantB', formData.variantB);
      setErrors((prev) => ({ ...prev, variantB: variantBError }));
    }
  };

  // Обработка blur (потеря фокуса)
  const handleBlur = (name: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name as keyof FormData]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Проверка валидности всей формы
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
      (!formData.sourceLink || isValidUrl(formData.sourceLink)) &&
      Object.keys(errors).every((key) => !errors[key as keyof FormErrors])
    );
  };

  // Обработка отправки формы
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Помечаем все поля как затронутые
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Валидируем все поля
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key as keyof FormData, formData[key as keyof FormData]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
      }
    });
    setErrors(newErrors);

    // Если есть ошибки, не отправляем
    if (Object.keys(newErrors).length > 0) {
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    if (!isFormValid()) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      // Проверяем что response.ok перед парсингом
      if (!response.ok) {
        // Пытаемся получить текст ошибки
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Если не удалось распарсить JSON, используем текст
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        
        // Специальная обработка для rate limiting
        if (response.status === 429) {
          toast.error(errorMessage, { duration: 5000 });
        } else {
          toast.error(errorMessage);
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Проверяем success в ответе
      if (!data.success) {
        throw new Error(data.error || 'Ошибка отправки формы');
      }

      // Успех!
      setIsSubmitted(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#f59e0b'],
      });
      toast.success('Эффект отправлен на модерацию! ✓');

      // Очищаем форму
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

      // Через 3 секунды сбрасываем состояние успеха
      setTimeout(() => {
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Ошибка отправки формы:', error);
      // Показываем toast только если его ещё не показали выше
      if (error instanceof Error && !error.message.includes('HTTP error')) {
        toast.error(error.message || 'Что-то пошло не так. Попробуйте снова');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-light mb-2">Предложить новый эффект</h1>
          <p className="text-lg text-light/60">Помоги расширить коллекцию эффектов Манделы</p>
        </div>

        {/* Сообщение об успехе */}
        {isSubmitted && (
          <div className="bg-primary/20 border border-primary/50 rounded-xl p-6 mb-8 text-center">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-xl font-semibold text-light mb-2">
              Спасибо! Эффект отправлен на модерацию
            </h3>
            <p className="text-light/80">Мы проверим его и добавим в каталог</p>
          </div>
        )}

        {/* Форма */}
        <form onSubmit={handleSubmit} className="max-w-[600px] mx-auto">
          {/* Категория */}
          <div className="mb-6">
            <label htmlFor="category" className="block text-sm font-semibold mb-2 text-light">
              Категория <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              onBlur={() => handleBlur('category')}
              className={`w-full p-3 rounded-lg bg-darkCard border ${
                errors.category
                  ? 'border-red-500'
                  : touched.category
                    ? 'border-primary'
                    : 'border-light/20'
              } text-light focus:outline-none focus:border-primary transition-colors`}
            >
              <option value="">Выбрать категорию</option>
              {categories.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category}</p>
            )}
          </div>

          {/* Название эффекта */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-semibold mb-2 text-light">
              Название эффекта <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              onBlur={() => handleBlur('title')}
              placeholder="Например: Фраза из фильма"
              minLength={5}
              className={`w-full p-3 rounded-lg bg-darkCard border ${
                errors.title
                  ? 'border-red-500'
                  : touched.title
                    ? 'border-primary'
                    : 'border-light/20'
              } text-light placeholder:text-light/40 focus:outline-none focus:border-primary transition-colors`}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Вопрос для голосования */}
          <div className="mb-6">
            <label htmlFor="question" className="block text-sm font-semibold mb-2 text-light">
              Вопрос для голосования <span className="text-red-500">*</span>
            </label>
            <textarea
              id="question"
              value={formData.question}
              onChange={(e) => handleChange('question', e.target.value)}
              onBlur={() => handleBlur('question')}
              placeholder="Как вы помните...?"
              rows={3}
              minLength={20}
              className={`w-full p-3 rounded-lg bg-darkCard border ${
                errors.question
                  ? 'border-red-500'
                  : touched.question
                    ? 'border-primary'
                    : 'border-light/20'
              } text-light placeholder:text-light/40 focus:outline-none focus:border-primary transition-colors resize-none`}
            />
            <p className="text-light/60 text-sm mt-1">ℹ️ Вопрос должен быть нейтральным</p>
            {errors.question && <p className="text-red-500 text-sm mt-1">{errors.question}</p>}
          </div>

          {/* Вариант А */}
          <div className="mb-6">
            <label htmlFor="variantA" className="block text-sm font-semibold mb-2 text-light">
              Вариант А <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="variantA"
              value={formData.variantA}
              onChange={(e) => handleChange('variantA', e.target.value)}
              onBlur={() => handleBlur('variantA')}
              placeholder="Первый вариант..."
              minLength={3}
              className={`w-full p-3 rounded-lg bg-darkCard border ${
                errors.variantA
                  ? 'border-red-500'
                  : touched.variantA
                    ? 'border-primary'
                    : 'border-light/20'
              } text-light placeholder:text-light/40 focus:outline-none focus:border-primary transition-colors`}
            />
            {errors.variantA && <p className="text-red-500 text-sm mt-1">{errors.variantA}</p>}
          </div>

          {/* Вариант Б */}
          <div className="mb-6">
            <label htmlFor="variantB" className="block text-sm font-semibold mb-2 text-light">
              Вариант Б <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="variantB"
              value={formData.variantB}
              onChange={(e) => handleChange('variantB', e.target.value)}
              onBlur={() => handleBlur('variantB')}
              placeholder="Второй вариант..."
              minLength={3}
              className={`w-full p-3 rounded-lg bg-darkCard border ${
                errors.variantB
                  ? 'border-red-500'
                  : touched.variantB
                    ? 'border-primary'
                    : 'border-light/20'
              } text-light placeholder:text-light/40 focus:outline-none focus:border-primary transition-colors`}
            />
            {errors.variantB && <p className="text-red-500 text-sm mt-1">{errors.variantB}</p>}
          </div>

          {/* Описание текущего состояния */}
          <div className="mb-6">
            <label htmlFor="currentState" className="block text-sm font-semibold mb-2 text-light">
              Описание текущего состояния
            </label>
            <textarea
              id="currentState"
              value={formData.currentState}
              onChange={(e) => handleChange('currentState', e.target.value)}
              placeholder="Что показывают источники..."
              rows={3}
              className="w-full p-3 rounded-lg bg-darkCard border border-light/20 text-light placeholder:text-light/40 focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Ссылка на источник */}
          <div className="mb-6">
            <label htmlFor="sourceLink" className="block text-sm font-semibold mb-2 text-light">
              Ссылка на источник
            </label>
            <input
              type="url"
              id="sourceLink"
              value={formData.sourceLink}
              onChange={(e) => handleChange('sourceLink', e.target.value)}
              onBlur={() => handleBlur('sourceLink')}
              placeholder="https://..."
              className={`w-full p-3 rounded-lg bg-darkCard border ${
                errors.sourceLink
                  ? 'border-red-500'
                  : touched.sourceLink
                    ? 'border-primary'
                    : 'border-light/20'
              } text-light placeholder:text-light/40 focus:outline-none focus:border-primary transition-colors`}
            />
            {errors.sourceLink && (
              <p className="text-red-500 text-sm mt-1">{errors.sourceLink}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-8">
            <label htmlFor="email" className="block text-sm font-semibold mb-2 text-light">
              Ваш email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="для связи (необязательно)"
              className="w-full p-3 rounded-lg bg-darkCard border border-light/20 text-light placeholder:text-light/40 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Кнопка отправки */}
          <button
            type="submit"
            disabled={!isFormValid() || isLoading}
            className={`w-full py-3 rounded-lg font-semibold text-light transition-all duration-300 ${
              isFormValid() && !isLoading
                ? 'bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 cursor-pointer'
                : 'bg-darkCard text-light/40 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Отправка...
              </span>
            ) : (
              'Отправить на модерацию'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

