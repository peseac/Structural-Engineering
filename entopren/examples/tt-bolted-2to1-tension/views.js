/* Schematic views of the connection: front (elevation), side (section through the joint), plan.
   Two outer members continue to the LEFT, the middle member continues to the RIGHT.
   Everything is drawn from the input values, in mm. */
'use strict';

var Views = (function () {
  var C = { outer: '#ead2a6', mid: '#d9ad6f', grain: '#9a6a34', edge: '#5a4128', steel: '#9aa6b2', steelD: '#4f5a65' };

  function geo(o) {
    var n = o.n, m = o.m, d = o.d, G = {};
    G.Lj = 2 * o.a3 + (n - 1) * o.a1;                 // length of the overlap (joint)
    G.E = Math.max(0.35 * G.Lj, 100);                 // length shown outside the joint
    G.xMin = -G.E; G.xMax = G.Lj + G.E;
    G.W = 2 * o.a4 + (m - 1) * o.a2;
    G.H = Math.max(o.h || G.W, G.W);
    G.dw = o.dw > 0 ? o.dw : 3.4 * d;
    G.tw = Math.max(3, 0.2 * d);                      // washer thickness
    G.hd = 0.65 * d;                                  // head / nut height
    G.R = 0.9 * d;                                    // hexagon circumradius
    G.T = 2 * o.t1 + o.t2;
    G.xs = []; G.ys = [];
    for (var i = 0; i < n; i++) G.xs.push(o.a3 + i * o.a1);
    for (var j = 0; j < m; j++) G.ys.push(G.H / 2 + (j - (m - 1) / 2) * o.a2);
    G.fs = Math.max(G.xMax - G.xMin, G.H) / 52;       // base font size
    return G;
  }

  function defs(id) {
    return '<defs>' +
      '<pattern id="go' + id + '" patternUnits="userSpaceOnUse" width="60" height="14"><rect width="60" height="14" fill="' + C.outer + '"/>' +
      '<path d="M0 3 C15 1 30 5 60 3 M0 10 C20 12 40 8 60 10" fill="none" stroke="' + C.grain + '" stroke-width="0.9" opacity=".55"/></pattern>' +
      '<pattern id="gm' + id + '" patternUnits="userSpaceOnUse" width="60" height="14"><rect width="60" height="14" fill="' + C.mid + '"/>' +
      '<path d="M0 3 C15 1 30 5 60 3 M0 10 C20 12 40 8 60 10" fill="none" stroke="' + C.grain + '" stroke-width="0.9" opacity=".6"/></pattern>' +
      '<pattern id="eo' + id + '" patternUnits="userSpaceOnUse" width="44" height="44"><rect width="44" height="44" fill="' + C.outer + '"/>' +
      '<path d="M4 40 A36 36 0 0 1 40 4 M12 40 A28 28 0 0 1 40 12 M20 40 A20 20 0 0 1 40 20" fill="none" stroke="' + C.grain + '" stroke-width="0.9" opacity=".55"/></pattern>' +
      '<pattern id="em' + id + '" patternUnits="userSpaceOnUse" width="44" height="44"><rect width="44" height="44" fill="' + C.mid + '"/>' +
      '<path d="M4 40 A36 36 0 0 1 40 4 M12 40 A28 28 0 0 1 40 12 M20 40 A20 20 0 0 1 40 20" fill="none" stroke="' + C.grain + '" stroke-width="0.9" opacity=".6"/></pattern>' +
      '</defs>';
  }

  function r(x) { return Math.round(x * 100) / 100; }
  function rect(x, y, w, h, fill, extra) {
    return '<rect x="' + r(x) + '" y="' + r(y) + '" width="' + r(w) + '" height="' + r(h) + '" fill="' + fill + '"' + (extra || '') + '/>';
  }
  function txt(x, y, s, fs, anchor, extra) {
    return '<text x="' + r(x) + '" y="' + r(y) + '" font-size="' + r(fs) + '" text-anchor="' + (anchor || 'middle') + '" fill="currentColor"' + (extra || '') + '>' + s + '</text>';
  }
  function dimH(x1, x2, y, label, fs) {
    var t = fs * 0.4, sw = fs * 0.07;
    return '<g stroke="currentColor" stroke-width="' + sw + '" fill="none"><line x1="' + r(x1) + '" y1="' + r(y) + '" x2="' + r(x2) + '" y2="' + r(y) + '"/>' +
      '<line x1="' + r(x1) + '" y1="' + r(y - t) + '" x2="' + r(x1) + '" y2="' + r(y + t) + '"/><line x1="' + r(x2) + '" y1="' + r(y - t) + '" x2="' + r(x2) + '" y2="' + r(y + t) + '"/></g>' +
      txt((x1 + x2) / 2, y - fs * 0.45, label, fs);
  }
  function dimV(y1, y2, x, label, fs) {
    var t = fs * 0.4, sw = fs * 0.07;
    return '<g stroke="currentColor" stroke-width="' + sw + '" fill="none"><line x1="' + r(x) + '" y1="' + r(y1) + '" x2="' + r(x) + '" y2="' + r(y2) + '"/>' +
      '<line x1="' + r(x - t) + '" y1="' + r(y1) + '" x2="' + r(x + t) + '" y2="' + r(y1) + '"/><line x1="' + r(x - t) + '" y1="' + r(y2) + '" x2="' + r(x + t) + '" y2="' + r(y2) + '"/></g>' +
      txt(x + fs * 0.6, (y1 + y2) / 2 + fs * 0.35, label, fs, 'start');
  }
  function guide(x1, y1, x2, y2, fs) {
    return '<line x1="' + r(x1) + '" y1="' + r(y1) + '" x2="' + r(x2) + '" y2="' + r(y2) + '" stroke="currentColor" stroke-width="' + r(fs * 0.04) + '" stroke-dasharray="' + r(fs * 0.3) + ' ' + r(fs * 0.3) + '" opacity=".45"/>';
  }
  function arrow(x, y, dir, label, fs) {
    var L = fs * 4, h = fs * 0.9, x2 = x + dir * L, s = fs * 0.14;
    return '<g stroke="currentColor" stroke-width="' + s + '" fill="currentColor"><line x1="' + r(x) + '" y1="' + r(y) + '" x2="' + r(x2) + '" y2="' + r(y) + '"/>' +
      '<polygon points="' + r(x2) + ',' + r(y) + ' ' + r(x2 - dir * h) + ',' + r(y - h * 0.45) + ' ' + r(x2 - dir * h) + ',' + r(y + h * 0.45) + '" stroke="none"/></g>' +
      txt((x + x2) / 2, y - fs * 0.5, label, fs);
  }
  function zigV(x, y0, y1, fs) {            // vertical break line
    var p = 'M' + r(x) + ' ' + r(y0), k = fs * 0.5, y = y0, s = 1;
    while (y < y1) { y = Math.min(y1, y + k * 1.5); p += ' L' + r(x + s * k) + ' ' + r(y); s = -s; }
    return '<path d="' + p + '" fill="none" stroke="' + C.edge + '" stroke-width="' + r(fs * 0.12) + '"/>';
  }
  function hexagon(cx, cy, R, fill) {
    var pts = [];
    for (var k = 0; k < 6; k++) pts.push(r(cx + R * Math.cos(Math.PI / 6 + k * Math.PI / 3)) + ',' + r(cy + R * Math.sin(Math.PI / 6 + k * Math.PI / 3)));
    return '<polygon points="' + pts.join(' ') + '" fill="' + fill + '" stroke="' + C.steelD + '" stroke-width="' + r(R * 0.06) + '"/>';
  }
  function svgOpen(vx, vy, vw, vh, label, id) {
    return '<svg viewBox="' + r(vx) + ' ' + r(vy) + ' ' + r(vw) + ' ' + r(vh) + '" role="img" aria-label="' + label + '" font-family="Segoe UI,Roboto,Helvetica,Arial,sans-serif">' + defs(id);
  }
  var EDGE = ' stroke="' + C.edge + '" stroke-width="1.2"';

  /* ---------- front view: looking at the face of the outer member ---------- */
  function front(o) {
    var g = geo(o), fs = g.fs, s = '';
    var top = -fs * 5.2, left = g.xMin - fs * 6.5, right = g.xMax + fs * 9, bottom = g.H + fs * 1.5;
    s += svgOpen(left, top, right - left, bottom - top, 'Front view of the connection', 'f');
    s += rect(0, 0, g.xMax - 0, g.H, 'url(#gmf)', EDGE);                       // middle member (behind)
    s += rect(g.xMin, 0, g.Lj - g.xMin, g.H, 'url(#gof)', EDGE);              // outer member (in front)
    s += '<rect x="0" y="0" width="' + r(g.Lj) + '" height="' + r(g.H) + '" fill="none" stroke="' + C.edge + '" stroke-width="1" stroke-dasharray="6 4"/>';
    s += zigV(g.xMin, 0, g.H, fs) + zigV(g.xMax, 0, g.H, fs);
    g.xs.forEach(function (x) { g.ys.forEach(function (y) {
      s += '<circle cx="' + r(x) + '" cy="' + r(y) + '" r="' + r(g.dw / 2) + '" fill="' + C.steel + '" stroke="' + C.steelD + '" stroke-width="1"/>' + hexagon(x, y, g.R, C.steelD);
    }); });
    s += arrow(g.xMin - fs * 0.3, g.H / 2, -1, 'N<tspan font-size="' + r(fs * 0.7) + '" dy="' + r(fs * 0.25) + '">Ed</tspan>', fs);
    s += arrow(g.xMax + fs * 0.3, g.H / 2, 1, 'N<tspan font-size="' + r(fs * 0.7) + '" dy="' + r(fs * 0.25) + '">Ed</tspan>', fs);
    // horizontal dimensions: a3,t | a1 ... | a3,t
    var yd = -fs * 2.2, pts = [0].concat(g.xs).concat([g.Lj]);
    pts.forEach(function (x) { s += guide(x, 0, x, yd + fs * 0.4, fs); });
    pts.forEach(function (x, i) {
      if (i === pts.length - 1) return;
      var lab = (i === 0 || i === pts.length - 2) ? 'a<tspan font-size="' + r(fs * 0.7) + '" dy="' + r(fs * 0.25) + '">3,t</tspan>' : 'a<tspan font-size="' + r(fs * 0.7) + '" dy="' + r(fs * 0.25) + '">1</tspan>';
      s += dimH(x, pts[i + 1], yd, lab + '<tspan dy="' + r(-fs * 0.25) + '"> ' + (i === 0 || i === pts.length - 2 ? o.a3 : o.a1) + '</tspan>', fs * 0.9);
    });
    // vertical dimensions: a4,c, a2 ..., a4,c
    var xd = g.xMax + fs * 4.8;
    var yy = [0, g.ys[0]].concat(g.ys.slice(1)).concat([g.H]);
    yy.forEach(function (y) { s += guide(g.xs[g.xs.length - 1], y, xd + fs * 0.4, y, fs); });
    yy.forEach(function (y, i) {
      if (i === yy.length - 1) return;
      var edge = (i === 0 || i === yy.length - 2), val = edge ? (g.ys[0] - 0) : o.a2;
      var lab = edge ? 'a<tspan font-size="' + r(fs * 0.7) + '" dy="' + r(fs * 0.25) + '">4</tspan><tspan dy="' + r(-fs * 0.25) + '"> ' + Math.round(val) + '</tspan>' :
                       'a<tspan font-size="' + r(fs * 0.7) + '" dy="' + r(fs * 0.25) + '">2</tspan><tspan dy="' + r(-fs * 0.25) + '"> ' + o.a2 + '</tspan>';
      s += dimV(y, yy[i + 1], xd, lab, fs * 0.9);
    });
    return s + '</svg>';
  }

  /* ---------- side view: section through the joint, looking along the grain ---------- */
  function side(o) {
    var g = geo(o), fs = g.fs * 0.9, s = '', T = g.T, ex = g.tw + g.hd + 0.4 * o.d + fs * 0.5;
    var left = -ex - fs * 1.5, right = T + ex + fs * 8, top = -fs * 3.2, bottom = g.H + fs * 3.5;
    s += svgOpen(left, top, right - left, bottom - top, 'Side view: section through the joint', 's');
    s += rect(0, 0, o.t1, g.H, 'url(#eos)', EDGE) + rect(o.t1, 0, o.t2, g.H, 'url(#ems)', EDGE) + rect(o.t1 + o.t2, 0, o.t1, g.H, 'url(#eos)', EDGE);
    g.ys.forEach(function (y) {
      var d = o.d;
      s += rect(-g.tw - g.hd, y - 0.8 * d, g.hd, 1.6 * d, C.steelD, ' stroke="#2f3943" stroke-width="1"');           // head
      s += rect(-g.tw, y - g.dw / 2, g.tw, g.dw, C.steel, ' stroke="' + C.steelD + '" stroke-width="1"');            // washer
      s += rect(0, y - d / 2, T, d, C.steel, ' stroke="' + C.steelD + '" stroke-width="1"');                          // shank
      s += rect(T, y - g.dw / 2, g.tw, g.dw, C.steel, ' stroke="' + C.steelD + '" stroke-width="1"');                // washer
      s += rect(T + g.tw, y - 0.8 * d, 0.8 * d, 1.6 * d, C.steelD, ' stroke="#2f3943" stroke-width="1"');            // nut
      s += rect(T + g.tw + 0.8 * d, y - d / 2, 0.4 * d, d, C.steel, ' stroke="' + C.steelD + '" stroke-width="1"');  // thread end
    });
    // horizontal dims below: t1 t2 t1
    var yd = g.H + fs * 2.2, xs = [0, o.t1, o.t1 + o.t2, T];
    xs.forEach(function (x) { s += guide(x, g.H, x, yd - fs * 0.4, fs); });
    [['t', 1, o.t1], ['t', 2, o.t2], ['t', 1, o.t1]].forEach(function (a, i) {
      s += dimH(xs[i], xs[i + 1], yd, 't<tspan font-size="' + r(fs * 0.7) + '" dy="' + r(fs * 0.25) + '">' + a[1] + '</tspan><tspan dy="' + r(-fs * 0.25) + '"> ' + a[2] + '</tspan>', fs * 0.9);
    });
    // vertical dims right: a4,c a2 a4,c
    var xd = T + ex + fs * 1.2, yy = [0].concat(g.ys).concat([g.H]);
    yy.forEach(function (y) { s += guide(T, y, xd + fs * 0.4, y, fs); });
    yy.forEach(function (y, i) {
      if (i === yy.length - 1) return;
      var edge = (i === 0 || i === yy.length - 2);
      var lab = edge ? 'a<tspan font-size="' + r(fs * 0.7) + '" dy="' + r(fs * 0.25) + '">4</tspan><tspan dy="' + r(-fs * 0.25) + '"> ' + Math.round(g.ys[0]) + '</tspan>' :
                       'a<tspan font-size="' + r(fs * 0.7) + '" dy="' + r(fs * 0.25) + '">2</tspan><tspan dy="' + r(-fs * 0.25) + '"> ' + o.a2 + '</tspan>';
      s += dimV(y, yy[i + 1], xd, lab, fs * 0.9);
    });
    s += txt(o.t1 / 2, -fs * 0.8, 'outer', fs * 0.85) + txt(o.t1 + o.t2 / 2, -fs * 0.8, 'middle', fs * 0.85) + txt(o.t1 + o.t2 + o.t1 / 2, -fs * 0.8, 'outer', fs * 0.85);
    return s + '</svg>';
  }

  /* ---------- plan view: looking at the top edge, grain horizontal ---------- */
  function plan(o) {
    var g = geo(o), fs = g.fs, s = '', T = g.T, ex = g.tw + g.hd + fs * 0.4;
    var left = g.xMin - fs * 6.5, right = g.xMax + fs * 9, top = -ex - fs * 5, bottom = T + ex + fs * 1.5;
    s += svgOpen(left, top, right - left, bottom - top, 'Plan view of the connection', 'p');
    var z1 = o.t1, z2 = o.t1 + o.t2;
    s += rect(g.xMin, 0, g.Lj - g.xMin, o.t1, 'url(#gop)', EDGE);                    // upper outer member
    s += rect(0, z1, g.xMax, o.t2, 'url(#gmp)', EDGE);                                // middle member
    s += rect(g.xMin, z2, g.Lj - g.xMin, o.t1, 'url(#gop)', EDGE);                   // lower outer member
    s += zigV(g.xMin, 0, o.t1, fs) + zigV(g.xMin, z2, T, fs) + zigV(g.xMax, z1, z2, fs);
    g.xs.forEach(function (x) {
      var d = o.d;
      s += '<rect x="' + r(x - d / 2) + '" y="0" width="' + r(d) + '" height="' + r(T) + '" fill="none" stroke="' + C.steelD + '" stroke-width="1.1" stroke-dasharray="5 3"/>';
      s += rect(x - 0.8 * d, -g.tw - g.hd, 1.6 * d, g.hd, C.steelD, ' stroke="#2f3943" stroke-width="1"');       // head
      s += rect(x - g.dw / 2, -g.tw, g.dw, g.tw, C.steel, ' stroke="' + C.steelD + '" stroke-width="1"');         // washer
      s += rect(x - g.dw / 2, T, g.dw, g.tw, C.steel, ' stroke="' + C.steelD + '" stroke-width="1"');             // washer
      s += rect(x - 0.8 * d, T + g.tw, 1.6 * d, g.hd, C.steelD, ' stroke="#2f3943" stroke-width="1"');           // nut
    });
    var lab = 'N<tspan font-size="' + r(fs * 0.7) + '" dy="' + r(fs * 0.25) + '">Ed</tspan><tspan dy="' + r(-fs * 0.25) + '">/2</tspan>';
    s += arrow(g.xMin - fs * 0.3, o.t1 / 2, -1, lab, fs * 0.8) + arrow(g.xMin - fs * 0.3, z2 + o.t1 / 2, -1, lab, fs * 0.8);
    s += arrow(g.xMax + fs * 0.3, (z1 + z2) / 2, 1, 'N<tspan font-size="' + r(fs * 0.7) + '" dy="' + r(fs * 0.25) + '">Ed</tspan>', fs * 0.8);
    var yd = -ex - fs * 2.4, pts = [0].concat(g.xs).concat([g.Lj]);
    pts.forEach(function (x) { s += guide(x, -g.tw - g.hd, x, yd + fs * 0.4, fs); });
    pts.forEach(function (x, i) {
      if (i === pts.length - 1) return;
      var e = (i === 0 || i === pts.length - 2);
      var l = 'a<tspan font-size="' + r(fs * 0.7) + '" dy="' + r(fs * 0.25) + '">' + (e ? '3,t' : '1') + '</tspan><tspan dy="' + r(-fs * 0.25) + '"> ' + (e ? o.a3 : o.a1) + '</tspan>';
      s += dimH(x, pts[i + 1], yd, l, fs * 0.9);
    });
    var xd = g.xMax + fs * 4.8, zz = [0, o.t1, z2, T];
    zz.forEach(function (z) { s += guide(g.xMax, z, xd + fs * 0.4, z, fs); });
    [['1', o.t1], ['2', o.t2], ['1', o.t1]].forEach(function (a, i) {
      s += dimV(zz[i], zz[i + 1], xd, 't<tspan font-size="' + r(fs * 0.7) + '" dy="' + r(fs * 0.25) + '">' + a[0] + '</tspan><tspan dy="' + r(-fs * 0.25) + '"> ' + a[1] + '</tspan>', fs * 0.9);
    });
    return s + '</svg>';
  }

  return { front: front, side: side, plan: plan };
})();
