"use client"

import React, { useEffect, useRef, useState } from 'react';

export const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
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
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
    let shards: FloatingShard[] = [];
    let width = window.innerWidth;
    let height = window.innerHeight;

    class Particle {
      x: number; y: number; vx: number; vy: number; size: number; alpha: number;
      targetAlpha: number; color: string; pulse: number; pulseSpeed: number;

      constructor() { this.reset(); }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.size = Math.random() * 2 + 1;
        this.alpha = 0;
        this.targetAlpha = Math.random() * 0.4 + 0.1;
        this.color = Math.random() > 0.6 ? '15, 252, 235' : '25, 136, 245';
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.05 + 0.03;
      }

      update() {
        const dx = this.x - mouseRef.current.x;
        const dy = this.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250) {
          const force = (250 - dist) / 250;
          this.vx += (dx / dist) * force * 0.8;
          this.vy += (dy / dist) * force * 0.8;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.97;
        this.vy *= 0.97;

        if (this.x < -10) this.x = width + 10;
        if (this.x > width + 10) this.x = -10;
        if (this.y < -10) this.y = height + 10;
        if (this.y > height + 10) this.y = -10;
        this.alpha += (this.targetAlpha - this.alpha) * 0.02;
        this.pulse += this.pulseSpeed;
      }

      draw() {
        if (!ctx) return;
        const finalAlpha = this.alpha * (0.6 + Math.sin(this.pulse) * 0.4) * (isDark ? 0.9 : 0.5);
        ctx.save();
        ctx.globalAlpha = finalAlpha;
        ctx.fillStyle = `rgb(${this.color})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    class EnergyLine {
      x: number; y: number; speed: number; length: number; opacity: number; color: string;

      constructor() { this.reset(); }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.speed = Math.random() * 6 + 4;
        this.length = Math.random() * 600 + 300;
        this.opacity = Math.random() * 0.25;
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
        grad.addColorStop(0.5, `rgba(${this.color}, ${this.opacity * (isDark ? 1 : 0.6)})`);
        grad.addColorStop(1, `rgba(${this.color}, 0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.length, this.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    class FloatingShard {
      x: number; y: number; rotation: number; rotSpeed: number; size: number; vx: number; vy: number;

      constructor() { this.reset(); }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.02;
        this.size = Math.random() * 30 + 10;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotSpeed;
        if (this.x < -100) this.x = width + 100;
        if (this.x > width + 100) this.x = -100;
        if (this.y < -100) this.y = height + 100;
        if (this.y > height + 100) this.y = -100;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.strokeStyle = isDark ? 'rgba(15, 252, 235, 0.15)' : 'rgba(25, 136, 245, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(0, -this.size * 0.5);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(0, this.size * 0.5);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
    }

    class Wave {
      y: number; speed: number; amplitude: number; length: number; opacity: number; phase: number;

      constructor() {
        this.y = Math.random() * height;
        this.speed = Math.random() * 0.08 + 0.04;
        this.amplitude = Math.random() * 120 + 60;
        this.length = Math.random() * 800 + 400;
        this.opacity = Math.random() * 0.08;
        this.phase = Math.random() * Math.PI * 2;
      }

      update() { this.phase += this.speed; }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.beginPath();
        const color = isDark ? '15, 252, 235' : '25, 136, 245';
        ctx.strokeStyle = `rgba(${color}, ${this.opacity * (isDark ? 1 : 2.5)})`;
        ctx.lineWidth = 2.5;
        for (let x = 0; x <= width; x += 40) {
          const dy = Math.sin(x / this.length + this.phase) * this.amplitude;
          if (x === 0) ctx.moveTo(x, this.y + dy);
          else ctx.lineTo(x, this.y + dy);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    const init = () => {
      particles = Array.from({ length: 180 }, () => new Particle());
      waves = Array.from({ length: 10 }, () => new Wave());
      lines = Array.from({ length: 50 }, () => new EnergyLine());
      shards = Array.from({ length: 15 }, () => new FloatingShard());
    };

    const drawGrid = () => {
      const gridColor = isDark ? '25, 136, 245, 0.12' : '25, 136, 245, 0.18';
      ctx.strokeStyle = `rgba(${gridColor})`;
      ctx.lineWidth = 0.8;
      const step = 90;
      const time = Date.now() / 1000;
      const offsetX = (time * 50) % step;
      const offsetY = (time * 40) % step;
      
      for (let x = -step; x < width + step; x += step) {
        ctx.beginPath();
        ctx.moveTo(x + offsetX, 0); ctx.lineTo(x + offsetX, height); ctx.stroke();
      }
      for (let y = -step; y < height + step; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y + offsetY); ctx.lineTo(width, y + offsetY); ctx.stroke();
      }
    };

    const drawMouseAura = () => {
      if (!ctx) return;
      ctx.save();
      const auraGrad = ctx.createRadialGradient(
        mouseRef.current.x, mouseRef.current.y, 0,
        mouseRef.current.x, mouseRef.current.y, 250
      );
      const auraColor = isDark ? '15, 252, 235' : '25, 136, 245';
      auraGrad.addColorStop(0, `rgba(${auraColor}, ${isDark ? 0.2 : 0.12})`);
      auraGrad.addColorStop(1, `rgba(${auraColor}, 0)`);
      ctx.fillStyle = auraGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    };

    const render = () => {
      ctx.fillStyle = isDark ? '#02040a' : '#f8fbff';
      ctx.fillRect(0, 0, width, height);

      drawGrid();
      drawMouseAura();
      shards.forEach(s => { s.update(); s.draw(); });
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
