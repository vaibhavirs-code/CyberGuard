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
    let waves: Wave[] = [];
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
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 3 + 1;
        this.alpha = 0;
        this.targetAlpha = Math.random() * 0.5 + 0.1;
        this.color = Math.random() > 0.5 ? '15, 252, 235' : '25, 136, 245';
        this.pulse = 0;
        this.pulseSpeed = Math.random() * 0.05 + 0.02;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
        this.alpha += (this.targetAlpha - this.alpha) * 0.02;
        this.pulse += this.pulseSpeed;
      }

      draw() {
        if (!ctx) return;
        const finalAlpha = this.alpha * (0.8 + Math.sin(this.pulse) * 0.2) * (isDark ? 0.8 : 0.4);
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

    class Line {
      x: number; y: number; speed: number; length: number; opacity: number; color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.speed = Math.random() * 1.5 + 0.5;
        this.length = Math.random() * 300 + 200;
        this.opacity = Math.random() * 0.3;
        this.color = Math.random() > 0.5 ? '15, 252, 235' : '150, 150, 255';
      }

      update() {
        this.y -= this.speed;
        if (this.y < -this.length) {
          this.y = height + this.length;
          this.x = Math.random() * width;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        const grad = ctx.createLinearGradient(0, this.y, 0, this.y + this.length);
        grad.addColorStop(0, `rgba(${this.color}, 0)`);
        grad.addColorStop(0.5, `rgba(${this.color}, ${this.opacity * (isDark ? 1 : 0.5)})`);
        grad.addColorStop(1, `rgba(${this.color}, 0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();
        ctx.restore();
      }
    }

    class Wave {
      y: number; speed: number; amplitude: number; length: number; opacity: number; phase: number;

      constructor() {
        this.y = Math.random() * height;
        this.speed = Math.random() * 0.5 + 0.2;
        this.amplitude = Math.random() * 50 + 20;
        this.length = Math.random() * 1000 + 500;
        this.opacity = Math.random() * 0.05;
        this.phase = Math.random() * Math.PI * 2;
      }

      update() {
        this.phase += this.speed * 0.1;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = isDark ? `rgba(15, 252, 235, ${this.opacity})` : `rgba(25, 136, 245, ${this.opacity * 2})`;
        ctx.lineWidth = 2;
        for (let x = 0; x <= width; x += 10) {
          const dy = Math.sin(x / this.length + this.phase) * this.amplitude;
          if (x === 0) ctx.moveTo(x, this.y + dy);
          else ctx.lineTo(x, this.y + dy);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    const init = () => {
      particles = Array.from({ length: 80 }, () => new Particle());
      lines = Array.from({ length: 25 }, () => new Line());
      waves = Array.from({ length: 10 }, () => new Wave());
    };

    const drawGrid = () => {
      const gridColor = isDark ? '25, 136, 245, 0.06' : '25, 136, 245, 0.12';
      ctx.strokeStyle = `rgba(${gridColor})`;
      ctx.lineWidth = 0.5;
      const step = 60;
      const time = Date.now() / 1000;
      const offset = (time * 20) % step;
      
      // Perspective Grid
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
      ctx.fillStyle = isDark ? '#05060f' : '#f8fafd';
      ctx.fillRect(0, 0, width, height);

      // Radial gradient for atmospheric lighting
      const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
      if (isDark) {
        grad.addColorStop(0, 'rgba(15, 252, 235, 0.03)');
        grad.addColorStop(1, 'rgba(5, 6, 15, 0)');
      } else {
        grad.addColorStop(0, 'rgba(25, 136, 245, 0.05)');
        grad.addColorStop(1, 'rgba(248, 250, 253, 0)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      drawGrid();
      waves.forEach(w => { w.update(); w.draw(); });
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