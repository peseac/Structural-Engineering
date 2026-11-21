(function () {
  'use strict';

  var FIELDS = ['cls1', 't1', 'cls2', 't2', 'h', 'd', 'steel', 'n', 'm', 'dw', 'a1', 'a2', 'a3', 'a4', 'Ed', 'ld', 'sc'];
  var NUM = ['t1', 't2', 'd', 'n', 'm', 'a1', 'a2', 'a3', 'a4', 'Ed', 'h'];
  // worked example: M20 bolts 6.8, outer 2 x 60 mm, middle 80 mm, 2 rows of 4 bolts
  var EXAMPLE = { cls1: 'C24', t1: 60, cls2: 'C24', t2: 80, h: 200, d: 20, steel: '6.8', n: 4, m: 2, dw: '',
                  a1: 100, a2: 80, a3: 140, a4: 60, Ed: 87.6, ld: 'long', sc: 'sc1' };
  var KEY = 'enPrenBolted2to1v2';

  function $(id) { return document.getElementById(id); }

  function fillSelect(id, pairs) {
    $(id).innerHTML = pairs.map(function (p) { return '<option value="' + p[0] + '">' + p[1] + '</option>'; }).join('');
  }
  fillSelect('cls1', Object.keys(Data.rho).map(function (k) { return [k, k]; }));
  fillSelect('cls2', Object.keys(Data.rho).map(function (k) { return [k, k]; }));
  fillSelect('steel', Object.keys(Data.steel).map(function (k) { return [k, k + '  (fu = ' + Data.steel[k] + ' N/mm²)']; }));
  fillSelect('ld', Object.keys(Data.ldName).map(function (k) { return [k, Data.ldName[k]]; }));
  fillSelect('sc', [['sc1', 'class 1 or 2'], ['sc3', 'class 3']]);

  /* ---- state ---- */
  function getValues() { var v = {}; FIELDS.forEach(function (k) { v[k] = $(k).value; }); return v; }
  function setValues(v) { FIELDS.forEach(function (k) { $(k).value = (v && v[k] !== undefined) ? v[k] : EXAMPLE[k]; }); }
  function clearValues() {
    FIELDS.forEach(function (k) { if ($(k).tagName === 'INPUT') $(k).value = ''; });
    $('t1').focus();
  }
  function readInputs() {
    var o = getValues();
    NUM.forEach(function (k) { o[k] = parseFloat(o[k]); });
    o.dw = parseFloat(o.dw) || 0;
    return o;
  }
  function valid(o) {
    return NUM.every(function (k) { return isFinite(o[k]) && o[k] >= 0; }) &&
           o.d > 0 && o.t1 > 0 && o.t2 > 0 && o.n >= 1 && o.m >= 1 && o.h > 0 && o.dw >= 0;
  }

  /* ---- html of the calculation steps ---- */
  function itemHtml(it) {
    switch (it.k) {
      case 'eq':   return '<div class="eq">\\[' + it.t + '\\]</div>';
      case 'note': return '<div class="note">' + it.t + '</div>';
      case 'txt':  return '<div class="sub">' + it.t + '</div>';
      case 'chk':  return '<div class="chk ' + (it.ok ? 'ok' : 'bad') + '"><span class="m">\\(' + it.t + '\\)</span>' +
                          (it.label ? '<span class="lab">' + it.label + '</span>' : '') + '<span class="mark">' + (it.ok ? '✓' : '✗') + '</span></div>';
    }
    return '';
  }
  function stepHtml(s) {
    var h = '<div class="step"><div class="sh"><b>' + s.title + '</b><span class="cl">' + (s.clause || '') + '</span></div>';
    h += s.items.map(itemHtml).join('');
    if (s.res) h += '<div class="res ' + (s.status || '') + '">' + s.res + '</div>';
    return h + '</div>';
  }

  var offlineCopy = false;
  function render() {
    var o = readInputs();
    if (!valid(o)) {
      var msg = '<p class="sub">Enter positive numbers in all fields, or load the worked example.</p>';
      $('outEN').innerHTML = $('outPREN').innerHTML = msg;
      $('vFront').innerHTML = $('vSide').innerHTML = $('vPlan').innerHTML = '';
      $('summary').innerHTML = '';
      $('bannerPren').style.display = 'none';
      return;
    }
    var en = EN.run(o), pr = PrEN.run(o);
    Eq.render($('outEN'), en.steps.map(stepHtml).join(''));
    Eq.render($('outPREN'), pr.steps.map(stepHtml).join(''));
    $('vFront').innerHTML = Views.front(o);
    $('vSide').innerHTML = Views.side(o);
    $('vPlan').innerHTML = Views.plan(o);

    $('bannerPren').style.display = '';
    $('bannerPren').innerHTML = '<b>Basis.</b> Rules as in the draft prEN 1995-1-1. Clause numbers are shown where they are known, otherwise “clause no. to be added”. Check every step against the current text of the standard.';

    var ok = function (r) { return r.util <= 1 && r.spOk ? '  ✓' : '  ✗'; };
    var diff = (pr.FRd / en.FRd - 1) * 100;
    $('summary').innerHTML =
      '<div class="kpi en"><small>EN 1995-1-1: bolt group FRd</small><b>' + f(en.FRd / 1000, 1) + ' kN</b></div>' +
      '<div class="kpi en"><small>EN 1995-1-1: utilisation Ed / FRd</small><b>' + f(en.util, 2) + ok(en) + '</b></div>' +
      '<div class="kpi pren"><small>prEN 1995-1-1: bolt group NRd</small><b>' + f(pr.FRd / 1000, 1) + ' kN</b></div>' +
      '<div class="kpi pren"><small>prEN 1995-1-1: governing utilisation <i>(' + pr.governing + ')</i></small><b>' + f(pr.util, 2) + ok(pr) + '</b></div>' +
      '<div class="kpi"><small>Bolt group resistance, prEN vs EN</small><b>' + (diff >= 0 ? '+' : '') + f(diff, 1) + ' %</b></div>';

    if (!offlineCopy) { try { localStorage.setItem(KEY, JSON.stringify(getValues())); } catch (e) {} }
  }

  function mjStatus() {
    $('mjstatus').textContent = Eq.state === 'failed'
      ? 'The equation library (MathJax) could not be loaded, so the equations are shown as plain text.' : '';
  }

  /* ---- start ---- */
  var saved = null;
  try { saved = JSON.parse($('saved').textContent); } catch (e) {}
  if (saved && saved.values) { offlineCopy = true; document.body.classList.add('offline'); setValues(saved.values); }
  else {
    var ls = null;
    try { ls = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    setValues(ls);
  }

  FIELDS.forEach(function (k) {
    $(k).addEventListener('input', render);
    $(k).addEventListener('change', render);
  });
  $('btnExample').addEventListener('click', function () { setValues(null); render(); });
  $('btnClear').addEventListener('click', function () { clearValues(); render(); });
  $('btnPrint').addEventListener('click', function () { window.print(); });
  $('btnSave').addEventListener('click', function () {
    var btn = $('btnSave'), msg = $('saveMsg'), v = getValues();
    btn.disabled = true; msg.className = 'cap'; msg.textContent = 'Preparing the offline copy…';
    Offline.save({ values: v }, 'bolted-2to1-tension_M' + (v.d || 'x') + '_' + (v.n || 'x') + 'x' + (v.m || 'x') + '.html').then(function (kb) {
      msg.textContent = 'Offline copy downloaded (' + kb + ' kB). It contains everything, including the equations, and the current values.';
    }).catch(function (e) {
      msg.className = 'cap err';
      msg.textContent = 'The offline copy could not be created. Browsers do not let a page read its own files when it is opened from a local folder (file://). Open the page from GitHub Pages or another web server and try again.';
      console.warn(e);
    }).then(function () { btn.disabled = false; });
  });
  Eq.onChange(function () { mjStatus(); render(); });

  render();
})();
