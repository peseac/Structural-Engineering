/* Shared data tables and small helpers used by the EN and prEN columns. */
'use strict';

var Data = {
  // characteristic densities rho_k [kg/m3] (EN 338 and EN 14080)
  rho: { C16: 310, C18: 320, C20: 330, C22: 340, C24: 350, C27: 370, C30: 380, C35: 400, C40: 420,
         GL24c: 350, GL28c: 380, GL32c: 400, GL24h: 385, GL28h: 425, GL32h: 440 },
  // characteristic tensile strength of bolt steel f_u,k [N/mm2]
  steel: { '4.6': 400, '5.6': 500, '6.8': 600, '8.8': 800 },
  // k_mod for solid timber and glued laminated timber
  kmod: {
    sc1: { perm: 0.60, long: 0.70, med: 0.80, short: 0.90, inst: 1.10 },
    sc3: { perm: 0.50, long: 0.55, med: 0.65, short: 0.70, inst: 0.90 }
  },
  // tensile stress area A_s [mm2] of metric bolts
  As: { 6: 20.1, 8: 36.6, 10: 58, 12: 84.3, 14: 115, 16: 157, 18: 192, 20: 245, 22: 303, 24: 353, 27: 459, 30: 561 },
  // ft0k [N/mm2], fvk [N/mm2], E0mean [N/mm2], Gmean [N/mm2]  (EN 338, EN 14080 - verify against the product standards)
  tim: {
    C16: { ft: 8.5, fv: 3.2, E: 8000, G: 500 },  C18: { ft: 10, fv: 3.4, E: 9000, G: 560 },
    C20: { ft: 11.5, fv: 3.6, E: 9500, G: 590 }, C22: { ft: 13, fv: 3.8, E: 10000, G: 630 },
    C24: { ft: 14.5, fv: 4.0, E: 11000, G: 690 }, C27: { ft: 16.5, fv: 4.0, E: 11500, G: 720 },
    C30: { ft: 19, fv: 4.0, E: 12000, G: 750 },  C35: { ft: 22.5, fv: 4.0, E: 13000, G: 810 },
    C40: { ft: 26, fv: 4.0, E: 14000, G: 880 },
    GL24c: { ft: 14, fv: 3.5, E: 11000, G: 650 },  GL28c: { ft: 16.5, fv: 3.5, E: 12500, G: 650 },
    GL32c: { ft: 19.5, fv: 3.5, E: 13700, G: 650 }, GL24h: { ft: 16.5, fv: 3.5, E: 11500, G: 650 },
    GL28h: { ft: 19.5, fv: 3.5, E: 12600, G: 650 }, GL32h: { ft: 22.5, fv: 3.5, E: 14200, G: 650 }
  },
  ldName: { perm: 'permanent', long: 'long-term', med: 'medium-term', short: 'short-term', inst: 'instantaneous' }
};

// A_s for any diameter: exact for standard sizes, linear interpolation otherwise
Data.asOf = function (d) {
  var ks = Object.keys(Data.As).map(Number).sort(function (a, b) { return a - b; });
  if (Data.As[d] !== undefined) return { v: Data.As[d], approx: false };
  var lo = ks[0], hi = ks[ks.length - 1];
  for (var i = 0; i < ks.length - 1; i++) if (d >= ks[i] && d <= ks[i + 1]) { lo = ks[i]; hi = ks[i + 1]; }
  var t = Math.max(0, Math.min(1, (d - lo) / (hi - lo)));
  return { v: Data.As[lo] + t * (Data.As[hi] - Data.As[lo]), approx: true };
};

function f(x, n) { return Number(x).toFixed(n === undefined ? 2 : n); }

/* ---- helpers for LaTeX output ---- */
var R = String.raw;
var U = { mm: R`\,\mathrm{mm}`, mm2: R`\,\mathrm{mm^2}`, N: R`\,\mathrm{N}`, kN: R`\,\mathrm{kN}`,
          MPa: R`\,\mathrm{N/mm^2}`, Nmm: R`\,\mathrm{Nmm}`, kg: R`\,\mathrm{kg/m^3}` };
// number for TeX with thin-space thousands separator
function nt(x, dec) {
  var s = Number(x).toFixed(dec === undefined ? 2 : dec).split('.');
  s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, R`\,`);
  return s.join('.');
}
// sub- and superscript shorthands (plain-text notes)
function sub(t) { return t; }
// items of a calculation step
function EQ(t) { return { k: 'eq', t: t }; }
function NOTE(t) { return { k: 'note', t: t }; }
function CHK(t, ok, label) { return { k: 'chk', t: t, ok: ok, label: label }; }
