/* Max's World — site config and bilingual content */
/* =============== CONFIG =============== */
export const SITE_URL = 'https://zhiyihan.com';
export const AVATAR = { skin:0xf7d9bc, hair:0x24201d, shirt:0xf7f8fa, bow:0x8fb9e6, shorts:0x3a4a6b, shoes:0xf4f4f6, cheek:0xf5a98d };
export const ARTWORKS = [
  { id:'glala',  img:'assets/art/glala.jpg',  en:'Glala & Little Tiger',   zh:'Glala 和小老虎' },
  { id:'horse',  img:'assets/art/horse.jpg',  en:'General on Horseback',   zh:'騎馬的將軍' },
  { id:'dragon', img:'assets/art/dragon.jpg', en:'Dragon Dance No.1',      zh:'舞龍一號' },
  { id:'soon',   img:'assets/art/more.jpg',   en:'More coming soon…',      zh:'更多作品即將登場…' },
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
    tourNext: "Next stop ▶",
    menuTip: "💡 Tap the M (top left) for a map of all zones",
    tourStop: "✕ Stop tour",
    rocketHint: "Fly to Jupiter!",
    jupiterMsg: "🪐 Welcome to Jupiter!",
    lookDown: "Look — Max's World is way down there! 🌍",
    backMsg: "What a trip! 🚀",
    allDone: "🎉 You explored all of Max's World!",
    thanks: "Thank you for visiting — Max ❤️",
    goal: "⚽ GOAL!!",
    jumpTip: "Wheee!",
    zones: {
      welcome:{ icon:'👋', t:'About Max', sub:'Nice to meet you!', body:"Max is a five-year-old boy in Hong Kong — curious, imaginative and warm-hearted. He learns through stories, drawing, numbers, LEGO bricks and real adventures outdoors. Walk around and visit every corner of his world to see what he loves!", chips:['Curiosity','Imagination','Creativity','Empathy','Growth'] },
      gallery:{ icon:'🎨', t:"Max's Art Gallery", sub:'Stories he draws', body:"Drawing is one of Max's favourite ways to talk about his world. He invents his own characters and stories — like Glala and his best friend Little Tiger — and draws real memories too, from museums to dragon dances. Tap a painting for a closer look!", chips:['World-building','Storytelling','Imagination'] },
      numbers:{ icon:'🔢', t:'Number Land', sub:'Every number is a friend', body:"To Max, every number has its own personality! His love of numbers began with Numberblocks — now he plays with number bonds, shapes and patterns everywhere. Even the codes on Dad's cameras, 604 and 603, became characters in his stories.", chips:['Number Sense','Logic','Spatial Thinking'] },
      builder:{ icon:'🧱', t:"Builder's Corner", sub:'The flood-control project', body:"When Max saw news about summer floods, he asked: “How can people control floods?” He explored the answer with Dad — then built it all in LEGO: a river, houses, a dam and a diversion channel, watching how extra water is guided safely away.", chips:['Real-world Learning','Scientific Inquiry','Problem Solving'] },
      sports:{ icon:'⚽', t:'Sports Park', sub:'Brave and bouncy', body:"Football, swimming, cycling, climbing, Taekwondo and fencing — Max loves them all, and earned an Outstanding Fencer certificate. At a Spartan Kids race he was scared of the mud pit… but jumped in anyway, got up after falling, and finished the race. Try kicking the football!", chips:['Courage','Resilience','Fencing ⭐'] },
      nature:{ icon:'🌲', t:'Nature Trail', sub:'A little outdoor explorer', body:"Max grows up outdoors — he has hiked forest paths in Gaoligong Mountain and the Xishuangbanna rainforest, and joined a five-day camp in Dali before turning four, bringing home stones, twigs and flowers as little gifts.", chips:['Independence','Adaptability','Adventure'] },
      kindness:{ icon:'❤️', t:'Kindness Tree', sub:'Small hands, warm heart', body:"Max is learning that caring means small, real actions: selling charity flags in the rain two years in a row, giving his favourite cup to a family who lost their home in a fire, and sharing all ten of his candies — one for each child in the photo.", chips:['Empathy','Sharing','Responsibility'] },
      reading:{ icon:'📚', t:'Reading Nook', sub:'Two languages, many worlds', body:"Bookshops and libraries are Max's happy places — from Hong Kong to Oxford. He reads stories in both Chinese and English, loves linking new words to characters he knows, and is starting to write his own little sentences.", chips:['Reading Habit','Bilingual','Phonics'] },
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
    tourNext: "下一站 ▶",
    menuTip: "💡 點左上角 M 可以打開地圖",
    tourStop: "✕ 結束導覽",
    rocketHint: "搭火箭飛去木星！",
    jupiterMsg: "🪐 歡迎來到木星！",
    lookDown: "看！Max 的小世界在下面呢！🌍",
    backMsg: "旅行真棒！🚀",
    allDone: "🎉 你探索完 Max 的整個世界啦！",
    thanks: "謝謝你的到訪 — Max ❤️",
    goal: "⚽ 入球啦！！",
    jumpTip: "咻——！",
    zones: {
      welcome:{ icon:'👋', t:'關於 Max', sub:'很高興認識你！', body:"Max 是一個五歲的香港小男孩——好奇、愛想像、有一顆溫暖的心。他喜歡從故事、畫畫、數字、LEGO 和戶外探險中學習。四處走走，逛逛他世界裡的每個角落，看看他喜歡的東西吧！", chips:['好奇','想像力','創意','同理心','成長'] },
      gallery:{ icon:'🎨', t:'Max 的小畫廊', sub:'他畫下的故事', body:"畫畫是 Max 最喜歡的表達方式之一。他會創作自己的角色和故事——例如 Glala 和好朋友小老虎——也會畫下真實的回憶，例如博物館和舞龍。點一點畫作，仔細看看吧！", chips:['世界觀創作','說故事','想像力'] },
      numbers:{ icon:'🔢', t:'數字樂園', sub:'每個數字都是朋友', body:"對 Max 來說，每個數字都有自己的性格！他對數字的喜愛從 Numberblocks 開始——現在他隨時隨地玩數感、圖形和規律。連爸爸相機上的編號 604 和 603，都變成了他故事裡的角色。", chips:['數感','邏輯','空間思維'] },
      builder:{ icon:'🧱', t:'小小工程師', sub:'治水大工程', body:"Max 在新聞裡看到夏天的洪水，就問：「人們怎樣才能治水呢？」他和爸爸一起找答案，然後用 LEGO 把整個工程搭了出來：河流、房子、水壩和分洪道，看着多餘的水被安全地引走。", chips:['真實世界學習','科學探究','解決問題'] },
      sports:{ icon:'⚽', t:'運動小天地', sub:'勇敢又活力滿滿', body:"足球、游泳、單車、攀爬、跆拳道和劍擊——Max 全部都喜歡，還獲得了「傑出小劍手」證書。在 Spartan 小勇士賽中，他很怕泥潭……但還是勇敢跳了進去，跌倒了再爬起來，堅持完成比賽。試試踢一踢足球吧！", chips:['勇氣','堅毅','劍擊 ⭐'] },
      nature:{ icon:'🌲', t:'大自然小徑', sub:'小小戶外探險家', body:"Max 在大自然中長大——他走過高黎貢山和西雙版納雨林的山徑，不到四歲就參加了大理的五天戶外營，還把石頭、樹枝和小花帶回家當小禮物。", chips:['獨立','適應力','探險精神'] },
      kindness:{ icon:'❤️', t:'愛心樹', sub:'小小的手，暖暖的心', body:"Max 正在學習：關愛就是一件件真實的小事——連續兩年冒雨參加賣旗籌款；把最心愛的水杯送給火災中失去家園的家庭；看到照片裡有十個小朋友，就把自己的十顆糖全部分享出去。", chips:['同理心','分享','責任感'] },
      reading:{ icon:'📚', t:'閱讀小角落', sub:'兩種語言，無數世界', body:"書店和圖書館是 Max 最開心的地方——由香港到牛津。他用中英文閱讀故事，喜歡把新學的字和認識的角色連起來，也開始寫下自己的小句子。", chips:['閱讀習慣','雙語','拼讀'] },
    }
  }
};
