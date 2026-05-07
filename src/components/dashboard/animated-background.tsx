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
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = [];
    const energyLines: EnergyLine[] = [];
    const shards: Shard[] = [];
    
    const particleCount = 200;
    const energyLineCount = 15;
    const shardCount = 8;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.6;
        this.speedY = (Math.random() - 0.5) * 0.6;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          this.x -= dx * 0.005;
          this.y -= dy * 0.005;
        }
      }

      draw() {
        if (!ctx) return;
        const color = isDark 
          ? `rgba(0, 255, 255, ${this.opacity})` 
          : `rgba(0, 180, 255, ${this.opacity * 0.8})`;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    class EnergyLine {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.length = Math.random() * 150 + 50;
        this.speed = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.1 + 0.05;
      }

      update() {
        this.y -= this.speed;
        if (this.y + this.length < 0) {
          this.y = height + this.length;
          this.x = Math.random() * width;
        }
      }

      draw() {
        if (!ctx) return;
        const color = isDark 
          ? `rgba(0, 255, 255, ${this.opacity})` 
          : `rgba(180, 100, 255, ${this.opacity * 1.5})`;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();
      }
    }

    class Shard {
      x: number;
      y: number;
      size: number;
      angle: number;
      rotation: number;
      speed: number;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 30 + 10;
        this.angle = Math.random() * Math.PI * 2;
        this.rotation = (Math.random() - 0.5) * 0.01;
        this.speed = Math.random() * 0.2 + 0.1;
      }

      update() {
        this.angle += this.rotation;
        this.y -= this.speed;
        if (this.y + this.size < 0) {
          this.y = height + this.size;
          this.x = Math.random() * width;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.strokeStyle = isDark ? 'rgba(0, 255, 255, 0.05)' : 'rgba(0, 180, 255, 0.15)';
        ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
      }
    }

    for (let i = 0; i < particleCount; i++) particles.push(new Particle());
    for (let i = 0; i < energyLineCount; i++) energyLines.push(new EnergyLine());
    for (let i = 0; i < shardCount; i++) shards.push(new Shard());

    const render = () => {
      ctx.fillStyle = isDark ? '#02030a' : '#f8fbff';
      ctx.fillRect(0, 0, width, height);

      // Grid
      const time = Date.now() * 0.0002;
      ctx.strokeStyle = isDark ? 'rgba(0, 255, 255, 0.03)' : 'rgba(0, 150, 255, 0.06)';
      ctx.lineWidth = 1;
      const gridSize = 80;
      const offsetX = (time * 60) % gridSize;
      const offsetY = (time * 40) % gridSize;

      for (let x = offsetX; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = offsetY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Mouse Aura
      const aura = ctx.createRadialGradient(
        mouseRef.current.x,
        mouseRef.current.y,
        0,
        mouseRef.current.x,
        mouseRef.current.y,
        400
      );
      aura.addColorStop(0, isDark ? 'rgba(0, 255, 255, 0.12)' : 'rgba(0, 180, 255, 0.15)');
      aura.addColorStop(1, 'transparent');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, width, height);

      energyLines.forEach(l => { l.update(); l.draw(); });
      shards.forEach(s => { s.update(); s.draw(); });
      particles.forEach(p => { p.update(); p.draw(); });

      // Connective Lines
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.strokeStyle = isDark 
              ? `rgba(0, 255, 255, ${0.1 * (1 - dist/100)})` 
              : `rgba(0, 180, 255, ${0.12 * (1 - dist/100)})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(render);
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    const animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [isDark]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[-1] pointer-events-none" />;
};