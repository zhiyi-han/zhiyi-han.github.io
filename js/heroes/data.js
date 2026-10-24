import { EXTRA_HEROES } from './roster.js?v=catalog-63b';
/* ============================================================
   滿滿英雄基地 · Max's Hero Base — hero data

   One entry per hero. Text is written for a five-year-old and read
   aloud (zh = Cantonese voice, en = British English voice), so keep
   sentences short. `look` drives the original chibi drawing in
   draw.js; `move` picks the special-move animation in heroes.js.
   Heights and weights are the official figures.
   ============================================================ */

export const SERIES = [
  {
    id: 'ultra',
    icon: '🌟',
    t: { zh: '奧特曼全員圖鑑', en: 'The Ultra Hero Encyclopedia' },
    sub: { zh: '經典、新生代與傳說的光之巨人', en: 'Classic, New Generation and legendary Giants of Light' },
  },
];

/* move kinds: ray | slugger | ring | kick | heal | king | array | horn */
const ORIGINAL_HEROES = [
  {
    id: 'king', series: 'ultra', n: 0,
    name: { zh: '奧特之王', en: 'Ultraman King' },
    home: { zh: '王者之星', en: 'Planet King' },
    h: 58, w: 56000,
    move: 'king', moveName: { zh: '國王光線', en: 'King Flasher' }, beam: '#ffd75e',
    tag: { zh: '最有智慧的老爺爺', en: 'The wisest grandpa of all' },
    story: {
      zh: '奧特之王已經三十萬歲啦，是光之國最有智慧的老爺爺。他有長長的白鬍子，還有一件紅色大披風。他平時住在遙遠的王者之星，只要奧特兄弟遇到大麻煩，他就會飛來幫忙。很久以前，他把最壞的貝利亞關進了宇宙監獄。',
      en: "Ultraman King is three hundred thousand years old — the wisest grandpa in the whole Land of Light. He has a long white beard and a big red cape. He lives far away on Planet King, but whenever the Ultra Brothers are in big trouble, he flies in to help. Long ago, he locked the bad Ultraman Belial away in a space prison.",
    },
    family: [], look: 'king',
  },
  {
    id: 'father', series: 'ultra', n: 0,
    name: { zh: '奧特之父', en: 'Father of Ultra' },
    home: { zh: 'M78 星雲 · 光之國', en: 'Land of Light, M78 Nebula' },
    h: 45, w: 50000,
    move: 'array', moveName: { zh: '父親光線', en: 'Father Shot' }, beam: '#9fe3ff',
    tag: { zh: '宇宙警備隊的大隊長', en: 'Chief of the Space Garrison' },
    story: {
      zh: '奧特之父頭上有一對又大又彎的角，是宇宙警備隊的大隊長，負責保護整個宇宙的和平。他是奧特之母的丈夫，也是泰羅的爸爸。他很勇敢，也很溫柔，所有奧特戰士都很尊敬他。',
      en: "Father of Ultra has a pair of huge curly horns. He is the chief of the Space Garrison, which keeps the whole universe safe. He is married to Mother of Ultra, and he is Taro's dad. He is brave and gentle, and every Ultra warrior looks up to him.",
    },
    family: [['mother', 'wife'], ['taro', 'son']], look: 'father',
  },
  {
    id: 'mother', series: 'ultra', n: 0,
    name: { zh: '奧特之母', en: 'Mother of Ultra' },
    home: { zh: 'M78 星雲 · 光之國', en: 'Land of Light, M78 Nebula' },
    h: 40, w: 32000,
    move: 'heal', moveName: { zh: '母親光線', en: 'Mother Ray' }, beam: '#ffb3d1',
    tag: { zh: '銀十字軍的隊長', en: 'Leader of the Silver Cross' },
    story: {
      zh: '奧特之母是銀十字軍的隊長，銀十字軍就像宇宙的醫生和護士。哪位奧特戰士受傷了，她就用溫暖的光把他治好。她是泰羅的媽媽，也像所有奧特兄弟的媽媽一樣，照顧大家。',
      en: "Mother of Ultra leads the Silver Cross — they are like the doctors and nurses of space. When an Ultra warrior gets hurt, she heals him with her warm light. She is Taro's mum, and she looks after all the Ultra Brothers like a mum too.",
    },
    family: [['father', 'husband'], ['taro', 'son']], look: 'mother',
  },
  {
    id: 'zoffy', series: 'ultra', n: 1,
    name: { zh: '佐菲', en: 'Zoffy' },
    home: { zh: 'M78 星雲 · 光之國', en: 'Land of Light, M78 Nebula' },
    h: 45, w: 45000,
    move: 'ray', moveName: { zh: 'M87 光線', en: 'M87 Ray' }, beam: '#bfe8ff',
    tag: { zh: '奧特兄弟的大哥', en: 'The eldest Ultra Brother' },
    story: {
      zh: '佐菲是奧特兄弟的大哥，也是宇宙警備隊的隊長。他胸口和肩膀上有一粒粒的星星勳章，那是他立下大功的證明。初代奧特曼輸給傑頓的時候，就是佐菲飛到地球，帶來兩條生命，救回了奧特曼和他的地球朋友早田。',
      en: "Zoffy is the eldest of the Ultra Brothers and captain of the Space Garrison. The little star medals on his chest and shoulders show all the brave things he has done. When Ultraman lost to Zetton, Zoffy flew to Earth with two lives — one for Ultraman, and one for his human friend Hayata.",
    },
    family: [['ultraman', 'brother']], look: 'zoffy',
  },
  {
    id: 'ultraman', series: 'ultra', n: 2,
    name: { zh: '初代奧特曼', en: 'Ultraman' },
    home: { zh: 'M78 星雲 · 光之國', en: 'Land of Light, M78 Nebula' },
    h: 40, w: 35000,
    move: 'ray', moveName: { zh: '斯派修姆光線', en: 'Specium Ray' }, beam: '#e9f7ff',
    tag: { zh: '第一個來地球的奧特曼', en: 'The very first Ultraman on Earth' },
    story: {
      zh: '初代奧特曼是第一個來到地球的奧特曼。他和科學特搜隊的早田變成一體，一起保護地球。他雙手交叉成十字，就可以射出斯派修姆光線。在地球上他只可以戰鬥三分鐘，胸口的彩色計時器一閃紅燈，就要快點打敗怪獸啦！',
      en: "Ultraman was the first Ultra hero to come to Earth. He joined together with Hayata of the Science Patrol to protect our planet. When he crosses his arms like a plus sign, out shoots the Specium Ray! On Earth he can only fight for three minutes — when the Color Timer on his chest flashes red, he has to beat the monster fast!",
    },
    family: [['zoffy', 'brother']], look: 'ultraman',
  },
  {
    id: 'seven', series: 'ultra', n: 3,
    name: { zh: '賽文', en: 'Ultraseven' },
    home: { zh: 'M78 星雲 · 光之國', en: 'Land of Light, M78 Nebula' },
    h: 40, w: 35000,
    move: 'slugger', moveName: { zh: '頭鏢', en: 'Eye Slugger' }, beam: '#9cf2a8',
    tag: { zh: '頭上有飛鏢的紅色戰士', en: 'The red warrior with a boomerang on his head' },
    story: {
      zh: '賽文全身紅色，頭上那塊頭鏢可以拿下來，像迴旋鏢一樣飛出去，再飛回頭上。他沒有彩色計時器，額頭上的綠色光燈會發射艾美利姆光線。他在地球上的名字叫諸星彈。後來他還做了雷歐的師父，他的兒子就是賽羅奧特曼！',
      en: "Ultraseven is red all over. The Eye Slugger on his head comes off and flies like a boomerang, then zooms back home! He has no Color Timer — instead, the green Beam Lamp on his forehead fires the Emerium Ray. On Earth he was called Dan Moroboshi. Later he became Leo's teacher, and his son is Ultraman Zero!",
    },
    family: [['leo', 'student']], look: 'seven',
  },
  {
    id: 'jack', series: 'ultra', n: 4,
    name: { zh: '傑克', en: 'Ultraman Jack' },
    home: { zh: 'M78 星雲 · 光之國', en: 'Land of Light, M78 Nebula' },
    h: 40, w: 35000,
    move: 'ring', moveName: { zh: '奧特手鐲', en: 'Ultra Bracelet' }, beam: '#ffe27a',
    tag: { zh: '戴着神奇手鐲的奧特曼', en: 'The Ultraman with a magic bracelet' },
    story: {
      zh: '傑克也叫「歸來的奧特曼」，身上有兩條細細的紅線。賽文送了他一隻神奇的奧特手鐲，手鐲可以變成光圈、長槍和盾牌，甚麼怪獸都難不到他。他在地球上和鄉秀樹一起戰鬥。',
      en: "Jack is also called 'The Return of Ultraman', and he has thin double red lines on his body. Ultraseven gave him a magic Ultra Bracelet — it can turn into a spinning ring, a spear or a shield, so no monster can stop him! On Earth, he fought together with Hideki Go.",
    },
    family: [['seven', 'gift']], look: 'jack',
  },
  {
    id: 'ace', series: 'ultra', n: 5,
    name: { zh: '艾斯', en: 'Ultraman Ace' },
    home: { zh: 'M78 星雲 · 光之國', en: 'Land of Light, M78 Nebula' },
    h: 40, w: 45000,
    move: 'ray', moveName: { zh: '梅塔利姆光線', en: 'Metallium Ray' }, beam: '#ffc46b',
    tag: { zh: '兩個人一起變身的奧特曼', en: 'Two friends transform together' },
    story: {
      zh: '艾斯頭上的角中間有個洞，可以發出很厲害的光。他最特別的地方，是要兩個人一起才可以變身：北斗和南，把戴着戒指的手碰在一起，就會變成艾斯！他打敗了很多異次元人亞波爾派來的超獸。',
      en: "Ace has a crest with a hole in the middle that fires powerful light. The most special thing about him: it takes two people to transform! When Hokuto and Minami touch their rings together, they become Ace! He beat lots of super-beasts sent by the sneaky Yapool.",
    },
    family: [], look: 'ace',
  },
  {
    id: 'taro', series: 'ultra', n: 6,
    name: { zh: '泰羅', en: 'Ultraman Taro' },
    home: { zh: 'M78 星雲 · 光之國', en: 'Land of Light, M78 Nebula' },
    h: 53, w: 55000,
    move: 'horn', moveName: { zh: '斯特利姆光線', en: 'Storium Ray' }, beam: '#ff9a7a',
    tag: { zh: '奧特之父和奧特之母的兒子', en: 'Son of Father and Mother of Ultra' },
    story: {
      zh: '泰羅是奧特之父和奧特之母的兒子，頭上有一對像爸爸的奧特之角。他把雙手舉高再擺成 T 字，就可以射出斯特利姆光線。長大後他做了宇宙警備隊的老師，教過夢比優斯。他的兒子是泰迦奧特曼！',
      en: "Taro is the son of Father and Mother of Ultra, and he has Ultra Horns just like his dad. He raises his arms high, then makes a T shape to fire the Storium Ray! When he grew up, he became a teacher at the Space Garrison and taught Ultraman Mebius. His son is Ultraman Taiga!",
    },
    family: [['father', 'dad'], ['mother', 'mum']], look: 'taro',
  },
  {
    id: 'leo', series: 'ultra', n: 7,
    name: { zh: '雷歐', en: 'Ultraman Leo' },
    home: { zh: 'L77 星雲 · 獅子座', en: 'Nebula L77, in Leo' },
    h: 52, w: 48000,
    move: 'kick', moveName: { zh: '雷歐飛踢', en: 'Leo Kick' }, beam: '#ffb347',
    tag: { zh: '功夫最厲害的獅子戰士', en: 'The kung-fu lion warrior' },
    story: {
      zh: '雷歐不是來自光之國，他來自獅子座的 L77 星雲。他最擅長功夫，飛起一腳雷歐飛踢，連最硬的怪獸都會被踢飛。賽文是他的師父，教他每天努力練習。他還有一個弟弟，叫阿斯特拉。',
      en: "Leo doesn't come from the Land of Light — he's from Nebula L77, in the Leo constellation. He is a kung-fu master, and his flying Leo Kick can knock away even the toughest monster! Ultraseven was his teacher and trained him hard every day. He has a little brother called Astra.",
    },
    family: [['astra', 'brother'], ['seven', 'teacher']], look: 'leo',
  },
  {
    id: 'astra', series: 'ultra', n: 8,
    name: { zh: '阿斯特拉', en: 'Astra' },
    home: { zh: 'L77 星雲 · 獅子座', en: 'Nebula L77, in Leo' },
    h: 50, w: 49000,
    move: 'kick', moveName: { zh: '阿斯特拉踢', en: 'Astra Kick' }, beam: '#ffd36b',
    tag: { zh: '雷歐的弟弟', en: "Leo's little brother" },
    story: {
      zh: '阿斯特拉是雷歐的弟弟，兩兄弟長得很像。你知道怎樣分辨嗎？阿斯特拉的腳上有一個金色的腳環，那是他以前被壞人抓住時留下的。兩兄弟一起飛踢的時候，力量大到連大怪獸也擋不住！',
      en: "Astra is Leo's little brother, and the two look almost the same. Do you know how to tell them apart? Astra has a golden ring on his leg, left over from when bad guys once caught him. When the two brothers kick together, not even a giant monster can stand up to them!",
    },
    family: [['leo', 'brother']], look: 'astra',
  },
  {
    id: 'eighty', series: 'ultra', n: 9,
    name: { zh: '愛迪', en: 'Ultraman 80' },
    home: { zh: 'M78 星雲 · 光之國', en: 'Land of Light, M78 Nebula' },
    h: 50, w: 44000,
    move: 'ray', moveName: { zh: '薩克西姆光線', en: 'Sakusium Ray' }, beam: '#fff1a8',
    tag: { zh: '做過學校老師的奧特曼', en: 'The Ultraman who was a schoolteacher' },
    story: {
      zh: '愛迪也叫奧特曼 80。他在地球上做中學老師，名字叫矢的猛。他發現人心裡的壞情緒，會變成怪獸，所以他一邊打怪獸，一邊教小朋友要勇敢、要善良。開心和友愛，就是打敗怪獸的力量！',
      en: "Ultraman 80 worked on Earth as a schoolteacher called Takeshi Yamato. He found out that grumpy, unkind feelings in people's hearts can grow into monsters! So while he fought monsters, he also taught children to be brave and kind. Happiness and friendship are the real monster-beating power!",
    },
    family: [], look: 'eighty',
  },
];

