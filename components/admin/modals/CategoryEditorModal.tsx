'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Save, Loader2, Film, Music, Tag, User, Globe, Gamepad2, Baby, Ghost, HelpCircle, 
  Atom, FlaskConical, BookOpen, Library, Landmark, Hourglass, Rocket, Cpu, Smartphone, 
  Laptop, Tv, Monitor, Car, Plane, ShoppingCart, Utensils, Coffee, Pizza, Apple, 
  Sun, Moon, Cloud, Heart, Skull, Smile, Sparkles, Brain, Zap, Star, AlertTriangle,
  Camera, Video, Mic, Palette
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CategoryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
}

// Расширенный набор иконок
const ICON_PRESETS = [
  { id: 'films', icon: Film, label: 'Кино' },
  { id: 'music', icon: Music, label: 'Музыка' },
  { id: 'brands', icon: Tag, label: 'Бренды' },
  { id: 'people', icon: User, label: 'Люди' },
  { id: 'geography', icon: Globe, label: 'География' },
  { id: 'games', icon: Gamepad2, label: 'Игры' },
  { id: 'science', icon: Atom, label: 'Наука' },
  { id: 'history', icon: Landmark, label: 'История' },
  { id: 'tech', icon: Cpu, label: 'Технологии' },
  { id: 'food', icon: Utensils, label: 'Еда' },
  { id: 'popculture', icon: Tv, label: 'Поп-культура' },
  { id: 'childhood', icon: Baby, label: 'Детство' },
  { id: 'russian', icon: Ghost, label: 'Россия' },
  { id: 'brain', icon: Brain, label: 'Мозг' },
  { id: 'zap', icon: Zap, label: 'Энергия' },
  { id: 'star', icon: Star, label: 'Звезда' },
  { id: 'alert', icon: AlertTriangle, label: 'Опасно' },
  { id: 'camera', icon: Camera, label: 'Фото' },
  { id: 'video', icon: Video, label: 'Видео' },
  { id: 'audio', icon: Mic, label: 'Аудио' },
  { id: 'other', icon: HelpCircle, label: 'Другое' },
];

const PRESET_COLORS = ['#3b82f6', '#f97316', '#a855f7', '#ec4899', '#eab308', '#06b6d4', '#22c55e', '#ef4444', '#6b7280'];

export default function CategoryEditorModal({ isOpen, onClose, onSave, initialData }: CategoryEditorModalProps) {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    emoji: '', 
    color: '#6b7280', // Default gray hex
    sortOrder: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        slug: initialData.slug || '',
        emoji: initialData.emoji || 'other',
        color: initialData.color || '#6b7280',
        sortOrder: initialData.sortOrder || 0
      });
    } else {
      setForm({ name: '', slug: '', emoji: 'other', color: '#6b7280', sortOrder: 0 });
    }
  }, [initialData, isOpen]);

  const handleSave = async () => {
    if (!form.name || !form.slug) return toast.error('Заполните обязательные поля');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-darkCard w-full max-w-lg rounded-2xl border border-light/10 shadow-2xl p-6" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{initialData ? 'Редактирование категории' : 'Новая категория'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-light/50 mb-1 uppercase font-bold">Название</label>
              <input 
                type="text" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-primary outline-none" 
                placeholder="Фильмы" 
              />
            </div>
            <div>
              <label className="block text-xs text-light/50 mb-1 uppercase font-bold">Slug (ID)</label>
              <input 
                type="text" 
                value={form.slug} 
                onChange={e => setForm({...form, slug: e.target.value})} 
                className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white font-mono focus:border-primary outline-none" 
                placeholder="films" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-light/50 mb-2 uppercase font-bold">Иконка</label>
            <div className="grid grid-cols-7 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
              {ICON_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = form.emoji === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setForm({...form, emoji: preset.id})}
                    className={`aspect-square flex items-center justify-center rounded-lg border transition-all ${
                      isSelected 
                        ? 'bg-primary/20 border-primary text-white' 
                        : 'bg-white/5 border-transparent text-light/50 hover:bg-white/10 hover:text-light'
                    }`}
                    title={preset.label}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-light/50 mb-2 uppercase font-bold">Цвет</label>
              <div className="flex flex-wrap gap-2 items-center">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({...form, color: c})}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      form.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                {/* Кастомный цвет */}
                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 hover:border-white transition-colors">
                  <input 
                    type="color" 
                    value={form.color}
                    onChange={(e) => setForm({...form, color: e.target.value})}
                    className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Palette className="w-4 h-4 text-white mix-blend-difference" />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-light/50 mb-1 uppercase font-bold">Сортировка</label>
              <input 
                type="number" 
                value={form.sortOrder} 
                onChange={e => setForm({...form, sortOrder: parseInt(e.target.value) || 0})} 
                className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white focus:border-primary outline-none" 
              />
            </div>
          </div>
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
