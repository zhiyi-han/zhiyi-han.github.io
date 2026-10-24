/* Max's World — site config and bilingual content */
/* =============== CONFIG =============== */
export const SITE_URL = 'https://zhiyihan.com';
export const AVATAR = { skin:0xf7d9bc, hair:0x24201d, shirt:0xf7f8fa, bow:0x8fb9e6, shorts:0x3a4a6b, shoes:0xf4f4f6, cheek:0xf5a98d };
/* Max's drawings: assets/art/<id>.webp (full) and <id>-s.webp (small); `easel` ones also stand in the 3D gallery */
export const ARTWORKS = [
  { id:'bumblebee', easel:true, en:"Bumblebee's Space Adventure", zh:'Bumblebee 的太空之旅',
    link:{ href:'stories.html#s03', en:"📖 Read Max's Bumblebee story", zh:'📖 讀滿滿的 Bumblebee 故事' } },
  { id:'lotte',     easel:true, en:'Lotte World',                 zh:'樂天世界' },
  { id:'earth',     easel:true, en:'Good Earth, Bad Earth',       zh:'好地球，壞地球' },
  { id:'sushi',     easel:true, en:'Knuckles Goes for Sushi',     zh:'Knuckles 的壽司之旅' },
  { id:'sea',       easel:true, en:'Flood Rescue in Guangxi',     zh:'廣西洪水大救援',
    link:{ zone:'builder', en:"🧱 See Max's flood-control project", zh:'🧱 看看滿滿的治水大工程' } },
  { id:'monster',   easel:true, en:'The Big Red Monster',         zh:'紅色大怪獸' },
  { id:'pharaoh',   en:"The Pharaoh's Story",         zh:'埃及法老的故事' },
  { id:'aquarium',  en:'COEX Aquarium, Seoul',        zh:'首爾 COEX 水族館' },
  { id:'pool',      en:'Korea Diary: The Rooftop Pool', zh:'韓國日記：和媽媽在酒店露天泳池看風景' },
  { id:'kart',      en:'Mario Bros. Kart Race',       zh:'馬里奧兄弟賽車' },
  { id:'words',     en:'Little Word Monsters',        zh:'文字小怪獸' },
  { id:'tower',     en:'The Cave and the Rainbow Tower', zh:'山洞和彩虹高塔' },
  { id:'map',       en:'Treasure Map',                zh:'尋寶地圖' },
];

