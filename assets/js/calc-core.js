/* calc-core.js – shared helpers for the HTML calculators
   ------------------------------------------------------------------
   Loaded by every check from the folder assets/js. It provides:
   - CalcCore.start(base, main)   loads calc.css and the optional modules, then runs the page
   - CalcCore.form(...)           input form with a "Simple" and a "Detailed" mode
   - CalcCore.renderSteps(...)    calculation with MathJax, or in plain form without it
   - CalcCore.tex2html(tex)       turns a LaTeX equation into readable text (the plain form)
   - small helpers: $, N (number format), esc, sub, download, saveCopy
   Nothing here knows about a particular check, so it can be reused as it is.
*/
(function(){
'use strict';
var C={};
C.$=function(id){return document.getElementById(id);};

/* number with a thin space as thousands separator: N(12345.6,1) -> "12 345.6" */
C.N=function(x,dec){
  var s=(+x).toFixed(dec||0).split('.');
  s[0]=s[0].replace(/\B(?=(\d{3})+(?!\d))/g,'\u202f');
  return s.join('.');
};
/* the same number for use inside LaTeX */
C.Ntex=function(x,dec){return C.N(x,dec).replace(/\u202f/g,'\\,');};
/* round to a step: rnd(4.32,0.1) -> 4.3 */
C.rnd=function(x,step){return +(Math.round(x/step)*step).toFixed(6);};
C.esc=function(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
/* light notation for notes: "f_h,1,k and d^2" -> HTML with <sub> and <sup> */
C.sub=function(s){return s.replace(/_([A-Za-z0-9,]+)/g,'<sub>$1</sub>').replace(/\^\(([^)]+)\)/g,'<sup>$1</sup>').replace(/\^([0-9.]+)/g,'<sup>$1</sup>');};

C.download=function(name,txt,type){
  var url=URL.createObjectURL(new Blob([txt],{type:type})),a=document.createElement('a');
  a.href=url;a.download=name.replace(/[^A-Za-z0-9._-]/g,'_');document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(url);},1000);
};
/* save the page with the current values written into <script id="saved"> */
C.saveCopy=function(src,state,name){
  var json=JSON.stringify(state).replace(/</g,'\\u003c');
  var html=src.replace(/(<script id="saved" type="application\/json">)[\s\S]*?(<\/script>)/,function(m,a,b){return a+json+b;});
  C.download(name,html,'text/html');
};

/* ================================================================
   LaTeX -> readable text, used when MathJax is not available.
   Covers what the calculators use: \frac, \sqrt, \cdot, \left( \right),
   \min, \max, \text{}, \mathrm{}, sub- and superscripts, Greek letters,
   aligned environments. Unknown commands lose only their backslash.
   ================================================================ */
var SYM={alpha:'α',beta:'β',gamma:'γ',delta:'δ',Delta:'Δ',epsilon:'ε',varepsilon:'ε',eta:'η',theta:'θ',kappa:'κ',lambda:'λ',mu:'μ',
  nu:'ν',pi:'π',ell:'ℓ',partial:'∂',sum:'Σ',xi:'ξ',zeta:'ζ',Omega:'Ω',Phi:'Φ',rho:'ρ',sigma:'σ',Sigma:'Σ',tau:'τ',phi:'φ',varphi:'φ',chi:'χ',psi:'ψ',omega:'ω',
  cdot:'·',times:'×',div:'÷',pm:'±',le:'≤',leq:'≤',ge:'≥',geq:'≥',ne:'≠',neq:'≠',approx:'≈',infty:'∞',circ:'°',
  to:'→',rightarrow:'→',Rightarrow:'⇒',ldots:'…',dots:'…',cdots:'⋯',
  min:'min',max:'max',sin:'sin',cos:'cos',tan:'tan',ln:'ln',log:'log',exp:'exp',
  quad:'\u2003',qquad:'\u2003\u2003',',':'\u2009',';':' ',':':' ','!':'',' ':' ',
  left:'',right:'',big:'',Big:'',bigg:'',Bigg:'',bigl:'',bigr:'',Bigl:'',Bigr:'',displaystyle:'',textstyle:'',limits:'',
  '{':'{','}':'}','%':'%','&':'&amp;','_':'_','#':'#','$':'$',lbrace:'{',rbrace:'}'};
