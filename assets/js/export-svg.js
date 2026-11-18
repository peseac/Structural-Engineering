/* export-svg.js – one-page SVG report of a calculator
   ------------------------------------------------------------------
   CalcSVG.report(spec) returns the text of a standalone SVG file. spec:
     {title, subtitle, width (default 1000), footer, blocks:[…]}
   Blocks are stacked from top to bottom:
     {title, svg: <svg element on the page>, width}         a sketch, styles copied from the screen
     {title, lines: ['text', …]}                            lines of text
     {title, table: {cols:[widths], head:[…], rows:[{cells:[…], hl:true, icon:<svg element>}]}}
     {row: [block, block]}                                  blocks side by side
   Text may contain <sub>/<sup>; they are written as plain text (F_v,Rd).
   CalcSVG.inline(el) gives the SVG of an element with its CSS turned into inline styles.
*/
(function(){
'use strict';
var G={},INK='#1d2a2f',MUTED='#5d6b70',STEEL='#2b6a70',SOFT='#dcebea',SIGNAL='#f6dfe2',LINE='#cfd8d6';
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function plain(s){
  return String(s).replace(/<sub>(.*?)<\/sub>/g,'_$1').replace(/<sup>(.*?)<\/sup>/g,'^$1').replace(/<[^>]+>/g,'')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
}
G.inline=function(el){
  var clone=el.cloneNode(true),src=[el].concat([].slice.call(el.querySelectorAll('*'))),dst=[clone].concat([].slice.call(clone.querySelectorAll('*')));
  var props=['fill','stroke','stroke-width','stroke-dasharray','stroke-linejoin','stroke-linecap','stroke-opacity','fill-opacity','opacity','font-family','font-size','font-weight','text-anchor','paint-order'];
  for(var k=0;k<src.length;k++){
    var cs=getComputedStyle(src[k]),st='';
    props.forEach(function(p){var v=cs.getPropertyValue(p);if(v)st+=p+':'+v+';';});
    dst[k].removeAttribute('class');dst[k].setAttribute('style',st);
  }
  clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
  var s=new XMLSerializer().serializeToString(clone);
  return {inner:s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,''),vb:el.getAttribute('viewBox')||'0 0 100 100'};
};
function place(o,x,y,w,h){
  return '<svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" viewBox="'+o.vb+'" preserveAspectRatio="xMidYMid meet">'+o.inner+'</svg>';
}
G.text=function(x,y,t,opt){
  opt=opt||{};
  return '<text x="'+x+'" y="'+y+'" font-family="Arial, Helvetica, sans-serif" font-size="'+(opt.size||13)+'" font-weight="'+(opt.bold?700:400)+'" fill="'+(opt.fill||INK)+'"'+(opt.anchor?' text-anchor="'+opt.anchor+'"':'')+'>'+esc(plain(t))+'</text>';
};
function table(x,y,T){
  var rh=T.rowH||26,W=T.cols.reduce(function(a,b){return a+b;},0),yy=y,o='',ind=T.rows.some(function(r){return r.icon;})?34:0;
  o+='<rect x="'+x+'" y="'+yy+'" width="'+W+'" height="'+rh+'" fill="'+SOFT+'"/>';
  var cx=x;
  T.head.forEach(function(h,k){o+=G.text(k?cx+T.cols[k]-6:cx+6,yy+17,h,{bold:true,size:12,fill:STEEL,anchor:k?'end':null});cx+=T.cols[k];});
  yy+=rh;
  T.rows.forEach(function(row){
    o+='<rect x="'+x+'" y="'+yy+'" width="'+W+'" height="'+rh+'" fill="'+(row.hl?SIGNAL:'#ffffff')+'"/>';
    o+='<line x1="'+x+'" x2="'+(x+W)+'" y1="'+(yy+rh)+'" y2="'+(yy+rh)+'" stroke="'+LINE+'" stroke-width="1"/>';
    if(row.icon)o+=place(G.inline(row.icon),x+6,yy+2,24,rh-4);
    cx=x;
    row.cells.forEach(function(c,k){
      o+=G.text(k?cx+T.cols[k]-6:cx+6+ind,yy+17,c,{anchor:k?'end':null});
      cx+=T.cols[k];
    });
    yy+=rh;
  });
  return {svg:o,h:yy-y};
}
/* draw one block at (x,y) within width w; returns {svg,h} */
function block(b,x,y,w){
  var o='',h=0;
  if(b.title){o+=G.text(x,y+16,b.title,{size:14,bold:true});h=26;}
  if(b.svg){
    var s=G.inline(b.svg),vb=s.vb.split(/[\s,]+/).map(Number),bw=Math.min(b.width||w,w),bh=bw*vb[3]/vb[2];
    o+=place(s,x,y+h,bw,bh);h+=bh;
  }
  if(b.lines){b.lines.forEach(function(t,k){o+=G.text(x,y+h+16+k*22,t,{size:13});});h+=b.lines.length*22+6;}
  if(b.table){var t=table(x,y+h,b.table);o+=t.svg;h+=t.h;}
  return {svg:o,h:h};
}
G.report=function(spec){
  var W=spec.width||1000,pad=30,y=0,body='';
  body+=G.text(pad,40,spec.title||'',{size:22,bold:true});
  if(spec.subtitle)body+=G.text(pad,62,spec.subtitle,{size:13,fill:MUTED});
  y=80;
  (spec.blocks||[]).forEach(function(b){
    if(b.row){
      var n=b.row.length,gap=20,cw=(W-2*pad-gap*(n-1))/n,hm=0;
      b.row.forEach(function(c,k){var r=block(c,pad+k*(cw+gap),y,cw);body+=r.svg;hm=Math.max(hm,r.h);});
      y+=hm+34;
    }else{var r=block(b,pad,y,W-2*pad);body+=r.svg;y+=r.h+34;}
  });
  if(spec.footer)body+=G.text(pad,y+4,spec.footer,{size:11,fill:MUTED});
  var H=y+24;
  return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><rect width="100%" height="100%" fill="#ffffff"/>'+body+'</svg>\n';
};
G.save=function(name,spec){if(window.CalcCore)CalcCore.download(name,G.report(spec),'image/svg+xml');};
window.CalcSVG=G;
})();
