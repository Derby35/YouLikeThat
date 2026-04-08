import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────
   Particle network canvas
   - Dots float + bounce autonomously
   - Connecting lines drawn between nearby dots
   - Mouse proximity repels dots (no layout shift)
   - Canvas is pointer-events:none / position:absolute
───────────────────────────────────────────── */
const ParticleNet = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const mouse = { x: -9999, y: -9999 };
    let raf;

    /* ── Tuning ── */
    const N        = 58;    // particle count
    const CONNECT  = 140;   // max px between connected dots
    const REPEL_R  = 100;   // mouse repulsion radius
    const REPEL_F  = 2.4;   // repulsion force strength

    /* ── Resize canvas to match CSS size ── */
    const resize = () => {
      canvas.width  = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };

    /* ── Particle class ── */
    class Dot {
      constructor() { this.spawn(); }

      spawn() {
        this.x  = Math.random() * canvas.width;
        this.y  = Math.random() * canvas.height;
        const a = Math.random() * Math.PI * 2;
        const s = 0.18 + Math.random() * 0.3;
        this.vx = Math.cos(a) * s;
        this.vy = Math.sin(a) * s;
        // remember original drift for easing back
        this.ox = this.vx;
        this.oy = this.vy;
        this.r  = 1 + Math.random() * 1.6;
      }

      update() {
        /* mouse repulsion */
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const d  = Math.hypot(dx, dy);
        if (d < REPEL_R && d > 0.5) {
          const f = ((REPEL_R - d) / REPEL_R) * REPEL_F;
          this.vx += (dx / d) * f;
          this.vy += (dy / d) * f;
        }

        /* ease velocity back toward original drift */
        this.vx += (this.ox - this.vx) * 0.035;
        this.vy += (this.oy - this.vy) * 0.035;

        /* cap speed */
        const sp = Math.hypot(this.vx, this.vy);
        if (sp > 4.5) { this.vx = (this.vx / sp) * 4.5; this.vy = (this.vy / sp) * 4.5; }

        this.x += this.vx;
        this.y += this.vy;

        /* bounce off walls — flip velocity & original drift */
        if (this.x < 0)             { this.x = 0;             this.vx = Math.abs(this.vx);  this.ox = Math.abs(this.ox); }
        if (this.x > canvas.width)  { this.x = canvas.width;  this.vx = -Math.abs(this.vx); this.ox = -Math.abs(this.ox); }
        if (this.y < 0)             { this.y = 0;             this.vy = Math.abs(this.vy);  this.oy = Math.abs(this.oy); }
        if (this.y > canvas.height) { this.y = canvas.height; this.vy = -Math.abs(this.vy); this.oy = -Math.abs(this.oy); }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(249,115,22,0.62)';
        ctx.fill();
      }
    }

    /* ── Init ── */
    resize();
    let dots = Array.from({ length: N }, () => new Dot());

    /* ── Render loop ── */
    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /* draw connecting lines first (below dots) */
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const d = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
          if (d < CONNECT) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(249,115,22,${(1 - d / CONNECT) * 0.2})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();
          }
        }
      }

      /* update + draw dots */
      dots.forEach(d => { d.update(); d.draw(); });

      raf = requestAnimationFrame(frame);
    };

    frame();

    /* ── Mouse tracking on the hero panel (not the canvas) ── */
    const hero = canvas.parentElement;
    const onMove  = (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const onLeave = ()    => { mouse.x = -9999; mouse.y = -9999; };
    hero.addEventListener('mousemove',  onMove);
    hero.addEventListener('mouseleave', onLeave);

    /* ── Resize observer ── */
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      hero.removeEventListener('mousemove',  onMove);
      hero.removeEventListener('mouseleave', onLeave);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};

