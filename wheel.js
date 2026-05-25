/* Sagan Reactivation — Spin Wheel + Contact Form */
(function() {
  const PERKS = [
    { name: 'Free Hire', desc: 'We cover our placement fee for your next hire. No cost to you.' },
    { name: 'Extended Guarantee', desc: '60-day replacement guarantee. Double the standard 30-day.' },
    { name: 'Priority Queue', desc: 'Jump to the front of our candidate pipeline. First pick on new matches.' },
    { name: 'Free Hire', desc: 'We cover our placement fee for your next hire. No cost to you.' },
    { name: 'Extended Guarantee', desc: '60-day replacement guarantee. Double the standard 30-day.' },
    { name: 'Priority Queue', desc: 'Jump to the front of our candidate pipeline. First pick on new matches.' }
  ];

  const COLORS = ['#c4293c', '#1a2744', '#e8354a', '#243358', '#d44558', '#2d3f66'];
  const STORAGE_KEY = 'sagan_spin_' + document.body.dataset.company;

  let canvas, ctx, spinning = false, currentAngle = 0;

  function init() {
    canvas = document.getElementById('wheelCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 300;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      showResult(JSON.parse(saved));
      disableBtn();
    }

    drawWheel(0);

    const btn = document.getElementById('spinBtn');
    if (btn) btn.addEventListener('click', spin);

    const form = document.getElementById('perkContactForm');
    if (form) form.addEventListener('submit', handleFormSubmit);
  }

  function drawWheel(angle) {
    const cx = 150, cy = 150, r = 140;
    const sliceAngle = (2 * Math.PI) / PERKS.length;

    ctx.clearRect(0, 0, 300, 300);

    PERKS.forEach(function(perk, i) {
      const start = angle + i * sliceAngle;
      const end = start + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = COLORS[i];
      ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + sliceAngle / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '600 11px Inter, sans-serif';

      var words = perk.name.split(' ');
      var line = '';
      var lines = [];
      words.forEach(function(w) {
        var test = line + (line ? ' ' : '') + w;
        if (ctx.measureText(test).width > 70) {
          lines.push(line);
          line = w;
        } else {
          line = test;
        }
      });
      lines.push(line);

      var startY = r * 0.6 - (lines.length - 1) * 7;
      lines.forEach(function(l, li) {
        ctx.fillText(l, 0, startY + li * 14);
      });

      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#f8f5f0';
    ctx.fill();
  }

  function spin() {
    if (spinning) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    spinning = true;
    var btn = document.getElementById('spinBtn');
    btn.disabled = true;

    var winIndex = Math.floor(Math.random() * PERKS.length);
    var sliceAngle = (2 * Math.PI) / PERKS.length;
    var targetAngle = (2 * Math.PI * 5) + ((2 * Math.PI) - (winIndex * sliceAngle + sliceAngle / 2)) - (Math.PI / 2);

    var startTime = null;
    var duration = 4000;
    var startAngle = currentAngle;

    function easeOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(ts) {
      if (!startTime) startTime = ts;
      var elapsed = ts - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = easeOut(progress);

      currentAngle = startAngle + targetAngle * eased;
      drawWheel(currentAngle);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        spinning = false;
        var perk = PERKS[winIndex];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(perk));
        showResult(perk);
      }
    }

    requestAnimationFrame(animate);
  }

  function showResult(perk) {
    var el = document.getElementById('perkResult');
    if (!el) return;
    el.classList.add('visible');
    var title = el.querySelector('.perk-result-title');
    var desc = el.querySelector('.perk-result-desc');
    if (title) title.textContent = 'You landed on: ' + perk.name + '!';
    if (desc) desc.textContent = perk.desc;

    var hiddenPerk = document.getElementById('perkValue');
    if (hiddenPerk) hiddenPerk.value = perk.name;
  }

  function disableBtn() {
    var btn = document.getElementById('spinBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Already spun';
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    var form = e.target;
    var data = new FormData(form);

    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    }).then(function(r) {
      if (r.ok) {
        form.style.display = 'none';
        var success = document.getElementById('formSuccess');
        if (success) success.classList.add('visible');
      }
    }).catch(function() {
      window.location.href = 'mailto:jesus.p@getsagan.com?subject=Reactivation%20-%20' +
        encodeURIComponent(document.body.dataset.company);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
