import { useEffect, useRef } from 'react';

/**
 * ParticleNet — full-viewport particle network background.
 *
 * Props:
 *   color     {string}  — dot + line base color   (default: '59,130,246' — blue)
 *   dotAlpha  {number}  — dot fill opacity         (default: 0.40)
 *   lineAlpha {number}  — max line opacity         (default: 0.15)
 *   count     {number}  — particle count           (default: 50)
 *   connect   {number}  — max connect distance px  (default: 160)
 *   repelR    {number}  — mouse repel radius px    (default: 110)
 *   repelF    {number}  — mouse repel force        (default: 2.2)
 *   zIndex    {number}  — CSS z-index              (default: 0)
 *
 * The canvas is position:fixed, pointer-events:none — zero layout impact.
 */
const ParticleNet = ({
  color    = '59,130,246',
  dotAlpha = 0.40,
  lineAlpha = 0.15,
  count    = 50,
  connect  = 160,
  repelR   = 110,
  repelF   = 2.2,
  zIndex   = 0,
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const mouse = { x: -9999, y: -9999 };
    let raf;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Dot {
      constructor() { this.spawn(); }
      spawn() {
        this.x  = Math.random() * canvas.width;
        this.y  = Math.random() * canvas.height;
        const a = Math.random() * Math.PI * 2;
        const s = 0.14 + Math.random() * 0.26;
        this.vx = Math.cos(a) * s;
        this.vy = Math.sin(a) * s;
        this.ox = this.vx;
        this.oy = this.vy;
        this.r  = 1 + Math.random() * 1.4;
      }
      update() {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const d  = Math.hypot(dx, dy);
        if (d < repelR && d > 0.5) {
          const f = ((repelR - d) / repelR) * repelF;
          this.vx += (dx / d) * f;
          this.vy += (dy / d) * f;
        }
        this.vx += (this.ox - this.vx) * 0.035;
        this.vy += (this.oy - this.vy) * 0.035;
        const sp = Math.hypot(this.vx, this.vy);
        if (sp > 4) {
          this.vx = (this.vx / sp) * 4;
          this.vy = (this.vy / sp) * 4;
        }
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0)             { this.x = 0;             this.vx = Math.abs(this.vx);  this.ox = Math.abs(this.ox); }
        if (this.x > canvas.width)  { this.x = canvas.width;  this.vx = -Math.abs(this.vx); this.ox = -Math.abs(this.ox); }
        if (this.y < 0)             { this.y = 0;             this.vy = Math.abs(this.vy);  this.oy = Math.abs(this.oy); }
        if (this.y > canvas.height) { this.y = canvas.height; this.vy = -Math.abs(this.vy); this.oy = -Math.abs(this.oy); }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color},${dotAlpha})`;
        ctx.fill();
      }
    }

    resize();
    const dots = Array.from({ length: count }, () => new Dot());

    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const d = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
          if (d < connect) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(${color},${((1 - d / connect) * lineAlpha).toFixed(3)})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }
      dots.forEach(d => { d.update(); d.draw(); });
      raf = requestAnimationFrame(frame);
    };
    frame();

    const onMove  = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = ()    => { mouse.x = -9999; mouse.y = -9999; };
    window.addEventListener('mousemove',  onMove);
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove',  onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', resize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex,
      }}
    />
  );
};

export default ParticleNet;
