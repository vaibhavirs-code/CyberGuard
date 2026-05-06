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
        this.vx = (Math.random() - 0.5) * 2.5; // Faster speed
        this.vy = (Math.random() - 0.5) * 2.5;
        this.size = Math.random() * 3 + 1;
        this.alpha = 0;
        this.targetAlpha = Math.random() * 0.5 + 0.2;
        this.color = Math.random() > 0.6 ? '15, 252, 235' : '25, 136, 245';
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.08 + 0.04;
      }

      update() {
        const dx = this.x - mouseRef.current.x;
        const dy = this.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 300) {
          const force = (300 - dist) / 300;
          this.vx += (dx / dist) * force * 1.2;
          this.vy += (dy / dist) * force * 1.2;
        }

        // Return to origin force
        const dxO = this.originX - this.x;
        const dyO = this.originY - this.y;
        this.vx += dxO * 0.001;
        this.vy += dyO * 0.001;

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;

        if (this.x < -50) this.x = width + 50;
        if (this.x > width + 50) this.x = -50;
        if (this.y < -50) this.y = height + 50;
        if (this.y > height + 50) this.y = -50;
        
        this.alpha += (this.targetAlpha - this.alpha) * 0.05;
        this.pulse += this.pulseSpeed;
      }

      draw() {
        if (!ctx) return;
        const finalAlpha = this.alpha * (0.5 + Math.sin(this.pulse) * 0.5) * (isDark ? 0.8 : 0.4);
        ctx.save();
        ctx.globalAlpha = finalAlpha;
        ctx.fillStyle = `rgb(${this.color})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect for particles
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgb(${this.color})`;
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
        this.speed = Math.random() * 12 + 6; // Faster streams
        this.length = Math.random() * 800 + 400;
        this.opacity = Math.random() * 0.35;
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
        grad.addColorStop(0.5, `rgba(${this.color}, ${this.opacity * (isDark ? 1 : 0.7)})`);
        grad.addColorStop(1, `rgba(${this.color}, 0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
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
        this.rotSpeed = (Math.random() - 0.5) * 0.04; // Faster rotation
        this.size = Math.random() * 50 + 20;
        this.vx = (Math.random() - 0.5) * 1.5; // Faster movement
        this.vy = (Math.random() - 0.5) * 1.5;
        this.alpha = Math.random() * 0.1 + 0.05;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotSpeed;
        if (this.x < -200) this.x = width + 200;
        if (this.x > width + 200) this.x = -200;
        if (this.y < -200) this.y = height + 200;
        if (this.y > height + 200) this.y = -200;
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        const shardColor = isDark ? '15, 252, 235' : '25, 136, 245';
        ctx.strokeStyle = `rgba(${shardColor}, ${this.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(0, -this.size * 0.7);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(0, this.size * 0.7);
        ctx.closePath();
        ctx.stroke();
        
        // Add a secondary internal wireframe
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.5, 0);
        ctx.lineTo(0, -this.size * 0.35);
        ctx.lineTo(this.size * 0.5, 0);
        ctx.lineTo(0, this.size * 0.35);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
    }

    class Wave {
      y: number; speed: number; amplitude: number; length: number; opacity: number; phase: number;

      constructor() {
        this.y = Math.random() * height;
        this.speed = Math.random() * 0.12 + 0.06;
        this.amplitude = Math.random() * 150 + 80;
        this.length = Math.random() * 1000 + 500;
        this.opacity = Math.random() * 0.12;
        this.phase = Math.random() * Math.PI * 2;
      }

      update() { this.phase += this.speed; }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.beginPath();
        const color = isDark ? '15, 252, 235' : '25, 136, 245';
        ctx.strokeStyle = `rgba(${color}, ${this.opacity * (isDark ? 1 : 2)})`;
        ctx.lineWidth = 3;
        for (let x = 0; x <= width; x += 30) {
          const dy = Math.sin(x / this.length + this.phase) * this.amplitude;
          if (x === 0) ctx.moveTo(x, this.y + dy);
          else ctx.lineTo(x, this.y + dy);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    const init = () => {
      particles = Array.from({ length: 220 }, () => new Particle()); // More particles
      waves = Array.from({ length: 12 }, () => new Wave());
      lines = Array.from({ length: 60 }, () => new EnergyLine()); // More energy lines
      shards = Array.from({ length: 20 }, () => new FloatingShard()); // More shards
    };

    const drawGrid = () => {
      const gridColor = isDark ? '25, 136, 245, 0.15' : '25, 136, 245, 0.22';
      ctx.strokeStyle = `rgba(${gridColor})`;
      ctx.lineWidth = 1;
      const step = 80; // Tighter grid
      const time = Date.now() / 800; // Faster grid shift
      const offsetX = (time * 60) % step;
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

    const drawConnectiveLines = () => {
      const maxDist = 120;
      const lineColor = isDark ? '15, 252, 235' : '25, 136, 245';
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dist = Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
          
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.15 * (isDark ? 1 : 0.6);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${lineColor}, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
    };

    const drawMouseAura = () => {
      if (!ctx) return;
      ctx.save();
      const auraGrad = ctx.createRadialGradient(
        mouseRef.current.x, mouseRef.current.y, 0,
        mouseRef.current.x, mouseRef.current.y, 350
      );
      const auraColor = isDark ? '15, 252, 235' : '25, 136, 245';
      auraGrad.addColorStop(0, `rgba(${auraColor}, ${isDark ? 0.25 : 0.15})`);
      auraGrad.addColorStop(1, `rgba(${auraColor}, 0)`);
      ctx.fillStyle = auraGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    };

    const render = () => {
      ctx.fillStyle = isDark ? '#010308' : '#f0f5fa';
      ctx.fillRect(0, 0, width, height);

      drawGrid();
      drawMouseAura();
      
      shards.forEach(s => { s.update(); s.draw(); });
      waves.forEach(w => { w.update(); w.draw(); });
      lines.forEach(l => { l.update(); l.draw(); });
      
      drawConnectiveLines(); // Neural connective tissue
      
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
