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
    let lines: Line[] = [];
    let width = window.innerWidth;
    let height = window.innerHeight;

    class Particle {
      x: number; y: number; vx: number; vy: number; size: number; alpha: number;
      targetAlpha: number; color: string;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.size = Math.random() * 2 + 1;
        this.alpha = 0;
        this.targetAlpha = Math.random() * 0.4;
        this.color = Math.random() > 0.5 ? '15, 252, 235' : '25, 136, 245';
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
        this.alpha += (this.targetAlpha - this.alpha) * 0.01;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.alpha * (isDark ? 1 : 0.4);
        ctx.fillStyle = `rgb(${this.color})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        if (isDark) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgb(${this.color})`;
          ctx.fill();
        }
        ctx.restore();
      }
    }

    class Line {
      x: number; y: number; speed: number; length: number; opacity: number; color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.speed = Math.random() * 0.5 + 0.1;
        this.length = Math.random() * 200 + 100;
        this.opacity = Math.random() * 0.2;
        this.color = Math.random() > 0.5 ? '15, 252, 235' : '150, 150, 255';
      }

      update() {
        this.y -= this.speed;
        if (this.y < -this.length) this.y = height + this.length;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        const grad = ctx.createLinearGradient(0, this.y, 0, this.y + this.length);
        grad.addColorStop(0, `rgba(${this.color}, 0)`);
        grad.addColorStop(0.5, `rgba(${this.color}, ${this.opacity})`);
        grad.addColorStop(1, `rgba(${this.color}, 0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();
        ctx.restore();
      }
    }

    const init = () => {
      particles = Array.from({ length: 50 }, () => new Particle());
      lines = Array.from({ length: 20 }, () => new Line());
    };

    const drawGrid = () => {
      const gridColor = isDark ? '25, 136, 245, 0.03' : '25, 136, 245, 0.05';
      ctx.strokeStyle = `rgba(${gridColor})`;
      ctx.lineWidth = 0.5;
      const step = 80;
      const offset = (Date.now() / 50) % step;
      
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y + offset); ctx.lineTo(width, y + offset); ctx.stroke();
      }
    };

    const render = () => {
      ctx.fillStyle = isDark ? '#05060f' : '#f0f4f8';
      ctx.fillRect(0, 0, width, height);
      drawGrid();
      particles.forEach(p => { p.update(); p.draw(); });
      lines.forEach(l => { l.update(); l.draw(); });
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