/* how a family link reads on a card: [zh, en] */
export const REL = {
  wife: ['太太', 'wife'], husband: ['丈夫', 'husband'], son: ['兒子', 'son'],
  dad: ['爸爸', 'dad'], mum: ['媽媽', 'mum'], brother: ['兄弟', 'brother'],
  student: ['徒弟', 'student'], teacher: ['師父', 'teacher'], gift: ['送他手鐲', 'gave him the bracelet'],
};

const BOOK_NUMBERS={leo:1,astra:2,king:3,eighty:5};
for(const h of ORIGINAL_HEROES){h.category='classic';h.catalogNo=BOOK_NUMBERS[h.id]||null;}
export const HEROES=[...ORIGINAL_HEROES,...EXTRA_HEROES];
Object.assign(REL,{sister:['妹妹','sister'],teammate:['隊友','teammate'],friend:['朋友','friend'],form:['同一道光的形態','form of the same light'],fusion:['合體成員','fusion member'],light:['光的連結','linked by light']});
const existing=Object.fromEntries(HEROES.map(h=>[h.id,h]));
existing.seven.family.push(['zero','son']);
existing.taro.family.push(['taiga','son'],['mebius','student']);
existing.leo.family.push(['zero','student']);
export const CATEGORIES=[
 {id:'all',zh:'全部',en:'All'}, {id:'classic',zh:'經典戰士',en:'Classic'},
 {id:'heisei',zh:'平成英雄',en:'Heisei'}, {id:'newgen',zh:'新生代',en:'New Generation'},
 {id:'latest',zh:'近代新英雄',en:'Recent Heroes'}, {id:'legend',zh:'傳說・合體・形態',en:'Legends & Fusions'}
];
