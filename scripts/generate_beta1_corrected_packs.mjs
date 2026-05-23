import fs from "node:fs";
import path from "node:path";

const sourceRoot = "/Volumes/ExtremePro/project/study/qclaw2";
const targetRoot = "data/ProgressiveLanguagePacks/beta1/stage1";
const manifestPath = "data/ProgressiveLanguagePacks/manifest.json";

const supportedLanguages = ["en", "de", "fr", "es", "zh", "ja"];
const languageLabels = {
  en: "English",
  de: "German",
  fr: "French",
  es: "Spanish",
  zh: "Chinese",
  ja: "Japanese",
};

const grammarTokens = [
  {
    tokenId: "ARTICLE_THE",
    type: "article",
    linkToConcept: false,
    translations: { en: "the", de: "der/die/das", fr: "le/la/les", es: "el/la/los/las", zh: "", ja: "" },
  },
  {
    tokenId: "PRONOUN_MY",
    type: "possessive",
    linkToConcept: false,
    translations: { en: "my", de: "mein/meine", fr: "mon/ma", es: "mi", zh: "我的", ja: "私の" },
  },
  {
    tokenId: "PREPOSITION_IN",
    type: "preposition",
    linkToConcept: false,
    translations: { en: "in", de: "in/im/in der", fr: "dans", es: "en", zh: "在", ja: "に" },
  },
  {
    tokenId: "PREPOSITION_NEAR",
    type: "preposition",
    linkToConcept: false,
    translations: { en: "near", de: "neben/bei", fr: "près de", es: "cerca de", zh: "旁边", ja: "近くに" },
  },
];

