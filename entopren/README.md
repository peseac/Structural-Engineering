# EN vs prEN – worked examples

Open `index.html` (the launcher) from a web server, or publish the whole folder with GitHub Pages
(for example as the folder `entopren/` in your repository). Plain HTML, CSS and JavaScript, no build step.

    index.html                                   launcher (list of examples, filters)
    vendor/mathjax/tex-svg.js                    MathJax 3.2.2 (Apache-2.0) for the equations, works offline
    examples/tt-bolted-2to1-tension/
        index.html   inputs | current EN | proposed prEN, plus front, side and plan view
        style.css
        core.js      data tables and TeX helpers
        en.js        rules of EN 1995-1-1
        pren.js      rules of prEN 1995-1-1 (bolt group, rope effect, net section, block shear)
        views.js     the three schematic views (drawn from the input values)
        math.js      loads MathJax (local copy first, then a CDN), plain-text fallback
        offline.js   builds the "Download offline copy" file

Buttons under the inputs:
- Download offline copy: one self-contained HTML file (CSS, scripts and MathJax inside) with the current
  values. It works without internet and without any other file. It can only be created while the page is
  opened from a web server (GitHub Pages); browsers block it for pages opened from a local folder.
- Print / save as PDF.
- Load worked example: M20 6.8, 2 x 60 mm outer + 80 mm middle, 2 x 4 bolts, Ed = 87.6 kN.
- Clear all: empties the number fields.

To use the shared MathJax of your `assets` folder instead, put its path first in the list `CAND` at the top of `math.js`.
To add an example, copy the example folder and add one entry to the `EXAMPLES` array in `index.html`.
