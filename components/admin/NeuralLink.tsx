'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, Activity, AlertTriangle, CheckCircle, Cpu } from 'lucide-react';

interface NeuralLinkProps {
  isOpen: boolean;
  onClose: () => void;
  effects: any[];
  logs: string[];
}

export default function NeuralLink({ isOpen, onClose, effects, logs }: NeuralLinkProps) {
  const [systemStatus, setSystemStatus] = useState<'IDLE' | 'SCANNING' | 'STABLE' | 'CRITICAL'>('IDLE');
  const [internalLogs, setInternalLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Объединяем внешние логи и внутренние
  const allLogs = [...internalLogs, ...logs];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allLogs, isOpen]);

  const addLog = (msg: string) => setInternalLogs(prev => [...prev, `> ${msg}`]);

  const runHealthCheck = async () => {
    setSystemStatus('SCANNING');
    setInternalLogs([]); // Очистка старых логов диагностики
    addLog('INITIATING SYSTEM SCAN...');
    
    await new Promise(r => setTimeout(r, 500));
    
    let issues = 0;
    const missingImages = effects.filter(e => !e.imageUrl);
    const shortDesc = effects.filter(e => e.description.length < 10);
    const hidden = effects.filter(e => !e.isVisible);

    addLog(`ANALYZING ${effects.length} ENTITIES...`);
    await new Promise(r => setTimeout(r, 800));

    if (missingImages.length > 0) {
      addLog(`[WARNING] ${missingImages.length} entities missing visual data.`);
      issues++;
    }
    
    if (shortDesc.length > 0) {
      addLog(`[WARNING] ${shortDesc.length} entities have insufficient description.`);
      issues++;
    }

    addLog(`[INFO] ${hidden.length} entities are currently cloaked (hidden).`);

    await new Promise(r => setTimeout(r, 500));

    if (issues > 0) {
      setSystemStatus('CRITICAL');
      addLog(`SCAN COMPLETE. ${issues} ISSUES DETECTED.`);
      addLog('RECOMMENDATION: Use AI Agents to patch data gaps.');
    } else {
      setSystemStatus('STABLE');
      addLog('SYSTEM INTEGRITY: 100%. NO ANOMALIES.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          />
          
          {/* Sidebar */}
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0a0a0a] border-l border-primary/30 shadow-2xl z-[70] flex flex-col font-mono"
          >
            {/* Header */}
            <div className="p-4 border-b border-primary/20 flex justify-between items-center bg-primary/5">
              <div className="flex items-center gap-2 text-primary">
                <Cpu className="w-5 h-5" />
                <span className="font-bold tracking-wider">NEURAL LINK v2.0</span>
              </div>
              <button onClick={onClose} className="text-primary/60 hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Panel */}
            <div className="p-4 grid grid-cols-2 gap-4 border-b border-white/5">
              <div className="bg-white/5 p-3 rounded border border-white/10">
                <div className="text-xs text-white/40 mb-1">SYSTEM STATUS</div>
                <div className={`font-bold flex items-center gap-2 ${
                  systemStatus === 'STABLE' ? 'text-green-400' : 
                  systemStatus === 'CRITICAL' ? 'text-red-400' : 
                  systemStatus === 'SCANNING' ? 'text-yellow-400' : 'text-white/60'
                }`}>
                  <Activity className="w-4 h-4" />
                  {systemStatus}
                </div>
              </div>
              <button 
                onClick={runHealthCheck}
                disabled={systemStatus === 'SCANNING'}
                className="bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary p-3 rounded flex flex-col items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-xs font-bold">RUN DIAGNOSTICS</span>
              </button>
            </div>

            {/* Terminal Logs */}
            <div className="flex-1 overflow-hidden flex flex-col p-4">
              <div className="text-xs text-white/40 mb-2 flex items-center gap-2">
                <Terminal className="w-3 h-3" /> LIVE FEED
              </div>
              <div 
                ref={scrollRef}
                className="flex-1 bg-black/50 rounded border border-white/10 p-3 overflow-y-auto font-mono text-xs space-y-1 shadow-inner"
              >
                {allLogs.length === 0 && <span className="text-white/20">Waiting for input...</span>}
                {allLogs.map((log, i) => (
                  <div key={i} className="break-words">
                    <span className="text-primary/50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    <span className={log.includes('WARNING') ? 'text-yellow-400' : log.includes('CRITICAL') ? 'text-red-400' : 'text-primary/80'}>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/5 text-[10px] text-white/20 text-center">
              CONNECTED TO MANDELA_NET // SECURE CONNECTION
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

