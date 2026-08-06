import React, { useEffect, useRef } from 'react';

const DynamicBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;
    let animationFrameId;

    let width = window.innerWidth;
    let height = window.innerHeight;

    let lines = [];
    const count = 120; // Number of wave lines

    const initLines = () => {
      lines = [];
      for (let i = 0; i < count; i++) {
        lines.push({
          angle: (Math.PI * 2 / count) * i,
          speed: 0.2 + Math.random() * 0.6,
          len: 0.3 + Math.random() * 0.7,
          width: 0.5 + Math.random() * 2,
          offset: Math.random() * 100
        });
      }
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initLines();
    };

    const draw = () => {
      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.sqrt(cx * cx + cy * cy);

      // Deep dark background
      ctx.fillStyle = '#0d0d0d';
      ctx.fillRect(0, 0, width, height);

      lines.forEach(l => {
        const progress = ((t * l.speed + l.offset) % 100) / 100;
        const r1 = maxR * progress;
        // Make the lines longer
        const r2 = maxR * (progress + l.len * 0.25);
        // Alpha based on sine wave to fade in and out gently
        const alpha = Math.sin(progress * Math.PI) * 0.4;

        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(l.angle) * r1, cy + Math.sin(l.angle) * r1);
        ctx.lineTo(cx + Math.cos(l.angle) * r2, cy + Math.sin(l.angle) * r2);
        
        // Add subtle colors (magenta/purple hints) instead of pure white
        const gradientColor = progress > 0.5 ? `rgba(233, 69, 96, ${alpha})` : `rgba(168, 85, 247, ${alpha})`;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`; // Base white
        if (Math.random() > 0.8) ctx.strokeStyle = gradientColor;
        
        ctx.lineWidth = l.width;
        ctx.stroke();
      });

      t += 0.08;
      animationFrameId = requestAnimationFrame(draw);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 0%, rgba(13,13,13,0.8) 100%)',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />
    </>
  );
};

export default DynamicBackground;