/* Fake leaderboard data for the left-panel ticker */
const PLAYERS = [
  { name: 'Josh Allen',          pos: 'QB', pts: 356.2 },
  { name: 'Patrick Mahomes',     pos: 'QB', pts: 342.4 },
  { name: 'Joe Burrow',          pos: 'QB', pts: 318.6 },
  { name: 'Christian McCaffrey', pos: 'RB', pts: 312.1 },
  { name: 'CeeDee Lamb',         pos: 'WR', pts: 302.1 },
  { name: 'Tyreek Hill',         pos: 'WR', pts: 298.7 },
  { name: 'Justin Jefferson',    pos: 'WR', pts: 287.3 },
  { name: 'Derrick Henry',       pos: 'RB', pts: 274.5 },
  { name: 'Davante Adams',       pos: 'WR', pts: 256.9 },
  { name: 'Travis Kelce',        pos: 'TE', pts: 241.8 },
];
const TICKER = [...PLAYERS, ...PLAYERS]; // duplicate for seamless loop

/* Floating-label input with focus/blur state */
const FloatInput = ({ label, type = 'text', value, onChange, required, autoFocus, children }) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  return (
    <div className={`float-field${active ? ' active' : ''}${focused ? ' focused' : ''}`}>
      <label className="float-label">{label}</label>
      <div className={children ? 'pw-wrap' : ''}>
        <input
          className="float-input"
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          autoFocus={autoFocus}
        />
        {children}
      </div>
    </div>
  );
};

const Login = () => {
  const [form,    setForm]    = useState({ username: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [shake,   setShake]   = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const { login, user }       = useAuth();
  const navigate              = useNavigate();

  if (user) {
    navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(form.username, form.password);
      navigate(u.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ── LEFT HERO PANEL ── */}
      <div className="login-hero">
        {/* Diagonal field-line texture */}
        <div className="lh-lines"   aria-hidden="true" />
        {/* Atmospheric orange glow */}
        <div className="lh-glow"    aria-hidden="true" />
        {/* Secondary blue glow */}
        <div className="lh-glow-b"  aria-hidden="true" />
        {/* Particle network — sits above glows, below text content */}
        <ParticleNet />

        {/* Wordmark */}
        <div className="lh-wordmark">You Like That</div>

        {/* Main headline */}
        <div className="lh-center">
          <div className="lh-eyebrow">2024 NFL Season</div>
          <h1 className="lh-headline">
            Fantasy<br />
            <span className="lh-headline-accent">Intelligence.</span>
          </h1>
          <p className="lh-tagline">
            Track players. Build watchlists.<br />Win your league.
          </p>
        </div>

        {/* Scrolling stats ticker */}
        <div className="lh-stats">
          <div className="lh-stats-label">Season Leaders</div>
          <div className="lh-stats-outer">
            <div className="lh-fade-top" aria-hidden="true" />
            <div className="lh-fade-bot" aria-hidden="true" />
            <div className="lh-stats-track">
              {TICKER.map((p, i) => (
                <div key={i} className="lh-stat-row">
                  <span className="lh-stat-rank">#{i % PLAYERS.length + 1}</span>
                  <span className={`pos-badge pos-${p.pos}`}>{p.pos}</span>
                  <span className="lh-stat-name">{p.name}</span>
                  <span className="lh-stat-pts">{p.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="login-form-side">
        <div className={`login-card${shake ? ' shake' : ''}`}>

          {/* Card top accent line rendered via CSS ::before */}
          <div className="login-card-logo">
            Stat<span>Blitz</span>
          </div>

          <h2 className="login-card-title">Sign In</h2>
          <p className="login-card-sub">Enter your credentials to continue</p>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <FloatInput
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              autoFocus
            />

            <FloatInput
              label="Password"
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            >
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw(!showPw)}
                tabIndex={-1}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? '◎' : '●'}
              </button>
            </FloatInput>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading && <span className="login-spinner" aria-hidden="true" />}
              <span>{loading ? 'Signing in…' : 'Sign In'}</span>
            </button>
          </form>

          <p className="auth-footer">
            No account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>

    </div>
  );
};

export default Login;