const TEMPLATES = {
  family_home: {
    title: "Family and Home",
    domains: ["family", "home"],
    vocabulary: [
      noun("PERSON_MOTHER", "people", {
        en: "mother", de: ["Mutter", "die"], fr: ["mère", "la"], es: ["madre", "la"], zh: "妈妈", ja: "母",
      }),
      noun("PERSON_GRANDMOTHER", "people", {
        en: "grandmother", de: ["Großmutter", "die"], fr: ["grand-mère", "la"], es: ["abuela", "la"], zh: "奶奶", ja: "祖母",
      }),
      noun("PLACE_GARDEN", "places", {
        en: "garden", de: ["Garten", "der"], fr: ["jardin", "le"], es: ["jardín", "el"], zh: "花园", ja: "庭",
      }),
      noun("PLACE_LIVING_ROOM", "places", {
        en: "living room", de: ["Wohnzimmer", "das"], fr: ["salon", "le"], es: ["sala", "la"], zh: "客厅", ja: "リビング",
      }),
      noun("OBJECT_CHAIR", "objects", {
        en: "chair", de: ["Stuhl", "der"], fr: ["chaise", "la"], es: ["silla", "la"], zh: "椅子", ja: "いす",
      }),
      noun("OBJECT_BED", "objects", {
        en: "bed", de: ["Bett", "das"], fr: ["lit", "le"], es: ["cama", "la"], zh: "床", ja: "ベッド",
      }),
      verb("VERB_EAT", { en: "eat", de: "essen", fr: "manger", es: "comer", zh: "吃", ja: "食べる" }),
      verb("VERB_SIT", { en: "sit", de: "sitzen", fr: "s'asseoir", es: "sentarse", zh: "坐", ja: "座る" }),
    ],
    location: locationSet("PERSON_MOTHER", "PLACE_GARDEN", {
      en: ["The mother is in the garden.", ["The", "mother", "is", "in", "the", "garden."]],
      de: ["Die Mutter ist im Garten.", ["Die", "Mutter", "ist", "im", "Garten."]],
      fr: ["La mère est dans le jardin.", ["La", "mère", "est", "dans", "le", "jardin."]],
      es: ["La madre está en el jardín.", ["La", "madre", "está", "en", "el", "jardín."]],
      zh: ["妈妈在花园里。", ["妈妈", "在花园里。"]],
      ja: ["母は庭にいます。", ["母は", "庭に", "います。"]],
    }),
    action: actionSet("PERSON_GRANDMOTHER", "VERB_SIT", "OBJECT_CHAIR", {
      en: ["The grandmother sits near the chair.", ["The", "grandmother", "sits", "near", "the", "chair."]],
      de: ["Die Großmutter sitzt neben dem Stuhl.", ["Die", "Großmutter", "sitzt", "neben", "dem", "Stuhl."]],
      fr: ["La grand-mère est assise près de la chaise.", ["La", "grand-mère", "est", "assise", "près", "de", "la", "chaise."]],
      es: ["La abuela se sienta cerca de la silla.", ["La", "abuela", "se", "sienta", "cerca", "de", "la", "silla."]],
      zh: ["奶奶坐在椅子旁边。", ["奶奶", "坐在", "椅子旁边。"]],
      ja: ["祖母はいすの近くに座ります。", ["祖母は", "いすの近くに", "座ります。"]],
    }),
  },
  school_classroom: {
    title: "School and Classroom",
    domains: ["school", "education"],
    vocabulary: [
      noun("PERSON_CLASSMATE", "people", { en: "classmate", de: ["Mitschüler", "der"], fr: ["camarade", "le"], es: ["compañero", "el"], zh: "同学", ja: "クラスメート" }),
      noun("PERSON_TEACHER", "people", { en: "teacher", de: ["Lehrer", "der"], fr: ["professeur", "le"], es: ["profesor", "el"], zh: "老师", ja: "先生" }),
      noun("PLACE_CLASSROOM", "places", { en: "classroom", de: ["Klassenzimmer", "das"], fr: ["classe", "la"], es: ["aula", "el"], zh: "教室", ja: "きょうしつ" }),
      noun("PLACE_SCHOOL", "places", { en: "school", de: ["Schule", "die"], fr: ["école", "l'"], es: ["escuela", "la"], zh: "学校", ja: "がっこう" }),
      noun("OBJECT_BOOK", "objects", { en: "book", de: ["Buch", "das"], fr: ["livre", "le"], es: ["libro", "el"], zh: "书", ja: "本" }),
      noun("OBJECT_BAG", "objects", { en: "bag", de: ["Tasche", "die"], fr: ["sac", "le"], es: ["bolsa", "la"], zh: "书包", ja: "かばん" }),
      verb("VERB_OPEN", { en: "open", de: "öffnen", fr: "ouvrir", es: "abrir", zh: "打开", ja: "開ける" }),
      verb("VERB_READ", { en: "read", de: "lesen", fr: "lire", es: "leer", zh: "读", ja: "読む" }),
    ],
    location: locationSet("PERSON_CLASSMATE", "PLACE_CLASSROOM", {
      en: ["The classmate is in the classroom.", ["The", "classmate", "is", "in", "the", "classroom."]],
      de: ["Der Mitschüler ist im Klassenzimmer.", ["Der", "Mitschüler", "ist", "im", "Klassenzimmer."]],
      fr: ["Le camarade est dans la classe.", ["Le", "camarade", "est", "dans", "la", "classe."]],
      es: ["El compañero está en el aula.", ["El", "compañero", "está", "en", "el", "aula."]],
      zh: ["同学在教室里。", ["同学", "在教室里。"]],
      ja: ["クラスメートは教室にいます。", ["クラスメートは", "教室に", "います。"]],
    }),
    action: actionSet("PERSON_TEACHER", "VERB_OPEN", "OBJECT_BOOK", {
      en: ["The teacher opens the book.", ["The", "teacher", "opens", "the", "book."]],
      de: ["Der Lehrer öffnet das Buch.", ["Der", "Lehrer", "öffnet", "das", "Buch."]],
      fr: ["Le professeur ouvre le livre.", ["Le", "professeur", "ouvre", "le", "livre."]],
      es: ["El profesor abre el libro.", ["El", "profesor", "abre", "el", "libro."]],
      zh: ["老师打开书。", ["老师", "打开", "书。"]],
      ja: ["先生は本を開けます。", ["先生は", "本を", "開けます。"]],
    }),
  },
  river_bridge: {
    title: "River and Bridge",
    domains: ["nature", "transport"],
    vocabulary: [
      noun("PERSON_TOURIST", "people", { en: "tourist", de: ["Urlauber", "der"], fr: ["touriste", "le"], es: ["turista", "el"], zh: "游客", ja: "観光客" }),
      noun("PERSON_FRIEND", "people", { en: "friend", de: ["Freund", "der"], fr: ["ami", "l'"], es: ["amigo", "el"], zh: "朋友", ja: "友だち" }),
      noun("PLACE_RIVER", "places", { en: "river", de: ["Fluss", "der"], fr: ["rivière", "la"], es: ["río", "el"], zh: "河流", ja: "川" }),
      noun("OBJECT_BRIDGE", "objects", { en: "bridge", de: ["Brücke", "die"], fr: ["pont", "le"], es: ["puente", "el"], zh: "桥", ja: "橋" }),
      noun("OBJECT_BOAT", "objects", { en: "boat", de: ["Boot", "das"], fr: ["bateau", "le"], es: ["barco", "el"], zh: "船", ja: "ボート" }),
      noun("OBJECT_TREE", "objects", { en: "tree", de: ["Baum", "der"], fr: ["arbre", "l'"], es: ["árbol", "el"], zh: "树", ja: "木" }),
      verb("VERB_SIT", { en: "sit", de: "sitzen", fr: "s'asseoir", es: "sentarse", zh: "坐", ja: "座る" }),
      verb("VERB_WALK", { en: "walk", de: "gehen", fr: "marcher", es: "caminar", zh: "走", ja: "歩く" }),
    ],
    location: locationSet("PERSON_TOURIST", "PLACE_RIVER", {
      en: ["The tourist is by the river.", ["The", "tourist", "is", "by", "the", "river."]],
      de: ["Der Urlauber ist am Fluss.", ["Der", "Urlauber", "ist", "am", "Fluss."]],
      fr: ["Le touriste est près de la rivière.", ["Le", "touriste", "est", "près", "de", "la", "rivière."]],
      es: ["El turista está junto al río.", ["El", "turista", "está", "junto", "al", "río."]],
      zh: ["游客在河边。", ["游客", "在河边。"]],
      ja: ["観光客は川のそばにいます。", ["観光客は", "川のそばに", "います。"]],
    }),
    action: actionSet("PERSON_FRIEND", "VERB_WALK", "OBJECT_BRIDGE", {
      en: ["The friend walks on the bridge.", ["The", "friend", "walks", "on", "the", "bridge."]],
      de: ["Der Freund geht auf der Brücke.", ["Der", "Freund", "geht", "auf", "der", "Brücke."]],
      fr: ["L'ami marche sur le pont.", ["L'ami", "marche", "sur", "le", "pont."]],
      es: ["El amigo camina por el puente.", ["El", "amigo", "camina", "por", "el", "puente."]],
      zh: ["朋友在桥上走。", ["朋友", "在桥上", "走。"]],
      ja: ["友だちは橋の上を歩きます。", ["友だちは", "橋の上を", "歩きます。"]],
    }),
  },
  market_shopping: {
    title: "Market and Shopping",
    domains: ["shopping", "city"],
    vocabulary: [
      noun("PERSON_SHOPKEEPER", "people", { en: "shopkeeper", de: ["Verkäufer", "der"], fr: ["vendeur", "le"], es: ["vendedor", "el"], zh: "店主", ja: "店員" }),
      noun("PERSON_FRIEND", "people", { en: "friend", de: ["Freund", "der"], fr: ["ami", "l'"], es: ["amigo", "el"], zh: "朋友", ja: "友だち" }),
      noun("PLACE_MARKET", "places", { en: "market", de: ["Markt", "der"], fr: ["marché", "le"], es: ["mercado", "el"], zh: "市场", ja: "市場" }),
      noun("PLACE_SHOP", "places", { en: "shop", de: ["Geschäft", "das"], fr: ["magasin", "le"], es: ["tienda", "la"], zh: "商店", ja: "店" }),
      noun("OBJECT_FRUIT", "objects", { en: "fruit", de: ["Obst", "das"], fr: ["fruits", "les"], es: ["fruta", "la"], zh: "水果", ja: "果物" }),
      noun("OBJECT_BASKET", "objects", { en: "basket", de: ["Korb", "der"], fr: ["panier", "le"], es: ["cesta", "la"], zh: "篮子", ja: "かご" }),
      verb("VERB_BUY", { en: "buy", de: "kaufen", fr: "acheter", es: "comprar", zh: "买", ja: "買う" }),
      verb("VERB_CARRY", { en: "carry", de: "tragen", fr: "porter", es: "llevar", zh: "拿", ja: "持つ" }),
    ],
    location: locationSet("PERSON_SHOPKEEPER", "PLACE_MARKET", {
      en: ["The shopkeeper is in the market.", ["The", "shopkeeper", "is", "in", "the", "market."]],
      de: ["Der Verkäufer ist auf dem Markt.", ["Der", "Verkäufer", "ist", "auf", "dem", "Markt."]],
      fr: ["Le vendeur est au marché.", ["Le", "vendeur", "est", "au", "marché."]],
      es: ["El vendedor está en el mercado.", ["El", "vendedor", "está", "en", "el", "mercado."]],
      zh: ["店主在市场里。", ["店主", "在市场里。"]],
      ja: ["店員は市場にいます。", ["店員は", "市場に", "います。"]],
    }),
    action: actionSet("PERSON_FRIEND", "VERB_BUY", "OBJECT_FRUIT", {
      en: ["The friend buys fruit.", ["The", "friend", "buys", "fruit."]],
      de: ["Der Freund kauft Obst.", ["Der", "Freund", "kauft", "Obst."]],
      fr: ["L'ami achète des fruits.", ["L'ami", "achète", "des", "fruits."]],
      es: ["El amigo compra fruta.", ["El", "amigo", "compra", "fruta."]],
      zh: ["朋友买水果。", ["朋友", "买", "水果。"]],
      ja: ["友だちは果物を買います。", ["友だちは", "果物を", "買います。"]],
    }),
  },
  kitchen_cooking: {
    title: "Kitchen and Cooking",
    domains: ["food", "home"],
    vocabulary: [
      noun("PERSON_COOK", "people", { en: "cook", de: ["Koch", "der"], fr: ["cuisinier", "le"], es: ["cocinero", "el"], zh: "厨师", ja: "料理人" }),
      noun("PERSON_MOTHER", "people", { en: "mother", de: ["Mutter", "die"], fr: ["mère", "la"], es: ["madre", "la"], zh: "妈妈", ja: "母" }),
      noun("PLACE_KITCHEN", "places", { en: "kitchen", de: ["Küche", "die"], fr: ["cuisine", "la"], es: ["cocina", "la"], zh: "厨房", ja: "台所" }),
      noun("PLACE_TABLE", "places", { en: "table", de: ["Tisch", "der"], fr: ["table à manger", "la"], es: ["mesa", "la"], zh: "桌子", ja: "テーブル" }),
      noun("OBJECT_BREAD", "objects", { en: "bread", de: ["Brot", "das"], fr: ["pain", "le"], es: ["pan", "el"], zh: "面包", ja: "パン" }),
      noun("OBJECT_WATER", "objects", { en: "water", de: ["Wasser", "das"], fr: ["eau", "l'"], es: ["agua", "el"], zh: "水", ja: "お水" }),
      verb("VERB_COOK", { en: "cook", de: "kochen", fr: "cuisiner", es: "cocinar", zh: "做饭", ja: "料理する" }),
      verb("VERB_EAT", { en: "eat", de: "essen", fr: "manger", es: "comer", zh: "吃", ja: "食べる" }),
    ],
    location: locationSet("PERSON_COOK", "PLACE_KITCHEN", {
      en: ["The cook is in the kitchen.", ["The", "cook", "is", "in", "the", "kitchen."]],
      de: ["Der Koch ist in der Küche.", ["Der", "Koch", "ist", "in", "der", "Küche."]],
      fr: ["Le cuisinier est dans la cuisine.", ["Le", "cuisinier", "est", "dans", "la", "cuisine."]],
      es: ["El cocinero está en la cocina.", ["El", "cocinero", "está", "en", "la", "cocina."]],
      zh: ["厨师在厨房里。", ["厨师", "在厨房里。"]],
      ja: ["料理人は台所にいます。", ["料理人は", "台所に", "います。"]],
    }),
    action: actionSet("PERSON_MOTHER", "VERB_EAT", "OBJECT_BREAD", {
      en: ["The mother eats bread.", ["The", "mother", "eats", "bread."]],
      de: ["Die Mutter isst Brot.", ["Die", "Mutter", "isst", "Brot."]],
      fr: ["La mère mange du pain.", ["La", "mère", "mange", "du", "pain."]],
      es: ["La madre come pan.", ["La", "madre", "come", "pan."]],
      zh: ["妈妈吃面包。", ["妈妈", "吃", "面包。"]],
      ja: ["母はパンを食べます。", ["母は", "パンを", "食べます。"]],
    }),
  },
  train_station: {
    title: "Train and Station",
    domains: ["transport", "travel"],
    vocabulary: [
      noun("PERSON_PASSENGER", "people", { en: "passenger", de: ["Fahrgast", "der"], fr: ["passager", "le"], es: ["pasajero", "el"], zh: "乘客", ja: "乗客" }),
      noun("PERSON_TRAVELER", "people", { en: "traveler", de: ["Reisende", "der"], fr: ["voyageur", "le"], es: ["viajero", "el"], zh: "旅行者", ja: "旅人" }),
      noun("PLACE_STATION", "places", { en: "station", de: ["Bahnhof", "der"], fr: ["gare", "la"], es: ["estación", "la"], zh: "车站", ja: "駅" }),
      noun("PLACE_PLATFORM", "places", { en: "platform", de: ["Bahnsteig", "der"], fr: ["quai", "le"], es: ["andén", "el"], zh: "站台", ja: "ホーム" }),
      noun("OBJECT_TRAIN", "objects", { en: "train", de: ["Zug", "der"], fr: ["rame", "la"], es: ["tren", "el"], zh: "火车", ja: "電車" }),
      noun("OBJECT_TICKET", "objects", { en: "ticket", de: ["Fahrkarte", "die"], fr: ["billet", "le"], es: ["billete", "el"], zh: "车票", ja: "切符" }),
      verb("VERB_WAIT", { en: "wait", de: "warten", fr: "attendre", es: "esperar", zh: "等", ja: "待つ" }),
      verb("VERB_READ", { en: "read", de: "lesen", fr: "lire", es: "leer", zh: "读", ja: "読む" }),
    ],
    location: locationSet("PERSON_PASSENGER", "PLACE_STATION", {
      en: ["The passenger is at the station.", ["The", "passenger", "is", "at", "the", "station."]],
      de: ["Der Fahrgast ist am Bahnhof.", ["Der", "Fahrgast", "ist", "am", "Bahnhof."]],
      fr: ["Le passager est à la gare.", ["Le", "passager", "est", "à", "la", "gare."]],
      es: ["El pasajero está en la estación.", ["El", "pasajero", "está", "en", "la", "estación."]],
      zh: ["乘客在车站。", ["乘客", "在车站。"]],
      ja: ["乗客は駅にいます。", ["乗客は", "駅に", "います。"]],
    }),
    action: actionSet("PERSON_TRAVELER", "VERB_READ", "OBJECT_TICKET", {
      en: ["The traveler reads the ticket.", ["The", "traveler", "reads", "the", "ticket."]],
      de: ["Der Reisende liest die Fahrkarte.", ["Der", "Reisende", "liest", "die", "Fahrkarte."]],
      fr: ["Le voyageur lit le billet.", ["Le", "voyageur", "lit", "le", "billet."]],
      es: ["El viajero lee el billete.", ["El", "viajero", "lee", "el", "billete."]],
      zh: ["旅行者读车票。", ["旅行者", "读", "车票。"]],
      ja: ["旅行者は切符を読みます。", ["旅行者は", "切符を", "読みます。"]],
    }),
  },
  weather_seasons: {
    title: "Weather and Seasons",
    domains: ["weather", "nature"],
    vocabulary: [
      noun("PERSON_CHILD", "people", { en: "child", de: ["Kind", "das"], fr: ["enfant", "l'"], es: ["niño", "el"], zh: "孩子", ja: "子ども" }),
      noun("PERSON_FRIEND", "people", { en: "friend", de: ["Freund", "der"], fr: ["ami", "l'"], es: ["amigo", "el"], zh: "朋友", ja: "友だち" }),
      noun("WEATHER_RAIN", "weather", { en: "rain", de: ["Regen", "der"], fr: ["pluie", "la"], es: ["lluvia", "la"], zh: "雨", ja: "あめ" }),
      noun("WEATHER_SUN", "weather", { en: "sun", de: ["Sonne", "die"], fr: ["soleil", "le"], es: ["sol", "el"], zh: "太阳", ja: "太陽" }),
      noun("OBJECT_UMBRELLA", "objects", { en: "umbrella", de: ["Regenschirm", "der"], fr: ["parapluie", "le"], es: ["paraguas", "el"], zh: "雨伞", ja: "傘" }),
      noun("OBJECT_COAT", "objects", { en: "coat", de: ["Mantel", "der"], fr: ["manteau", "le"], es: ["abrigo", "el"], zh: "外套", ja: "コート" }),
      adjective("ADJ_COLD", { en: "cold", de: "kalt", fr: "froid", es: "frío", zh: "冷", ja: "寒い" }),
      verb("VERB_HOLD", { en: "hold", de: "halten", fr: "tenir", es: "sostener", zh: "拿着", ja: "持つ" }),
    ],
    location: locationSet("PERSON_CHILD", "WEATHER_RAIN", {
      en: ["The child is in the rain.", ["The", "child", "is", "in", "the", "rain."]],
      de: ["Das Kind ist im Regen.", ["Das", "Kind", "ist", "im", "Regen."]],
      fr: ["L'enfant est sous la pluie.", ["L'enfant", "est", "sous", "la", "pluie."]],
      es: ["El niño está bajo la lluvia.", ["El", "niño", "está", "bajo", "la", "lluvia."]],
      zh: ["孩子在雨中。", ["孩子", "在雨中。"]],
      ja: ["子どもは雨の中にいます。", ["子どもは", "雨の中に", "います。"]],
    }),
    action: actionSet("PERSON_FRIEND", "VERB_HOLD", "OBJECT_UMBRELLA", {
      en: ["The friend holds an umbrella.", ["The", "friend", "holds", "an", "umbrella."]],
      de: ["Der Freund hält einen Regenschirm.", ["Der", "Freund", "hält", "einen", "Regenschirm."]],
      fr: ["L'ami tient un parapluie.", ["L'ami", "tient", "un", "parapluie."]],
      es: ["El amigo sostiene un paraguas.", ["El", "amigo", "sostiene", "un", "paraguas."]],
      zh: ["朋友拿着雨伞。", ["朋友", "拿着", "雨伞。"]],
      ja: ["友だちは傘を持っています。", ["友だちは", "傘を", "持っています。"]],
    }),
  },
  park_playground: {
    title: "Park and Playground",
    domains: ["outdoor", "children"],
    vocabulary: [
      noun("PERSON_PARENT", "people", { en: "parent", de: ["Elternteil", "das"], fr: ["responsable", "le"], es: ["padre", "el"], zh: "家长", ja: "親" }),
      noun("PERSON_CHILD", "people", { en: "child", de: ["Kind", "das"], fr: ["enfant", "l'"], es: ["niño", "el"], zh: "孩子", ja: "子ども" }),
      noun("PLACE_PARK", "places", { en: "park", de: ["Parkanlage", "die"], fr: ["parc", "le"], es: ["parque", "el"], zh: "公园", ja: "公園" }),
      noun("PLACE_PLAYGROUND", "places", { en: "playground", de: ["Spielplatz", "der"], fr: ["aire de jeux", "l'"], es: ["parque infantil", "el"], zh: "游乐场", ja: "遊び場" }),
      noun("OBJECT_BALL", "objects", { en: "ball", de: ["Spielball", "der"], fr: ["ballon", "le"], es: ["pelota", "la"], zh: "球", ja: "ボール" }),
      noun("OBJECT_BICYCLE", "objects", { en: "bicycle", de: ["Fahrrad", "das"], fr: ["vélo", "le"], es: ["bicicleta", "la"], zh: "自行车", ja: "自転車" }),
      verb("VERB_PLAY", { en: "play", de: "spielen", fr: "jouer", es: "jugar", zh: "玩", ja: "遊ぶ" }),
      verb("VERB_RIDE", { en: "ride", de: "fahren", fr: "faire du vélo", es: "montar", zh: "骑", ja: "乗る" }),
    ],
    location: locationSet("PERSON_PARENT", "PLACE_PARK", {
      en: ["The parent is in the park.", ["The", "parent", "is", "in", "the", "park."]],
      de: ["Das Elternteil ist in der Parkanlage.", ["Das", "Elternteil", "ist", "in", "der", "Parkanlage."]],
      fr: ["Le responsable est dans le parc.", ["Le", "responsable", "est", "dans", "le", "parc."]],
      es: ["El padre está en el parque.", ["El", "padre", "está", "en", "el", "parque."]],
      zh: ["家长在公园里。", ["家长", "在公园里。"]],
      ja: ["親は公園にいます。", ["親は", "公園に", "います。"]],
    }),
    action: actionSet("PERSON_CHILD", "VERB_PLAY", "OBJECT_BALL", {
      en: ["The child plays with the ball.", ["The", "child", "plays", "with", "the", "ball."]],
      de: ["Das Kind spielt mit dem Spielball.", ["Das", "Kind", "spielt", "mit", "dem", "Spielball."]],
      fr: ["L'enfant joue avec le ballon.", ["L'enfant", "joue", "avec", "le", "ballon."]],
      es: ["El niño juega con la pelota.", ["El", "niño", "juega", "con", "la", "pelota."]],
      zh: ["孩子玩球。", ["孩子", "玩", "球。"]],
      ja: ["子どもはボールで遊びます。", ["子どもは", "ボールで", "遊びます。"]],
    }),
  },
  restaurant_dinner: {
    title: "Restaurant and Dinner",
    domains: ["food", "social"],
    vocabulary: [
      noun("PERSON_WAITER", "people", { en: "waiter", de: ["Kellner", "der"], fr: ["serveur", "le"], es: ["camarero", "el"], zh: "服务员", ja: "ウェイター" }),
      noun("PERSON_CUSTOMER", "people", { en: "customer", de: ["Gast", "der"], fr: ["client", "le"], es: ["cliente", "el"], zh: "顾客", ja: "客" }),
      noun("PLACE_RESTAURANT", "places", { en: "restaurant", de: ["Gaststätte", "die"], fr: ["brasserie", "la"], es: ["restaurante", "el"], zh: "餐厅", ja: "レストラン" }),
      noun("OBJECT_TABLE", "objects", { en: "table", de: ["Tisch", "der"], fr: ["table à manger", "la"], es: ["mesa", "la"], zh: "桌子", ja: "テーブル" }),
      noun("OBJECT_RICE", "objects", { en: "rice", de: ["Reis", "der"], fr: ["riz", "le"], es: ["arroz", "el"], zh: "米饭", ja: "ご飯" }),
      noun("OBJECT_WATER", "objects", { en: "water", de: ["Wasser", "das"], fr: ["eau", "l'"], es: ["agua", "el"], zh: "水", ja: "お水" }),
      verb("VERB_EAT", { en: "eat", de: "essen", fr: "manger", es: "comer", zh: "吃", ja: "食べる" }),
      verb("VERB_DRINK", { en: "drink", de: "trinken", fr: "boire", es: "beber", zh: "喝", ja: "飲む" }),
    ],
    location: locationSet("PERSON_WAITER", "PLACE_RESTAURANT", {
      en: ["The waiter is in the restaurant.", ["The", "waiter", "is", "in", "the", "restaurant."]],
      de: ["Der Kellner ist in der Gaststätte.", ["Der", "Kellner", "ist", "in", "der", "Gaststätte."]],
      fr: ["Le serveur est dans la brasserie.", ["Le", "serveur", "est", "dans", "la", "brasserie."]],
      es: ["El camarero está en el restaurante.", ["El", "camarero", "está", "en", "el", "restaurante."]],
      zh: ["服务员在餐厅里。", ["服务员", "在餐厅里。"]],
      ja: ["ウェイターはレストランにいます。", ["ウェイターは", "レストランに", "います。"]],
    }),
    action: actionSet("PERSON_CUSTOMER", "VERB_DRINK", "OBJECT_WATER", {
      en: ["The customer drinks water.", ["The", "customer", "drinks", "water."]],
      de: ["Der Gast trinkt Wasser.", ["Der", "Gast", "trinkt", "Wasser."]],
      fr: ["Le client boit de l'eau.", ["Le", "client", "boit", "de", "l'eau."]],
      es: ["El cliente bebe agua.", ["El", "cliente", "bebe", "agua."]],
      zh: ["顾客喝水。", ["顾客", "喝", "水。"]],
      ja: ["客はお水を飲みます。", ["客は", "お水を", "飲みます。"]],
    }),
  },
  airport_airplane: {
    title: "Airport and Airplane",
    domains: ["travel", "transport"],
    vocabulary: [
      noun("PERSON_TRAVELER", "people", { en: "traveler", de: ["Reisende", "der"], fr: ["voyageur", "le"], es: ["viajero", "el"], zh: "旅行者", ja: "旅人" }),
      noun("PERSON_PILOT", "people", { en: "pilot", de: ["Flugkapitän", "der"], fr: ["commandant de bord", "le"], es: ["piloto", "el"], zh: "飞行员", ja: "パイロット" }),
      noun("PLACE_AIRPORT", "places", { en: "airport", de: ["Flughafen", "der"], fr: ["aéroport", "l'"], es: ["aeropuerto", "el"], zh: "机场", ja: "空港" }),
      noun("OBJECT_AIRPLANE", "objects", { en: "airplane", de: ["Flugzeug", "das"], fr: ["avion", "l'"], es: ["avión", "el"], zh: "飞机", ja: "飛行機" }),
      noun("OBJECT_SUITCASE", "objects", { en: "suitcase", de: ["Koffer", "der"], fr: ["valise", "la"], es: ["maleta", "la"], zh: "行李箱", ja: "スーツケース" }),
      noun("OBJECT_PASSPORT", "objects", { en: "passport", de: ["Reisepass", "der"], fr: ["passeport", "le"], es: ["pasaporte", "el"], zh: "护照", ja: "パスポート" }),
      verb("VERB_GO", { en: "go", de: "gehen", fr: "aller", es: "ir", zh: "去", ja: "行く" }),
      verb("VERB_FLY", { en: "fly", de: "fliegen", fr: "voler", es: "volar", zh: "飞", ja: "飛ぶ" }),
    ],
    location: locationSet("PERSON_TRAVELER", "PLACE_AIRPORT", {
      en: ["The traveler is at the airport.", ["The", "traveler", "is", "at", "the", "airport."]],
      de: ["Der Reisende ist am Flughafen.", ["Der", "Reisende", "ist", "am", "Flughafen."]],
      fr: ["Le voyageur est à l'aéroport.", ["Le", "voyageur", "est", "à", "l'aéroport."]],
      es: ["El viajero está en el aeropuerto.", ["El", "viajero", "está", "en", "el", "aeropuerto."]],
      zh: ["旅行者在机场。", ["旅行者", "在机场。"]],
      ja: ["旅行者は空港にいます。", ["旅行者は", "空港に", "います。"]],
    }),
    action: actionSet("PERSON_PILOT", "VERB_FLY", "OBJECT_AIRPLANE", {
      en: ["The pilot flies the airplane.", ["The", "pilot", "flies", "the", "airplane."]],
      de: ["Der Flugkapitän fliegt das Flugzeug.", ["Der", "Flugkapitän", "fliegt", "das", "Flugzeug."]],
      fr: ["Le commandant de bord fait voler l'avion.", ["Le", "commandant", "de", "bord", "fait", "voler", "l'avion."]],
      es: ["El piloto vuela el avión.", ["El", "piloto", "vuela", "el", "avión."]],
      zh: ["飞行员驾驶飞机。", ["飞行员", "驾驶", "飞机。"]],
      ja: ["パイロットは飛行機を操縦します。", ["パイロットは", "飛行機を", "操縦します。"]],
    }),
  },
};

