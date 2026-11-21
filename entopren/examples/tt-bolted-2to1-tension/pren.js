/* prEN 1995-1-1 column: bolted timber-to-timber connection, double shear, tension.
   Rules implemented (clause numbers where known; "clause no. to be added" otherwise):
     - embedment strength, yield moment, dowel effect (modes a, b, d, f)
     - rope effect from the washer (head pull-through) and the bolt tension capacity
     - design capacity per shear plane with gamma_R
     - effective number of bolts n_ef = min{n ; n^0.9 (a / 13d)^0.25}, a = min(a1 ; a3,t)
     - minimum number of bolts, minimum spacings (Table 11.17)
     - net cross-section of the members with the 1/3 reduction of the outer members
     - block shear of the outer and the middle members
   NOT implemented yet: F_ax,t,Ed in the bolts from the eccentricity (11.3.8.7), row shear,
   plug shear, staggered bolts, prevented shrinkage and swelling.
   Units: N, mm, MPa. Output: steps with TeX items, see core.js. */
'use strict';

var PrEN = {
  run: function (inp) {
    var NA = 'clause no. to be added';
    var steps = [];
    function add(s) { steps.push(s); return s; }

    var d = inp.d, dh = d + 1, p = 2, n = inp.n, m = inp.m;
    var fu = Data.steel[inp.steel], rho1 = Data.rho[inp.cls1], rho2 = Data.rho[inp.cls2];
    var km = Data.kmod[inp.sc][inp.ld], gR = 1.3, gM = 1.3;
    var Ed = inp.Ed * 1000, t1 = inp.t1, t2 = inp.t2;

    // 1 embedment
    var fh1 = 0.082 * (1 - 0.01 * d) * rho1, fh2 = 0.082 * (1 - 0.01 * d) * rho2;
    add({ title: '1  Embedment strength', clause: NA, items: [
      EQ(R`\begin{aligned} f_{\mathrm{h,1,k}} &= 0.082\,(1-0.01\,d)\,\rho_{\mathrm{k,1}} = 0.082\cdot(1-0.01\cdot ${d})\cdot ${rho1} = ${nt(fh1)}${U.MPa} \\[4pt]
        f_{\mathrm{h,2,k}} &= 0.082\,(1-0.01\,d)\,\rho_{\mathrm{k,2}} = 0.082\cdot(1-0.01\cdot ${d})\cdot ${rho2} = ${nt(fh2)}${U.MPa} \end{aligned}`),
      NOTE('Outer members ' + inp.cls1 + ' (index 1), middle member ' + inp.cls2 + ' (index 2). Load parallel to grain.')] });

    // 2 yield moment
    var My = 0.3 * fu * Math.pow(d, 2.6), beta = fh2 / fh1;
    add({ title: '2  Bolt yield moment and ratio of embedment strengths', clause: 'f<sub>u,k</sub>: Table 11.3; ' + NA, items: [
      EQ(R`\begin{aligned} M_{\mathrm{y,k}} &= 0.3\,f_{\mathrm{u,k}}\,d^{2.6} = 0.3\cdot ${fu}\cdot ${d}^{2.6} = ${nt(My, 0)}${U.Nmm} \\[4pt]
        \beta &= \frac{f_{\mathrm{h,2,k}}}{f_{\mathrm{h,1,k}}} = \frac{${nt(fh2)}}{${nt(fh1)}} = ${nt(beta, 3)} \end{aligned}`)] });

    // 3 dowel effect
    var th1 = t1, th2 = t2 / 2;
    var Ra = fh1 * th1 * d;
    var Rb = fh2 * th2 * d;
    var Rd = 1.05 * fh1 * th1 * d / (2 + beta) *
             (Math.sqrt(2 * beta * (1 + beta) + 4 * beta * (2 + beta) * My / (fh1 * d * th1 * th1)) - beta);
    var Rf = 1.15 * Math.sqrt(2 * beta / (1 + beta)) * Math.sqrt(2 * My * fh1 * d);
    var modes = [['a', Ra], ['b', Rb], ['d', Rd], ['f', Rf]];
    var gov = modes.reduce(function (a, b) { return b[1] < a[1] ? b : a; });
    var FD = gov[1];
    add({ title: '3  Dowel effect per bolt and shear plane', clause: NA, items: [
      EQ(R`t_{\mathrm{h,1}} = t_1 = ${nt(th1, 0)}${U.mm}, \qquad t_{\mathrm{h,2}} = \frac{t_2}{2} = \frac{${nt(t2, 0)}}{2} = ${nt(th2, 0)}${U.mm}`),
      EQ(R`\begin{aligned}
        F_{\mathrm{v,a,k}} &= f_{\mathrm{h,1,k}}\,t_{\mathrm{h,1}}\,d = ${nt(fh1)}\cdot ${nt(th1, 0)}\cdot ${d} = ${nt(Ra, 0)}${U.N} \\[4pt]
        F_{\mathrm{v,b,k}} &= f_{\mathrm{h,2,k}}\,t_{\mathrm{h,2}}\,d = ${nt(fh2)}\cdot ${nt(th2, 0)}\cdot ${d} = ${nt(Rb, 0)}${U.N} \\[6pt]
        F_{\mathrm{v,d,k}} &= 1.05\,\frac{f_{\mathrm{h,1,k}}\,t_{\mathrm{h,1}}\,d}{2+\beta}\left[\sqrt{2\beta(1+\beta)+\frac{4\beta(2+\beta)\,M_{\mathrm{y,k}}}{f_{\mathrm{h,1,k}}\,d\,t_{\mathrm{h,1}}^{2}}}-\beta\right] \\[2pt]
          &= ${nt(Rd, 0)}${U.N} \\[6pt]
        F_{\mathrm{v,f,k}} &= 1.15\sqrt{\frac{2\beta}{1+\beta}}\sqrt{2\,M_{\mathrm{y,k}}\,f_{\mathrm{h,1,k}}\,d} = ${nt(Rf, 0)}${U.N}
        \end{aligned}`),
      EQ(R`F_{\mathrm{D,k}} = \min\{F_{\mathrm{v,a,k}};\ F_{\mathrm{v,b,k}};\ F_{\mathrm{v,d,k}};\ F_{\mathrm{v,f,k}}\} = ${nt(FD, 0)}${U.N} \quad \text{(mode ${gov[0]})}`)] });

    // 4 rope effect
    var dwAuto = !(inp.dw > 0), dw = dwAuto ? 3.4 * d : inp.dw;
    var fhead = 19 * Math.exp(-dw / 50);
    var Ahead = Math.max(0, Math.PI / 4 * (dw * dw - dh * dh));
    var Fpull = fhead * Ahead;
    var as = Data.asOf(d), Ft = 0.9 * as.v * fu;
    var Fax = Math.min(Fpull, Ft);
    var rope = (gov[0] === 'd' || gov[0] === 'f');
    var Frp = rope ? Math.min(0.25 * Fax, 0.25 * FD) : 0;
    var Fvk = FD + Frp;
    var it4 = [
      EQ(dwAuto ? R`d_{\mathrm{w}} = 3.4\,d = 3.4\cdot ${d} = ${nt(dw, 1)}${U.mm}, \qquad d_{\mathrm{hole}} = d + 1 = ${dh}${U.mm}`
                : R`d_{\mathrm{w}} = ${nt(dw, 1)}${U.mm}, \qquad d_{\mathrm{hole}} = d + 1 = ${dh}${U.mm}`),
      EQ(R`\begin{aligned}
        f_{\mathrm{head,k}} &= 19\,e^{-d_{\mathrm{w}}/50} = 19\,e^{-${nt(dw, 1)}/50} = ${nt(fhead)}${U.MPa} \\[4pt]
        A_{\mathrm{head}} &= \frac{\pi}{4}\left(d_{\mathrm{w}}^{2} - d_{\mathrm{hole}}^{2}\right) = \frac{\pi}{4}\left(${nt(dw, 1)}^{2} - ${dh}^{2}\right) = ${nt(Ahead, 0)}${U.mm2} \\[4pt]
        F_{\mathrm{pull,k}} &= f_{\mathrm{head,k}}\,A_{\mathrm{head}} = ${nt(Fpull, 0)}${U.N} \\[4pt]
        F_{\mathrm{t,k}} &= 0.9\,A_{\mathrm{s}}\,f_{\mathrm{u,k}} = 0.9\cdot ${nt(as.v, 1)}\cdot ${fu} = ${nt(Ft, 0)}${U.N} \\[4pt]
        F_{\mathrm{ax,t,k}} &= \min\{F_{\mathrm{pull,k}};\ F_{\mathrm{t,k}}\} = ${nt(Fax, 0)}${U.N}
        \end{aligned}`)];
    if (rope) it4.push(EQ(R`F_{\mathrm{rp,k}} = \min\{0.25\,F_{\mathrm{ax,t,k}};\ 0.25\,F_{\mathrm{D,k}}\} = \min\{${nt(0.25 * Fax, 0)}${U.N};\ ${nt(0.25 * FD, 0)}${U.N}\} = ${nt(Frp, 0)}${U.N}`));
    else it4.push(NOTE('Mode a or b governs, so the rope effect is not counted: F<sub>rp,k</sub> = 0.'));
    it4.push(EQ(R`F_{\mathrm{v,k}} = F_{\mathrm{D,k}} + F_{\mathrm{rp,k}} = ${nt(FD, 0)}${U.N} + ${nt(Frp, 0)}${U.N} = ${nt(Fvk, 0)}${U.N}`));
    if (as.approx) it4.push(NOTE('A<sub>s</sub> is interpolated for this non-standard diameter.'));
    add({ title: '4  Rope effect (washer pull-through and bolt tension)', clause: NA, items: it4 });

    // 5 design capacity per shear plane
    var FvRd = km * Fvk / gR;
    add({ title: '5  Design capacity per bolt and shear plane', clause: NA + '; γ<sub>R</sub> = 1.3', items: [
      EQ(R`F_{\mathrm{v,Rd}} = \frac{k_{\mathrm{mod}}\,F_{\mathrm{v,k}}}{\gamma_{\mathrm{R}}} = \frac{${nt(km)}\cdot ${nt(Fvk / 1000)}${U.kN}}{${nt(gR)}} = ${nt(FvRd / 1000)}${U.kN}`),
      NOTE('k<sub>mod</sub> = ' + f(km) + ' (' + (inp.sc === 'sc1' ? 'service class 1 or 2' : 'service class 3') + ', ' + Data.ldName[inp.ld] + ').')] });

    // 6 group effect and number of bolts
    var a = Math.min(inp.a1, inp.a3);
    var nef = (n === 1) ? 1 : Math.min(n, Math.pow(n, 0.9) * Math.pow(a / (13 * d), 0.25));
    var nefTot = m * nef, single = (n * m === 1), minOk = (n * m >= 2);
    var NRd = p * nefTot * FvRd * (single ? 0.5 : 1);
    var it6 = [
      EQ(R`a = \min\{a_1;\ a_{3,\mathrm{t}}\} = \min\{${inp.a1};\ ${inp.a3}\}${U.mm} = ${a}${U.mm}`),
      n === 1 ? EQ(R`n_{\mathrm{ef}} = 1 \qquad (n = 1)`)
              : EQ(R`n_{\mathrm{ef}} = \min\left\{n;\ n^{0.9}\sqrt[4]{\frac{a}{13\,d}}\right\} = \min\left\{${n};\ ${n}^{0.9}\cdot\sqrt[4]{\frac{${a}}{13\cdot ${d}}}\right\} = ${nt(nef)}`),
      EQ(R`n_{\mathrm{ef,total}} = m\,n_{\mathrm{ef}} = ${m}\cdot ${nt(nef)} = ${nt(nefTot)}`),
      CHK(R`n\,m = ${n * m} \ge 2`, minOk, 'at least 2 bolts for 2 shear planes (11.3.8.1)')];
    if (single) it6.push(NOTE('Single bolt: the resistance is multiplied by 0.5.'));
    it6.push(EQ(R`N_{\mathrm{Rd}} = p\,n_{\mathrm{ef,total}}\,F_{\mathrm{v,Rd}}${single ? R`\cdot 0.5` : ''} = ${p}\cdot ${nt(nefTot)}\cdot ${nt(FvRd / 1000)}${U.kN}${single ? R`\cdot 0.5` : ''} = ${nt(NRd / 1000, 1)}${U.kN}`));
    it6.push(NOTE('p = 2 shear planes.'));
    add({ title: '6  Effective number of bolts and resistance of the bolt group', clause: '11.3.4; 11.3.8.1', items: it6, status: minOk ? '' : 'fail' });
    var uConn = Ed / NRd;

    // 7 spacings and member width
    var sp = { a1: 5 * d, a2: 4 * d, a3: Math.max(7 * d, 80), a4: 3 * d };
    var W = 2 * inp.a4 + (m - 1) * inp.a2, spOk = minOk;
    var rows = [['a_1', inp.a1, R`5\,d`, sp.a1, 'along grain'], ['a_2', inp.a2, R`4\,d`, sp.a2, 'across grain'],
                ['a_{3,t}', inp.a3, R`\max\{7\,d;\ 80\,\mathrm{mm}\}`, sp.a3, 'loaded end'], ['a_{4,c}', inp.a4, R`3\,d`, sp.a4, 'unloaded edge']];
    var it7 = rows.map(function (c) {
      var ok = c[1] >= c[3] - 1e-9; if (!ok) spOk = false;
      return CHK(c[0] + ' = ' + c[1] + U.mm + (ok ? R`\ \ge\ ` : R`\ \lt\ `) + c[2] + ' = ' + nt(c[3], 0) + U.mm, ok,
                 c[4] + (ok && Math.abs(c[1] - c[3]) < 1e-9 ? ', no reserve for execution tolerances' : ''));
    });
    var wOk = inp.h >= W - 1e-9; if (!wOk) spOk = false;
    it7.push(CHK(R`h = ${inp.h}${U.mm}` + (wOk ? R`\ \ge\ ` : R`\ \lt\ `) + R`2\,a_{4,\mathrm{c}} + (m-1)\,a_2 = ${W}${U.mm}`, wOk, 'member width'));
    it7.push(NOTE('Chosen spacings should exceed the minimum values to cover execution tolerances (11.4.1(2)). Valid for any angle between force and grain.'));
    add({ title: '7  Minimum spacings and distances', clause: 'Table 11.17; 11.4.1(2)', items: it7,
          res: spOk ? 'all minimum values satisfied' : 'minimum values NOT satisfied', status: spOk ? 'ok' : 'fail' });

    // 8 net cross-section
    var T1 = Data.tim[inp.cls1], T2 = Data.tim[inp.cls2];
    var ft1 = km * T1.ft / gM, ft2 = km * T2.ft / gM;
    function kh(cls, h) {
      if (cls.indexOf('GL') === 0) return 1.0;
      return h >= 150 ? 1.0 : Math.min(1.3, Math.pow(150 / h, 0.2));
    }
    var kh1 = kh(inp.cls1, inp.h), kh2 = kh(inp.cls2, inp.h);
    var net = inp.h - m * dh, netOk = net > 0;
    var Ao = netOk ? 2 * net * t1 : 0, Am = netOk ? net * t2 : 0;
    var so = netOk ? Ed / Ao : Infinity, sm = netOk ? Ed / Am : Infinity;
    var ro = kh1 * (2 / 3) * ft1, rm = kh2 * ft2;
    var uNo = so / ro, uNm = sm / rm;
    var it8;
    if (netOk) {
      it8 = [
        EQ(R`b_{\mathrm{net}} = h - m\,d_{\mathrm{hole}} = ${inp.h} - ${m}\cdot ${dh} = ${nt(net, 0)}${U.mm}`),
        EQ(R`\begin{aligned}
          f_{\mathrm{t,0,d,1}} &= \frac{k_{\mathrm{mod}}\,f_{\mathrm{t,0,k}}}{\gamma_{\mathrm{M}}} = \frac{${nt(km)}\cdot ${nt(T1.ft, 1)}}{${nt(gM)}} = ${nt(ft1)}${U.MPa} \\[4pt]
          f_{\mathrm{t,0,d,2}} &= \frac{${nt(km)}\cdot ${nt(T2.ft, 1)}}{${nt(gM)}} = ${nt(ft2)}${U.MPa}
          \end{aligned}`),
        EQ(R`\begin{aligned}
          A_{\mathrm{net,1}} &= 2\,b_{\mathrm{net}}\,t_1 = 2\cdot ${nt(net, 0)}\cdot ${t1} = ${nt(Ao, 0)}${U.mm2} \\[4pt]
          \sigma_{\mathrm{t,0,d,1}} &= \frac{N_{\mathrm{Ed}}}{A_{\mathrm{net,1}}} = \frac{${nt(Ed, 0)}}{${nt(Ao, 0)}} = ${nt(so)}${U.MPa}
          \end{aligned}`),
        CHK(R`\sigma_{\mathrm{t,0,d,1}} = ${nt(so)} \le k_{\mathrm{h}}\cdot\tfrac{2}{3}\,f_{\mathrm{t,0,d,1}} = ${nt(kh1)}\cdot\tfrac{2}{3}\cdot ${nt(ft1)} = ${nt(ro)}${U.MPa}`, uNo <= 1, 'outer members, ' + f(uNo * 100, 0) + ' %'),
        EQ(R`\begin{aligned}
          A_{\mathrm{net,2}} &= b_{\mathrm{net}}\,t_2 = ${nt(net, 0)}\cdot ${t2} = ${nt(Am, 0)}${U.mm2} \\[4pt]
          \sigma_{\mathrm{t,0,d,2}} &= \frac{N_{\mathrm{Ed}}}{A_{\mathrm{net,2}}} = \frac{${nt(Ed, 0)}}{${nt(Am, 0)}} = ${nt(sm)}${U.MPa}
          \end{aligned}`),
        CHK(R`\sigma_{\mathrm{t,0,d,2}} = ${nt(sm)} \le k_{\mathrm{h}}\,f_{\mathrm{t,0,d,2}} = ${nt(kh2)}\cdot ${nt(ft2)} = ${nt(rm)}${U.MPa}`, uNm <= 1, 'middle member, ' + f(uNm * 100, 0) + ' %'),
        NOTE('Outer members: f<sub>t,0,d</sub> reduced by 1/3 because of the eccentricity (11.3.8.7(1)). k<sub>h</sub> = 1.0 for h ≥ 150 mm; for smaller h the EN 1995-1-1 rule is assumed (glulam: 1.0). γ<sub>M</sub> = 1.3.')];
    } else {
      it8 = [NOTE('The holes are wider than the member: h − m·d<sub>hole</sub> ≤ 0.')];
    }
    add({ title: '8  Net cross-section in tension (weakened by the bolt holes)', clause: '11.3.8.7(1)', items: it8,
          res: netOk ? 'outer ' + f(uNo * 100, 0) + ' %,  middle ' + f(uNm * 100, 0) + ' %' : 'not possible',
          status: (netOk && uNo <= 1 && uNm <= 1) ? 'ok' : 'fail' });

    // 9 block shear
    var lcon = inp.a1 * (n - 1) + inp.a3, bnet = Math.max(0, (inp.a2 - dh) * (m - 1)), ac = 0.65;
    function blk(cls, t, outer, Fed) {
      var P = Data.tim[cls], q = Math.sqrt(P.G / P.E);
      var kv = 0.4 + 1.4 * q, kt = 0.9 + 1.4 * q;
      var fvd = km * P.fv / gM, ftd = km * P.ft / gM, tef, tefTex;
      if (outer) {
        if (t / d <= 3) { tef = ac * t; tefTex = R`t_{\mathrm{ef}} &= \alpha_{\mathrm{cl}}\,t_{\mathrm{h,1}} = 0.65\cdot ${nt(t, 0)} = ${nt(tef, 1)}${U.mm}`; }
        else {
          tef = Math.max((1.17 - t / (18 * d)) * ac * t, 0.35 * ac * t);
          tefTex = R`t_{\mathrm{ef}} &= \max\left\{\left(1.17 - \frac{t_{\mathrm{h,1}}}{18\,d}\right)\alpha_{\mathrm{cl}}\,t_{\mathrm{h,1}};\ 0.35\,\alpha_{\mathrm{cl}}\,t_{\mathrm{h,1}}\right\} \\ &= ${nt(tef, 1)}${U.mm}`;
        }
      } else {
        if (t / d <= 11 * ac) { tef = t; tefTex = R`t_{\mathrm{ef}} &= t_{\mathrm{h,2}} = ${nt(t, 0)}${U.mm} \quad (t_{\mathrm{h,2}}/d = ${nt(t / d, 1)} \le 11\,\alpha_{\mathrm{cl}})`; }
        else {
          tef = Math.max((2 - t / (11 * d)) * ac * t, 0.65 * ac * t);
          tefTex = R`t_{\mathrm{ef}} &= \max\left\{\left(2 - \frac{t_{\mathrm{h,2}}}{11\,d}\right)\alpha_{\mathrm{cl}}\,t_{\mathrm{h,2}};\ 0.65\,\alpha_{\mathrm{cl}}\,t_{\mathrm{h,2}}\right\} \\ &= ${nt(tef, 1)}${U.mm}`;
        }
      }
      var Fv = kv * tef * lcon * fvd, Ftd = kt * bnet * t * ftd, Fbs = Math.max(2 * Fv, Ftd);
      var tex = R`\begin{aligned}
        k_{\mathrm{v}} &= 0.4 + 1.4\sqrt{\frac{G_{\mathrm{mean}}}{E_{0,\mathrm{mean}}}} = 0.4 + 1.4\sqrt{\frac{${P.G}}{${nt(P.E, 0)}}} = ${nt(kv, 3)} \\[4pt]
        k_{\mathrm{t}} &= 0.9 + 1.4\sqrt{\frac{G_{\mathrm{mean}}}{E_{0,\mathrm{mean}}}} = ${nt(kt, 3)} \\[4pt]
        f_{\mathrm{v,d}} &= \frac{k_{\mathrm{mod}}\,f_{\mathrm{v,k}}}{\gamma_{\mathrm{M}}} = \frac{${nt(km)}\cdot ${nt(P.fv, 1)}}{${nt(gM)}} = ${nt(fvd)}${U.MPa} \\[4pt]
        f_{\mathrm{t,0,d}} &= \frac{${nt(km)}\cdot ${nt(P.ft, 1)}}{${nt(gM)}} = ${nt(ftd)}${U.MPa} \\[6pt]
        ${tefTex} \\[6pt]
        F_{\mathrm{v,la,d}} &= k_{\mathrm{v}}\,t_{\mathrm{ef}}\,l_{\mathrm{con}}\,f_{\mathrm{v,d}} \\
          &= ${nt(kv, 3)}\cdot ${nt(tef, 1)}\cdot ${nt(lcon, 0)}\cdot ${nt(fvd)} = ${nt(Fv, 0)}${U.N} \\[6pt]
        F_{\mathrm{t,d}} &= k_{\mathrm{t}}\,b_{\mathrm{net}}\,t\,f_{\mathrm{t,0,d}} \\
          &= ${nt(kt, 3)}\cdot ${nt(bnet, 0)}\cdot ${nt(t, 0)}\cdot ${nt(ftd)} = ${nt(Ftd, 0)}${U.N} \\[6pt]
        F_{\mathrm{bs,Rd}} &= \max\{2\,F_{\mathrm{v,la,d}};\ F_{\mathrm{t,d}}\} \\
          &= \max\{${nt(2 * Fv, 0)};\ ${nt(Ftd, 0)}\}${U.N} = ${nt(Fbs / 1000, 1)}${U.kN}
        \end{aligned}`;
      return { u: Fed / Fbs, tex: tex, Fbs: Fbs, Fed: Fed };
    }
    var bo = blk(inp.cls1, t1, true, Ed / 2), bm = blk(inp.cls2, t2, false, Ed);
    add({ title: '9  Block shear (brittle failure) of the timber members', clause: '11.5', items: [
      EQ(R`\begin{aligned} l_{\mathrm{con}} &= a_1\,(n-1) + a_{3,\mathrm{t}} = ${inp.a1}\cdot ${n - 1} + ${inp.a3} = ${nt(lcon, 0)}${U.mm} \\[4pt]
        b_{\mathrm{net}} &= (a_2 - d_{\mathrm{hole}})(m-1) = (${inp.a2} - ${dh})\cdot ${m - 1} = ${nt(bnet, 0)}${U.mm} \end{aligned}`),
      NOTE('<b>Outer member</b> (t = t<sub>1</sub>, carries E<sub>d</sub>/2):'),
      EQ(bo.tex),
      CHK(R`\frac{E_{\mathrm{d}}/2}{F_{\mathrm{bs,Rd}}} = \frac{${nt(bo.Fed / 2000, 1)}${U.kN}}{${nt(bo.Fbs / 1000, 1)}${U.kN}} = ${nt(bo.u)}`, bo.u <= 1, 'outer members'),
      NOTE('<b>Middle member</b> (t = t<sub>2</sub>, carries E<sub>d</sub>):'),
      EQ(bm.tex),
      CHK(R`\frac{E_{\mathrm{d}}}{F_{\mathrm{bs,Rd}}} = \frac{${nt(bm.Fed / 1000, 1)}${U.kN}}{${nt(bm.Fbs / 1000, 1)}${U.kN}} = ${nt(bm.u)}`, bm.u <= 1, 'middle member'),
      NOTE('F<sub>bs,Rd</sub> = max(2·F<sub>v,la,d</sub>; F<sub>t,d</sub>) with α<sub>cl</sub> = 0.65. With one row (m = 1) b<sub>net</sub> = 0 and the check reduces to row shear. The full member thickness is used as t<sub>h</sub> for the middle member.')],
      res: 'outer ' + f(bo.u * 100, 0) + ' %,  middle ' + f(bm.u * 100, 0) + ' %', status: (bo.u <= 1 && bm.u <= 1) ? 'ok' : 'fail' });

    // 10 summary
    var itemsU = [['bolt group', uConn], ['net section, outer members', uNo], ['net section, middle member', uNm],
                  ['block shear, outer members', bo.u], ['block shear, middle member', bm.u]];
    var worst = itemsU.reduce(function (x, y) { return y[1] > x[1] ? y : x; });
    add({ title: '10  Verification', clause: '', items: itemsU.map(function (x) {
        return CHK(R`\text{utilisation} = ${nt(x[1])}`, x[1] <= 1, x[0]); }),
      res: 'governing: ' + worst[0] + ',  utilisation ' + f(worst[1], 2) + (worst[1] <= 1 ? '  ✓' : '  ✗'),
      status: worst[1] <= 1 ? 'ok' : 'fail' });

    return { steps: steps, FRd: NRd, FvRd: FvRd, nef: nef, util: worst[1], governing: worst[0], spOk: spOk,
             items: itemsU, tag: 'prEN 1995-1-1' };
  }
};
