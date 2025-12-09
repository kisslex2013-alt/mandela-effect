'use client';

import { Edit, Trash2, Plus, Film, Music, Tag, User, Globe, Gamepad2, Baby, Ghost, HelpCircle, Atom, Landmark, Cpu, Utensils, Tv, Brain, Zap, Star, AlertTriangle, Camera, Video, Mic } from 'lucide-react';

interface CategoriesTabProps {
  categories: any[];
  counts: Record<string, number>;
  onEdit: (category: any) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

// Маппинг иконок
const getIcon = (id: string) => {
  const icons: Record<string, any> = {
    films: Film, music: Music, brands: Tag, people: User, geography: Globe,
    games: Gamepad2, science: Atom, history: Landmark, tech: Cpu, food: Utensils,
    popculture: Tv, childhood: Baby, russian: Ghost, other: HelpCircle,
    brain: Brain, zap: Zap, star: Star, alert: AlertTriangle,
    camera: Camera, video: Video, audio: Mic
  };
  // Пробуем найти по ID, если нет - дефолтная
  const Icon = icons[id] || icons[id.toLowerCase()] || HelpCircle;
  return <Icon className="w-6 h-6" />;
};

// Цветовые классы для фона и текста
const COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  green: { bg: 'bg-green-500/10', text: 'text-green-400' },
  red: { bg: 'bg-red-500/10', text: 'text-red-400' },
  gray: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
};

export default function CategoriesTab({ categories, counts, onEdit, onDelete, onCreate }: CategoriesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-sm font-bold transition-colors">
          <Plus className="w-4 h-4" /> Добавить категорию
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const colorKey = cat.color || 'gray';
          const colorClasses = COLOR_CLASSES[colorKey] || COLOR_CLASSES.gray;
          
          return (
            <div key={cat.id} className="bg-darkCard border border-light/10 rounded-xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${colorClasses.bg} ${colorClasses.text}`}>
                  {getIcon(cat.emoji || cat.slug)}
                </div>
                <div>
                  <div className="font-bold text-white">{cat.name}</div>
                  <div className="flex items-center gap-2 text-xs text-light/40 font-mono">
                    <span>/{cat.slug}</span>
                    <span className="w-1 h-1 rounded-full bg-light/20" />
                    <span>{counts[cat.slug] || 0} эффектов</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(cat)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(cat.id)} className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
