'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, Check, Send, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

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
  effectDescription,
  effectImageUrl,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/effect/${effectId}`
    : '';
  
  // Ссылка на OG-изображение для шаринга
  const ogImageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/effect/${effectId}/opengraph-image`
    : '';
  
  const shareText = `${effectTitle}${effectDescription ? ` - ${effectDescription}` : ''}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Ссылка скопирована!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Не удалось скопировать');
    }
  };

  const shareToTelegram = () => {
    // Telegram подхватывает изображение из OG мета-тегов страницы
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToVK = () => {
    // VK: передаем OG-изображение как параметр image
    const url = `https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(effectTitle)}&description=${encodeURIComponent(effectDescription || '')}&image=${encodeURIComponent(ogImageUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    // Twitter использует OG-изображение автоматически через мета-теги
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop с градиентом */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-darkCard border-2 border-red-500/50 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Stranger Things Style Glow Effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-cyan-500/10 opacity-50" />
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 via-purple-600/20 to-cyan-600/20 blur-xl opacity-30 animate-pulse" />
              
              {/* Scanline эффект */}
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,255,0.03)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30" />
              
              {/* Header */}
              <div className="relative z-10 border-b-2 border-red-500/30 bg-gradient-to-r from-red-950/20 via-transparent to-cyan-950/20 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500/30 blur-md animate-pulse" />
                      <div className="relative p-2.5 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-lg border-2 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                        <Share2 className="w-5 h-5 text-red-400" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <span className="text-red-400">ПОДЕЛИТЬСЯ</span>
                        <span className="text-cyan-400">ЭФФЕКТОМ</span>
                      </h2>
                      <div className="h-0.5 w-full bg-gradient-to-r from-red-500 via-purple-500 to-cyan-500 mt-1" />
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white border border-white/10 hover:border-red-500/50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 p-6 space-y-4">
                {/* Social buttons grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Telegram - Cyan accent */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={shareToTelegram}
                    className="group relative overflow-hidden bg-gradient-to-br from-cyan-950/40 to-cyan-900/40 border-2 border-cyan-500/50 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <div className="relative z-10 p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                      <Send className="w-6 h-6 text-cyan-400" />
                    </div>
                    <span className="text-sm font-black text-white uppercase tracking-wider">Telegram</span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>

                  {/* VK - Blue accent */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={shareToVK}
                    className="group relative overflow-hidden bg-gradient-to-br from-blue-950/40 to-blue-900/40 border-2 border-blue-500/50 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <div className="relative z-10 p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                      <MessageCircle className="w-6 h-6 text-blue-400" />
                    </div>
                    <span className="text-sm font-black text-white uppercase tracking-wider">VK</span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>

                  {/* Twitter - Cyan accent */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={shareToTwitter}
                    className="group relative overflow-hidden bg-gradient-to-br from-cyan-950/40 to-cyan-900/40 border-2 border-cyan-500/50 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <div className="relative z-10 p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                      <Share2 className="w-6 h-6 text-cyan-400" />
                    </div>
                    <span className="text-sm font-black text-white uppercase tracking-wider">Twitter</span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>

                  {/* Copy Link - Red accent */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    className="group relative overflow-hidden bg-gradient-to-br from-red-950/40 to-red-900/40 border-2 border-red-500/50 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <div className="relative z-10 p-2 bg-red-500/20 rounded-lg border border-red-500/30">
                      {copied ? (
                        <Check className="w-6 h-6 text-green-400" />
                      ) : (
                        <Copy className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    <span className="text-sm font-black text-white uppercase tracking-wider">
                      {copied ? 'Скопировано' : 'Копировать'}
                    </span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                </div>

                {/* URL Preview - Terminal style */}
                <div className="mt-6 p-4 bg-black/40 border-2 border-cyan-500/30 rounded-lg relative overflow-hidden">
                  {/* Scanline overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,255,0.05)_50%)] bg-[length:100%_2px] pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <p className="text-xs text-red-400 font-mono uppercase tracking-wider font-bold">
                        ССЫЛКА:
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-2 bg-black/60 border border-cyan-500/20 rounded font-mono text-xs text-cyan-300 break-all">
                        {shareUrl}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-cyan-400/60 font-mono">
                      <span className="animate-pulse">▶</span>
                      <span>Готово к отправке</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
