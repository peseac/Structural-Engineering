/* Typesets the equations with MathJax (SVG output).
   MathJax is looked for in this order: the copy that ships with the example
   (../../vendor/mathjax/tex-svg.js), then a CDN. If neither can be loaded, the equations are shown
   as plain text. The MathJax options are set in index.html (window.MathJax). */
'use strict';

var Eq = (function () {
  var CAND = ['../../vendor/mathjax/tex-svg.js', 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js'];
  var state = 'loading', listeners = [], chain = Promise.resolve(), tokens = {};

  function setState(s) { state = s; listeners.forEach(function (cb) { cb(s); }); }
  function onReady() {
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(function () { setState('ok'); }, function () { setState('failed'); });
    else setState('failed');
  }
  function load(k) {
    if (k >= CAND.length) { setState('failed'); return; }
    var s = document.createElement('script');
    s.src = CAND[k]; s.async = true;
    s.onload = onReady;
    s.onerror = function () { s.remove(); load(k + 1); };
    document.head.appendChild(s);
  }
  // MathJax already present (offline copy with the library inlined)?
  if (window.MathJax && MathJax.startup && MathJax.startup.promise) onReady(); else load(0);

  /* ---- plain-text fallback ---- */
  function plain(t) {
    var s = t, i;
    s = s.replace(/\\\{/g, '(').replace(/\\\}/g, ')');
    for (i = 0; i < 8; i++) {
      s = s.replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, '$1')
           .replace(/([_^])\{([^{}]*)\}/g, '$1$2')
           .replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
           .replace(/\\sqrt\[4\]\{([^{}]*)\}/g, '($1)^0.25').replace(/\\sqrt\{([^{}]*)\}/g, '√($1)');
    }
    var greek = { alpha: 'α', beta: 'β', gamma: 'γ', rho: 'ρ', sigma: 'σ', pi: 'π' };
    return s.replace(/\\begin\{aligned\}|\\end\{aligned\}/g, '').replace(/\\\\(\[[^\]]*\])?/g, '\n').replace(/&/g, '')
            .replace(/\\cdot/g, '·').replace(/\\le(q)?(?![a-z])/g, '≤').replace(/\\ge(q)?(?![a-z])/g, '≥').replace(/\\lt(?![a-z])/g, '<')
            .replace(/\\(alpha|beta|gamma|rho|sigma|pi)(?![a-z])/g, function (m, g) { return greek[g]; })
            .replace(/\\left|\\right/g, '').replace(/\\(min|max|sin|cos)(?![a-z])/g, '$1').replace(/\\(?:qquad|quad)/g, '   ').replace(/\\[,;:! ]/g, ' ')
            .replace(/[{}]/g, '').replace(/\s+\n/g, '\n').trim();
  }
  function esc(x) { return x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fallback(html) {
    return html.replace(/\\\[([\s\S]*?)\\\]/g, function (m, t) { return '<pre class="plain">' + esc(plain(t)) + '</pre>'; })
               .replace(/\\\(([\s\S]*?)\\\)/g, function (m, t) { return '<span class="plain">' + esc(plain(t)) + '</span>'; });
  }

  /* Puts html into el. With MathJax the new content is typeset off-screen first, so the old
     content stays visible until the new equations are ready (no flicker while typing). */
  function render(el, html) {
    var id = el.id, tok = (tokens[id] = (tokens[id] || 0) + 1);
    if (state === 'failed') { el.innerHTML = fallback(html); return Promise.resolve(); }
    if (state !== 'ok') { el.innerHTML = html; return Promise.resolve(); }
    var stage = document.createElement('div');
    stage.style.cssText = 'position:absolute;left:-99999px;top:0;width:' + Math.max(300, el.clientWidth) + 'px;visibility:hidden';
    document.body.appendChild(stage);
    stage.innerHTML = html;
    chain = chain.then(function () { return MathJax.typesetPromise([stage]); }).then(function () {
      if (tokens[id] === tok) {
        try { MathJax.typesetClear([el]); } catch (e) {}
        el.replaceChildren.apply(el, Array.prototype.slice.call(stage.childNodes));
      }
      try { MathJax.typesetClear([stage]); } catch (e) {}
      stage.remove();
    }).catch(function (e) { console.warn(e); stage.remove(); el.innerHTML = fallback(html); });
    return chain;
  }

  return {
    CAND: CAND, render: render, get state() { return state; },
    onChange: function (cb) { listeners.push(cb); },
    urls: function () { return CAND.map(function (u) { return new URL(u, location.href).href; }); }
  };
})();
