/* "Download offline copy": builds ONE self-contained HTML file (CSS, scripts and MathJax inlined)
   with the current input values stored in it. It needs the page to be opened from a web server
   (for example GitHub Pages), because browsers do not let a page read its own files from file://. */
'use strict';

var Offline = (function () {
  function get(u) {
    return fetch(u, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(u + ' – ' + r.status);
      return r.text();
    });
  }
  function safe(js) { return js.replace(/<\/script/gi, '<\\/script'); }
  function abs(u) { return new URL(u, location.href).href; }

  function firstOf(urls, k) {
    k = k || 0;
    if (k >= urls.length) return Promise.reject(new Error('MathJax not found'));
    return get(urls[k]).catch(function () { return firstOf(urls, k + 1); });
  }

  function save(state, filename) {
    var pageUrl = location.href.split('#')[0].split('?')[0];
    return get(pageUrl).then(function (html) {
      var css = [], js = [], m, reC = /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, reJ = /<script[^>]*src="([^"]+)"[^>]*><\/script>/g;
      while ((m = reC.exec(html))) css.push(m[1]);
      while ((m = reJ.exec(html))) js.push(m[1]);
      return Promise.all([
        Promise.all(css.map(function (u) { return get(abs(u)); })),
        Promise.all(js.map(function (u) { return get(abs(u)); })),
        firstOf(Eq.urls())
      ]).then(function (res) {
        var out = html;
        css.forEach(function (u, i) {
          out = out.replace(new RegExp('<link[^>]*href="' + u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*>'), function () { return '<style>\n' + res[0][i] + '\n</style>'; });
        });
        js.forEach(function (u, i) {
          out = out.replace(new RegExp('<script[^>]*src="' + u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*></script>'), function () { return '<script>\n' + safe(res[1][i]) + '\n</script>'; });
        });
        out = out.replace('<!--MATHJAX-->', function () { return '<script>\n' + safe(res[2]) + '\n</script>'; });
        var json = JSON.stringify(state).replace(/</g, '\\u003c');
        out = out.replace(/<script id="saved" type="application\/json">[\s\S]*?<\/script>/, function () { return '<script id="saved" type="application/json">' + json + '</script>'; });
        var blob = new Blob([out], { type: 'text/html;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
        return Math.round(blob.size / 1024);
      });
    });
  }
  return { save: save };
})();
