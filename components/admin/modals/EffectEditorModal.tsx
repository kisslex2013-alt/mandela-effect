'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader2, Wand2, Eye, Search, ScrollText, Brain, MessageSquare, ExternalLink as ExternalLinkIcon, Edit, Trash2, Image as ImageIcon, Video, Music } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { generateEffectData } from '@/app/actions/generate-content';
import { getComments, updateComment, deleteComment } from '@/app/actions/comments';
import toast from 'react-hot-toast';
import Link from 'next/link';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';

interface EffectEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
  categories: any[];
}

export default function EffectEditorModal({ isOpen, onClose, onSave, initialData, categories }: EffectEditorModalProps) {
  const [form, setForm] = useState({
    title: '', description: '', category: '', variantA: '', variantB: '',
    currentState: '', sourceLink: '', residue: '', residueSource: '',
    history: '', historySource: '', scientificInterpretation: '', scientificSource: '',
    communityInterpretation: '', communitySource: '', imageUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  useEffect(() => {
    if (initialData) {
      const contentLines = initialData.content?.split('\n') || [];
      const variantA = contentLines.find((l: string) => l.startsWith('Вариант А:'))?.replace('Вариант А: ', '').trim() || '';
      const variantB = contentLines.find((l: string) => l.startsWith('Вариант Б:'))?.replace('Вариант Б: ', '').trim() || '';
      const currentState = contentLines.find((l: string) => l.includes('Текущее состояние:'))?.replace('Текущее состояние: ', '').trim() || '';
      const interp = initialData.interpretations || {};

      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || '',
        variantA, variantB, currentState,
        sourceLink: interp.sourceLink || '',
        residue: initialData.residue || '',
        residueSource: initialData.residueSource || '',
        history: initialData.history || '',
        historySource: initialData.historySource || '',
        scientificInterpretation: interp.scientific || '',
        scientificSource: interp.scientificSource || '',
        communityInterpretation: interp.community || '',
        communitySource: interp.communitySource || '',
        imageUrl: initialData.imageUrl || '',
      });

      // Загружаем комментарии для эффекта
      if (initialData.id) {
        loadComments(initialData.id);
      }
    } else {
      // Reset form
      setForm({
        title: '', description: '', category: '', variantA: '', variantB: '',
        currentState: '', sourceLink: '', residue: '', residueSource: '',
        history: '', historySource: '', scientificInterpretation: '', scientificSource: '',
        communityInterpretation: '', communitySource: '', imageUrl: '',
      });
      setComments([]);
    }
  }, [initialData, isOpen]);

  const loadComments = async (effectId: string) => {
    setCommentsLoading(true);
    try {
      // Загружаем все комментарии, включая неодобренные (для админа)
      // Используем прямой запрос к БД через server action, который поддерживает includePending
      const result = await getComments(effectId, undefined, true);
      if (result.success && result.comments) {
        setComments(result.comments);
      }
    } catch (error) {
      console.error('Ошибка загрузки комментариев:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    setEditingCommentId(commentId);
    setEditCommentText(comment.text);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editCommentText.trim()) {
      toast.error('Текст не может быть пустым');
      return;
    }

    const result = await updateComment(commentId, { text: editCommentText });
    if (result.success) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, text: editCommentText } : c));
      setEditingCommentId(null);
      toast.success('Комментарий обновлен');
      if (initialData?.id) {
        loadComments(initialData.id);
      }
    } else {
      toast.error(result.error || 'Ошибка обновления');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Удалить комментарий?')) return;

    const result = await deleteComment(commentId);
    if (result.success) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Комментарий удален');
      if (initialData?.id) {
        loadComments(initialData.id);
      }
    } else {
      toast.error(result.error || 'Ошибка удаления');
    }
  };

  if (!isOpen) return null;

  const handleAiFill = async () => {
    if (!form.title) return toast.error('Нужен заголовок');
    setAiLoading(true);
    try {
      const result = await generateEffectData(form.title, form.description, form.variantA, form.variantB, { generateImage: true });
      if (result.success && result.data) {
        setForm(prev => ({
          ...prev,
          category: result.data!.category || prev.category,
          currentState: result.data!.currentState || prev.currentState,
          
          residue: result.data!.residue || prev.residue,
          residueSource: result.data!.residueSource || prev.residueSource, // <-- ДОБАВЛЕНО
          
          history: result.data!.history || prev.history,
          historySource: result.data!.historySource || prev.historySource, // <-- ДОБАВЛЕНО
          
          scientificInterpretation: result.data!.scientific || prev.scientificInterpretation,
          scientificSource: result.data!.scientificSource || prev.scientificSource, // <-- ДОБАВЛЕНО
          
          communityInterpretation: result.data!.community || prev.communityInterpretation,
          communitySource: result.data!.communitySource || prev.communitySource, // <-- ДОБАВЛЕНО
          
          sourceLink: result.data!.sourceLink || prev.sourceLink,
          imageUrl: result.data!.imageUrl || prev.imageUrl
        }));
        toast.success('AI данные получены');
      } else toast.error(result.error || 'Ошибка AI');
    } catch (e) { toast.error('Ошибка AI'); } finally { setAiLoading(false); }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-darkCard w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-light/10 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{initialData ? 'Редактирование' : 'Новый эффект'}</h2>
          <div className="flex gap-2">
            <button onClick={handleAiFill} disabled={aiLoading} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm flex items-center gap-2">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} AI
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="space-y-4">
          <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-primary outline-none" placeholder="Название" />
          <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-primary outline-none resize-none" placeholder="Описание" />
          
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={form.variantA} onChange={e => setForm({...form, variantA: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none" placeholder="Вариант А (Ложь)" />
            <input type="text" value={form.variantB} onChange={e => setForm({...form, variantB: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-green-500 outline-none" placeholder="Вариант Б (Правда)" />
          </div>

          <CustomSelect label="Категория" value={form.category} onChange={val => setForm({...form, category: val})} options={categories} />
          <input type="text" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white text-xs" placeholder="URL картинки" />

          <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-4">
            <h3 className="text-green-400 font-bold flex items-center gap-2 mb-2"><Eye className="w-4 h-4" /> Факты</h3>
            <textarea rows={2} value={form.currentState} onChange={e => setForm({...form, currentState: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-2 text-sm text-light outline-none" />
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
            <h3 className="text-blue-400 font-bold flex items-center gap-2 mb-2"><Search className="w-4 h-4" /> Остатки</h3>
            <textarea rows={2} value={form.residue} onChange={e => setForm({...form, residue: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-2 text-sm text-light outline-none" />
            <input type="text" value={form.residueSource || ''} onChange={e => setForm({...form, residueSource: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-2 text-xs text-light/60 mt-2 outline-none" placeholder="Источник остатков (URL)" />
          </div>

          {/* История */}
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
            <h3 className="text-amber-400 font-bold flex items-center gap-2 mb-2"><ScrollText className="w-4 h-4" /> История</h3>
            <textarea rows={3} value={form.history} onChange={e => setForm({...form, history: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-2 text-sm text-light outline-none" placeholder="История эффекта, временная шкала событий..." />
            <input type="text" value={form.historySource || ''} onChange={e => setForm({...form, historySource: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-2 text-xs text-light/60 mt-2 outline-none" placeholder="Источник истории (URL)" />
          </div>

          {/* Теории */}
          <div className="bg-pink-500/5 border border-pink-500/10 rounded-xl p-4">
            <h3 className="text-pink-400 font-bold flex items-center gap-2 mb-2"><Brain className="w-4 h-4" /> Теории</h3>
            
            <div className="mb-4 pb-4 border-b border-white/5">
              <h4 className="text-xs font-bold text-pink-300 uppercase tracking-wider mb-2">Научная точка зрения</h4>
              <textarea rows={3} value={form.scientificInterpretation} onChange={e => setForm({...form, scientificInterpretation: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-2 text-sm text-light outline-none" placeholder="Научное объяснение эффекта..." />
              <input type="text" value={form.scientificSource || ''} onChange={e => setForm({...form, scientificSource: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-2 text-xs text-light/60 mt-2 outline-none" placeholder="Источник научной теории (URL)" />
            </div>

            <div>
              <h4 className="text-xs font-bold text-pink-300 uppercase tracking-wider mb-2">Теории сообщества</h4>
              <textarea rows={3} value={form.communityInterpretation} onChange={e => setForm({...form, communityInterpretation: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-2 text-sm text-light outline-none" placeholder="Популярные теории сообщества..." />
              <input type="text" value={form.communitySource || ''} onChange={e => setForm({...form, communitySource: e.target.value})} className="w-full bg-dark border border-light/10 rounded-lg p-2 text-xs text-light/60 mt-2 outline-none" placeholder="Источник теорий сообщества (URL)" />
            </div>
          </div>

          {/* Комментарии */}
          {initialData?.id && (
            <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-purple-400 font-bold flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Комментарии</h3>
                <Link 
                  href={`/effect/${initialData.id}`} 
                  target="_blank"
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  Открыть на странице <ExternalLinkIcon className="w-3 h-3" />
                </Link>
              </div>
              {commentsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-dark/50 border border-white/5 rounded-lg p-2 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            comment.type === 'WITNESS' ? 'bg-blue-500/20 text-blue-400' : 
                            comment.type === 'ARCHAEOLOGIST' ? 'bg-purple-500/20 text-purple-400' : 
                            'bg-pink-500/20 text-pink-400'
                          }`}>
                            {comment.type}
                          </span>
                          <span className="text-light/40 text-[10px]">
                            {new Date(comment.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleEditComment(comment.id)}
                            className="p-1 hover:bg-white/10 rounded text-blue-400/80 hover:text-blue-400 transition-colors"
                            title="Редактировать"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 hover:bg-white/10 rounded text-red-400/80 hover:text-red-400 transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <textarea 
                            value={editCommentText}
                            onChange={e => setEditCommentText(e.target.value)}
                            className="w-full bg-dark border border-light/10 rounded p-2 text-xs text-light outline-none resize-none"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleSaveEdit(comment.id)}
                              className="px-2 py-1 bg-primary text-white rounded text-[10px] font-bold"
                            >
                              Сохранить
                            </button>
                            <button 
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditCommentText('');
                              }}
                              className="px-2 py-1 bg-white/10 text-light rounded text-[10px]"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-light/70 mb-2">{comment.text}</p>
                          
                          {/* Медиа-контент */}
                          {comment.imageUrl && (
                            <div className="mb-2">
                              <div className="flex items-center gap-1 text-[10px] text-light/50 mb-1">
                                <ImageIcon className="w-3 h-3" /> Изображение:
                              </div>
                              <div className="relative w-full h-24 rounded overflow-hidden border border-white/10">
                                <ImageWithSkeleton src={comment.imageUrl} alt="" fill className="object-cover" />
                              </div>
                              <a href={comment.imageUrl} target="_blank" rel="noopener" className="text-[10px] text-purple-400 hover:underline mt-1 flex items-center gap-1">
                                <ExternalLinkIcon className="w-2.5 h-2.5" /> Открыть
                              </a>
                            </div>
                          )}
                          
                          {comment.videoUrl && (
                            <div className="mb-2">
                              <div className="flex items-center gap-1 text-[10px] text-light/50 mb-1">
                                <Video className="w-3 h-3" /> Видео:
                              </div>
                              <a href={comment.videoUrl} target="_blank" rel="noopener" className="text-[10px] text-purple-400 hover:underline flex items-center gap-1">
                                <ExternalLinkIcon className="w-2.5 h-2.5" /> {comment.videoUrl}
                              </a>
                            </div>
                          )}
                          
                          {comment.audioUrl && (
                            <div className="mb-2">
                              <div className="flex items-center gap-1 text-[10px] text-light/50 mb-1">
                                <Music className="w-3 h-3" /> Аудио:
                              </div>
                              <a href={comment.audioUrl} target="_blank" rel="noopener" className="text-[10px] text-purple-400 hover:underline flex items-center gap-1">
                                <ExternalLinkIcon className="w-2.5 h-2.5" /> {comment.audioUrl}
                              </a>
                            </div>
                          )}
                          
                          {(comment.likes > 0 || comment.dislikes > 0) && (
                            <div className="mt-1 text-[10px] text-light/50">
                              👍 {comment.likes} {comment.dislikes > 0 && `👎 ${comment.dislikes}`}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-light/40 text-xs text-center py-2">Нет комментариев</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-primary text-white rounded-lg font-bold flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Сохранить
          </button>
        </div>
      </motion.div>
    </div>
  );
}

