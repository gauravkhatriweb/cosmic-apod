/**
 * Animated star field canvas.
 *
 * Draws a subtle twinkling star field behind the app.
 * Automatically resizes with the window.
 * Respects prefers-reduced-motion.
 */

export function initStars() {
  const canvas = document.getElementById('star-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let stars = [];
  let animationId;
  let width, height;

  // Detect reduced motion
  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    width  = canvas.width  = window.innerWidth;
    height = canvas.height = window.innerHeight;
    createStars();
  }

  function createStars() {
    const count = Math.min(Math.floor((width * height) / 6000), 250);
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.4 + 0.3,
        alpha: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 0.003 + 0.001,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);

    for (const star of stars) {
      const twinkle = prefersReducedMotion
        ? star.alpha
        : star.alpha + Math.sin(time * star.speed + star.phase) * 0.25;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 210, 255, ${Math.max(0, Math.min(1, twinkle))})`;
      ctx.fill();
    }

    animationId = requestAnimationFrame(draw);
  }

  // If reduced motion, draw once and stop
  if (prefersReducedMotion) {
    resize();
    draw(0);
    cancelAnimationFrame(animationId);
  } else {
    resize();
    draw(0);
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animationId);
    resize();
    if (!prefersReducedMotion) draw(performance.now());
  });
}