/* =============== I18N =============== */
export const I18N = {
  en: {
    otag: "Hi! I'm Max — a five-year-old explorer.<br>Walk around my little world and see what I love!",
    octrDesk: "🕹️ Move: <b>WASD / arrow keys</b> &nbsp;·&nbsp; 👀 Look: <b>drag mouse</b><br>⭐ Interact: <b>E</b> or click &nbsp;·&nbsp; ⬆️ Jump: <b>space</b>",
    octrMob: "🕹️ Move: <b>arrow buttons</b> or joystick &nbsp;·&nbsp; 👀 Look: <b>swipe</b><br>⭐ Interact: <b>star button</b> or tap things &nbsp;·&nbsp; ⬆️ Jump",
    start: "Start Exploring",
    explored: (n,total) => `${n}/${total} explored`,
    walkCloser: "Walk closer to take a look! 🏃",
    dirTitle: "Where shall we go? 🗺️",
    tourBtn: "🚶 Take me around",
    invite: {
      story:  { icon:'📖', t:"Max's Story House", body:"Max and his mum made up twenty-one picture books and stories together — and every one can be read aloud!", go:'Go in 📖', next:'Next stop ▶' },
      heroes: { icon:'⚡', t:"Ultraman Family", body:"Max loves superheroes — especially Ultraman! Step into the glowing tower to meet the whole Ultra family from the Land of Light and see their special moves.", go:'Go in ⚡', next:'Next stop ▶' },
      rocket: { icon:'🚀', t:'Last stop: the rocket!', body:"Would you like to fly into space and visit every planet?", go:'Blast off! 🚀', next:'End the tour' },
    },
    allDoneNext: "Next: hear a story in the Story House, or blast off to space! 📖🚀",
    tourNext: "Next stop ▶",
    menuTip: "💡 Tap the M (top left) for a map of all zones",
    tourStop: "✕ Stop tour",
    rocketHint: "Blast off to the Galaxy Adventure!",
    liftoff: "🚀 Blast off!",
    galaxySign: ["Galaxy Adventure","銀河大冒險"],
    storyHint: "Explore Story & Words",
    pirateHint: "Play Pirate Ships: Add & Subtract",
    pirateBtn: "🏴‍☠️ Play: Pirate Ships, Add & Subtract",
    floodHint: "Play Flood Fixers",
    floodBtn: "🌊 Play: Flood Fixers — dig a diversion channel",
    heroHint: "Meet the Ultraman family",
    heroSign: ["Ultraman Family","奧特曼家族"],
    backFromHeroes: "Welcome back from the Hero Base! ⚡",
    storySign: ["Story & Words","故事與文字"],
    backFromGalaxy: "Welcome back to Earth! 🌍",
    backFromStories: "Welcome back to Story & Words! 📖",
    backFromEarth: "Welcome to Max's World in Hong Kong! 🏝️",
    footprints: "🌍 Max's Footprints — where he has lived & travelled",
    owTitle: "Or jump straight in:",
    owStories: ["📖","Story & Words","Stories, reading & word play"],
    owArt: ["🎨","Art Gallery","13 drawings by Max"],
    owGalaxy: ["🚀","Galaxy Adventure","Fly to every planet"],
    owHeroes: ["🦸","Hero Base","Max's superheroes"],
    owUltra: ["⚡","Ultraman Family"],
    allDone: "🎉 You explored all of Max's World!",
    thanks: "Thank you for visiting — Max ❤️",
    goal: "⚽ GOAL!!",
    jumpTip: "Wheee!",
    zones: {
      welcome:{ icon:'👋', t:'About Max', sub:'Nice to meet you!', body:"Max is a five-year-old boy in Hong Kong — his Chinese nickname is Mun Mun (滿滿), and he's the boy in all his picture books and stories. He's curious, imaginative and warm-hearted. He learns through stories, drawing, numbers, LEGO bricks and real adventures outdoors. Walk around and visit every corner of his world to see what he loves!", chips:['Curiosity','Imagination','Creativity','Empathy','Growth'] },
      gallery:{ icon:'🎨', t:"Max's Art Gallery", sub:'Stories he draws', body:"Drawing is one of Max's favourite ways to talk about his world. He mixes characters he loves with things he sees and his own imagination — Bumblebee flying through space, a pharaoh from a book about ancient Egypt, Knuckles visiting a sushi shop. He drew Bumblebee on the train to Disneyland, and an artist sitting nearby came over to cheer him on! Tap a drawing for a closer look.", chips:['Creativity','Storytelling','Imagination'] },
      numbers:{ icon:'🔢', t:'Number Land', sub:'Every number is a friend', body:"To Max, every number has its own personality! His love of numbers began with Numberblocks — now he plays with number bonds, shapes and patterns everywhere. Even the codes on Dad's cameras, 604 and 603, became characters in his stories.", chips:['Number Sense','Logic','Spatial Thinking'] },
      builder:{ icon:'🧱', t:"Builder's Corner", sub:'The flood-control project', body:"When Max saw news about summer floods, he asked: “How can people control floods?” He explored the answer with Dad — then built it all in LEGO: a river, houses, a dam and a diversion channel, watching how extra water is guided safely away.", chips:['Real-world Learning','Scientific Inquiry','Problem Solving'] },
      sports:{ icon:'⚽', t:'Sports Park', sub:'Brave and bouncy', body:"Football, swimming, cycling, climbing, Taekwondo and fencing — Max loves them all, and earned an Outstanding Fencer certificate. At a Spartan Kids race he was scared of the mud pit… but jumped in anyway, got up after falling, and finished the race. Try kicking the football!", chips:['Courage','Resilience','Fencing ⭐'] },
      nature:{ icon:'🌲', t:'Nature Trail', sub:'A little outdoor explorer', body:"Max grows up outdoors — he has hiked forest paths in Gaoligong Mountain and the Xishuangbanna rainforest, and joined a five-day camp in Dali before turning four, bringing home stones, twigs and flowers as little gifts.", chips:['Independence','Adaptability','Adventure'] },
      kindness:{ icon:'❤️', t:'Kindness Tree', sub:'Small hands, warm heart', body:"Max is learning that caring means small, real actions: selling charity flags in the rain two years in a row, giving his favourite cup to a family who lost their home in a fire, and sharing all ten of his candies — one for each child in the photo.", chips:['Empathy','Sharing','Responsibility'] },
      readingNook:{ icon:'📚', t:'Reading Nook', sub:'Two languages, many worlds', body:"Bookshops and libraries are Max's happy places — from Hong Kong to Oxford. He reads stories in both Chinese and English, loves linking new words to characters he knows, and is starting to write his own little sentences.", chips:['Reading Habit','Bilingual','Phonics'] },
      reading:{icon:'📖',t:'Story & Words',sub:'Listen, read and play with words',body:"Welcome to Max's Story & Words neighbourhood. Listen to his stories, choose a book in the reading nook, or practise Chinese characters with Little Yellow.",chips:['Listen to stories','Read a book','Play with words']},
    }
  },
  zh: {
    otag: "你好！我是 Max——一個五歲的小小探險家。<br>來我的小世界走走，看看我喜歡的東西吧！",
    octrDesk: "🕹️ 移動：<b>WASD／方向鍵</b> &nbsp;·&nbsp; 👀 視角：<b>拖動滑鼠</b><br>⭐ 互動：<b>E 鍵</b>或點擊 &nbsp;·&nbsp; ⬆️ 跳：<b>空白鍵</b>",
    octrMob: "🕹️ 移動：<b>方向按鈕</b>或搖桿 &nbsp;·&nbsp; 👀 視角：<b>滑動畫面</b><br>⭐ 互動：<b>星星按鈕</b>或點按物件 &nbsp;·&nbsp; ⬆️ 跳",
    start: "開始探索",
    explored: (n,total) => `已探索 ${n}/${total}`,
    walkCloser: "走近一點看看吧！🏃",
    dirTitle: "想去哪裡逛逛？🗺️",
    tourBtn: "🚶 帶我逛逛",
    invite: {
      story:  { icon:'📖', t:'滿滿故事屋', body:'滿滿和媽媽一起創作了二十一本繪本和故事，每一本都可以聽朗讀！', go:'進去看看 📖', next:'下一站 ▶' },
      heroes: { icon:'⚡', t:'奧特曼家族', body:'滿滿最喜歡超級英雄，特別是奧特曼！走進發光的塔，來認識光之國的奧特曼家族，看看他們的必殺技吧。', go:'進去看看 ⚡', next:'下一站 ▶' },
      rocket: { icon:'🚀', t:'最後一站：火箭！', body:'要不要搭火箭去太空，飛遊九大行星？', go:'出發！🚀', next:'結束導覽' },
    },
    allDoneNext: "下一站：去故事屋聽故事，或者搭火箭去太空吧！📖🚀",
    tourNext: "下一站 ▶",
    menuTip: "💡 點左上角 M 可以打開地圖",
    tourStop: "✕ 結束導覽",
    rocketHint: "搭火箭去銀河大冒險！",
    liftoff: "🚀 出發！",
    galaxySign: ["Galaxy Adventure","銀河大冒險"],
    storyHint: "進入故事與文字",
    pirateHint: "玩海盜船算一算",
    pirateBtn: "🏴‍☠️ 玩遊戲：海盜船算一算",
    floodHint: "玩分洪小工程師",
    floodBtn: "🌊 玩遊戲：分洪小工程師——挖一條分洪道",
    heroHint: "進入奧特曼家族",
    heroSign: ["Ultraman Family","奧特曼家族"],
    backFromHeroes: "從英雄基地回來啦！⚡",
    storySign: ["Story & Words","故事與文字"],
    backFromGalaxy: "歡迎回到地球！🌍",
    backFromStories: "回到故事與文字啦！📖",
    backFromEarth: "歡迎來到香港的 Max's World！🏝️",
    footprints: "🌍 Max 的足跡——住過和去過的地方",
    owTitle: "也可以直接去：",
    owStories: ["📖","故事與文字","聽故事・閱讀・文字遊戲"],
    owArt: ["🎨","小畫廊","13 幅 Max 的畫作"],
    owGalaxy: ["🚀","銀河大冒險","飛遊九大行星"],
    owHeroes: ["🦸","英雄基地","Max 的超級英雄"],
    owUltra: ["⚡","奧特曼家族"],
    allDone: "🎉 你探索完 Max 的整個世界啦！",
    thanks: "謝謝你的到訪 — Max ❤️",
    goal: "⚽ 入球啦！！",
    jumpTip: "咻——！",
    zones: {
      welcome:{ icon:'👋', t:'關於 Max', sub:'很高興認識你！', body:"Max 是一個五歲的香港小男孩，中文小名叫「滿滿」，他的繪本和故事裏的主角就是他。他好奇、愛想像、有一顆溫暖的心。他喜歡從故事、畫畫、數字、LEGO 和戶外探險中學習。四處走走，逛逛他世界裡的每個角落，看看他喜歡的東西吧！", chips:['好奇','想像力','創意','同理心','成長'] },
      gallery:{ icon:'🎨', t:'Max 的小畫廊', sub:'他畫下的故事', body:"畫畫是 Max 最喜歡的表達方式之一。他把喜歡的角色、生活中的觀察和自己的想像放在一起——Bumblebee 飛上太空、書裏的埃及法老、Knuckles 去吃壽司。《Bumblebee 的太空之旅》是在去迪士尼的地鐵上畫的，旁邊一位藝術家還走過來鼓勵他呢！點一點畫作，仔細看看吧！", chips:['創造力','說故事','想像力'] },
      numbers:{ icon:'🔢', t:'數字樂園', sub:'每個數字都是朋友', body:"對 Max 來說，每個數字都有自己的性格！他對數字的喜愛從 Numberblocks 開始——現在他隨時隨地玩數感、圖形和規律。連爸爸相機上的編號 604 和 603，都變成了他故事裡的角色。", chips:['數感','邏輯','空間思維'] },
      builder:{ icon:'🧱', t:'小小工程師', sub:'治水大工程', body:"Max 在新聞裡看到夏天的洪水，就問：「人們怎樣才能治水呢？」他和爸爸一起找答案，然後用 LEGO 把整個工程搭了出來：河流、房子、水壩和分洪道，看着多餘的水被安全地引走。", chips:['真實世界學習','科學探究','解決問題'] },
      sports:{ icon:'⚽', t:'運動小天地', sub:'勇敢又活力滿滿', body:"足球、游泳、單車、攀爬、跆拳道和劍擊——Max 全部都喜歡，還獲得了「傑出小劍手」證書。在 Spartan 小勇士賽中，他很怕泥潭……但還是勇敢跳了進去，跌倒了再爬起來，堅持完成比賽。試試踢一踢足球吧！", chips:['勇氣','堅毅','劍擊 ⭐'] },
      nature:{ icon:'🌲', t:'大自然小徑', sub:'小小戶外探險家', body:"Max 在大自然中長大——他走過高黎貢山和西雙版納雨林的山徑，不到四歲就參加了大理的五天戶外營，還把石頭、樹枝和小花帶回家當小禮物。", chips:['獨立','適應力','探險精神'] },
      kindness:{ icon:'❤️', t:'愛心樹', sub:'小小的手，暖暖的心', body:"Max 正在學習：關愛就是一件件真實的小事——連續兩年冒雨參加賣旗籌款；把最心愛的水杯送給火災中失去家園的家庭；看到照片裡有十個小朋友，就把自己的十顆糖全部分享出去。", chips:['同理心','分享','責任感'] },
      readingNook:{ icon:'📚', t:'閱讀小角落', sub:'兩種語言，無數世界', body:"書店和圖書館是 Max 最開心的地方——由香港到牛津。他用中英文閱讀故事，喜歡把新學的字和認識的角色連起來，也開始寫下自己的小句子。", chips:['閱讀習慣','雙語','拼讀'] },
      reading:{icon:'📖',t:'故事與文字',sub:'聽故事、讀繪本、玩文字',body:'故事屋、閱讀小角落和文字遊戲，現在住在同一片小天地。挑一本滿滿的故事聽朗讀、到閱讀角自己翻書，或和小黃一起認字吧。',chips:['聽故事','自己閱讀','文字遊戲']},
    }
  }
};

