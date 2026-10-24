import {MODERN_LOOKS, modernChest, modernHelmet, modernShoulders} from './portraits.js?v=catalog-63b';
/* Ultra portrait system. Self-contained vector art shared by cards,
   family tree, certificate and the world's hologram. Keep animation hooks. */
const INK='#344355', RED='#c91e35';
let uid=0;
const LOOKS={
  ultraman:{kind:'classic',crest:'fin'}, zoffy:{kind:'classic',crest:'fin',medals:true},
  jack:{kind:'classic',crest:'fin',double:true,bracelet:true}, eighty:{kind:'eighty',crest:'eighty'},
  seven:{kind:'seven',crest:'slugger',redHead:true,noTimer:true},
  ace:{kind:'ace',crest:'ace'}, taro:{kind:'taro',crest:'horns',redHead:true},
  father:{kind:'father',crest:'bighorns',beard:true}, mother:{kind:'mother',crest:'mother'},
  leo:{kind:'leo',crest:'leo',redHead:true}, astra:{kind:'astra',crest:'astra',redHead:true,shackle:true},
  king:{kind:'king',crest:'king',beard:true,cape:true}
};
const path=(d,fill,stroke=INK,w=1.25)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const mirror=s=>s+`<g transform="translate(200 0) scale(-1 1)">${s}</g>`;
const ellipse=(x,y,rx,ry,fill,stroke='none',w=1)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
function chest(L,s,r,g){
  if(L.modern)return modernChest(L,s,r,g);
  const k=L.kind;
  let a='';
  if(['classic','mother','eighty'].includes(k)){
    a+=mirror(path(k==='mother'?'M63 105 Q83 119 87 145 L82 178 L64 178 Z':'M63 104 Q77 111 88 136 L84 180 L63 180 Z',r,'none'));
    a+=path('M84 174 Q100 167 116 174 L119 188 L81 188Z',r,'none');
    if(L.double) a+=mirror(path('M77 108 Q94 133 91 153 L88 176','none',RED,2));
    if(k==='eighty') a+=mirror(path('M65 120 L91 130 L89 138 L65 131Z',r,'none'));
    if(k==='mother') a+=path('M88 142 Q100 149 112 142 L109 167 L91 167Z',r,'none');
  }else if(k==='ace'){
    a+=path('M64 105 Q100 95 136 105 L128 127 L111 134 L109 178 L91 178 L89 134 L72 127Z',s);
    a+=mirror(path('M68 109 L81 114 L84 126','none','#778b9b',2));
  }else if(['seven','taro','father'].includes(k)){
    a+=path('M64 105 Q100 96 136 105 L134 128 Q119 127 110 137 L90 137 Q81 127 66 128Z',s);
    for(let i=0;i<9;i++){
      const x=70+i*7.5, y=110-Math.sin(i/8*Math.PI)*5;
      a+=path(`M${x} ${y} l0 13`,'none','#697e90',2.5);
      a+=ellipse(x,y,1.4,1.2,'#fff');
    }
    if(k!=='seven') a+=path('M91 137 L109 137 L113 178 L87 178Z',s,'none');
    if(k==='father') a+=path('M69 171 L131 171 L130 179 L70 179Z',s)+ellipse(100,175,5,4,g);
  }else if(['leo','astra'].includes(k)){
    a+=path(k==='leo'?'M71 105 L87 109 L100 119 L113 109 L129 105 L123 132 L108 143 L92 143 L77 132Z':'M76 105 L90 114 L100 126 L110 114 L124 105 L118 132 L100 146 L82 132Z',s);
    a+=mirror(path('M80 108 L84 126 L94 133','none','#af8132',2.5));
    if(k==='leo') a+=path('M67 164 L133 164 L131 176 L69 176Z',s)+path('M91 163 L109 163 L109 177 L91 177Z',g);
  }else if(k==='king'){
    a+=path('M64 106 L80 102 L100 123 L120 102 L136 106 L128 141 L113 149 L108 176 L92 176 L87 149 L72 141Z',s);
    a+=mirror(path('M73 111 L84 127 L88 143','none',g,5));
    a+=path('M69 167 L131 167 L130 179 L70 179Z',g);
    a+=ellipse(100,173,7,5,'#bd243d',INK);
  }
  if(L.medals) for(const sd of [-1,1]) for(let i=0;i<6;i++){
    const x=100+sd*(15+(i%3)*7),y=112+Math.floor(i/3)*8;
    a+=ellipse(x,y,2.5,2.5,s,INK,.7);
  }
  return a;
}
function helmet(L,s,r,g){
  if(L.modern)return modernHelmet(L,s,r,g);
  const k=L.crest, f=d=>path(d,s);
  if(k==='fin') return f('M96 49 L96 25 Q100 12 104 25 L104 49 L100 63Z')+path('M100 23 L100 52','none','#fff',1.5);
  if(k==='eighty') return f('M91 46 L94 26 Q100 18 106 26 L109 46 L104 57 L96 57Z')+path('M100 24 L100 49','none','#718797',2);
  if(k==='slugger') return `<g class="slug">${f('M93 48 L90 27 Q98 8 106 16 L111 27 L106 48 L101 57Z')}${path('M98 44 L98 24 L103 18','none','#fff',2)}</g>`+ellipse(100,53,4,5,'#6af5ae',INK);
  if(k==='ace') return path('M91 51 L88 28 Q100 3 112 28 L109 51 L104 61 L96 61Z',s)+ellipse(100,28,4.8,8.5,'#26384e')+path('M100 40 L100 57','none','#fff',2);
  if(k==='horns'||k==='bighorns'){
    const big=k==='bighorns';
    return mirror(f(big?'M77 57 Q48 47 52 12 Q59 36 79 37 L85 51Z':'M78 51 Q65 35 71 22 Q74 35 88 39 L89 51Z'))+f('M96 49 L96 25 L100 18 L104 25 L104 49 L100 61Z')+ellipse(100,53,3,4,'#52dba5',INK);
  }
  if(k==='mother') return mirror(f('M78 44 Q69 31 61 39 Q52 57 61 89 L68 100 L71 72 L76 64Z')+path('M63 47 L63 77','none','#8498a9',2))+f('M95 48 L94 28 Q100 17 106 28 L105 48 L100 58Z');
  if(k==='leo') return mirror(f('M81 59 L67 53 L65 35 L76 42 L78 25 L91 41 L95 53Z'))+f('M94 53 L94 27 L100 10 L106 27 L106 53 L100 65Z')+ellipse(100,42,3.5,5,'#52dba5',INK);
  if(k==='astra') return mirror(f('M79 58 L70 45 L75 32 L88 43 L92 56Z'))+f('M94 51 L94 27 L100 18 L106 27 L106 51 L100 61Z');
  return mirror(f('M78 55 L68 38 L75 24 L86 31 L91 19 L96 40 L91 56Z'))+path('M94 50 L94 22 L100 10 L106 22 L106 50Z',s)+ellipse(100,32,4,6,'#b62c42',INK);
}
function face(L,id,s,r,g){
  const k=L.kind, silver=s;
  let a=mirror(ellipse(70,68,4.5,9,s,INK)+path('M69 64 L69 72','none','#647a90',1.4));
  const head='M100 30 Q126 30 129 58 L127 79 Q122 96 108 103 L92 103 Q78 96 73 79 L71 58 Q74 30 100 30Z';
  a+=path(head,L.redHead?r:s);
  if(L.redHead&&!L.redFace) a+=path(k==='seven'?'M79 53 L92 49 L100 58 L108 49 L121 53 L122 78 L113 95 L100 101 L87 95 L78 78Z':'M78 56 L91 51 L100 62 L109 51 L122 56 L121 81 L109 98 L91 98 L79 81Z',s);
  a+=mirror(path('M76 77 L84 85 L88 95','none','#879aa9',1.5));
  if(k==='eighty') a+=path('M77 52 Q88 42 97 55 L100 60 L103 55 Q112 42 123 52','none',r,4);
  const eyes=k==='seven'?'M78 59 L94 60 L95 70 L81 73 L77 68Z':k==='ace'?'M78 59 Q88 52 96 64 L93 73 Q82 77 78 68Z':k==='king'?'M78 60 L95 62 L94 73 L81 72Z':'M78 59 Q88 54 96 65 Q94 76 83 75 Q77 71 78 59Z';
  a+=mirror(path(eyes,k==='king'?'#e44950':L.eyes||`url(#eye${id})`,INK,1.4)+path('M81 61 L88 60','none','#fff9db',1.4));
  a+=path('M100 64 L96 81 L100 84 L104 81Z','#b2c4d1','#73899b',.6);
  a+=path('M90 88 L96 86 L104 86 L110 88 L106 94 L94 94Z','#a0b1bd',INK,.9)+path('M94 90 L106 90','none','#485e71',1);
  if(L.beard) a+=path(k==='king'?'M79 84 L89 95 L100 98 L111 95 L121 84 L118 101 L110 110 L100 117 L90 110 L82 101Z':'M82 91 L92 98 L100 99 L108 98 L118 91 L113 104 L100 110 L87 104Z',silver)+mirror(path('M88 99 L94 107','none','#8299aa',1));
  a+=helmet(L,s,r,g);
  return a;
}
function leg(L,sd,id,s,r,g){
  const classic=['classic','mother','eighty'].includes(L.kind), c=classic?s:r;
  let a=path('M83 173 Q91 171 99 179 L97 207 L94 235 L92 241 L77 241 L78 211 L76 191Z',c);
  a+=path('M78 231 L94 231 L97 241 L98 246 L73 246 L74 240Z',classic?r:s);
  a+=path('M83 184 L86 207 L84 229','none',classic?r:s,classic?5:2);
  a+=path('M79 243 L94 243','none','#ffffff',1.2);
  if(L.shackle&&sd===1) a+=path('M76 215 L96 215 L96 223 L77 223Z',g)+path('M78 219 L94 219','none','#73592f',1);
  return `<g transform="${sd===1?'translate(200 0) scale(-1 1)':''}">${a}</g>`;
}
function arm(points,c,s,bracelet){
  const d='M'+points.map(p=>p.join(' ')).join(' L'),[x,y]=points.at(-1);
  return path(d,'none',INK,18)+path(d,'none',c,15)+path(d,'none',s,3)+ellipse(x,y,7.5,8,c,INK,1.2)+(bracelet?path(`M${x-7} ${y-12} l14 0 l0 6 l-14 0Z`,'#d6b15e',INK,1):'');
}
export function drawHero(look,pose='stand'){
  const L=LOOKS[look]||MODERN_LOOKS[look];
  if(!L)throw new Error('Missing Ultra portrait: '+look);
  const id=++uid;
  const s=`url(#silver${id})`,r=`url(#red${id})`,g=`url(#gold${id})`;
  const classic=['classic','mother','eighty'].includes(L.kind), suit=classic?s:r;
  const shape='M72 103 Q83 99 90 103 L110 103 Q117 99 128 103 L133 117 L122 141 L119 166 L125 180 Q100 193 75 180 L81 166 L78 141 L67 117Z';
  let a=`<svg class="hero-svg" viewBox="0 -14 200 264" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
  <linearGradient id="silver${id}" x1="0" x2="1" y2=".25"><stop stop-color="#859aa9"/><stop offset=".3" stop-color="#e4eef3"/><stop offset=".48" stop-color="#f9fcff"/><stop offset=".7" stop-color="#becfda"/><stop offset="1" stop-color="#708697"/></linearGradient>
  <linearGradient id="red${id}" x2="1" y2=".3"><stop stop-color="${L.primary||'#85172b'}"/><stop offset=".45" stop-color="${L.primary||'#ec3b4e'}"/><stop offset="1" stop-color="${L.primary||'#a4122b'}"/></linearGradient>
  <linearGradient id="gold${id}"><stop stop-color="#98703b"/><stop offset=".45" stop-color="#ffe6a2"/><stop offset="1" stop-color="#ba8a36"/></linearGradient>
  <radialGradient id="eye${id}" cx=".35" cy=".3"><stop stop-color="#fff"/><stop offset=".6" stop-color="#fff8c6"/><stop offset="1" stop-color="#f2c863"/></radialGradient>
  <clipPath id="body${id}"><path d="${shape}"/></clipPath></defs><g class="hero">`;
  if(L.wings)a+=mirror(path('M78 114 L52 78 L48 39 L61 54 L72 83 L88 105Z',s));
  if(L.modern)a+=modernShoulders(L,s);
  if(L.cape) a+=path('M68 104 Q100 92 132 104 L151 237 Q100 251 49 237Z','#602b56')+path('M68 107 L57 232 L78 219 L86 118 M132 107 L143 232 L122 219 L114 118',r)+path('M62 105 Q100 89 138 105 L131 119 Q100 108 69 119Z',g);
  a+=leg(L,-1,id,s,r,g)+`<g${pose==='kick'?' transform="rotate(-65 114 180)"':''}>${leg(L,1,id,s,r,g)}</g>`;
  a+=path('M89 90 L111 90 L114 109 L86 109Z',s);
  if(pose!=='beam') a+=arm([[73,112],[61,140],[55,169]],suit,classic?RED:'#e3b1b5',L.bracelet);
  a+=path(shape,suit)+`<g clip-path="url(#body${id})">${chest(L,s,r,g)}</g>`+mirror(path('M78 142 Q88 149 91 164','none',classic?'#a5b7c5':'#921c30',1.2));
  if(!L.noTimer){
    const x=L.offsetTimer?86:100,y=L.kind==='leo'||L.kind==='astra'?132:125;
    const shell=L.timer==='diamond'?path(`M${x} ${y-10} L${x+8} ${y} L${x} ${y+10} L${x-8} ${y}Z`,s):ellipse(x,y,7.5,9,s,INK);
    const core=L.timer==='diamond'?path(`M${x} ${y-6} L${x+4} ${y} L${x} ${y+6} L${x-4} ${y}Z`,'#42cfff','none'):ellipse(x,y,4.5,6,L.id==='nexus'||L.id==='next'?'#e4474e':'#42cfff');
    a+=`<g class="timer">${shell}<g class="tcore">${core}</g>${ellipse(x-2,y-3,1.6,2.1,'#eeffff')}</g>`;
  }
  if(pose==='beam') a+=arm([[127,114],[158,190],[158,140]],suit,'#becbd4',false)+arm([[73,114],[105,172],[170,172]],suit,'#becbd4',L.bracelet);
  else a+=arm(pose==='kick'?[[127,112],[145,126],[159,111]]:[[127,112],[139,140],[145,169]],suit,classic?RED:'#e3b1b5',false);
  if(L.armMarks)a+=mirror(path('M62 140 L68 148 L62 156 L56 148Z',g));
  a+=face(L,id,s,r,g);
  return a+'</g><g class="fx"></g></svg>';
}