function wrap(h){
  var t=h.replace(/<[^>]+>/g,'').trim();
  return /[\s+\-−·×\/=]/.test(t)&&!/^\(.*\)$/.test(t)?'('+h+')':h;
}
C.tex2html=function(src){
  var s=String(src),i=0,out='';
  function arg(){
    while(s[i]===' ')i++;
    if(s[i]==='{'){
      var d=1,j=i+1;
      while(j<s.length&&d){if(s[j]==='\\'){j+=2;continue;}if(s[j]==='{')d++;else if(s[j]==='}')d--;j++;}
      var inner=s.slice(i+1,j-1);i=j;return inner;
    }
    if(s[i]==='\\'){var m=/^\\([A-Za-z]+|.)/.exec(s.slice(i));i+=m[0].length;return m[0];}
    return s[i++]||'';
  }
  while(i<s.length){
    var c=s[i];
    if(c==='\\'){
      if(s[i+1]==='\\'){i+=2;if(s[i]==='['){while(i<s.length&&s[i]!==']')i++;i++;}out+='<br>';continue;}
      var m=/^\\([A-Za-z]+|.)/.exec(s.slice(i)),name=m[1];i+=m[0].length;
      if(name==='frac'||name==='tfrac'||name==='dfrac'){var a=C.tex2html(arg()),b=C.tex2html(arg());out+=wrap(a)+'/'+wrap(b);if(/^\s*(\\left|\\[Bb]ig|\[)/.test(s.slice(i)))out+=' · ';}
      else if(name==='sqrt'){
        var n='';if(s[i]==='['){var k=s.indexOf(']',i);n=s.slice(i+1,k);i=k+1;}
        var r=C.tex2html(arg()),t=r.replace(/<[^>]+>/g,'');
        out+=(n?'<sup>'+n+'</sup>':'')+'√'+(/^[\w.,\u2009]+$/.test(t)&&!/\s/.test(t)?r:'('+r+')');
      }
      else if(name==='text'||name==='textrm'||name==='mbox'||name==='textit'||name==='textbf')out+=C.esc(arg());
      else if(name==='mathrm'||name==='mathit'||name==='mathbf'||name==='operatorname'||name==='boldsymbol')out+=C.tex2html(arg());
      else if(name==='begin'||name==='end')arg();
      else if(Object.prototype.hasOwnProperty.call(SYM,name)){out+=SYM[name];if((name==='left'||name==='right')&&s[i]==='.')i++;}
      else out+=name;
      continue;
    }
    if(c==='_'||c==='^'){
      i++;var h=C.tex2html(arg());
      if(c==='^'&&h==='°'){out+='°';continue;}
      out+=c==='_'?'<sub>'+h+'</sub>':'<sup>'+h+'</sup>';continue;
    }
    if(c==='{'){out+=C.tex2html(arg());continue;}
    if(c==='&'){i++;if(/<br>\s*$/.test(out))out+='\u2003\u2003';continue;}
    if(c==='-'){out+='−';i++;continue;}
    if(c==='<'){out+='&lt;';i++;continue;}
    if(c==='>'){out+='&gt;';i++;continue;}
    if(c==='~'){out+=' ';i++;continue;}
    out+=c;i++;
  }
  return out.replace(/ {2,}/g,' ');
};

/* ================================================================
   Calculation steps. The page passes HTML where every equation is
   <div class="eq">\[ ... \]</div>. With MathJax the equations are
   typeset; without it they are converted by tex2html.
   ================================================================ */
var S={box:null,html:'',math:'',seq:0,timer:null,chain:Promise.resolve()};
function plain(html){
  return html.replace(/<div class="eq">\\\[([\s\S]*?)\\\]<\/div>/g,function(m,t){return '<div class="eq plain">'+C.tex2html(t)+'</div>';});
}
C.renderSteps=function(box,html,now){
  S.box=box;S.html=html;
  if(!S.math||!window.MathJax||!MathJax.typesetPromise){box.innerHTML='<div>'+plain(html)+'</div>';return;}
  clearTimeout(S.timer);
  S.timer=setTimeout(function(){
    var seq=++S.seq,nw=document.createElement('div');
    nw.className='pending';nw.innerHTML=html;box.appendChild(nw);
    S.chain=S.chain.then(function(){return MathJax.typesetPromise([nw]);}).then(function(){
      if(seq!==S.seq){nw.remove();return;}
      while(box.firstChild&&box.firstChild!==nw)box.removeChild(box.firstChild);
      nw.className='';
    }).catch(function(){nw.remove();if(seq===S.seq)box.innerHTML='<div>'+plain(html)+'</div>';});
  },now?0:150);
};
C.clearSteps=function(){S.html='';++S.seq;clearTimeout(S.timer);if(S.box)S.box.innerHTML='';};
C.mathStatus=function(text){var el=C.$('mjstatus');if(el)el.textContent=text;};
/* called by mathjax-loader.js */
C.mathReady=function(source){
  S.math=source;
  C.mathStatus('Equations typeset with MathJax ('+source+').');
  if(S.box&&S.html)C.renderSteps(S.box,S.html,true);
};
C.mathFailed=function(){
  S.math='';
  C.mathStatus('MathJax could not be loaded (neither online nor from assets/mathjax), so the equations are shown in plain form.');
};

/* ================================================================
   Input form with two modes.
   fields: list of
     {h:'Heading'}                       heading
     {note:'text'}                       hint paragraph
     {id, l, u, v, s, max}               number input (label, unit, value, step)
     {id, l, u, v, type:'text'}          text input on its own line (e.g. a list of values)
     {sel, l, v, opts}                   select (opts = HTML of the options)
     {c, l}                              checkbox
   Add adv:true to show an item only in the Detailed mode. Such inputs need
   auto:function(i){...}, the default computed from the inputs above them
   (i holds the values read so far). Add why:'…' (the rule) to list the default
   in the box "Assumed defaults" of the Simple mode; defaults without why are not listed.
   In the Simple mode the default is always used. In the Detailed mode the
   default is shown with a dashed border until the user types an own value.
   ================================================================ */
C.form=function(el,fields,onChange){
  var $=C.$,F={mode:'simple',touched:{}};
  function key(f){return f.id||f.sel||f.c;}
  function adv(f){return f.adv?' data-adv':'';}
  var h='<div class="modesw" role="group" aria-label="Amount of input"><button type="button" data-mode="simple" aria-pressed="true">Simple</button><button type="button" data-mode="detailed" aria-pressed="false">Detailed</button></div>';
  fields.forEach(function(f){
    if(f.h)h+='<h3'+adv(f)+'>'+f.h+'</h3>';
    else if(f.note)h+='<p class="hint"'+adv(f)+'>'+f.note+'</p>';
    else if(f.sel)h+='<div class="field"'+adv(f)+'><label for="'+f.sel+'">'+f.l+'</label><select id="'+f.sel+'">'+f.opts+'</select></div>';
    else if(f.c)h+='<label class="check"'+adv(f)+'><input type="checkbox" id="'+f.c+'"> '+f.l+'</label>';
    else if(f.id&&f.type==='text')h+='<div class="field wide"'+adv(f)+'><label for="'+f.id+'">'+f.l+(f.u?' <span class="u">['+f.u+']</span>':'')+'</label><input type="text" id="'+f.id+'" value="'+C.esc(f.v===undefined?'':f.v)+'" spellcheck="false"></div>';
    else if(f.id)h+='<div class="field"'+adv(f)+'><label for="'+f.id+'">'+f.l+'</label><input type="number" id="'+f.id+'" value="'+(f.v===undefined?'':f.v)+'" step="'+(f.s||'any')+'" min="0"'+(f.max?' max="'+f.max+'"':'')+(f.why?' title="Default: '+C.esc(f.why.replace(/<[^>]+>/g,''))+'"':'')+'><span class="u">'+(f.u||'')+'</span></div>';
  });
  h+='<p data-adv><button type="button" class="linkbtn" id="resetAdv">Reset the detailed values to the defaults</button></p>';
  h+='<div class="assumed" id="assumed"></div>';
  el.innerHTML=h;
  fields.forEach(function(f){if(f.sel&&f.v!==undefined)$(f.sel).value=f.v;});

  F.setMode=function(m){
    F.mode=m==='detailed'?'detailed':'simple';
    el.setAttribute('data-mode',F.mode);
    [].forEach.call(el.querySelectorAll('.modesw button'),function(b){b.setAttribute('aria-pressed',b.getAttribute('data-mode')===F.mode);});
  };
  /* read all values; defaults are written into the hidden or untouched inputs */
  F.read=function(){
    var i={},used=[];
    fields.forEach(function(f){
      var k=key(f);if(!k)return;
      var inp=$(k),auto=!!f.auto&&(F.mode==='simple'||!F.touched[k]);
      if(auto){
        var v=f.auto(i);
        if(f.c)inp.checked=!!v;else inp.value=(v===null||v===undefined||(typeof v==='number'&&!isFinite(v)))?'':v;
      }
      if(f.auto)inp.classList.toggle('auto',auto);
      i[k]=f.c?inp.checked:(f.sel||f.type==='text')?inp.value:parseFloat(inp.value);
      if(f.adv&&auto&&f.why&&inp.value!=='')used.push(f);
    });
    var a=$('assumed');
    if(F.mode==='simple'&&used.length){
      a.innerHTML='<b>Assumed defaults</b> (switch to <button type="button" class="linkbtn" data-go="detailed">Detailed</button> to change them):<ul>'+used.map(function(f){
        var k=key(f),inp=$(k),v=f.c?(inp.checked?'yes':'no'):f.sel?inp.options[inp.selectedIndex].text:f.type==='text'?C.esc(inp.value)+(f.u?' '+f.u:''):C.N(+inp.value,(String(inp.value).split('.')[1]||'').length)+(f.u&&f.u!=='–'?' '+f.u:'');
        return '<li>'+f.l+' = '+v+(f.why?' ('+f.why+')':'')+'</li>';
      }).join('')+'</ul>';
      a.hidden=false;
    }else{a.innerHTML='';a.hidden=true;}
    return i;
  };
  /* rows for a report: [label, value, unit, source] for everything that is used */
  F.rows=function(){
    var r=[];
    fields.forEach(function(f){
      var k=key(f);if(!k)return;
      var inp=$(k),src=f.auto&&(F.mode==='simple'||!F.touched[k])?'default':'input';
      if(f.c)r.push([f.l,inp.checked?'yes':'no','–',src]);
      else if(f.sel)r.push([f.l,inp.options[inp.selectedIndex].text,'–',src]);
      else if(inp.value!=='')r.push([f.l,inp.value,f.u||'–',src]);
    });
    return r;
  };
  F.getState=function(){
    var v={};
    fields.forEach(function(f){var k=key(f);if(!k)return;v[k]=f.c?$(k).checked:$(k).value;});
    return {mode:F.mode,values:v,touched:F.touched};
  };
  F.setState=function(st){
    F.touched={};
    fields.forEach(function(f){
      var k=key(f);if(!k)return;
      var v=st&&st.values&&st.values[k]!==undefined?st.values[k]:(f.v===undefined?'':f.v);
      if(f.c)$(k).checked=!!v;else $(k).value=v;
    });
    if(st&&st.touched)Object.keys(st.touched).forEach(function(k){if(st.touched[k])F.touched[k]=true;});
    F.setMode(st&&st.mode);
  };
  F.clear=function(){
    fields.forEach(function(f){var k=key(f);if(!k)return;if(f.c)$(k).checked=false;else if(!f.sel)$(k).value='';});
  };
  function changed(e){
    var t=e.target,f=fields.filter(function(x){return key(x)===t.id;})[0];
    if(!f)return;
    if(f.auto&&F.mode==='detailed')F.touched[t.id]=true;
    onChange();
  }
  el.addEventListener('input',changed);   /* also fires for selects and checkboxes */
  el.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    var m=b.getAttribute('data-mode')||b.getAttribute('data-go');
    if(m){F.setMode(m);onChange();if(b.getAttribute('data-go'))el.querySelector('.modesw button[data-mode=detailed]').focus();}
    if(b.id==='resetAdv'){F.touched={};onChange();}
  });
  F.setMode('simple');
  return F;
};

/* ================================================================
   Start-up: load calc.css, run the page, then load the optional modules.
   base is the address of the assets folder that was found by the page.
   ================================================================ */
C.base='';
C.start=function(base,main){
  C.base=base;
  var css=document.createElement('link'),done=false;
  css.rel='stylesheet';css.href=base+'css/calc.css';
  function go(){if(done)return;done=true;main();
    ['js/mathjax-loader.js','js/export-md.js','js/export-svg.js','js/export-dxf.js'].forEach(function(p){
      var s=document.createElement('script');s.src=base+p;
      if(p==='js/mathjax-loader.js')s.onerror=function(){C.mathFailed();};
      document.head.appendChild(s);
    });
  }
  css.onload=go;css.onerror=go;setTimeout(go,1500);
  document.head.appendChild(css);
};
/* run fn(module) if an optional module was loaded, else explain what is missing */
C.need=function(name,file,fn){
  if(window[name])return fn(window[name]);
  alert('This export needs the file assets/'+file+', which was not found. Put the assets folder next to the folder of this check.');
};

window.CalcCore=C;
})();