/* Keep the two original activity descriptions inside the unified neighbourhood. */
for(const lg of ['en','zh']){
  const z=I18N[lg].zones;z.numberPlay={...z.numbers};
  z.numbers=lg==='zh'?{
    icon:'🔢',t:'數字與搭建',sub:'數一數、想一想、搭起來',
    body:'數字樂園和小小工程師，現在住在同一片小天地。左邊是數字朋友，右邊是 LEGO 治水模型；選一種玩法，或走近看看吧。',
    chips:['數字玩法','搭建玩法','觀察與思考']
  }:{
    icon:'🔢',t:'Numbers & Building',sub:'Count, think and build',
    body:'Number Land and Builder’s Corner share one neighbourhood. Meet the number friends on the left and explore the LEGO flood-control project on the right. Choose an activity or walk closer to look.',
    chips:['Number play','Building play','Observe and think']
  };
}

/* Direct activities are shared by the homepage and map. */
I18N.zh.activityTitle='想玩什麼？直接開始';
I18N.en.activityTitle='Choose an activity';
I18N.zh.islandTitle='也可以逛逛主島';
I18N.en.islandTitle='Explore the island';
I18N.zh.activities=[['stories','📖','聽故事','21 本故事與繪本・普通話朗讀','stories.html','sto'],['words','🔤','和小黃認字','認字、聽讀、複習','words.html','art'],['pirates','🏴‍☠️','海盜船算一算','100 以內加減，選出答案小船',null,'pirate'],['flood','🌊','分洪小工程師','挖水道，保護小村莊',null,'flood'],['galaxy','🚀','銀河大冒險','飛到太空，探索星球','galaxy.html','gal'],['footprints','🌍','Max 的足跡','轉轉地球，看 Max 去過哪裡','earth.html','footprints']];
I18N.en.activities=[['stories','📖','Listen to stories','21 stories & picture books, in Mandarin','stories.html','sto'],['words','🔤','Words with Little Yellow','Read, listen and practise Chinese','words.html','art'],['pirates','🏴‍☠️','Pirate Ships','Add and subtract within 100',null,'pirate'],['flood','🌊','Flood Fixers','Dig a channel and save the village',null,'flood'],['galaxy','🚀','Galaxy Adventure','Fly into space and explore the planets','galaxy.html','gal'],['footprints','🌍',"Max’s Footprints",'Spin the globe and see his travels','earth.html','footprints']];
I18N.zh.start='逛逛主島';I18N.en.start='Explore the island';
