/* mathjax-loader.js – loads MathJax for the calculation steps
   ------------------------------------------------------------------
   Tries the sources below in order and uses the first one that loads:
     1. the official MathJax repository on GitHub (mathjax/MathJax), served by jsDelivr
     2. the official MathJax npm package, served by jsDelivr
     3. the local copy assets/mathjax/tex-svg.js        (works offline, no font files needed)
     4. the local copy assets/mathjax/tex-mml-chtml.js  (works offline, needs assets/mathjax/output/chtml/fonts)
   If none of them loads, CalcCore shows the equations in plain form (CalcCore.tex2html).
   When the computer reports that it is offline, the online sources are skipped.
   To prefer the local copy (for example in a classroom without internet), move it up in SOURCES.
*/
(function(){
'use strict';
var me=document.currentScript,base=me?me.src.replace(/js\/mathjax-loader\.js(\?.*)?$/,''):'';
var V='3.2.2';
var SOURCES=[
  ['online, official MathJax repository on GitHub','https://cdn.jsdelivr.net/gh/mathjax/MathJax@'+V+'/es5/tex-svg.js',true],
  ['online, official MathJax package','https://cdn.jsdelivr.net/npm/mathjax@'+V+'/es5/tex-svg.js',true],
  ['local copy assets/mathjax/tex-svg.js',base+'mathjax/tex-svg.js',false],
  ['local copy assets/mathjax/tex-mml-chtml.js',base+'mathjax/tex-mml-chtml.js',false]
].filter(function(s){return !(s[2]&&navigator.onLine===false);});

var current='';
window.MathJax={
  svg:{fontCache:'global',displayAlign:'left',displayIndent:'0'},
  chtml:{displayAlign:'left',displayIndent:'0'},
  options:{enableMenu:false},
  startup:{typeset:false,ready:function(){
    MathJax.startup.defaultReady();
    if(window.CalcCore)CalcCore.mathReady(current);
  }}
};
function next(list){
  if(!list.length){if(window.CalcCore)CalcCore.mathFailed();return;}
  var s=document.createElement('script');
  current=list[0][0];
  if(window.CalcCore)CalcCore.mathStatus('Loading MathJax ('+current+')…');
  s.src=list[0][1];s.async=true;
  s.onerror=function(){s.remove();next(list.slice(1));};
  document.head.appendChild(s);
}
next(SOURCES);
})();
