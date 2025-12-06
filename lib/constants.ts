import { Film, Music, Tag, User, Globe, Gamepad2, Baby, Ghost, Sparkles, LucideIcon } from 'lucide-react';

export interface CategoryDef {
  emoji: string;
  name: string;
  color: string; // Tailwind классы для бейджей
  icon: LucideIcon;
}

export const CATEGORY_MAP: Record<string, CategoryDef> = {
  films: { emoji: '🎬', name: 'Фильмы и сериалы', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Film },
  brands: { emoji: '🏢', name: 'Бренды и логотипы', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Tag },
  music: { emoji: '🎵', name: 'Музыка', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Music },
  popculture: { emoji: '🎨', name: 'Поп-культура', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', icon: Gamepad2 },
  childhood: { emoji: '🧸', name: 'Детство', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Baby },
  people: { emoji: '👤', name: 'Люди', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: User },
  geography: { emoji: '🌍', name: 'География', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Globe },
  history: { emoji: '📜', name: 'История', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Sparkles },
  science: { emoji: '🔬', name: 'Наука', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', icon: Sparkles },
  russian: { emoji: 'RU', name: 'Россия и СССР', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: Ghost },
  other: { emoji: '❓', name: 'Другое', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Sparkles },
};

export const getCategoryInfo = (slug: string): CategoryDef => {
  return CATEGORY_MAP[slug] || { ...CATEGORY_MAP.other, name: slug };
};

