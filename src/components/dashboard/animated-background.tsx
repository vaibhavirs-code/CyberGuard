"use client"

import React, { useEffect, useRef, useState } from 'react';

export const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDark(document.documentElement.classList.contains('dark'));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let waves: Wave[] = [];
    let lines: EnergyLine[] = [];
    let width = window.innerWidth;
    let height = window.innerHeight;

    class Particle {
      x: number; y: number; vx: number; vy: number; size: number; alpha: number;
      targetAlpha: number; color: string; pulse: number; pulseSpeed: number;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        this.size = Math.random() * 3 + 1;
        this.alpha = 0;
        this.targetAlpha = Math.random() * 0.4 + 0.1;
        this.color = Math.random() > 0.6 ? '15, 252, 235' : '25, 136, 245';
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.04 + 0.02;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
        this.alpha += (this.targetAlpha - this.alpha) * 0.02;
        this.pulse += this.pulseSpeed;
      }

      draw() {
        if (!ctx) return;
        const finalAlpha = this.alpha * (0.7 + Math.sin(this.pulse) * 0.3) * (isDark ? 0.8 : 0.4);
        ctx.save();
        ctx.globalAlpha = finalAlpha;
        ctx.fillStyle = `rgb(${this.color})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        if (isDark) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = `rgb(${this.color})`;
          ctx.fill();
        }
        ctx.restore();
      }
    }

    class EnergyLine {
      x: number; y: number; speed: number; length: number; opacity: number; color: string;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.speed = Math.random() * 4 + 2;
        this.length = Math.random() * 400 + 200;
        this.opacity = Math.random() * 0.2;
        this.color = Math.random() > 0.5 ? '15, 252, 235' : '100, 200, 255';
      }

      update() {
        this.x += this.speed;
        if (this.x > width + this.length) {
          this.x = -this.length;
          this.y = Math.random() * height;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        const grad = ctx.createLinearGradient(this.x, 0, this.x + this.length, 0);
        grad.addColorStop(0, `rgba(${this.color}, 0)`);
        grad.addColorStop(0.5, `rgba(${this.color}, ${this.opacity * (isDark ? 1 : 0.5)})`);
        grad.addColorStop(1, `rgba(${this.color}, 0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.length, this.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    class Wave {
      y: number; speed: number; amplitude: number; length: number; opacity: number; phase: number;

      constructor() {
        this.y = Math.random() * height;
        this.speed = Math.random() * 0.05 + 0.02;
        this.amplitude = Math.random() * 100 + 50;
        this.length = Math.random() * 1000 + 500;
        this.opacity = Math.random() * 0.06;
        this.phase = Math.random() * Math.PI * 2;
      }

      update() {
        this.phase += this.speed;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.beginPath();
        const color = isDark ? '15, 252, 235' : '25, 136, 245';
        ctx.strokeStyle = `rgba(${color}, ${this.opacity * (isDark ? 1 : 2)})`;
        ctx.lineWidth = 2;
        for (let x = 0; x <= width; x += 15) {
          const dy = Math.sin(x / this.length + this.phase) * this.amplitude;
          if (x === 0) ctx.moveTo(x, this.y + dy);
          else ctx.lineTo(x, this.y + dy);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    const init = () => {
      particles = Array.from({ length: 100 }, () => new Particle());
      waves = Array.from({ length: 12 }, () => new Wave());
      lines = Array.from({ length: 30 }, () => new EnergyLine());
    };

    const drawGrid = () => {
      const gridColor = isDark ? '25, 136, 245, 0.08' : '25, 136, 245, 0.15';
      ctx.strokeStyle = `rgba(${gridColor})`;
      ctx.lineWidth = 0.5;
      const step = 80;
      const time = Date.now() / 1000;
      const offsetX = (time * 40) % step;
      const offsetY = (time * 30) % step;
      
      for (let x = -step; x < width + step; x += step) {
        ctx.beginPath();
        ctx.moveTo(x + offsetX, 0); ctx.lineTo(x + offsetX, height); ctx.stroke();
      }
      for (let y = -step; y < height + step; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y + offsetY); ctx.lineTo(width, y + offsetY); ctx.stroke();
      }
    };

    const render = () => {
      ctx.fillStyle = isDark ? '#020308' : '#f0f4f8';
      ctx.fillRect(0, 0, width, height);

      const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
      if (isDark) {
        grad.addColorStop(0, 'rgba(15, 252, 235, 0.05)');
        grad.addColorStop(1, 'rgba(2, 3, 8, 0)');
      } else {
        grad.addColorStop(0, 'rgba(25, 136, 245, 0.08)');
        grad.addColorStop(1, 'rgba(240, 244, 248, 0)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      drawGrid();
      waves.forEach(w => { w.update(); w.draw(); });
      lines.forEach(l => { l.update(); l.draw(); });
      particles.forEach(p => { p.update(); p.draw(); });
      
      animationFrameId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      init();
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[-1]" />;
};