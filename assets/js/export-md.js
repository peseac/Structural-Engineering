/* export-md.js – Markdown export for the calculators
   ------------------------------------------------------------------
   CalcMD.text(html)          HTML fragment -> plain Markdown text (<sub> -> _{}, tags removed)
   CalcMD.table(head, rows)   Markdown table
   CalcMD.steps(html)         calculation steps -> Markdown; equations stay LaTeX in $$ … $$
                              (GitHub, Obsidian, Typora and VS Code render them)
   CalcMD.inputs(rows)        table of the inputs from CalcCore.form(...).rows()
   CalcMD.save(name, lines)   joins the lines and downloads the .md file
*/
(function(){
'use strict';
var M={};
M.text=function(s){
  return String(s)
    .replace(/<sub>(.*?)<\/sub>/g,'_{$1}').replace(/<sup>(.*?)<\/sup>/g,'^{$1}')
    .replace(/<br\s*\/?>/g,' ').replace(/<[^>]+>/g,'')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&')
    .replace(/[ \t]+/g,' ').trim();
};
function cell(s){return M.text(s).replace(/\|/g,'\\|');}
M.table=function(head,rows){
  var t='| '+head.map(cell).join(' | ')+' |\n|'+head.map(function(){return ' --- |';}).join('')+'\n';
  rows.forEach(function(r){t+='| '+r.map(function(c){return cell(c===null||c===undefined?'–':c);}).join(' | ')+' |\n';});
  return t;
};
M.steps=function(html){
  var out=[],t=html;
  t=t.replace(/<div class="eq">\\\[([\s\S]*?)\\\]<\/div>/g,function(m,e){out.push('$$'+e.trim()+'$$');return '\u0001'+(out.length-1)+'\u0001';});
  t=t.replace(/<h4>([\s\S]*?)<\/h4>/g,function(m,h){return '\n### '+M.text(h)+'\n\n';});
  t=t.replace(/<p class="note">([\s\S]*?)<\/p>/g,function(m,p){return '\n*'+M.text(p)+'*\n\n';});
  t=t.replace(/<p>([\s\S]*?)<\/p>/g,function(m,p){return '\n'+M.text(p)+'\n\n';});
  t=M.text(t.replace(/\n/g,'\u0002')).replace(/\u0002/g,'\n');
  t=t.replace(/\u0001(\d+)\u0001/g,function(m,k){return '\n\n'+out[+k]+'\n\n';});
  return t.replace(/[ \t]*\n[ \t]*/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
};
M.inputs=function(rows){
  return M.table(['Input','Value','Unit','Source'],rows.map(function(r){return [r[0],r[1],r[2],r[3]==='default'?'default':'entered'];}));
};
M.save=function(name,lines){
  if(window.CalcCore)CalcCore.download(name,lines.join('\n'),'text/markdown');
};
window.CalcMD=M;
})();
