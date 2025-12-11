'use client';

import { useEffect, useRef } from 'react';
import { useReality } from '@/lib/context/RealityContext';

export default function AiAvatar() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isUpsideDown } = useReality();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    // В Изнанке частиц больше для плотности хаоса
    const particleCount = isUpsideDown ? 1000 : 600;

    const resize = () => {
      canvas.width = 400;
      canvas.height = 400;
    };
    resize();

    class Particle {
      x: number;
      y: number;
      z: number;
      baseX: number;
      baseY: number;
      baseZ: number;
      size: number;
      speed: number;
      offset: number;
      angle: number;
      // Индивидуальные параметры для глючей
      glitchSeed: number;
      collapseTrigger: number;
      reverseTrigger: number;
      stopTrigger: number;
      lastGlitchTime: number;

      constructor() {
        // Генерируем точки на сфере
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 120;

        this.baseX = r * Math.sin(phi) * Math.cos(theta);
        this.baseY = r * Math.sin(phi) * Math.sin(theta);
        this.baseZ = r * Math.cos(phi);
        
        this.x = this.baseX;
        this.y = this.baseY;
        this.z = this.baseZ;
        this.size = Math.random() * 1.5 + 0.5;
        // Скорость и смещение для хаоса
        this.speed = Math.random() * 0.05 + 0.01;
        this.offset = Math.random() * 100;
        this.angle = Math.random() * Math.PI * 2;
        
        // Индивидуальные триггеры для глючей (генерируем один раз)
        this.glitchSeed = Math.random() * 1000;
        // Каждая частица имеет свой интервал между глючами (300-800 кадров)
        this.collapseTrigger = 300 + Math.random() * 500;
        this.reverseTrigger = 200 + Math.random() * 400;
        this.stopTrigger = 150 + Math.random() * 300;
        this.lastGlitchTime = -1000; // Начальное значение
      }

      update(isGlitch: boolean, time: number) {
        if (isGlitch) {
          // --- ИЗНАНКА: СФЕРА С ГЛЮЧАМИ (индивидуальные для каждой частицы) ---
          
          // Используем детерминированные функции для псевдослучайности (без Math.random в update)
          const timeWithOffset = time + this.glitchSeed;
          
          // Определяем текущее состояние частицы через детерминированные функции
          const reversePhase = Math.sin(timeWithOffset * 0.01 + this.reverseTrigger) > 0.7;
          const stopPhase = Math.sin(timeWithOffset * 0.015 + this.stopTrigger) > 0.8;
          
          // Проверяем, нужно ли схлопывание (детерминированно, но разное для каждой частицы)
          const timeSinceLastGlitch = time - this.lastGlitchTime;
          const shouldCollapse = timeSinceLastGlitch > this.collapseTrigger;
          
          // Базовое вращение
          let speed = 0.005;
          let rotationDirection = 1;
          
          if (reversePhase && !stopPhase) {
            // Реверс вращения (разное время для разных частиц)
            rotationDirection = -1;
            speed *= 2.5;
          } else if (stopPhase) {
            // Остановка
            speed = 0;
          }
          
          const cos = Math.cos(speed * rotationDirection);
          const sin = Math.sin(speed * rotationDirection);

          // Вращаем базовые координаты
          const x = this.baseX;
          const z = this.baseZ;
          this.baseX = x * cos - z * sin;
          this.baseZ = z * cos + x * sin;

          // Обработка схлопывания/взрыва/возврата
          if (shouldCollapse) {
            const glitchProgress = (timeSinceLastGlitch - this.collapseTrigger);
            
            if (glitchProgress < 30) {
              // СХЛОПЫВАНИЕ В ЦЕНТР (30 кадров)
              const progress = glitchProgress / 30;
              const ease = progress * progress;
              
              this.x = this.baseX * (1 - ease);
              this.y = this.baseY * (1 - ease);
              this.z = this.baseZ * (1 - ease);
              this.size = 0.3 + (1 - ease) * 0.7;
            }
            else if (glitchProgress < 55) {
              // ВЗРЫВ ОБРАТНО (25 кадров)
              const progress = (glitchProgress - 30) / 25;
              const ease = progress * progress;
              
              // Детерминированный overshoot на основе offset
              const overshoot = (this.offset % 2) > 1 ? 1.5 : 1.0;
              const verticalBoost = (this.offset % 3) > 1 ? 1.7 : 1.0;
              
              this.x = this.baseX * overshoot * ease;
              this.y = this.baseY * verticalBoost * ease;
              this.z = this.baseZ * overshoot * ease;
              this.size = 0.5 + ease * 2;
            }
            else if (glitchProgress < 85) {
              // ДЕРГАНОЕ ВОЗВРАЩЕНИЕ (30 кадров)
              const progress = (glitchProgress - 55) / 30;
              const smooth = 1 - Math.pow(1 - progress, 3);
              
              // Детерминированное дрожание (на основе sin, не random)
              const jitter = Math.sin(timeWithOffset * 0.3) * 15 * (1 - progress);
              
              this.x = this.baseX * smooth + jitter;
              this.y = this.baseY * smooth + jitter;
              this.z = this.baseZ * smooth;
              this.size = 0.5 + smooth * 1;
            }
            else {
              // Возврат завершен, сбрасываем таймер
              this.lastGlitchTime = time;
              this.collapseTrigger = 400 + (this.offset % 300); // Новый случайный интервал
              
              // Нормальное состояние
              const breath = Math.sin(time * 0.002) * 5;
              this.x = this.baseX + (this.baseX / 120) * breath;
              this.y = this.baseY + (this.baseY / 120) * breath;
              this.z = this.baseZ + (this.baseZ / 120) * breath;
              this.size = Math.random() * 1.5 + 0.5;
            }
          }
          else {
            // НОРМАЛЬНОЕ СОСТОЯНИЕ (с редкими глючами)
            const breath = Math.sin(time * 0.002) * 5;
            
            // Вертикальные глючи (детерминированные, но редкие)
            const verticalGlitchPhase = Math.sin(timeWithOffset * 0.008);
            const verticalGlitch = verticalGlitchPhase > 0.95 ? verticalGlitchPhase * 40 : 0;
            
            // Горизонтальные глючи
            const horizontalGlitchPhase = Math.cos(timeWithOffset * 0.007);
            const horizontalGlitch = horizontalGlitchPhase > 0.96 ? horizontalGlitchPhase * 25 : 0;
            
            this.x = this.baseX + (this.baseX / 120) * breath + horizontalGlitch;
            this.y = this.baseY + (this.baseY / 120) * breath + verticalGlitch;
            this.z = this.baseZ + (this.baseZ / 120) * breath;
            this.size = Math.random() * 1.5 + 0.5;
          }

        } else {
          // --- РЕАЛЬНОСТЬ: СТАБИЛЬНАЯ СФЕРА ---
          const speed = 0.005;
          const cos = Math.cos(speed);
          const sin = Math.sin(speed);

          // Классическое вращение матрицы координат
          const x = this.baseX;
          const z = this.baseZ;
          this.baseX = x * cos - z * sin;
          this.baseZ = z * cos + x * sin;

          // Плавное "дыхание"
          const breath = Math.sin(time * 0.002) * 5;
          this.x = this.baseX + (this.baseX / 120) * breath;
          this.y = this.baseY + (this.baseY / 120) * breath;
          this.z = this.baseZ + (this.baseZ / 120) * breath;
          this.size = Math.random() * 1.5 + 0.5;
        }
      }

      draw(ctx: CanvasRenderingContext2D, isGlitch: boolean) {
        const scale = 300 / (300 + this.z);
        const x2d = this.x * scale + canvas!.width / 2;
        const y2d = this.y * scale + canvas!.height / 2;

        const alpha = scale > 0 ? (scale - 0.5) : 0;
        
        ctx.beginPath();
        ctx.arc(x2d, y2d, this.size * scale, 0, Math.PI * 2);
        
        if (isGlitch) {
            // Красный с вариациями (Огонь/Кровь)
            const r = 200 + Math.random() * 55;
            ctx.fillStyle = `rgba(${r}, 0, 0, ${alpha})`;
        } else {
            // Циан (Спокойствие)
            ctx.fillStyle = `rgba(6, 182, 212, ${alpha})`;
        }
        ctx.fill();
      }
    }

    // Инициализация
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let time = 0;
    const render = () => {
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Глобальный глитч смещения всего холста (редко, только в Изнанке)
      if (isUpsideDown && Math.random() > 0.92) {
        const shakeX = (Math.random() - 0.5) * 10;
        const shakeY = (Math.random() - 0.5) * 5;
        ctx.translate(shakeX, shakeY);
      } else {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }

      particles.forEach(p => {
        p.update(isUpsideDown, time);
        p.draw(ctx, isUpsideDown);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isUpsideDown]);

  return (
    <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Свечение */}
      <div className={`absolute inset-0 blur-3xl opacity-30 rounded-full pointer-events-none ${
        isUpsideDown ? 'bg-red-600 animate-pulse' : 'bg-cyan-500'
      }`} />
    </div>
  );
}
