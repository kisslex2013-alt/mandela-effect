'use client';

export const Skeleton = ({ 
  className = "",
  variant = "default" 
}: { 
  className?: string;
  variant?: "default" | "text" | "circular" | "rectangular";
}) => {
  const baseClasses = "animate-pulse bg-darkCard/50";
  
  const variantClasses = {
    default: "rounded",
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg"
  };
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-label="Загрузка..."
    />
  );
};

