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
    let width = window.innerWidth;
    let height = window.innerHeight;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      targetAlpha: number;
      baseColor: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 2 + 0.5;
        this.alpha = Math.random() * 0.5;
        this.targetAlpha = Math.random() * 0.5 + 0.1;
        this.baseColor = Math.random() > 0.5 ? '15, 252, 235' : '25, 136, 245';
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        this.alpha += (this.targetAlpha - this.alpha) * 0.01;
        if (Math.abs(this.alpha - this.targetAlpha) < 0.01) {
          this.targetAlpha = Math.random() * (isDark ? 0.5 : 0.3) + 0.1;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.alpha * (isDark ? 1 : 0.4);
        ctx.fillStyle = `rgb(${this.baseColor})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        if (isDark) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgb(${this.baseColor})`;
          ctx.fill();
        }
        ctx.restore();
      }
    }

    const init = () => {
      particles = [];
      const count = Math.floor((width * height) / 12000);
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    };

    const drawGrid = () => {
      const gridColor = isDark ? '25, 136, 245, 0.03' : '25, 136, 245, 0.05';
      ctx.strokeStyle = `rgba(${gridColor})`;
      ctx.lineWidth = 1;
      const step = 80;
      
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    const drawConnections = () => {
      ctx.lineWidth = 0.5;
      const maxDist = isDark ? 180 : 150;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${particles[i].baseColor}, ${(1 - dist / maxDist) * (isDark ? 0.08 : 0.12)})`;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const render = () => {
      ctx.fillStyle = isDark ? '#05060f' : '#f8f9fc';
      ctx.fillRect(0, 0, width, height);
      
      drawGrid();
      drawConnections();
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });

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

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1] transition-opacity duration-1000"
    />
  );
};