// DuoStreak Engine: Badges, Countdown Timer & Canvas Fireworks for Yavuz & Nisa

const STREAK_BADGES = [
  { days: 30, icon: '🥉', name: 'İlk Ay', desc: 'İlk 30 günlük güzel başlangıç!' },
  { days: 100, icon: '💍', name: 'Yüzük & Sadakat', desc: '100 günlük kesintisiz aşk ve bağ!' },
  { days: 200, icon: '💎', name: 'Saf Elmas', desc: '200 gündür parıldayan tertemiz sevgi!' },
  { days: 285, icon: '🔥', name: 'Efsanevi 285', desc: '285 günlük muazzam kesintisiz seri!' },
  { days: 300, icon: '👑', name: 'Sonsuz Kalp', desc: '300 gün devrildi, zirveye doğru!' },
  { days: 365, icon: '🪐', name: '1 Tam Yıl', desc: '365 gün! 1 yıl boyunca her an beraber!' },
  { days: 500, icon: '✨', name: 'Masalsı Aşk', desc: '500 günlük destansı birliktelik!' },
  { days: 1000, icon: '💫', name: 'Ömürlük', desc: '1000 gün! Bir ömür boyu el ele!' }
];

class StreakEngine {
  constructor() {
    this.timerInterval = null;
  }

  getBadges() {
    return STREAK_BADGES;
  }

  getCurrentBadge(streakCount) {
    let current = null;
    for (const b of STREAK_BADGES) {
      if (streakCount >= b.days) {
        current = b;
      }
    }
    return current;
  }

  startCountdownTimer(onTick) {
    if (this.timerInterval) clearInterval(this.timerInterval);

    const update = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const diff = endOfDay.getTime() - now.getTime();
      if (diff <= 0) {
        if (onTick) onTick({ formatted: '00:00:00', totalSeconds: 0, isUrgent: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      const isUrgent = hours < 4;

      if (onTick) {
        onTick({ formatted, totalSeconds: Math.floor(diff / 1000), isUrgent });
      }
    };

    update();
    this.timerInterval = setInterval(update, 1000);
  }

  renderBadgesGrid(containerEl, currentStreak) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    STREAK_BADGES.forEach(badge => {
      const isUnlocked = currentStreak >= badge.days;
      const card = document.createElement('div');
      card.className = `badge-card ${isUnlocked ? 'unlocked' : ''}`;
      card.innerHTML = `
        <div class="badge-card-icon">${badge.icon}</div>
        <div class="badge-card-info">
          <span class="badge-card-name">${badge.name}</span>
          <span class="badge-card-req">${isUnlocked ? 'Kazanıldı ✓' : `${badge.days} Gün Hedefi`}</span>
        </div>
      `;
      containerEl.appendChild(card);
    });
  }

  launchCelebrationParticles(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#ff4081', '#ff4500', '#ff8c00', '#ffd700', '#ff66aa', '#ffffff'];

    for (let i = 0; i < 140; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * (Math.random() * 16 + 4),
        vy: (Math.random() - 0.5) * (Math.random() * 16 + 4),
        radius: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.015 + 0.008,
        gravity: 0.12
      });
    }

    let animId = null;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let aliveCount = 0;

      particles.forEach(p => {
        if (p.alpha > 0) {
          aliveCount++;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.alpha -= p.decay;

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      if (aliveCount > 0) {
        animId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animId);
      }
    };

    render();
  }
}

window.streakEngine = new StreakEngine();
