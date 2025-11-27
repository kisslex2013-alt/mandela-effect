'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import EffectForm from '@/components/EffectForm';

interface Effect {
  id: string | number;
  title: string;
  question: string;
  category: string;
  categoryEmoji: string;
  variantA: { text: string; description: string } | string;
  variantB: { text: string; description: string } | string;
  interpretations?: {
    scientific: string;
    scientificTheory?: string;
    scientificSource?: string;
    community: string;
    communitySource?: string;
  };
  submittedAt?: string;
  dateAdded?: string;
  votesA: number;
  votesB: number;
  currentState?: string;
  sourceLink?: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'moderation' | 'database'>('moderation');
  const [pendingEffects, setPendingEffects] = useState<Effect[]>([]);
  const [allEffects, setAllEffects] = useState<Effect[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingEffect, setEditingEffect] = useState<Effect | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const [pendingRes, allRes] = await Promise.all([
        fetch('/api/admin/pending', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        }),
        fetch('/api/admin/all-effects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        }),
      ]);

      if (pendingRes.ok && allRes.ok) {
        setPendingEffects(await pendingRes.json());
        setAllEffects(await allRes.json());
        setIsAuthenticated(true);
      } else {
        setError('Неверный пароль');
      }
    } catch (err) {
      setError('Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (effectId: string, action: 'approve' | 'reject') => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, effectId, action }),
      });

      if (response.ok) {
        setPendingEffects(prev => prev.filter(e => e.id !== effectId));
        
        // Перезагружаем все эффекты если одобрили
        if (action === 'approve') {
          const allRes = await fetch('/api/admin/all-effects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
          });
          if (allRes.ok) {
            setAllEffects(await allRes.json());
          }
        }
      } else {
        setError('Ошибка модерации');
      }
    } catch (err) {
      setError('Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEffect) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password, 
          effectId: editingEffect.id,
          updatedEffect: editingEffect
        }),
      });

      if (response.ok) {
        // Обновляем локальный стейт
        if (typeof editingEffect.id === 'string' && editingEffect.id.startsWith('pending_')) {
          setPendingEffects(prev => prev.map(e => 
            e.id === editingEffect.id ? editingEffect : e
          ));
        } else {
          setAllEffects(prev => prev.map(e => 
            e.id === editingEffect.id ? editingEffect : e
          ));
        }
        setEditingEffect(null);
      } else {
        setError('Ошибка сохранения');
      }
    } catch (err) {
      setError('Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (effectId: number) => {
    if (!confirm('Удалить этот эффект?')) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, effectId }),
      });

      if (response.ok) {
        setAllEffects(prev => prev.filter(e => e.id !== effectId));
      } else {
        setError('Ошибка удаления');
      }
    } catch (err) {
      setError('Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  // Нормализуем variantA и variantB для отображения
  const normalizeVariant = (variant: { text: string; description: string } | string) => {
    if (typeof variant === 'string') {
      return { text: variant, description: '' };
    }
    return variant;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-darkCard p-8 rounded-xl border border-light/10">
            <h1 className="text-3xl font-bold text-light mb-6 text-center">
              🔐 Админ-панель
            </h1>
            
            <div className="mb-4">
              <label className="block text-light font-medium mb-2">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Введите пароль"
                className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light placeholder-light/40 focus:border-primary focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full px-6 py-3 bg-primary hover:bg-primary/80 text-light rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>

            <Link 
              href="/"
              className="block text-center text-light/60 hover:text-light mt-4 text-sm"
            >
              ← Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-light">
            Админ-панель
          </h1>
          <Link 
            href="/"
            className="text-light/60 hover:text-light transition-colors"
          >
            ← На главную
          </Link>
        </div>

        {/* Табы */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'moderation'
                ? 'bg-primary text-light'
                : 'bg-darkCard text-light/60 hover:text-light'
            }`}
          >
            Модерация {pendingEffects.length > 0 && `(${pendingEffects.length})`}
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'database'
                ? 'bg-primary text-light'
                : 'bg-darkCard text-light/60 hover:text-light'
            }`}
          >
            База эффектов ({allEffects.length})
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Модальное окно редактирования */}
        {editingEffect && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-darkCard p-6 rounded-xl border border-light/10 max-w-4xl w-full my-8">
              <h2 className="text-2xl font-bold text-light mb-6">
                Редактирование эффекта
              </h2>
              
              <EffectForm
                initialData={{
                  category: editingEffect.category,
                  title: editingEffect.title,
                  question: editingEffect.question,
                  variantA: typeof editingEffect.variantA === 'object' ? editingEffect.variantA.text : editingEffect.variantA,
                  variantADescription: typeof editingEffect.variantA === 'object' ? editingEffect.variantA.description : '',
                  variantB: typeof editingEffect.variantB === 'object' ? editingEffect.variantB.text : editingEffect.variantB,
                  variantBDescription: typeof editingEffect.variantB === 'object' ? editingEffect.variantB.description : '',
                  currentState: editingEffect.currentState,
                  sourceLink: editingEffect.sourceLink,
                  interpretations: editingEffect.interpretations,
                }}
                onSubmit={async (data) => {
                  const response = await fetch('/api/admin/edit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      password, 
                      effectId: editingEffect.id,
                      updatedEffect: {
                        ...editingEffect,
                        category: data.category,
                        title: data.title,
                        question: data.question,
                        variantA: {
                          text: data.variantA,
                          description: data.variantADescription,
                        },
                        variantB: {
                          text: data.variantB,
                          description: data.variantBDescription,
                        },
                        currentState: data.currentState,
                        sourceLink: data.sourceLink,
                        interpretations: data.interpretations,
                      }
                    }),
                  });

                  if (!response.ok) {
                    throw new Error('Ошибка сохранения');
                  }

                  // Обновляем локальный стейт
                  const updatedEffect = {
                    ...editingEffect,
                    category: data.category,
                    title: data.title,
                    question: data.question,
                    variantA: { text: data.variantA, description: data.variantADescription },
                    variantB: { text: data.variantB, description: data.variantBDescription },
                    currentState: data.currentState,
                    sourceLink: data.sourceLink,
                    interpretations: data.interpretations,
                  };

                  if (typeof editingEffect.id === 'string' && editingEffect.id.startsWith('pending_')) {
                    setPendingEffects(prev => prev.map(e => 
                      e.id === editingEffect.id ? updatedEffect : e
                    ));
                  } else {
                    setAllEffects(prev => prev.map(e => 
                      e.id === editingEffect.id ? updatedEffect : e
                    ));
                  }
                  
                  setEditingEffect(null);
                }}
                onCancel={() => setEditingEffect(null)}
                submitButtonText="💾 Сохранить изменения"
                isModal={true}
              />
            </div>
          </div>
        )}

        {/* Контент вкладок */}
        {activeTab === 'moderation' ? (
          // МОДЕРАЦИЯ
          pendingEffects.length === 0 ? (
            <div className="bg-darkCard p-12 rounded-xl border border-light/10 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-light/60">
                Нет эффектов, ожидающих модерации
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingEffects.map((effect) => {
                const variantA = normalizeVariant(effect.variantA);
                const variantB = normalizeVariant(effect.variantB);

                return (
                  <div 
                    key={effect.id} 
                    className="bg-darkCard p-6 rounded-xl border border-light/10"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{effect.categoryEmoji}</span>
                        <div>
                          <h2 className="text-2xl font-bold text-light">
                            {effect.title}
                          </h2>
                          <p className="text-light/60 text-sm">
                            {effect.category} • {effect.submittedAt && new Date(effect.submittedAt).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-light/80 mb-4">
                        <strong>Вопрос:</strong> {effect.question}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-sm font-semibold text-light mb-2">Вариант А</p>
                        <p className="text-light/90 mb-2">{variantA.text}</p>
                        {variantA.description && (
                          <p className="text-light/60 text-sm">{variantA.description}</p>
                        )}
                      </div>
                      <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <p className="text-sm font-semibold text-light mb-2">Вариант Б</p>
                        <p className="text-light/90 mb-2">{variantB.text}</p>
                        {variantB.description && (
                          <p className="text-light/60 text-sm">{variantB.description}</p>
                        )}
                      </div>
                    </div>

                    {effect.interpretations && (
                      <div className="mb-4 p-4 bg-darkCard/50 rounded-lg border border-light/10">
                        <p className="text-sm font-semibold text-light mb-2">
                          📚 Интерпретации добавлены
                        </p>
                        {effect.interpretations.scientific && (
                          <p className="text-light/70 text-sm mb-2">
                            🔬 {effect.interpretations.scientific.substring(0, 100)}...
                          </p>
                        )}
                        {effect.interpretations.community && (
                          <p className="text-light/70 text-sm">
                            🌐 {effect.interpretations.community.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        onClick={() => setEditingEffect(effect)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                      >
                        ✏️ Редактировать
                      </button>
                      <button
                        onClick={() => handleModerate(effect.id as string, 'approve')}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                      >
                        ✅ Одобрить
                      </button>
                      <button
                        onClick={() => handleModerate(effect.id as string, 'reject')}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                      >
                        ❌ Отклонить
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          // БАЗА ЭФФЕКТОВ
          <div className="space-y-4">
            {allEffects.map((effect) => {
              // Преобразуем строки в объекты для отображения
              const variantA = typeof effect.variantA === 'string' 
                ? { text: effect.variantA, description: '' }
                : effect.variantA;
              const variantB = typeof effect.variantB === 'string'
                ? { text: effect.variantB, description: '' }
                : effect.variantB;

              return (
                <div 
                  key={effect.id} 
                  className="bg-darkCard p-6 rounded-xl border border-light/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{effect.categoryEmoji}</span>
                      <div>
                        <h3 className="text-xl font-bold text-light">
                          {effect.title}
                        </h3>
                        <p className="text-light/60 text-sm">
                          ID: {effect.id} • {effect.votesA + effect.votesB} голосов
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingEffect({
                          ...effect,
                          variantA,
                          variantB
                        })}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        ✏️ Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(effect.id as number)}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
