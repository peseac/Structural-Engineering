# Shared files for the HTML calculators

Every check lives in its own folder next to this `assets` folder and loads what it needs from here.

```
Structural-Engineering/        (GitHub repository, published at https://peseac.github.io/Structural-Engineering/)
├─ index.html
├─ assets/
│  ├─ style.css                 look of index.html
│  ├─ sketch_placeholder.svg    sketch of the student template card
│  ├─ css/calc.css              common look (light, dark and print)
│  ├─ js/calc-core.js           required: helpers, Simple/Detailed form, equation rendering
│  ├─ js/mathjax-loader.js      MathJax: GitHub → npm → local tex-svg.js → local tex-mml-chtml.js
│  ├─ js/export-md.js           Markdown export (equations kept as $$ LaTeX $$)
│  ├─ js/export-svg.js          one-page SVG report
│  ├─ js/export-dxf.js          minimal DXF writer (R12)
│  └─ mathjax/                  local MathJax 3.2.2 (Apache 2.0 licence, see mathjax/LICENSE)
│     ├─ tex-svg.js
│     ├─ tex-mml-chtml.js
│     └─ output/chtml/fonts/woff-v2/   fonts needed by tex-mml-chtml.js
├─ 01_Floor_Beam/
│  ├─ floor-beam.html
│  ├─ floor-beam.pdf / floor-beam.xlsx   hand calculation, spreadsheet
│  └─ sketch.svg
├─ 02_Step_Joint_calculator/
│  ├─ Step_Joint_calculator.html  standalone (MathJax and exports built in)
│  ├─ Step_Joint_calculator.pdf   hand calculation
│  └─ sketch.svg
├─ 03_Screw_Lateral_Timber/
│  ├─ screw-lateral-t2t.html
│  └─ sketch.svg
└─ 04_Screw_Lateral_Timber_to_Steel/
   ├─ screw-lateral-s2t.html
   └─ sketch.svg
```

`index.html` shows one card per folder. Each card shows the folder's `sketch.svg` (a plain SVG file with
inline colours, no CSS classes) and links to the check. Students copy the template card, give it the next
number and point it to their own folder; `assets/sketch_placeholder.svg` is used until they add a sketch.

## How the equations are shown

1. MathJax from the official MathJax repository on GitHub (through jsDelivr), then from the official npm package.
2. Without internet: `assets/mathjax/tex-svg.js`, then `assets/mathjax/tex-mml-chtml.js`.
3. If none of them loads, `CalcCore.tex2html` turns the same LaTeX into plain readable text
   (fractions as a/b, roots as √(…), subscripts kept), so nothing has to be written twice.

To prefer the local copy, move it to the top of `SOURCES` in `js/mathjax-loader.js`.
Firefox may refuse the chtml fonts when the page is opened from disk; the SVG version needs no fonts.

## Adding a new check

1. Copy a check folder, rename it and its HTML file (keep the number prefix, e.g. `05_…`).
2. In the page, edit `calc(i)` (the calculation), `FIELDS` (the inputs) and `stepsTex(r)` (the steps in LaTeX).
3. Inputs marked `adv:1` appear only in the Detailed mode and need `auto:function(i){…}` with the default;
   add `why:'…'` to list the default and its rule in the Simple mode. `type:'text'` gives a text input
   (for lists of values, e.g. the widths to try).
4. Keep the start-up block unchanged. The last address in `ASSET_BASES` is the published copy of the shared files,
   `https://peseac.github.io/Structural-Engineering/assets/`, so that a copy saved outside the repository still finds them online.
   Change it only if the repository is renamed or moved.
5. A check that searches for a cross-section (like 01) can reuse the CSS classes `secgrid` (clickable grid of
   sections) and `cmp` (comparison table) from calc.css.
6. Add a `sketch.svg` to the folder and a card for the check to `index.html` (copy the template card).
