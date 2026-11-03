/* ווידג'ט נגישות לאתר.
   הוספה לדף: <script src="a11y-widget.js" defer></script> לפני </body>.
   אין תלויות חיצוניות. ההגדרות נשמרות בדפדפן של המשתמש בלבד. */
(function () {
  'use strict';

  // באפליקציה (נטען דרך AndroidAPI) הווידג'ט מוסתר. באתר רגיל הוא פועל כרגיל.
  if (window.AndroidAPI) return;

  var KEY = 'a11yPrefs';
  var defaults = {
    size: 0, lineSpacing: false, letterSpacing: false, readableFont: false,
    align: 'right', headings: false, links: false, hideImages: false,
    muteMedia: false, contrast: 'none', saturation: 'none', motion: false,
    readingGuide: false, adhd: false, voice: false
  };
  var prefs = loadPrefs();
  var guide = null;

  function loadPrefs() {
    try { return Object.assign({}, defaults, JSON.parse(window.localStorage.getItem(KEY)) || {}); }
    catch (e) { return Object.assign({}, defaults); }
  }
  function savePrefs() {
    try { window.localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {}
  }

  var css = [
    '#a11y-btn{position:fixed;bottom:16px;left:16px;z-index:9998;width:44px;height:44px;border-radius:50%;border:2px solid #8fd0ff;background:#0a1628;color:#8fd0ff;font-size:20px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.4);}',
    '#a11y-btn:focus-visible,#a11y-panel button:focus-visible,#a11y-panel select:focus-visible{outline:3px solid #ffd60a;outline-offset:2px;}',
    '#a11y-panel{position:fixed;bottom:76px;left:16px;z-index:9999;width:300px;max-width:calc(100vw - 32px);max-height:70vh;overflow-y:auto;background:#0a1628;color:#f2f5f9;border:1px solid #1e2c44;border-radius:14px;padding:14px;box-shadow:0 8px 24px rgba(0,0,0,.5);font-family:system-ui,Arial,sans-serif;direction:rtl;display:none;}',
    '#a11y-panel.open{display:block;}',
    '#a11y-panel h2{font-size:1rem;margin:0 0 6px;color:#8fd0ff;}',
    '#a11y-panel h3{font-size:0.85rem;margin:12px 0 4px;color:#c7d2e0;}',
    '#a11y-panel button{display:block;width:100%;min-height:44px;margin:4px 0;padding:8px 12px;border-radius:10px;border:1px solid #2a4a6a;background:#060b15;color:#f2f5f9;font-size:0.92rem;text-align:right;cursor:pointer;}',
    '#a11y-panel button[aria-pressed="true"]{background:#0a6fb5;border-color:#0a6fb5;color:#fff;}',
    '#a11y-panel .row{display:flex;gap:6px;}',
    '#a11y-panel .row button{text-align:center;}',
    '#a11y-guide{position:fixed;left:0;right:0;height:28px;background:rgba(255,214,10,.18);border-top:2px solid #ffd60a;border-bottom:2px solid #ffd60a;pointer-events:none;z-index:9997;display:none;}',
    'html.a11y-size-1 body{zoom:1.15;}',
    'html.a11y-size-2 body{zoom:1.3;}',
    'html.a11y-size-3 body{zoom:1.5;}',
    'html.a11y-line body{line-height:2.1!important;}',
    'html.a11y-letter body{letter-spacing:.12em!important;word-spacing:.2em!important;}',
    'html.a11y-font body, html.a11y-font body *{font-family:Arial,Verdana,sans-serif!important;}',
    'html.a11y-align-left body{text-align:left!important;}',
    'html.a11y-align-center body{text-align:center!important;}',
    'html.a11y-align-right body{text-align:right!important;}',
    'html.a11y-headings h1,html.a11y-headings h2,html.a11y-headings h3{background:#ffd60a;color:#000!important;padding:2px 6px;}',
    'html.a11y-links a{text-decoration:underline!important;text-underline-offset:3px;background:rgba(255,214,10,.2);}',
    'html.a11y-hide-images img,html.a11y-hide-images svg{visibility:hidden!important;}',
    'html.a11y-contrast-high body{filter:contrast(1.3);}',
    'html.a11y-contrast-light{filter:invert(1) hue-rotate(180deg);}',
    'html.a11y-contrast-light img,html.a11y-contrast-light video{filter:invert(1) hue-rotate(180deg);}',
    'html.a11y-sat-high{filter:saturate(2);}',
    'html.a11y-sat-low{filter:saturate(.4);}',
    'html.a11y-sat-gray{filter:grayscale(1);}',
    'html.a11y-adhd{--a11y-adhd:1;}',
    'html.a11y-adhd body{line-height:2!important;max-width:680px;margin:0 auto!important;}',
    'html.a11y-adhd aside,html.a11y-adhd [class*="ad-"],html.a11y-adhd [id*="ad-"],html.a11y-adhd iframe{display:none!important;}',
    'html.a11y-adhd p,html.a11y-adhd li{transition:opacity .2s;}',
    'html.a11y-adhd-focus p:not(.a11y-focus),html.a11y-adhd-focus li:not(.a11y-focus){opacity:.35;}',
    'html.a11y-motion *,html.a11y-motion *::before,html.a11y-motion *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;}'
  ].join('\n');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.id = 'a11y-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'פתח תפריט נגישות');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'a11y-panel');
  btn.textContent = '♿';

  var panel = document.createElement('div');
  panel.id = 'a11y-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'תפריט נגישות');
  panel.innerHTML =
    '<h2>נגישות</h2>' +
    '<h3>גודל טקסט</h3>' +
    '<div class="row"><button type="button" data-act="smaller">טקסט −</button><button type="button" data-act="bigger">טקסט +</button></div>' +
    '<h3>יישור טקסט</h3>' +
    '<div class="row"><button type="button" data-align="right">ימין</button><button type="button" data-align="center">מרכז</button><button type="button" data-align="left">שמאל</button></div>' +
    '<h3>קריאות</h3>' +
    '<button type="button" data-toggle="lineSpacing">רווח בין שורות</button>' +
    '<button type="button" data-toggle="letterSpacing">רווח בין אותיות</button>' +
    '<button type="button" data-toggle="readableFont">גופן קריא</button>' +
    '<button type="button" data-toggle="headings">הדגשת כותרות</button>' +
    '<button type="button" data-toggle="links">הדגשת קישורים</button>' +
    '<button type="button" data-toggle="readingGuide">מדריך קריאה</button>' +
    '<h3>ניגודיות וצבעים</h3>' +
    '<div class="row"><button type="button" data-contrast="high">ניגודיות גבוהה</button><button type="button" data-contrast="light">ניגודיות בהירה</button></div>' +
    '<div class="row"><button type="button" data-sat="high">רוויה גבוהה</button><button type="button" data-sat="low">רוויה נמוכה</button></div>' +
    '<button type="button" data-sat="gray">מונוכרום</button>' +
    '<h3>עזרים נוספים</h3>' +
    '<button type="button" data-toggle="hideImages">הסתר תמונות</button>' +
    '<button type="button" data-toggle="muteMedia">עצירת אודיו וידאו</button>' +
    '<button type="button" data-toggle="motion">עצירת אנימציות</button>' +
    '<h3>פרופיל ADHD וניווט קולי</h3>' +
    '<button type="button" data-toggle="adhd">פרופיל עזר ל-ADHD</button>' +
    '<button type="button" data-toggle="voice">ניווט קולי</button>' +
    '<button type="button" id="a11y-read">הקרא את הבחירה</button>' +
    '<button type="button" id="a11y-reset">איפוס הגדרות</button>' +
    '<button type="button" id="a11y-statement">הצהרת נגישות</button>';

  guide = document.createElement('div');
  guide.id = 'a11y-guide';

  document.body.appendChild(btn);
  document.body.appendChild(panel);
  document.body.appendChild(guide);

  function applyPrefs() {
    var r = document.documentElement.classList;
    [1, 2, 3].forEach(function (n) { r.toggle('a11y-size-' + n, prefs.size === n); });
    r.toggle('a11y-line', prefs.lineSpacing);
    r.toggle('a11y-letter', prefs.letterSpacing);
    r.toggle('a11y-font', prefs.readableFont);
    ['right', 'center', 'left'].forEach(function (a) { r.toggle('a11y-align-' + a, prefs.align === a); });
    r.toggle('a11y-headings', prefs.headings);
    r.toggle('a11y-links', prefs.links);
    r.toggle('a11y-hide-images', prefs.hideImages);
    r.toggle('a11y-contrast-high', prefs.contrast === 'high');
    r.toggle('a11y-contrast-light', prefs.contrast === 'light');
    r.toggle('a11y-sat-high', prefs.saturation === 'high');
    r.toggle('a11y-sat-low', prefs.saturation === 'low');
    r.toggle('a11y-sat-gray', prefs.saturation === 'gray');
    r.toggle('a11y-motion', prefs.motion);
    r.toggle('a11y-adhd', prefs.adhd);
    if (!prefs.adhd) r.remove('a11y-adhd-focus');
    if (!prefs.voice) stopVoice();
    guide.style.display = prefs.readingGuide ? 'block' : 'none';
    if (prefs.muteMedia) document.querySelectorAll('audio,video').forEach(function (m) { m.pause(); m.muted = true; });
    refreshPressed();
  }

  function refreshPressed() {
    panel.querySelectorAll('[data-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', prefs[b.dataset.toggle] ? 'true' : 'false');
    });
    panel.querySelectorAll('[data-align]').forEach(function (b) {
      b.setAttribute('aria-pressed', prefs.align === b.dataset.align ? 'true' : 'false');
    });
    panel.querySelectorAll('[data-contrast]').forEach(function (b) {
      b.setAttribute('aria-pressed', prefs.contrast === b.dataset.contrast ? 'true' : 'false');
    });
    panel.querySelectorAll('[data-sat]').forEach(function (b) {
      b.setAttribute('aria-pressed', prefs.saturation === b.dataset.sat ? 'true' : 'false');
    });
  }

  function togglePanel() {
    var open = !panel.classList.contains('open');
    panel.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) panel.querySelector('button').focus();
  }

  btn.addEventListener('click', function (e) { e.stopPropagation(); togglePanel(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) { togglePanel(); btn.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn) togglePanel();
  });
  document.addEventListener('mousemove', moveGuide);
  document.addEventListener('touchmove', function (e) { if (e.touches[0]) moveGuide(e.touches[0]); }, { passive: true });
  function moveGuide(e) { guide.style.top = (e.clientY - 14) + 'px'; }

  panel.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.act === 'bigger') prefs.size = Math.min(3, prefs.size + 1);
    else if (b.dataset.act === 'smaller') prefs.size = Math.max(0, prefs.size - 1);
    else if (b.dataset.align) prefs.align = b.dataset.align;
    else if (b.dataset.toggle) prefs[b.dataset.toggle] = !prefs[b.dataset.toggle];
    else if (b.dataset.contrast) prefs.contrast = prefs.contrast === b.dataset.contrast ? 'none' : b.dataset.contrast;
    else if (b.dataset.sat) prefs.saturation = prefs.saturation === b.dataset.sat ? 'none' : b.dataset.sat;
    else if (b.id === 'a11y-reset') prefs = Object.assign({}, defaults);
    else if (b.id === 'a11y-statement') { window.location.href = 'accessibility.html'; return; }
    else if (b.id === 'a11y-read') { readSelection(); return; }
    else return;
    savePrefs();
    applyPrefs();
    if (b.dataset.toggle === 'voice') { if (prefs.voice) startVoice(); }
  });

  function readSelection() {
    var text = (window.getSelection && window.getSelection().toString().trim()) || '';
    if (!text) text = 'בחר טקסט בדף ולחץ שוב על הקראה.';
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'he-IL';
    window.speechSynthesis.speak(u);
  }

  // ---- פרופיל ADHD: מדגיש את הפסקה שהעכבר או האצבע עליה ----
  function focusBlock(e) {
    if (!prefs.adhd) return;
    var el = e.target.closest && e.target.closest('p,li');
    document.querySelectorAll('.a11y-focus').forEach(function (x) { x.classList.remove('a11y-focus'); });
    if (el) el.classList.add('a11y-focus');
    document.documentElement.classList.toggle('a11y-adhd-focus', !!el);
  }
  document.addEventListener('mouseover', focusBlock);
  document.addEventListener('click', focusBlock);

  // ---- ניווט קולי: פקודות בעברית דרך זיהוי דיבור של הדפדפן ----
  var rec = null;
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function clickId(id) { var el = document.getElementById(id); if (el) el.click(); }
  function runCommand(text) {
    var t = text.replace(/\s+/g, ' ').trim();
    if (/חיפוש|חפש|מספר רכב/.test(t)) { var i = document.getElementById('plateInput'); if (i) i.focus(); return 'חיפוש'; }
    if (/תפריט/.test(t)) { clickId('menuToggleBtn'); return 'תפריט'; }
    if (/דף הבית|בית/.test(t)) { clickId('homeBtn'); return 'דף הבית'; }
    if (/חזרה|אחורה/.test(t)) { clickId('backBtn'); return 'חזרה'; }
    if (/מועדפ/.test(t)) { clickId('favBtn'); return 'מועדפים'; }
    if (/גדול|הגדל/.test(t)) { prefs.size = Math.min(3, prefs.size + 1); savePrefs(); applyPrefs(); return 'הגדלה'; }
    if (/קטן|הקטן/.test(t)) { prefs.size = Math.max(0, prefs.size - 1); savePrefs(); applyPrefs(); return 'הקטנה'; }
    if (/הקרא/.test(t)) { readSelection(); return 'הקראה'; }
    if (/עצור|הפסק/.test(t)) { window.speechSynthesis && window.speechSynthesis.cancel(); return 'עצירה'; }
    return null;
  }
  function startVoice() {
    if (!SR || rec) return;
    rec = new SR();
    rec.lang = 'he-IL';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = function (ev) {
      var last = ev.results[ev.results.length - 1][0].transcript;
      var done = runCommand(last);
      showVoiceStatus(done ? 'בוצע: ' + done : 'לא זוהתה פקודה: ' + last);
    };
    rec.onend = function () { if (prefs.voice && rec) { try { rec.start(); } catch (e) {} } };
    rec.onerror = function (ev) { showVoiceStatus('שגיאה בזיהוי: ' + ev.error); };
    try { rec.start(); showVoiceStatus('ניווט קולי פועל. אמור למשל: חיפוש, תפריט, הגדל'); } catch (e) {}
  }
  function stopVoice() {
    if (!rec) return;
    var r = rec; rec = null;
    try { r.onend = null; r.stop(); } catch (e) {}
    showVoiceStatus('');
  }
  function showVoiceStatus(msg) {
    var box = document.getElementById('a11y-voice-status');
    if (!box) {
      box = document.createElement('div');
      box.id = 'a11y-voice-status';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      box.style.cssText = 'position:fixed;bottom:16px;right:16px;max-width:60vw;background:#0a1628;color:#f2f5f9;border:1px solid #1e2c44;border-radius:10px;padding:8px 12px;font-size:0.85rem;z-index:9999;direction:rtl;';
      document.body.appendChild(box);
    }
    box.textContent = msg;
    box.style.display = msg ? 'block' : 'none';
  }

  applyPrefs();
})();
