/* Sagan Reactivation — Spin Wheel + Contact Form */
(function() {
  const PERKS = [
    { name: 'Free Hire', desc: 'A free Talent Agent placement. Pre-vetted, video-screened, full candidate package included. No placement fee.' },
    { name: 'Extended Guarantee', desc: '60-day replacement guarantee. Double the standard 30-day window.' },
    { name: 'Free Hire + Extended Guarantee', desc: 'Both perks combined. A free Talent Agent placement with a 60-day replacement guarantee included.' },
    { name: 'Free Hire', desc: 'A free Talent Agent placement. Pre-vetted, video-screened, full candidate package included. No placement fee.' },
    { name: 'Extended Guarantee', desc: '60-day replacement guarantee. Double the standard 30-day window.' },
    { name: 'Free Hire + Extended Guarantee', desc: 'Both perks combined. A free Talent Agent placement with a 60-day replacement guarantee included.' }
  ];

  const COLORS = ['#c4293c', '#1a2744', '#e8354a', '#243358', '#d44558', '#2d3f66'];
  const COMPANY = document.body.dataset.company || 'unknown';
  const STORAGE_KEY = 'sagan_spin_' + COMPANY;
  const COOKIE_KEY = 'sagan_spun_' + COMPANY;

  let canvas, ctx, spinning = false, currentAngle = 0, hasSpun = false;

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function alreadySpun() {
    return hasSpun
      || localStorage.getItem(STORAGE_KEY)
      || sessionStorage.getItem(STORAGE_KEY)
      || getCookie(COOKIE_KEY);
  }

  function lockSpin(perk) {
    hasSpun = true;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(perk)); } catch(e) {}
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch(e) {}
    setCookie(COOKIE_KEY, '1', 90);
  }

  function init() {
    canvas = document.getElementById('wheelCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 300;

    var saved = alreadySpun();
    if (saved) {
      var perkData = null;
      try { perkData = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch(e) {}
      if (perkData) {
        showResult(perkData);
      }
      disableBtn();
    }

    drawWheel(0);

    var btn = document.getElementById('spinBtn');
    if (btn) btn.addEventListener('click', spin);

    var form = document.getElementById('perkContactForm');
    if (form) form.addEventListener('submit', handleFormSubmit);
  }

  function drawWheel(angle) {
    var cx = 150, cy = 150, r = 140;
    var sliceAngle = (2 * Math.PI) / PERKS.length;

    ctx.clearRect(0, 0, 300, 300);

    PERKS.forEach(function(perk, i) {
      var start = angle + i * sliceAngle;
      var end = start + sliceAngle;

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
    if (spinning || alreadySpun()) return;

    spinning = true;
    hasSpun = true;
    var btn = document.getElementById('spinBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Spinning...'; }

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
        lockSpin(perk);
        showResult(perk);
        disableBtn();
        notifySpin(perk);
      }
    }

    requestAnimationFrame(animate);
  }

  function notifySpin(perk) {
    var data = new FormData();
    data.append('_subject', 'Wheel spin: ' + perk.name + ' — ' + COMPANY);
    data.append('company', COMPANY);
    data.append('perk', perk.name);
    data.append('type', 'spin-notification');
    data.append('timestamp', new Date().toISOString());
    fetch('https://formspree.io/f/xpwrbjqk', {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    }).catch(function() {});
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

    updateMailtoLinks(perk);
  }

  function updateMailtoLinks(perk) {
    var links = document.querySelectorAll('a[href^="mailto:jesus.p@getsagan.com"]');
    var perkLine = encodeURIComponent('\n\nPerk I landed on: ' + perk.name + '\n(' + perk.desc + ')');
    links.forEach(function(link) {
      var href = link.getAttribute('href');
      var bodyMatch = href.match(/body=([^&]*)/);
      if (bodyMatch) {
        var existingBody = bodyMatch[1];
        var newBody = existingBody + perkLine;
        link.setAttribute('href', href.replace(/body=[^&]*/, 'body=' + newBody));
      } else {
        link.setAttribute('href', href + '&body=' + perkLine);
      }
    });
  }

  function disableBtn() {
    var btn = document.getElementById('spinBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Already spun';
      btn.style.opacity = '0.4';
      btn.style.cursor = 'not-allowed';
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
        encodeURIComponent(COMPANY);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
