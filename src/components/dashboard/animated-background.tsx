
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
      originX: number; originY: number;

      constructor() { this.reset(); }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.originX = this.x;
        this.originY = this.y;
        this.vx = (Math.random() - 0.5) * 3; // Boosted speed
        this.vy = (Math.random() - 0.5) * 3;
        this.size = Math.random() * 4 + 1; // Slightly larger
        this.alpha = 0;
        this.targetAlpha = Math.random() * 0.6 + 0.3; // Brighter
        this.color = Math.random() > 0.6 ? '15, 252, 235' : '25, 136, 245';
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.1 + 0.05;
      }

      update() {
        const dx = this.x - mouseRef.current.x;
        const dy = this.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 400) {
          const force = (400 - dist) / 400;
          this.vx += (dx / dist) * force * 1.5;
          this.vy += (dy / dist) * force * 1.5;
        }

        this.x += this.vx;
        this.y += this.vy;
        
        // Friction and return-to-origin force
        this.vx *= 0.96;
        this.vy *= 0.96;
        this.vx += (this.originX - this.x) * 0.001;
        this.vy += (this.originY - this.y) * 0.001;

        if (this.x < -100) this.x = width + 100;
        if (this.x > width + 100) this.x = -100;
        if (this.y < -100) this.y = height + 100;
        if (this.y > height + 100) this.y = -100;
        
        this.alpha += (this.targetAlpha - this.alpha) * 0.05;
        this.pulse += this.pulseSpeed;
      }

      draw() {
        if (!ctx) return;
        const finalAlpha = this.alpha * (0.4 + Math.sin(this.pulse) * 0.6) * (isDark ? 1 : 0.6);
        ctx.save();
        ctx.globalAlpha = finalAlpha;
        ctx.fillStyle = `rgb(${this.color})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgb(${this.color})`;
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
        this.speed = Math.random() * 15 + 8; // Very fast
        this.length = Math.random() * 600 + 400;
        this.opacity = Math.random() * 0.4;
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
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.length, this.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    class FloatingShard {
      x: number; y: number; rotation: number; rotSpeed: number; size: number; vx: number; vy: number; alpha: number;

      constructor() { this.reset(); }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.06;
        this.size = Math.random() * 60 + 30;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.alpha = Math.random() * 0.15 + 0.05;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotSpeed;
        if (this.x < -300) this.x = width + 300;
        if (this.x > width + 300) this.x = -300;
        if (this.y < -300) this.y = height + 300;
        if (this.y > height + 300) this.y = -300;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        const shardColor = isDark ? '15, 252, 235' : '25, 136, 245';
        ctx.strokeStyle = `rgba(${shardColor}, ${this.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(0, -this.size * 0.8);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(0, this.size * 0.8);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
    }

    class Wave {
      y: number; speed: number; amplitude: number; length: number; opacity: number; phase: number;

      constructor() {
        this.y = Math.random() * height;
        this.speed = Math.random() * 0.2 + 0.1;
        this.amplitude = Math.random() * 180 + 100;
        this.length = Math.random() * 1200 + 600;
        this.opacity = Math.random() * 0.15;
        this.phase = Math.random() * Math.PI * 2;
      }

      update() { this.phase += this.speed; }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.beginPath();
        const color = isDark ? '15, 252, 235' : '25, 136, 245';
        ctx.strokeStyle = `rgba(${color}, ${this.opacity * (isDark ? 1 : 2)})`;
        ctx.lineWidth = 4;
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
      particles = Array.from({ length: 250 }, () => new Particle());
      waves = Array.from({ length: 15 }, () => new Wave());
      lines = Array.from({ length: 80 }, () => new EnergyLine());
      shards = Array.from({ length: 25 }, () => new FloatingShard());
    };

    const drawGrid = () => {
      const gridColor = isDark ? '25, 136, 245, 0.2' : '25, 136, 245, 0.3';
      ctx.strokeStyle = `rgba(${gridColor})`;
      ctx.lineWidth = 1;
      const step = 100;
      const time = Date.now() / 1000;
      const offsetX = (time * 80) % step;
      const offsetY = (time * 60) % step;
      
      for (let x = -step; x < width + step; x += step) {
        ctx.beginPath();
        ctx.moveTo(x + offsetX, 0); ctx.lineTo(x + offsetX, height); ctx.stroke();
      }
      for (let y = -step; y < height + step; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y + offsetY); ctx.lineTo(width, y + offsetY); ctx.stroke();
      }
    };

    const drawConnectiveLines = () => {
      const maxDist = 150;
      const lineColor = isDark ? '15, 252, 235' : '25, 136, 245';
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dist = Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
          
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.25 * (isDark ? 1 : 0.7);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${lineColor}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
    };

    const render = () => {
      ctx.fillStyle = isDark ? '#02040a' : '#f0f7ff';
      ctx.fillRect(0, 0, width, height);

      drawGrid();
      
      shards.forEach(s => { s.update(); s.draw(); });
      waves.forEach(w => { w.update(); w.draw(); });
      lines.forEach(l => { l.update(); l.draw(); });
      
      drawConnectiveLines();
      
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
