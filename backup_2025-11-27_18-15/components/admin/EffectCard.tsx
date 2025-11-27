'use client';

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

interface EffectCardProps {
  effect: Effect;
  showModeration?: boolean;
  onApprove?: (id: string | number) => void;
  onReject?: (id: string | number) => void;
  onEdit?: (effect: Effect) => void;
  onDelete?: (id: string | number) => void;
}

export default function EffectCard({
  effect,
  showModeration = false,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: EffectCardProps) {
  const getVariantText = (variant: { text: string; description: string } | string) => {
    return typeof variant === 'string' ? variant : variant.text;
  };

  return (
    <div className="bg-darkCard p-6 rounded-xl border border-light/10 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{effect.categoryEmoji}</span>
          <div>
            <h3 className="text-lg font-bold text-light">{effect.title}</h3>
            <p className="text-sm text-light/60">{effect.category}</p>
          </div>
        </div>
        {effect.dateAdded && (
          <span className="text-xs text-light/40">
            {new Date(effect.dateAdded).toLocaleDateString('ru-RU')}
          </span>
        )}
      </div>

      <p className="text-light/80 mb-4">{effect.question}</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-dark/50 rounded-lg">
          <div className="text-xs text-light/60 mb-1">Вариант А</div>
          <div className="text-light">{getVariantText(effect.variantA)}</div>
        </div>
        <div className="p-3 bg-dark/50 rounded-lg">
          <div className="text-xs text-light/60 mb-1">Вариант Б</div>
          <div className="text-light">{getVariantText(effect.variantB)}</div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-light/60 mb-4">
        <span>👍 {effect.votesA}</span>
        <span>👎 {effect.votesB}</span>
        <span>Всего: {effect.votesA + effect.votesB}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {showModeration && onApprove && (
          <button
            onClick={() => onApprove(effect.id)}
            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm font-medium"
          >
            ✓ Одобрить
          </button>
        )}
        {showModeration && onReject && (
          <button
            onClick={() => onReject(effect.id)}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
          >
            ✗ Отклонить
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(effect)}
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm font-medium"
          >
            ✏️ Редактировать
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(effect.id)}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
          >
            🗑️ Удалить
          </button>
        )}
      </div>
    </div>
  );
}

