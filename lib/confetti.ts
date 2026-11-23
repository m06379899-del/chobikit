/**
 * Tiny dependency-free canvas confetti burst. Automatically disabled when
 * the user prefers reduced motion.
 */
export function fireConfetti(): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:60";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  const g = ctx;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  g.scale(dpr, dpr);

  const colors = ["#3b82f6", "#2dd4bf", "#fb923c", "#c084fc", "#4ade80", "#fbbf24"];
  const w = window.innerWidth;
  const h = window.innerHeight;
  const rand = (min: number, max: number) => min + Math.random() * (max - min);
  const particles = Array.from({ length: 120 }, () => ({
    x: w / 2 + rand(-120, 120),
    y: h * 0.35 + rand(-40, 40),
    vx: rand(-6, 6),
    vy: rand(-14, -5),
    size: rand(4, 9),
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: rand(0, Math.PI * 2),
    spin: rand(-0.2, 0.2),
  }));

  const started = performance.now();
  const DURATION = 1600;

  function frame(now: number) {
    const elapsed = now - started;
    g.clearRect(0, 0, w, h);
    const fade = 1 - elapsed / DURATION;
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;
      p.rotation += p.spin;
      g.save();
      g.globalAlpha = Math.max(0, fade);
      g.translate(p.x, p.y);
      g.rotate(p.rotation);
      g.fillStyle = p.color;
      g.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      g.restore();
    }
    if (elapsed < DURATION) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(frame);
}
