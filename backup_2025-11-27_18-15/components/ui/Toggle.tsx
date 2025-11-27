'use client';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

// SVG иконка галочки
function CheckIcon() {
  return (
    <svg 
      className="w-3.5 h-3.5 text-white" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={3}
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function Toggle({ 
  checked, 
  onChange, 
  label,
  disabled = false 
}: ToggleProps) {
  return (
    <label 
      className={`
        flex items-center gap-3 select-none
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Кастомный чекбокс в стиле проекта */}
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={`
          w-5 h-5 rounded border-2 flex items-center justify-center
          transition-all duration-200
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          ${checked 
            ? 'bg-primary border-primary' 
            : 'bg-transparent border-light/30 hover:border-light/50'
          }
        `}
      >
        {checked && <CheckIcon />}
      </div>
      
      {/* Текст */}
      {label && (
        <span className={`
          text-sm font-medium transition-colors duration-200
          ${checked ? 'text-white' : 'text-light/70'}
        `}>
          {label}
        </span>
      )}
    </label>
  );
}
