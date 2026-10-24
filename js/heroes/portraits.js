/* Signature suit patterns and helmet silhouettes for the expanded roster.
   Shapes are authored as vectors; no downloaded or generated raster art. */
const P=(d,c,stroke='#344355',w=1.2)=>`<path d="${d}" fill="${c}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const M=s=>s+`<g transform="translate(200 0) scale(-1 1)">${s}</g>`;
const E=(x,y,rx,ry,c)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}"/>`;
const blue='#255bab',red='#ca2741',purple='#634796',black='#263344',gold='#dcb762',cyan='#68dbf5';
const raw={
 joneus:['star','blade',red,'#cce6c8'],yullian:['oval','swept',red,'#bce6db'],
 scott:['bands','fork',red,'#e9eff5'],beth:['pearls','swept',red,'#e5eff1'],chuck:['star','blade',red,blue],
 great:['arch','blade',red,'#e3e7ef'],powered:['classic','blade',red,'#f2e8dc'],zearth:['classic','blade',red,'#eeeeee'],
 tiga:['tiga','jewel',purple,gold],dyna:['tiga','blade',red,gold],gaia:['chevron','blade',red,black],agul:['chevron','tall',blue,gold],
 neos:['classic','fork',red,'#f0f3f8'],seven21:['bands','slugger',red,'#bccbd5'],cosmos:['moon','blade',blue,'#c5ecf8'],justice:['ribs','jewel',red,black],
 legend:['ribs','fork',purple,'#dfd7c0'],nexus:['chevron','tall','#82939e',red],noa:['anatomy','tall','#9aaebc','#bd4e40'],next:['anatomy','fork','#687985','#9e332f'],
 max:['tiga','fork',red,gold],xenon:['chevron','triple',red,black],mebius:['flame','fork',red,'#e1eef2'],zero:['ribs','twin',blue,red],hikari:['star','twin',blue,'#c9dee7'],
 saga:['crystal','spikes','#4e6797',cyan],ginga:['crystal','crystal',red,cyan],victory:['chevron','v',black,gold],gingavictory:['crystal','v',black,cyan],
 x:['x','headphones',red,'#f5bd47'],orb:['orb','blade',red,blue],geed:['flame','fork',black,red],
 rosso:['flame','fire',red,gold],blu:['orb','water',blue,cyan],ruebe:['orb','v',black,gold],grigio:['arch','cat','#d38a46','#dbdce6'],gruebe:['crystal','triple',black,red],
 taiga:['ribs','horns',red,blue],titas:['ribs','block',red,gold],fuma:['chevron','tall',blue,'#c1e5f0'],reiga:['ribs','triple',blue,gold],
 ribut:['classic','blade',red,cyan],z:['z','fork',blue,black],trigger:['tiga','jewel',purple,gold],regulos:['anatomy','triple',red,gold],
 decker:['galaxy','jewel',red,gold],dinas:['galaxy','jewel',purple,'#c3b9e4'],blazar:['asymmetric','wild',black,cyan],arc:['x','fork',red,black],omega:['ribs','omega',red,cyan],teo:['chevron','swept',blue,'#bfe6ef']
};
export const MODERN_LOOKS=Object.fromEntries(Object.entries(raw).map(([id,[pattern,crest,primary,accent]])=>[id,{kind:'modern',modern:true,id,pattern,crest,primary,accent}]));
Object.assign(MODERN_LOOKS.powered,{eyes:'#8bd9ff'});
Object.assign(MODERN_LOOKS.zearth,{redHead:true,redFace:true});
Object.assign(MODERN_LOOKS.seven21,{redHead:true,noTimer:true});
for(const id of ['joneus','chuck'])MODERN_LOOKS[id].timer='star';
for(const id of ['great','gaia','agul','mebius','tiga','dyna','trigger','regulos'])MODERN_LOOKS[id].timer='diamond';
MODERN_LOOKS.noa.wings=true;
MODERN_LOOKS.legend.shoulders=true;
MODERN_LOOKS.hikari.shoulders=true;
MODERN_LOOKS.beth.shoulders=true;
MODERN_LOOKS.regulos.armMarks=true;
MODERN_LOOKS.ribut.bracelet=true;
MODERN_LOOKS.titas.bulk=true;
MODERN_LOOKS.zero.redHead=true;
MODERN_LOOKS.blu.eyes='#effdff';
MODERN_LOOKS.z.eyes='#ddf8ff';
MODERN_LOOKS.teo.timer='diamond';
for(const id of ['decker','dinas'])MODERN_LOOKS[id].offsetTimer=true;
function star(x,y,R,r,c){let d='';for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r:R;d+=(i?'L':'M')+(x+Math.cos(a)*q)+' '+(y+Math.sin(a)*q);}return P(d+'Z',c);}
export function modernChest(L,s,r,g){
 const a=L.accent;let v='';
 switch(L.pattern){
 case 'classic':v=M(P('M64 103 Q84 112 91 138 L89 178 L70 181Z',s))+P('M88 153 L112 153 L119 178 L81 178Z',s);break;
 case 'tiga':v=M(P('M64 105 Q77 106 100 132 L100 141 Q76 130 63 117Z',a))+M(P('M67 115 Q81 120 96 137 L93 145 Q79 135 67 128Z',s))+M(P('M88 140 L97 149 L88 180 L76 180Z',L.id==='tiga'||L.id==='trigger'?red:blue));break;
 case 'chevron':v=P('M62 105 L78 106 L100 124 L122 106 L138 105 L133 123 L100 145 L67 123Z',a)+P('M66 109 L77 110 L100 130 L123 110 L134 109 L128 119 L100 139 L72 119Z',s)+M(P('M88 145 L95 151 L90 180 L77 180Z',s));break;
 case 'ribs':v=P('M63 105 L77 103 L100 116 L123 103 L137 105 L130 132 L111 144 L108 179 L92 179 L89 144 L70 132Z',s);for(let i=0;i<4;i++)v+=M(P(`M70 ${109+i*6} L83 ${114+i*6} L92 ${122+i*6}`,'none',a,2.6));break;
 case 'star':v=P('M65 105 L135 105 L128 138 L72 138Z',s)+star(100,123,13,6,L.id==='joneus'?'#4b956b':blue);for(const x of [77,85,115,123])v+=E(x,115,2.4,2.4,a);break;
 case 'bands':v=P('M65 105 L135 105 L130 135 Q100 145 70 135Z',s)+M(P('M69 110 L89 117 L89 122 L68 118Z',a))+M(P('M72 126 L89 131 L89 135 L72 132Z',a));break;
 case 'pearls':v=M(P('M70 102 Q61 102 61 116 L72 118Z',s))+M(P('M78 109 Q74 136 91 149','none',s,8));for(let i=0;i<5;i++)v+=M(E(80+i*3,111+i*7,3.2,3.2,'#f4f5e8'));break;
 case 'oval':v=P('M72 103 L89 107 L100 121 L111 107 L128 103 Q125 143 100 145 Q75 143 72 103Z',s)+P('M92 145 L108 145 L112 180 L88 180Z',s);break;
 case 'moon':v=P('M65 107 Q100 140 135 107 L133 119 Q100 152 67 119Z',s)+M(P('M88 143 L96 148 L88 180 L70 180Z',s));break;
 case 'arch':v=P('M63 105 Q100 93 137 105 L133 120 Q100 103 67 120Z',s)+P('M80 117 Q100 143 120 117 L113 149 L87 149Z',s)+M(P('M86 148 L95 152 L88 181 L73 181Z',s));break;
 case 'anatomy':v=M(P('M67 108 Q80 102 93 114 L94 134 Q74 134 69 121Z',s))+M(P('M89 139 L97 143 L94 178 L83 178Z',s));for(let i=0;i<5;i++)v+=M(P(`M69 ${135+i*7} L86 ${141+i*7}`,'none',a,2));break;
 case 'crystal':v=P('M65 106 L80 109 L91 117 L100 111 L109 117 L120 109 L135 106 L127 132 L100 143 L73 132Z',s)+M(P('M73 111 L87 115 L90 128 L77 123Z',a))+P('M94 109 L100 101 L106 109 L103 119 L97 119Z',a)+M(P('M86 148 L95 151 L88 182 L74 182Z',s));for(const y of [146,157,168])v+=P(`M97 ${y} L103 ${y} L105 ${y+5} L95 ${y+5}Z`,a);break;
 case 'x':v=P('M65 105 L78 105 L100 123 L122 105 L135 105 L110 133 L131 162 L119 167 L100 142 L81 167 L69 162 L90 133Z',s)+M(P('M70 109 L95 131','none',a,3));break;
 case 'orb':v=M(P('M64 107 L77 107 L100 127 L100 137 L67 121Z',s))+E(100,126,15,15,a)+E(100,126,11,11,'#8299ac')+M(P('M90 145 L96 150 L90 181 L74 181Z',s));break;
 case 'flame':v=M(P('M64 106 L78 110 L88 122 L94 117 L100 136 L88 145 L76 132 L70 135Z',a))+M(P('M68 110 L76 114 L91 135 L96 137','none',s,4))+M(P('M88 145 L95 151 L86 182 L73 182Z',s));break;
 case 'galaxy':v=P('M63 104 L79 104 Q95 120 119 107 L133 116 Q112 141 76 138Z','#233456')+P('M64 103 L79 103 Q98 116 120 107 L128 112 Q108 133 74 129Z',a);for(let i=0;i<19;i++){const x=74+(i*13%47),y=111+(i*7%17);v+=E(x,y,i%3?.65:1.2,i%3?.65:1.2,i%2?'#effaff':'#91c5ff');}v+=M(P('M88 143 L96 151 L87 182 L71 182Z',s));break;
 case 'asymmetric':v=P('M66 106 L84 108 L113 137 L108 144 L77 123Z',red)+P('M76 108 L89 112 L122 147 L115 151 L91 129Z',cyan)+P('M127 107 L113 114 L106 127 L114 137 L127 129Z',s)+M(P('M87 145 L95 153 L84 181 L74 180Z',s));break;
 case 'z':v=P('M65 105 L135 105 L133 117 L87 143 L130 143 L128 157 L70 157 L68 144 L113 117 L66 117Z',s);break;
 }
 if(L.id==='zero')v+=P('M65 154 L135 154 L133 184 L67 184Z',red);
 if(L.id==='reiga')v+=M(P('M65 107 L82 109 L95 124 L89 138 L71 129Z',g));
 if(L.id==='regulos')v+=M(P('M71 108 Q82 116 88 126','none',g,4));
 if(L.id==='titas')v+=P('M72 165 L128 165 L128 176 L72 176Z',g);
 return v;
}
export function modernHelmet(L,s,r,g){
 const a=L.accent,k=L.crest;let v='';
 if(k==='blade'||k==='tall')v=P(k==='tall'?'M95 55 L93 25 L100 9 L107 25 L105 55 L100 63Z':'M96 52 L95 29 L100 17 L105 29 L104 52 L100 61Z',s)+P('M100 24 L100 52','none','#f2fbff',1.5);
 if(k==='jewel')v=P('M89 50 L94 30 L100 16 L106 30 L111 50 L104 61 L96 61Z',s)+P('M96 40 L100 27 L104 40 L100 49Z',a);
 if(k==='fork'||k==='triple')v=M(P('M94 57 L86 49 L85 29 L92 36 L96 49Z',s))+P(k==='triple'?'M95 53 L94 27 L100 10 L106 27 L105 53 L100 61Z':'M96 53 L97 31 L100 22 L103 31 L104 53Z',s);
 if(k==='twin')v='<g class="slug">'+M(P('M84 59 L78 47 L80 23 L87 31 L92 50 L91 60Z',s))+'</g>'+P('M97 51 L100 42 L103 51 L100 59Z','#58cdb7');
 if(k==='v')v=P('M75 30 L87 33 L100 51 L113 33 L125 30 L119 53 L100 68 L81 53Z',a)+P('M83 35 L100 57 L117 35','none',s,4);
 if(k==='crystal')v=P('M89 54 L87 32 L99 10 L111 32 L111 54 L100 63Z',s)+P('M95 49 L93 32 L100 17 L107 32 L105 49Z',a)+P('M100 20 L100 47','none','#f2ffff',2);
 if(k==='swept')v=M(P('M83 56 Q76 36 93 26 L95 39 L91 58Z',s))+P('M95 53 Q93 31 104 20 L107 29 L103 54Z',s);
 if(k==='fire')v=M(P('M80 55 L71 37 L76 28 L84 37 L85 21 L95 45 L95 59Z',g))+P('M95 55 L95 26 L100 13 L105 26 L105 55Z',red);
 if(k==='water')v=P('M89 56 Q75 36 93 23 Q87 40 98 42 Q104 26 115 25 Q106 36 111 50 L103 63Z',s)+P('M95 50 Q88 37 97 28 L101 46 L105 54Z',a);
 if(k==='cat')v=M(P('M79 57 L76 30 L91 45 L94 58Z',s))+P('M95 52 L100 39 L105 52 L100 61Z',a);
 if(k==='horns')v=M(P('M80 54 Q68 42 73 27 L81 40 L91 44 L93 57Z',s))+P('M96 53 L95 30 L100 18 L105 30 L104 53Z',s);
 if(k==='headphones')v=M(P('M71 56 L64 58 L64 79 L71 84 L77 73Z',s))+P('M96 54 L95 32 L100 18 L105 32 L104 54Z',s);
 if(k==='block')v=P('M89 55 L88 34 L95 27 L105 27 L112 34 L111 55Z',s)+P('M95 31 L105 31 L105 46 L95 46Z',a);
 if(k==='omega')v='<g class="slug">'+P('M89 56 L85 41 L91 20 L98 34 L100 17 L108 31 L115 40 L111 56Z',r)+P('M93 49 L100 31 L107 49Z',s)+'</g>';
 if(k==='wild')v=P('M88 59 L87 40 L94 32 L95 15 L105 24 L108 43 L114 52 L105 62Z',s)+P('M94 49 L98 26 L102 38 L100 56Z',cyan)+P('M104 46 L109 32 L112 46 L121 54 L114 61Z',red);
 if(k==='spikes')v=M(P('M80 59 L70 43 L72 22 L80 35 L87 19 L90 42 L96 56Z',s))+P('M94 55 L94 24 L100 8 L106 24 L106 55Z',a);
 if(k==='slugger')v=`<g class="slug">${P('M94 55 L90 30 L100 13 L110 30 L106 55Z',s)}</g>`;
 if(L.id==='blazar')v+=P('M80 60 L89 65 L86 78 L82 72Z',red)+P('M119 59 L115 73 L110 80','none',cyan,3);
 return v;
}
export function modernShoulders(L,s){
 if(!L.shoulders)return '';
 return M(P(L.id==='beth'?'M73 101 Q60 87 59 106 L65 120 L78 113Z':'M76 105 L62 86 L49 111 L68 123 L79 117Z',s));
}
