'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Send, Twitter } from 'lucide-react';
import toast from 'react-hot-toast';

// VK Icon Component
const VKIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zM17.6 14.5c.3.44.76 1.18.95 1.5.17.28.15.42-.06.42h-2.1c-.72 0-1.05-.38-1.6-1.3-.2-.33-.45-.67-.6-.67-.13 0-.18.1-.18.6v1.37c0 .2-.06.33-.55.33-1.8 0-3.8-1.08-5.25-3.1-2.18-3.05-2.8-5.35-2.8-5.68 0-.15.06-.28.35-.28h2.1c.27 0 .37.12.47.4.52 1.5 1.4 2.8 1.75 2.8.13 0 .2-.06.2-.38V8.6c-.05-.85-.5-1.05-.5-1.4 0-.15.12-.3.32-.3h2c.27 0 .36.13.36.43v2.25c0 .25.1.33.17.33.14 0 .25-.08.5-.33 1-1.1 1.7-2.68 1.7-2.68.1-.2.25-.3.6-.3h2.1c.63 0 .76.32.62.75-.3.98-2.2 3.68-2.2 3.68-.18.28-.25.4 0 .75z"/>
  </svg>
);

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  effectId: string;
  effectTitle: string;
  effectDescription?: string;
  effectImageUrl?: string | null;
}

export default function ShareModal({ 
  isOpen, 
  onClose, 
  effectId, 
  effectTitle,
  effectDescription 
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(`${window.location.origin}/effect/${effectId}`);
    }
  }, [effectId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Ссылка скопирована');
    setTimeout(() => setCopied(false), 2000);
  };

  // Текст для шаринга (без ссылки, ссылка добавляется отдельно)
  const shareTitle = effectTitle;
  const shareText = `${effectTitle}\n\nПроверь свою память на mandela-effect.ru`;

  const shareLinks = [
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-blue-500',
      // Telegram: передаем только URL и заголовок (без дублирования ссылки в тексте)
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareTitle)}`
    },
    {
      name: 'VK',
      icon: VKIcon,
      color: 'bg-blue-600',
      // VK: передаем картинку явно
      href: `https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareTitle)}&image=${encodeURIComponent(`${url}/opengraph-image`)}`
    },
    {
      name: 'WhatsApp',
      icon: WhatsAppIcon,
      color: 'bg-green-500',
      // WhatsApp: Текст + Ссылка
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + url)}`
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(url)}`
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.9, opacity: 0 }} 
            className="relative w-full max-w-md bg-darkCard border border-light/10 rounded-2xl p-6 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Glow Effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-xl font-bold text-white">Поделиться эффектом</h3>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center">
                <X className="w-5 h-5 text-light/50 hover:text-white" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6 relative z-10">
              {shareLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <motion.div 
                    whileHover={{ scale: 1.15 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:brightness-110 ${link.color}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <link.icon className="w-6 h-6" />
                    </motion.div>
                  </motion.div>
                  <span className="text-xs text-light/60 group-hover:text-white transition-colors font-medium">{link.name}</span>
                </a>
              ))}
            </div>

            <div className="relative z-10">
              <label className="block text-xs text-light/40 mb-2 ml-1 uppercase tracking-wider font-bold">Прямая ссылка</label>
              <div className="flex items-center gap-2 bg-black/30 border border-light/10 rounded-xl p-1.5 pl-4">
                <input 
                  type="text" 
                  readOnly 
                  value={url} 
                  className="bg-transparent text-sm text-light/80 w-full outline-none"
                />
                <button 
                  onClick={handleCopy}
                  className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 hover:bg-white/10 text-light'}`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
