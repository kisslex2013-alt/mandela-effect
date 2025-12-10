import { 
  Film, Music, Tag, User, Globe, Gamepad2, Baby, Ghost, HelpCircle, 
  Atom, Landmark, Cpu, Utensils, Tv, Brain, Zap, Star, AlertTriangle,
  Camera, Video, Mic
} from 'lucide-react';

export interface CategoryDef {
  id: string;
  name: string;
  color: string;
  icon: any;
}

export const CATEGORY_MAP: Record<string, CategoryDef> = {
  films: { id: 'films', name: 'Фильмы и сериалы', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10', icon: Film },
  brands: { id: 'brands', name: 'Бренды и логотипы', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10', icon: Tag },
  music: { id: 'music', name: 'Музыка', color: 'text-pink-400 border-pink-500/30 bg-pink-500/10', icon: Music },
  people: { id: 'people', name: 'Люди и знаменитости', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', icon: User },
  geography: { id: 'geography', name: 'География', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10', icon: Globe },
  popculture: { id: 'popculture', name: 'Поп-культура', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10', icon: Tv },
  childhood: { id: 'childhood', name: 'Детство', color: 'text-green-400 border-green-500/30 bg-green-500/10', icon: Baby },
  russian: { id: 'russian', name: 'Россия и СССР', color: 'text-red-400 border-red-500/30 bg-red-500/10', icon: Ghost },
  science: { id: 'science', name: 'Наука', color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10', icon: Atom },
  history: { id: 'history', name: 'История', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', icon: Landmark },
  tech: { id: 'tech', name: 'Технологии', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10', icon: Cpu },
  food: { id: 'food', name: 'Еда', color: 'text-lime-400 border-lime-500/30 bg-lime-500/10', icon: Utensils },
  games: { id: 'games', name: 'Игры', color: 'text-violet-400 border-violet-500/30 bg-violet-500/10', icon: Gamepad2 },
  brain: { id: 'brain', name: 'Психология', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10', icon: Brain },
  other: { id: 'other', name: 'Другое', color: 'text-gray-400 border-gray-500/30 bg-gray-500/10', icon: HelpCircle },
};

export const getCategoryInfo = (slug: string): CategoryDef => {
  return CATEGORY_MAP[slug] || CATEGORY_MAP['other'];
};

// Сектора для Агента-Охотника
export const SECTORS = [
  "Авто (Случайная тема)",
  "Фильмы и сериалы",
  "Мультфильмы и анимация",
  "Бренды и логотипы",
  "Знаменитости и люди",
  "Цитаты и фразы",
  "География и история",
  "Искусство и книги",
  "Технологии и игры"
];

// Пресеты стилей для генерации изображений
export const STYLE_PRESETS: Record<string, string> = {
  cinematic: "cinematic lighting, 8k, highly detailed, dramatic atmosphere, depth of field, professional photography",
  vhs: "VHS glitch effect, 1990s TV footage, analog video noise, tracking error, low resolution style, slightly blurry",
  polaroid: "vintage polaroid photo, flash photography, soft focus, film grain, 1980s aesthetic, vignette",
  newspaper: "black and white newspaper print, halftone pattern, grainy, high contrast, documentary style, archival footage",
  render: "3d render, unreal engine 5, octane render, isometric, sharp focus, vibrant colors, plastic texture"
};
