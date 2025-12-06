'use client';

import { useState } from 'react';
import { Search, LayoutGrid, Eye, EyeOff, Edit, Trash2, CheckSquare, Square, Link as LinkIcon, Upload, Maximize2, FileText, Image as ImageIcon, Palette, LayoutTemplate, Loader2, ExternalLink } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import ImageWithSkeleton from '@/components/ui/ImageWithSkeleton';
import { getCategoryInfo } from '@/lib/constants';

interface EffectsTabProps {
  effects: any[];
  categories: any[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onEdit: (effect: any) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (effect: any) => void;
  onQuickAction: (effect: any, type: 'data' | 'image' | 'restyle' | 'fit') => void;
  onManualImage: (effect: any, mode: 'link' | 'upload') => void;
  onSearchImage: (title: string, engine: 'google' | 'yandex') => void;
  quickLoading: { id: string, type: string } | null;
}

export default function EffectsTab({ 
  effects, categories, selectedIds, onToggleSelection, 
  onEdit, onDelete, onToggleVisibility, onQuickAction, 
  onManualImage, onSearchImage, quickLoading 
}: EffectsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const filteredEffects = effects.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex gap-4 mb-4 bg-darkCard/50 p-2 rounded-xl border border-light/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light/40" />
          <input type="text" placeholder="Поиск по реальности..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-black/20 border border-light/10 rounded-lg text-sm text-light focus:outline-none focus:border-primary transition-colors" />
        </div>
        <div className="w-56">
          <CustomSelect value={selectedCategory} onChange={setSelectedCategory} options={[{ value: 'all', label: 'Все категории', icon: <LayoutGrid className="w-4 h-4" /> }, ...categories]} placeholder="Категория" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredEffects.map(effect => (
          <div key={effect.id} className={`bg-darkCard border rounded-xl overflow-hidden transition-all group relative flex flex-col ${selectedIds.has(effect.id) ? 'border-primary/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'border-light/10 hover:border-primary/30'}`}>
            
            {/* Selection Checkbox (Absolute) */}
            <button onClick={() => onToggleSelection(effect.id)} className="absolute top-2 left-2 z-20 p-1 bg-black/60 backdrop-blur-md rounded hover:bg-primary/20 transition-colors text-primary">
              {selectedIds.has(effect.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-white/50" />}
            </button>

            {/* Top Section: Image & Info */}
            <div className="flex p-3 gap-3">
              {/* Image Thumbnail */}
              <div className="w-28 h-20 shrink-0 rounded-lg bg-black/40 overflow-hidden relative group/img cursor-pointer border border-white/5" onClick={() => effect.imageUrl && setPreviewImage(effect.imageUrl)}>
                {effect.imageUrl ? <ImageWithSkeleton src={effect.imageUrl} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl opacity-50">🖼️</div>}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity"><Maximize2 className="w-5 h-5 text-white" /></div>
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getCategoryInfo(effect.category).color} bg-opacity-10 border border-opacity-20 truncate max-w-[100px]`}>
                    {getCategoryInfo(effect.category).name}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => onToggleVisibility(effect)} className={`p-1 rounded hover:bg-white/10 ${!effect.isVisible ? 'text-red-400' : 'text-light/30 hover:text-light'}`}>{!effect.isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                    <button onClick={() => onEdit(effect)} className="p-1 rounded hover:bg-white/10 text-blue-400/80 hover:text-blue-400"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onDelete(effect.id)} className="p-1 rounded hover:bg-white/10 text-red-400/80 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <h3 className="font-bold text-light text-sm truncate leading-tight mb-1" title={effect.title}>{effect.title}</h3>
                <p className="text-xs text-light/50 line-clamp-2 leading-relaxed">{effect.description}</p>
              </div>
            </div>

            {/* Bottom Toolbar (HUD) */}
            <div className="mt-auto bg-black/20 border-t border-light/5 p-2 flex items-center justify-between gap-2">
              
              {/* Research Group */}
              <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); onSearchImage(effect.title, 'google'); }} className="w-7 h-7 flex items-center justify-center rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors font-bold text-[10px]" title="Google Search">G</button>
                <button onClick={(e) => { e.stopPropagation(); onSearchImage(effect.title, 'yandex'); }} className="w-7 h-7 flex items-center justify-center rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors font-bold text-[10px]" title="Yandex Search">Y</button>
                
                <div className="relative group/dropdown">
                  <button className="w-7 h-7 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-light/60 hover:text-light border border-white/10 transition-colors">
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-full left-0 mb-1 bg-darkCard border border-light/10 rounded-lg shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-30 min-w-[140px]">
                    <button onClick={(e) => { e.stopPropagation(); onManualImage(effect, 'link'); }} className="w-full px-3 py-2 text-left text-xs hover:bg-white/5 flex items-center gap-2 text-light/70 hover:text-light"><LinkIcon className="w-3 h-3" /> Ссылка</button>
                    <button onClick={(e) => { e.stopPropagation(); onManualImage(effect, 'upload'); }} className="w-full px-3 py-2 text-left text-xs hover:bg-white/5 flex items-center gap-2 text-light/70 hover:text-light"><Upload className="w-3 h-3" /> Загрузить</button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-4 bg-white/10"></div>

              {/* AI Generation Group */}
              <div className="flex gap-1 flex-1 justify-end">
                <button onClick={() => onQuickAction(effect, 'data')} disabled={!!quickLoading} className="h-7 px-2 flex items-center justify-center gap-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-colors text-[10px] font-medium" title="Сгенерировать данные">
                  <FileText className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Данные</span>
                </button>
                <button onClick={() => onQuickAction(effect, 'image')} disabled={!!quickLoading} className="h-7 px-2 flex items-center justify-center gap-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-colors text-[10px] font-medium" title="Сгенерировать фото">
                  <ImageIcon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Фото</span>
                </button>
                <button onClick={() => onQuickAction(effect, 'restyle')} disabled={!!quickLoading} className="w-7 h-7 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-light/60 hover:text-light border border-white/10 transition-colors" title="Рестайлинг (Flux)">
                  <Palette className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onQuickAction(effect, 'fit')} disabled={!!quickLoading} className="w-7 h-7 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-light/60 hover:text-light border border-white/10 transition-colors" title="Формат 16:9">
                  <LayoutTemplate className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* Loading Overlay */}
            {quickLoading?.id === effect.id && (
              <div className="absolute inset-0 bg-dark/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-xs font-mono text-primary animate-pulse">PROCESSING...</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {previewImage && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-5xl w-full aspect-video">
            <ImageWithSkeleton src={previewImage} alt="" fill className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

