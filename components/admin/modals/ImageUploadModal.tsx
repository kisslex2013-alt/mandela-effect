'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Upload, Link as LinkIcon, DownloadCloud } from 'lucide-react';
import { extractImageFromGeminiChat } from '@/app/actions/gemini-extract';
import { isGeminiChatUrl } from '@/lib/gemini-utils';
import { uploadImage } from '@/app/actions/upload';
import toast from 'react-hot-toast';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string, type: 'URL' | 'UPLOAD' | 'YANDEX' | 'GOOGLE', value?: string) => Promise<void>;
  initialUrl?: string;
}

export default function ImageUploadModal({ isOpen, onClose, onSave, initialUrl = '' }: ImageUploadModalProps) {
  const [mode, setMode] = useState<'link' | 'upload'>('link');
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  if (!isOpen) return null;

  const handleProcessLink = async () => {
    if (!url.trim()) return toast.error('Введите ссылку');
    setLoading(true);
    
    try {
      let targetUrl = url;
      
      // 1. Если это Gemini Chat - извлекаем прямую ссылку
      if (isGeminiChatUrl(url)) {
        setStatus('Извлечение из Gemini...');
        const res = await extractImageFromGeminiChat(url);
        if (!res.success || !res.imageUrl) {
          throw new Error(res.error || 'Не удалось найти картинку в чате');
        }
        targetUrl = res.imageUrl;
      }

      // 2. Скачиваем, сжимаем и загружаем в Supabase
      setStatus('Сжатие и сохранение...');
      const uploadRes = await uploadImage(targetUrl);
      
      if (uploadRes.success && uploadRes.url) {
        // Сохраняем в БД уже нашу вечную ссылку Supabase
        // Но помечаем sourceValue оригинальной ссылкой (для истории)
        await onSave(uploadRes.url, 'UPLOAD', url); 
        toast.success('Изображение сохранено в облако!');
        onClose();
      } else {
        throw new Error(uploadRes.error);
      }

    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Ошибка обработки');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setStatus('Сжатие и загрузка...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await uploadImage(formData);
      
      if (res.success && res.url) {
        await onSave(res.url, 'UPLOAD', file.name);
        toast.success('Файл загружен!');
        onClose();
      } else {
        toast.error(res.error || 'Ошибка загрузки');
      }
    } catch (e) {
      toast.error('Ошибка загрузки');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-darkCard w-full max-w-md rounded-2xl border border-light/10 p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-4">
          {mode === 'link' ? 'Сохранить из ссылки' : 'Загрузить файл'}
        </h3>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setMode('link')} className={`flex-1 py-2 rounded-lg text-sm transition-colors ${mode === 'link' ? 'bg-primary/20 text-primary' : 'bg-white/5 hover:bg-white/10'}`}>Ссылка</button>
          <button onClick={() => setMode('upload')} className={`flex-1 py-2 rounded-lg text-sm transition-colors ${mode === 'upload' ? 'bg-primary/20 text-primary' : 'bg-white/5 hover:bg-white/10'}`}>Файл</button>
        </div>
        
        {mode === 'link' ? (
          <>
            <div className="mb-4">
              <input 
                type="text" 
                value={url} 
                onChange={e => setUrl(e.target.value)} 
                className="w-full bg-dark border border-light/10 rounded-lg p-3 text-white outline-none focus:border-primary placeholder:text-light/30" 
                placeholder="Вставьте ссылку (Gemini, Google...)" 
                autoFocus 
                disabled={loading}
              />
              <p className="text-xs text-light/40 mt-2">
                💡 Ссылка будет обработана, картинка сжата и сохранена на нашем сервере.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={onClose} disabled={loading} className="px-4 py-2 rounded-lg hover:bg-white/5 text-sm">Отмена</button>
              <button onClick={handleProcessLink} disabled={loading} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                {loading ? status : 'Скачать и Сохранить'}
              </button>
            </div>
          </>
        ) : (
          <div className="mb-4">
            <label className={`block w-full p-8 border-2 border-dashed rounded-lg cursor-pointer text-center transition-colors ${loading ? 'border-light/10 opacity-50 cursor-not-allowed' : 'border-light/20 hover:border-primary/50'}`}>
              <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} disabled={loading} />
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-sm text-primary">{status}</span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-light/50 mb-2" />
                  <span className="text-sm text-light/50">Нажмите для выбора файла</span>
                  <span className="text-xs text-light/30 block mt-1">JPG, PNG, WEBP (Авто-сжатие)</span>
                </>
              )}
            </label>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={onClose} disabled={loading} className="px-4 py-2 rounded-lg hover:bg-white/5 text-sm">Отмена</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