function noun(conceptId, semanticCategory, terms) {
  return concept(conceptId, "noun", semanticCategory, terms);
}

function verb(conceptId, terms) {
  return concept(conceptId, "verb", "actions", terms);
}

function adjective(conceptId, terms) {
  return concept(conceptId, "adjective", "descriptors", terms);
}

function concept(conceptId, type, semanticCategory, terms) {
  return {
    conceptId,
    type,
    senseKey: conceptId.toLowerCase(),
    semanticCategory,
    translations: Object.fromEntries(supportedLanguages.map((lang) => {
      const value = terms[lang];
      if (Array.isArray(value)) {
        const [text, article] = value;
        if (article && /['’]$/.test(article)) return [lang, { text: `${article}${text}` }];
        return [lang, article ? { text, article } : { text }];
      }
      return [lang, { text: value }];
    })),
  };
}

function locationSet(subjectConcept, placeConcept, translations) {
  return { kind: "location", concepts: [subjectConcept, placeConcept], translations };
}

function actionSet(subjectConcept, verbConcept, objectConcept, translations, extraVerb = null) {
  return { kind: "action", concepts: [subjectConcept, verbConcept, objectConcept], translations, extraVerb };
}

function getTerm(vocabulary, conceptId, lang) {
  const item = vocabulary.find((entry) => entry.conceptId === conceptId);
  const translation = item?.translations?.[lang];
  if (!translation) return conceptId;
  if (translation.article && ["de", "fr", "es"].includes(lang)) return `${translation.article} ${translation.text}`;
  return translation.text;
}

function analysis(lang, kind, tokens, literalOrderExplanation = "") {
  const patterns = {
    location: {
      en: "Article + noun + be + place phrase",
      de: "Article + noun + verb-second + place phrase",
      fr: "Article + noun + être + place phrase",
      es: "Article + noun + estar + place phrase",
      zh: "Person + 在 + place",
      ja: "Topic + place + います",
    },
    action: {
      en: "Article + noun + verb + object",
      de: "Article + noun + verb-second + object",
      fr: "Article + noun + verb phrase + object",
      es: "Article + noun + verb + object",
      zh: "Person + action + object",
      ja: "Topic + object + verb-final",
    },
    noun: {
      en: "Noun phrase",
      de: "Article + noun",
      fr: "Article + noun",
      es: "Article + noun",
      zh: "Noun",
      ja: "Noun",
    },
    phrase: {
      en: "Place or object phrase",
      de: "Prepositional/object phrase",
      fr: "Prepositional/object phrase",
      es: "Prepositional/object phrase",
      zh: "Phrase chunk",
      ja: "Phrase chunk with particle",
    },
  };
  const notes = {
    en: {
      location: ["English uses 'is' for location.", "The place phrase tells where the person is."],
      action: ["English places the verb after the subject.", "The object receives the action."],
      noun: ["English nouns often use an article in a phrase."],
      phrase: ["This phrase can be reused inside a full sentence."],
    },
    de: {
      location: ["German keeps the finite verb in second position.", "Location phrases often use dative forms such as im, am, or in der."],
      action: ["German uses verb-second word order.", "Articles change by gender and case."],
      noun: ["German nouns are capitalised.", "The article marks gender."],
      phrase: ["German phrase chunks often include an article or contraction."],
    },
    fr: {
      location: ["French uses être for location.", "Articles agree with the noun."],
      action: ["French usually places the verb after the subject.", "Articles and contractions must match the noun."],
      noun: ["French nouns normally use an article.", "Elision such as l' is written without a space."],
      phrase: ["French phrase chunks often include a preposition and article."],
    },
    es: {
      location: ["Spanish uses estar for location.", "Articles agree with gender and number."],
      action: ["Spanish verbs agree with the subject.", "The object follows the verb in simple sentences."],
      noun: ["Spanish nouns normally use an article.", "The article marks gender."],
      phrase: ["Spanish phrase chunks often include a preposition and article."],
    },
    zh: {
      location: ["Chinese does not use articles like 'the'.", "在 marks the location."],
      action: ["Chinese commonly follows subject + verb + object order.", "The verb does not change for person."],
      noun: ["Chinese nouns do not need articles."],
      phrase: ["Chinese learning chunks keep useful words together."],
    },
    ja: {
      location: ["Japanese marks the topic with は.", "に marks a place for being or destination.", "The verb comes at the end."],
      action: ["Japanese marks the topic with は.", "The object or phrase comes before the verb.", "The verb comes at the end."],
      noun: ["Japanese nouns do not need articles."],
      phrase: ["Japanese chunks keep particles attached to the word they mark."],
    },
  };
  return {
    sentencePattern: patterns[kind][lang],
    literalOrderExplanation: literalOrderExplanation || tokens.map((token) => token.text).join(" → "),
    grammarExplanation: notes[lang][kind],
    tokens,
  };
}

function translation(lang, kind, text, tiles, tokenRoles) {
  const tokens = tokenRoles.map(([tokenText, type, role, meaning, grammarNote = ""]) => ({
    text: tokenText,
    type,
    role,
    meaning,
    grammarNote,
  }));
  return { text, tiles, analysis: analysis(lang, kind, tokens) };
}

function fullTranslationSet(set, vocab) {
  return Object.fromEntries(supportedLanguages.map((lang) => {
    const [text, tiles] = set.translations[lang];
    const tokenRoles = tiles.map((tile, index) => {
      const clean = tile.replace(/[.。]/g, "");
      if (index === 0) return [clean, "noun", "subject", "person or topic"];
      if (index === tiles.length - 1) return [clean, "verb", set.kind === "location" ? "being/location" : "main action", "main sentence action"];
      return [clean, "phrase", set.kind === "location" ? "location" : "object_or_detail", "sentence detail"];
    });
    return [lang, translation(lang, set.kind, text, tiles, tokenRoles)];
  }));
}

function phraseSteps(set, vocab) {
  const steps = [];
  const subject = set.concepts[0];
  const objectOrPlace = set.concepts[set.concepts.length - 1];
  steps.push({
    step: 1,
    focus: "core_person",
    translations: Object.fromEntries(supportedLanguages.map((lang) => {
      const text = getTerm(vocab, subject, lang);
      return [lang, translation(lang, "noun", text, [text], [[text, "noun", "core_concept", "person"]])];
    })),
  });
  steps.push({
    step: 2,
    focus: set.kind === "location" ? "place_phrase" : "object_phrase",
    translations: Object.fromEntries(supportedLanguages.map((lang) => {
      const full = set.translations[lang][1];
      const phrase = set.kind === "location"
        ? full.slice(Math.max(0, full.length - 2)).join(" ")
        : getTerm(vocab, objectOrPlace, lang);
      const text = lang === "zh" || lang === "ja" ? phrase.replace(/\s+/g, "") : phrase;
      return [lang, translation(lang, "phrase", text, [text], [[text.replace(/[.。]/g, ""), "phrase", "supporting_detail", set.kind === "location" ? "place" : "object"]])];
    })),
  });
  steps.push({
    step: 3,
    focus: set.kind === "location" ? "full_location_sentence" : "full_action_sentence",
    translations: fullTranslationSet(set, vocab),
  });
  return steps;
}

function makePack(sourceFile) {
  const source = JSON.parse(fs.readFileSync(sourceFile, "utf8"));
  const slug = path.basename(sourceFile, ".json").replace(/^semantic_pack_l1_\d+_/, "");
  const template = TEMPLATES[slug];
  if (!template) throw new Error(`No template for ${slug}`);

  const vocabulary = [...template.vocabulary];
  if (template.action.extraVerb && !vocabulary.some((item) => item.conceptId === template.action.extraVerb.conceptId)) {
    vocabulary.push(template.action.extraVerb);
  }
  const locationChain = {
    chainId: "CHAIN_LOCATION",
    linkedConcepts: template.location.concepts,
    difficulty: "A0-A1",
    steps: phraseSteps(template.location, vocabulary),
  };
  const actionChain = {
    chainId: "CHAIN_ACTION",
    linkedConcepts: template.action.concepts,
    difficulty: "A0-A1",
    steps: phraseSteps(template.action, vocabulary),
  };
  const sentenceBuilders = [
    {
      sentenceId: "S001",
      difficulty: "A1",
      concepts: template.location.concepts,
      grammarFocus: ["location_phrase", "word_order"],
      sourceChainId: "CHAIN_LOCATION",
      translations: fullTranslationSet(template.location, vocabulary),
    },
    {
      sentenceId: "S002",
      difficulty: "A1",
      concepts: template.action.concepts,
      grammarFocus: ["basic_action", "word_order"],
      sourceChainId: "CHAIN_ACTION",
      translations: fullTranslationSet(template.action, vocabulary),
    },
  ];

  const conceptSentenceIndex = {};
  for (const sentence of sentenceBuilders) {
    for (const concept of sentence.concepts) {
      conceptSentenceIndex[concept] ||= [];
      conceptSentenceIndex[concept].push(sentence.sentenceId);
    }
  }

  return {
    packId: source.packId,
    schemaVersion: "prototype-0.3",
    title: source.title || `Semantic Pack — ${template.title}`,
    description: `A corrected multilingual Stage 1 Progressive Language pack for ${template.title}.`,
    baseLanguageCode: "en",
    supportedLanguages,
    languageLabels,
    sourceTopic: {
      topicId: source.sourceTopic?.topicId || source.packId,
      title: template.title,
      difficultyStage: 1,
      semanticDomains: template.domains,
      grammarTargets: source.sourceTopic?.grammarTargets || {
        universal: ["articles", "pronouns", "location_phrases"],
        german: ["article_gender", "verb_second_position"],
        french: ["article_gender", "être_location"],
        spanish: ["estar_location"],
        chinese: ["在_location_structure", "no_articles"],
        japanese: ["topic_marker_は", "verb_final_structure"],
      },
      sentenceGoals: [template.location.translations.en[0], template.action.translations.en[0]],
    },
    vocabulary,
    grammarTokens,
    phraseProgressionChains: [locationChain, actionChain],
    sentenceBuilders,
    conceptSentenceIndex,
  };
}

function titleFromSlug(slug) {
  return slug.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" and ").replace("And", "and");
}

function labelFromFile(fileName, pack) {
  const match = fileName.match(/semantic_pack_l1_(\d+)_/);
  const number = match ? match[1] : "000";
  return `${number} — ${pack.sourceTopic.title}`;
}

function main() {
  fs.mkdirSync(targetRoot, { recursive: true });
  const sourceFiles = fs.readdirSync(sourceRoot)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => path.join(sourceRoot, file));

  const lessons = [];
  for (const sourceFile of sourceFiles) {
    const sourceName = path.basename(sourceFile, ".json");
    const pack = makePack(sourceFile);
    const lessonDir = path.join(targetRoot, sourceName);
    fs.mkdirSync(lessonDir, { recursive: true });
    fs.writeFileSync(path.join(lessonDir, "pack.json"), `${JSON.stringify(pack, null, 2)}\n`);
    lessons.push({
      id: sourceName,
      label: labelFromFile(path.basename(sourceFile), pack),
      title: pack.title,
      path: `./data/ProgressiveLanguagePacks/beta1/stage1/${sourceName}/pack.json`,
      packId: pack.packId,
      vocabularyCount: pack.vocabulary.length,
      chainCount: pack.phraseProgressionChains.length,
      sentenceBuilderCount: pack.sentenceBuilders.length,
    });
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.generatedAt = new Date().toISOString();
  manifest.packs = manifest.packs.filter((pack) => pack.id !== "qclaw" && pack.id !== "qclaw2" && pack.id !== "beta1");
  manifest.packs.push({
    id: "beta1",
    label: "Beta 1",
    description: "Corrected multilingual Stage 1 beta lessons.",
    stages: [
      {
        id: "stage1",
        label: "Stage 1",
        description: "100 corrected beginner lessons",
        lessons,
      },
    ],
  });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(JSON.stringify({ generated: lessons.length, targetRoot }, null, 2));
}

main();
