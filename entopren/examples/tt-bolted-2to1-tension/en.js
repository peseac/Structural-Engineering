/* Current EN 1995-1-1:2004 (+A1:2008): bolts, timber to timber, double shear, load parallel to grain.
   The rope effect is neglected on purpose (F_ax,Rk = 0) to keep the first tryout simple and safe.
   Output: steps with TeX items, see core.js (EQ, NOTE, CHK). */
'use strict';

var EN = {
  run: function (inp) {
    var steps = [], d = inp.d, nSP = 2;
    var rho1 = Data.rho[inp.cls1], rho2 = Data.rho[inp.cls2], fu = Data.steel[inp.steel];
    var t1 = inp.t1, t2 = inp.t2, n = inp.n, m = inp.m;
    function add(s) { steps.push(s); return s; }

    // 1 embedment strength (8.32)
    var fh1 = 0.082 * (1 - 0.01 * d) * rho1, fh2 = 0.082 * (1 - 0.01 * d) * rho2;
    add({ title: '1  Embedment strength', clause: 'EN (8.32)', items: [
      EQ(R`\begin{aligned} f_{\mathrm{h,1,k}} &= 0.082\,(1-0.01\,d)\,\rho_{\mathrm{k,1}} = 0.082\cdot(1-0.01\cdot ${d})\cdot ${rho1} = ${nt(fh1)}${U.MPa} \\[4pt]
        f_{\mathrm{h,2,k}} &= 0.082\,(1-0.01\,d)\,\rho_{\mathrm{k,2}} = 0.082\cdot(1-0.01\cdot ${d})\cdot ${rho2} = ${nt(fh2)}${U.MPa} \end{aligned}`),
      NOTE('Outer members ' + inp.cls1 + ' (index 1), middle member ' + inp.cls2 + ' (index 2). Load parallel to grain.')] });

    // 2 yield moment (8.30)
    var My = 0.3 * fu * Math.pow(d, 2.6);
    add({ title: '2  Bolt yield moment', clause: 'EN (8.30)', items: [
      EQ(R`M_{\mathrm{y,Rk}} = 0.3\,f_{\mathrm{u,k}}\,d^{2.6} = 0.3\cdot ${fu}\cdot ${d}^{2.6} = ${nt(My, 0)}${U.Nmm}`)] });

    // 3 failure modes (8.7)
    var beta = fh2 / fh1;
    var Rg = fh1 * t1 * d;
    var Rh = 0.5 * fh2 * t2 * d;
    var Rj = 1.05 * fh1 * t1 * d / (2 + beta) *
             (Math.sqrt(2 * beta * (1 + beta) + 4 * beta * (2 + beta) * My / (fh1 * d * t1 * t1)) - beta);
    var Rk = 1.15 * Math.sqrt(2 * beta / (1 + beta)) * Math.sqrt(2 * My * fh1 * d);
    var modes = [['g', Rg], ['h', Rh], ['j', Rj], ['k', Rk]];
    var gov = modes.reduce(function (a, b) { return b[1] < a[1] ? b : a; });
    add({ title: '3  Capacity per bolt and shear plane', clause: 'EN (8.7) g, h, j, k', items: [
      EQ(R`\beta = \frac{f_{\mathrm{h,2,k}}}{f_{\mathrm{h,1,k}}} = \frac{${nt(fh2)}}{${nt(fh1)}} = ${nt(beta, 3)}`),
      EQ(R`\begin{aligned}
        F_{\mathrm{v,Rk,g}} &= f_{\mathrm{h,1,k}}\,t_1\,d = ${nt(fh1)}\cdot ${t1}\cdot ${d} = ${nt(Rg, 0)}${U.N} \\[4pt]
        F_{\mathrm{v,Rk,h}} &= 0.5\,f_{\mathrm{h,2,k}}\,t_2\,d = 0.5\cdot ${nt(fh2)}\cdot ${t2}\cdot ${d} = ${nt(Rh, 0)}${U.N} \\[6pt]
        F_{\mathrm{v,Rk,j}} &= 1.05\,\frac{f_{\mathrm{h,1,k}}\,t_1\,d}{2+\beta}\left[\sqrt{2\beta(1+\beta)+\frac{4\beta(2+\beta)\,M_{\mathrm{y,Rk}}}{f_{\mathrm{h,1,k}}\,d\,t_1^{2}}}-\beta\right] \\[2pt]
          &= ${nt(Rj, 0)}${U.N} \\[6pt]
        F_{\mathrm{v,Rk,k}} &= 1.15\sqrt{\frac{2\beta}{1+\beta}}\sqrt{2\,M_{\mathrm{y,Rk}}\,f_{\mathrm{h,1,k}}\,d} = ${nt(Rk, 0)}${U.N}
        \end{aligned}`),
      EQ(R`F_{\mathrm{v,Rk}} = \min\{F_{\mathrm{v,Rk,g}};\ F_{\mathrm{v,Rk,h}};\ F_{\mathrm{v,Rk,j}};\ F_{\mathrm{v,Rk,k}}\} = ${nt(gov[1], 0)}${U.N} \quad \text{(mode ${gov[0]})}`),
      NOTE('Rope effect neglected (F<sub>ax,Rk</sub> = 0). The result is per bolt and per shear plane.')] });

    // 4 capacity per bolt
    var Fbolt = nSP * gov[1];
    add({ title: '4  Capacity per bolt', clause: '2 shear planes', items: [
      EQ(R`F_{\mathrm{v,Rk,bolt}} = 2\,F_{\mathrm{v,Rk}} = 2\cdot ${nt(gov[1], 0)}${U.N} = ${nt(Fbolt, 0)}${U.N}`)] });

    // 5 group effect (8.34)
    var nef = (n === 1) ? 1 : Math.min(n, Math.pow(n, 0.9) * Math.pow(inp.a1 / (13 * d), 0.25));
    var nefTot = m * nef, FRk = nefTot * Fbolt;
    add({ title: '5  Group effect (bolts in rows parallel to the grain)', clause: 'EN (8.34)', items: [
      n === 1 ? EQ(R`n_{\mathrm{ef}} = 1 \qquad (n = 1)`)
              : EQ(R`n_{\mathrm{ef}} = \min\left\{n;\ n^{0.9}\sqrt[4]{\frac{a_1}{13\,d}}\right\} = \min\left\{${n};\ ${n}^{0.9}\cdot\sqrt[4]{\frac{${inp.a1}}{13\cdot ${d}}}\right\} = ${nt(nef)}`),
      EQ(R`\begin{aligned} n_{\mathrm{ef,total}} &= m\,n_{\mathrm{ef}} = ${m}\cdot ${nt(nef)} = ${nt(nefTot)} \\[4pt]
        F_{\mathrm{Rk}} &= n_{\mathrm{ef,total}}\,F_{\mathrm{v,Rk,bolt}} = ${nt(nefTot)}\cdot ${nt(Fbolt / 1000)}${U.kN} = ${nt(FRk / 1000, 1)}${U.kN} \end{aligned}`)] });

    // 6 design value
    var km = Data.kmod[inp.sc][inp.ld], gm = 1.3, FRd = km * FRk / gm;
    add({ title: '6  Design resistance', clause: 'EN Table 3.1; Table 2.3 (check the National Annex)', items: [
      EQ(R`F_{\mathrm{Rd}} = \frac{k_{\mathrm{mod}}\,F_{\mathrm{Rk}}}{\gamma_{\mathrm{M}}} = \frac{${nt(km)}\cdot ${nt(FRk / 1000, 1)}${U.kN}}{${nt(gm)}} = ${nt(FRd / 1000, 1)}${U.kN}`),
      NOTE('k<sub>mod</sub> = ' + f(km) + ' (' + (inp.sc === 'sc1' ? 'service class 1 or 2' : 'service class 3') + ', ' + Data.ldName[inp.ld] + '), γ<sub>M</sub> = 1.30.')] });

    // 7 spacings (Table 8.4)
    var sp = { a1: 7 * d, a2: 4 * d, a3: Math.max(7 * d, 80), a4: 3 * d }, W = 2 * inp.a4 + (m - 1) * inp.a2, spOk = true;
    var rows = [['a_1', inp.a1, R`7\,d`, sp.a1, 'along grain'], ['a_2', inp.a2, R`4\,d`, sp.a2, 'across grain'],
                ['a_{3,t}', inp.a3, R`\max\{7\,d;\ 80\,\mathrm{mm}\}`, sp.a3, 'loaded end'], ['a_{4,c}', inp.a4, R`3\,d`, sp.a4, 'unloaded edge']];
    var items7 = rows.map(function (c) {
      var ok = c[1] >= c[3] - 1e-9; if (!ok) spOk = false;
      return CHK(c[0] + ' = ' + c[1] + U.mm + (ok ? R`\ \ge\ ` : R`\ \lt\ `) + c[2] + ' = ' + nt(c[3], 0) + U.mm, ok, c[4]);
    });
    items7.push(NOTE('Minimum member width for this layout: 2·a<sub>4,c</sub> + (m − 1)·a<sub>2</sub> = ' + W + ' mm.'));
    add({ title: '7  Minimum spacings and distances', clause: 'EN Table 8.4', items: items7,
          res: spOk ? 'all minimum values satisfied' : 'minimum values NOT satisfied', status: spOk ? 'ok' : 'fail' });

    // 8 verification
    var Ed = inp.Ed * 1000, u = Ed / FRd;
    add({ title: '8  Verification', clause: '', items: [
      EQ(R`\frac{E_{\mathrm{d}}}{F_{\mathrm{Rd}}} = \frac{${nt(inp.Ed, 1)}${U.kN}}{${nt(FRd / 1000, 1)}${U.kN}} = ${nt(u, 2)} ${u <= 1 ? R`\le` : R`>`} 1.00`)],
      res: 'utilisation ' + f(u, 2) + (u <= 1 ? '  ✓' : '  ✗'), status: u <= 1 ? 'ok' : 'fail' });

    return { steps: steps, FRk: FRk, FRd: FRd, util: u, spOk: spOk, tag: 'EN 1995-1-1' };
  }
};
