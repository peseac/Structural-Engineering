/* export-dxf.js – minimal DXF writer (AutoCAD R12 / AC1009, opens in AutoCAD, BricsCAD, LibreCAD, FreeCAD, QCAD)
   ------------------------------------------------------------------
   var X = CalcDXF.create([[name, colour, linetype], …]);   layers; linetypes CONTINUOUS, CENTER, DASHED
   X.line(layer, x1, y1, x2, y2)
   X.circle(layer, x, y, r)
   X.text(layer, x, y, height, text, rotation)    only ASCII; other characters become '?'
   X.path(layer, [[x,y], …], closed)
   X.dimV(x, y1, y2, label, layer)                simple vertical dimension line with ticks
   X.dimH(y, x1, x2, label, layer)                the same, horizontal
   X.toString()                                   text of the .dxf file
   CalcDXF.save(name, X)                          downloads it
   Units are whatever the page uses; the calculators draw 1 unit = 1 mm.
*/
(function(){
'use strict';
var D={};
D.create=function(layers){
  var E=[],X={};
  function f(v){return (+(+v).toFixed(3)).toString();}
  X.line=function(l,x1,y1,x2,y2){E.push('0','LINE','8',l,'10',f(x1),'20',f(y1),'30','0','11',f(x2),'21',f(y2),'31','0');};
  X.circle=function(l,x,y,r){E.push('0','CIRCLE','8',l,'10',f(x),'20',f(y),'30','0','40',f(r));};
  X.text=function(l,x,y,h,t,rot){
    E.push('0','TEXT','8',l,'10',f(x),'20',f(y),'30','0','40',f(h),'1',String(t).replace(/[^\x20-\x7e]/g,'?'));
    if(rot)E.push('50',f(rot));
  };
  X.path=function(l,p,close){
    for(var k=1;k<p.length;k++)X.line(l,p[k-1][0],p[k-1][1],p[k][0],p[k][1]);
    if(close)X.line(l,p[p.length-1][0],p[p.length-1][1],p[0][0],p[0][1]);
  };
  X.dimV=function(x,y1,y2,label,l){
    l=l||'DIM';X.line(l,x,y1,x,y2);X.line(l,x-1.5,y1,x+1.5,y1);X.line(l,x-1.5,y2,x+1.5,y2);
    X.text(l,x-1.5,(y1+y2)/2-String(label).length*1.2,3,label,90);
  };
  X.dimH=function(y,x1,x2,label,l){
    l=l||'DIM';X.line(l,x1,y,x2,y);X.line(l,x1,y-1.5,x1,y+1.5);X.line(l,x2,y-1.5,x2,y+1.5);
    X.text(l,(x1+x2)/2-String(label).length*1.2,y+1.5,3,label);
  };
  X.toString=function(){
    var H=['0','SECTION','2','HEADER','9','$ACADVER','1','AC1009','0','ENDSEC',
      '0','SECTION','2','TABLES',
      '0','TABLE','2','LTYPE','70','3',
      '0','LTYPE','2','CONTINUOUS','70','0','3','Solid line','72','65','73','0','40','0.0',
      '0','LTYPE','2','CENTER','70','0','3','Center ____ _ ____','72','65','73','4','40','20.0','49','12.5','49','-2.5','49','2.5','49','-2.5',
      '0','LTYPE','2','DASHED','70','0','3','Dashed __ __ __','72','65','73','2','40','7.5','49','5.0','49','-2.5',
      '0','ENDTAB',
      '0','TABLE','2','LAYER','70',String(layers.length)];
    layers.forEach(function(l){H.push('0','LAYER','2',l[0],'70','0','62',String(l[1]),'6',l[2]||'CONTINUOUS');});
    H.push('0','ENDTAB','0','ENDSEC','0','SECTION','2','ENTITIES');
    return H.concat(E,['0','ENDSEC','0','EOF']).join('\r\n')+'\r\n';
  };
  return X;
};
D.save=function(name,X){if(window.CalcCore)CalcCore.download(name,X.toString(),'application/dxf');};
window.CalcDXF=D;
})();
