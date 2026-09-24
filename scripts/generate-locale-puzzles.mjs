// Deterministic multilingual puzzle generator.
//
// Produces genuinely different riddles AND answers per language for every
// single-player level (easy/medium/hard share per-level content) and for
// multiplayer rounds, without touching the locked English content.
//
//  Outputs:
//    src/data/locale_puzzles.js          - client data module (LOCALE_PUZZLES)
//    supabase/migrations/019_locale_puzzle_content.sql - table + 450 rows + RPC rewrites
//    supabase/locale_puzzle_seed.sql     - seed parity rows (appended to seed runs)
//
//  Guarantees:
//    * deterministic (seeded mulberry32, no Math.random / dates)
//    * self-verifying (answers are recomputed from the exact words embedded in
//      each prompt and asserted equal before writing)
//    * letter levels stay letters, digit levels stay digits, structure identical
//    * English client/server data is never modified by this script

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Locales
// ---------------------------------------------------------------------------

export const LOCALES = [
  "ar",
  "de",
  "es",
  "fr",
  "hi",
  "id",
  "it",
  "ja",
  "ko",
  "nl",
  "pt",
  "ru",
  "tr",
  "ur",
  "zh",
];

const LETTER_LEVELS = new Set([3, 8, 10, 13, 18, 23, 28]);
const LETTER_LEVEL_ORDER = [3, 8, 10, 13, 18, 23, 28];
export const ALL_LEVELS = Array.from({ length: 30 }, (_, index) => index + 1);

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32)
// ---------------------------------------------------------------------------

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(items, locale, level, salt = "") {
  const rand = mulberry32(hashString(`${locale}:${level}:${salt}`));
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rand() * (index + 1));
    [output[index], output[other]] = [output[other], output[index]];
  }
  return output;
}

// ---------------------------------------------------------------------------
// Per-locale word banks + template sentences.
//
// Concepts are shared across locales; each locale owns its own *word* for the
// concept plus authored sentence templates in that language. Letter counts are
// Unicode code points of the word as displayed (no diacritic stripping), which
// is exactly what a player counts in the rendered prompt.
// ---------------------------------------------------------------------------

const CONCEPT_ORDER = [
  "sun",
  "moon",
  "star",
  "water",
  "fire",
  "tree",
  "sea",
  "cloud",
  "rain",
  "wind",
  "mountain",
  "river",
  "bird",
  "fish",
  "cat",
  "dog",
  "house",
  "door",
  "key",
  "book",
  "bread",
  "milk",
  "hand",
  "clock",
];

const WORD_BANKS = {
  ar: {
    sun: "شمس",
    moon: "قمر",
    star: "نجم",
    water: "ماء",
    fire: "نار",
    tree: "شجرة",
    sea: "بحر",
    cloud: "سحاب",
    rain: "مطر",
    wind: "ريح",
    mountain: "جبل",
    river: "نهر",
    bird: "طير",
    fish: "سمك",
    cat: "قط",
    dog: "كلب",
    house: "بيت",
    door: "باب",
    key: "مفتاح",
    book: "كتاب",
    bread: "خبز",
    milk: "حليب",
    hand: "يد",
    clock: "ساعة",
  },
  de: {
    sun: "Sonne",
    moon: "Mond",
    star: "Stern",
    water: "Wasser",
    fire: "Feuer",
    tree: "Baum",
    sea: "Meer",
    cloud: "Wolke",
    rain: "Regen",
    wind: "Wind",
    mountain: "Berg",
    river: "Fluss",
    bird: "Vogel",
    fish: "Fisch",
    cat: "Katze",
    dog: "Hund",
    house: "Haus",
    door: "Tür",
    key: "Schlüssel",
    book: "Buch",
    bread: "Brot",
    milk: "Milch",
    hand: "Hand",
    clock: "Uhr",
  },
  es: {
    sun: "sol",
    moon: "luna",
    star: "estrella",
    water: "agua",
    fire: "fuego",
    tree: "árbol",
    sea: "mar",
    cloud: "nube",
    rain: "lluvia",
    wind: "viento",
    mountain: "montaña",
    river: "río",
    bird: "pájaro",
    fish: "pez",
    cat: "gato",
    dog: "perro",
    house: "casa",
    door: "puerta",
    key: "llave",
    book: "libro",
    bread: "pan",
    milk: "leche",
    hand: "mano",
    clock: "reloj",
  },
  fr: {
    sun: "soleil",
    moon: "lune",
    star: "étoile",
    water: "eau",
    fire: "feu",
    tree: "arbre",
    sea: "mer",
    cloud: "nuage",
    rain: "pluie",
    wind: "vent",
    mountain: "montagne",
    river: "fleuve",
    bird: "oiseau",
    fish: "poisson",
    cat: "chat",
    dog: "chien",
    house: "maison",
    door: "porte",
    key: "clé",
    book: "livre",
    bread: "pain",
    milk: "lait",
    hand: "main",
    clock: "horloge",
  },
  hi: {
    sun: "सूरज",
    moon: "चाँद",
    star: "तारा",
    water: "पानी",
    fire: "आग",
    tree: "पेड़",
    sea: "समुद्र",
    cloud: "बादल",
    rain: "बारिश",
    wind: "हवा",
    mountain: "पहाड़",
    river: "नदी",
    bird: "पक्षी",
    fish: "मछली",
    cat: "बिल्ली",
    dog: "कुत्ता",
    house: "घर",
    door: "दरवाज़ा",
    key: "चाबी",
    book: "किताब",
    bread: "रोटी",
    milk: "दूध",
    hand: "हाथ",
    clock: "घड़ी",
  },
  id: {
    sun: "matahari",
    moon: "bulan",
    star: "bintang",
    water: "air",
    fire: "api",
    tree: "pohon",
    sea: "laut",
    cloud: "awan",
    rain: "hujan",
    wind: "angin",
    mountain: "gunung",
    river: "sungai",
    bird: "burung",
    fish: "ikan",
    cat: "kucing",
    dog: "anjing",
    house: "rumah",
    door: "pintu",
    key: "kunci",
    book: "buku",
    bread: "roti",
    milk: "susu",
    hand: "tangan",
    clock: "jam",
  },
  it: {
    sun: "sole",
    moon: "luna",
    star: "stella",
    water: "acqua",
    fire: "fuoco",
    tree: "albero",
    sea: "mare",
    cloud: "nuvola",
    rain: "pioggia",
    wind: "vento",
    mountain: "montagna",
    river: "fiume",
    bird: "uccello",
    fish: "pesce",
    cat: "gatto",
    dog: "cane",
    house: "casa",
    door: "porta",
    key: "chiave",
    book: "libro",
    bread: "pane",
    milk: "latte",
    hand: "mano",
    clock: "orologio",
  },
  ja: {
    sun: "たいよう",
    moon: "つき",
    star: "ほし",
    water: "みず",
    fire: "ひ",
    tree: "き",
    sea: "うみ",
    cloud: "くも",
    rain: "あめ",
    wind: "かぜ",
    mountain: "やま",
    river: "かわ",
    bird: "とり",
    fish: "さかな",
    cat: "ねこ",
    dog: "いぬ",
    house: "いえ",
    door: "ドア",
    key: "かぎ",
    book: "ほん",
    bread: "パン",
    milk: "ミルク",
    hand: "て",
    clock: "とけい",
  },
  ko: {
    sun: "해",
    moon: "달",
    star: "별",
    water: "물",
    fire: "불",
    tree: "나무",
    sea: "바다",
    cloud: "구름",
    rain: "비",
    wind: "바람",
    mountain: "산",
    river: "강",
    bird: "새",
    fish: "물고기",
    cat: "고양이",
    dog: "개",
    house: "집",
    door: "문",
    key: "열쇠",
    book: "책",
    bread: "빵",
    milk: "우유",
    hand: "손",
    clock: "시계",
  },
  nl: {
    sun: "zon",
    moon: "maan",
    star: "ster",
    water: "water",
    fire: "vuur",
    tree: "boom",
    sea: "zee",
    cloud: "wolk",
    rain: "regen",
    wind: "wind",
    mountain: "berg",
    river: "rivier",
    bird: "vogel",
    fish: "vis",
    cat: "kat",
    dog: "hond",
    house: "huis",
    door: "deur",
    key: "sleutel",
    book: "boek",
    bread: "brood",
    milk: "melk",
    hand: "hand",
    clock: "klok",
  },
  pt: {
    sun: "sol",
    moon: "lua",
    star: "estrela",
    water: "água",
    fire: "fogo",
    tree: "árvore",
    sea: "mar",
    cloud: "nuvem",
    rain: "chuva",
    wind: "vento",
    mountain: "montanha",
    river: "rio",
    bird: "pássaro",
    fish: "peixe",
    cat: "gato",
    dog: "cão",
    house: "casa",
    door: "porta",
    key: "chave",
    book: "livro",
    bread: "pão",
    milk: "leite",
    hand: "mão",
    clock: "relógio",
  },
  ru: {
    sun: "солнце",
    moon: "луна",
    star: "звезда",
    water: "вода",
    fire: "огонь",
    tree: "дерево",
    sea: "море",
    cloud: "облако",
    rain: "дождь",
    wind: "ветер",
    mountain: "гора",
    river: "река",
    bird: "птица",
    fish: "рыба",
    cat: "кошка",
    dog: "собака",
    house: "дом",
    door: "дверь",
    key: "ключ",
    book: "книга",
    bread: "хлеб",
    milk: "молоко",
    hand: "рука",
    clock: "часы",
  },
  tr: {
    sun: "güneş",
    moon: "ay",
    star: "yıldız",
    water: "su",
    fire: "ateş",
    tree: "ağaç",
    sea: "deniz",
    cloud: "bulut",
    rain: "yağmur",
    wind: "rüzgâr",
    mountain: "dağ",
    river: "nehir",
    bird: "kuş",
    fish: "balık",
    cat: "kedi",
    dog: "köpek",
    house: "ev",
    door: "kapı",
    key: "anahtar",
    book: "kitap",
    bread: "ekmek",
    milk: "süt",
    hand: "el",
    clock: "saat",
  },
  ur: {
    sun: "سورج",
    moon: "چاند",
    star: "ستارہ",
    water: "پانی",
    fire: "آگ",
    tree: "درخت",
    sea: "سمندر",
    cloud: "بادل",
    rain: "بارش",
    wind: "ہوا",
    mountain: "پہاڑ",
    river: "دریا",
    bird: "پرندہ",
    fish: "مچھلی",
    cat: "بلی",
    dog: "کتا",
    house: "گھر",
    door: "دروازہ",
    key: "چابی",
    book: "کتاب",
    bread: "روٹی",
    milk: "دودھ",
    hand: "ہاتھ",
    clock: "گھڑی",
  },
  zh: {
    sun: "太阳",
    moon: "月亮",
    star: "星星",
    water: "水",
    fire: "火",
    tree: "树",
    sea: "海",
    cloud: "云",
    rain: "雨",
    wind: "风",
    mountain: "山",
    river: "河",
    bird: "鸟",
    fish: "鱼",
    cat: "猫",
    dog: "狗",
    house: "房子",
    door: "门",
    key: "钥匙",
    book: "书",
    bread: "面包",
    milk: "牛奶",
    hand: "手",
    clock: "钟",
  },
};

// Digit clue sentence templates. Each locale owns its grammatical phrasing of
// the four operations plus how to join the four clauses into one riddle.
const DIGIT_TEMPLATES = {
  ar: {
    intro: "رمز من أربعة أرقام ينتظرك",
    ordinals: ["الأول", "الثاني", "الثالث", "الرابع"],
    ops: {
      L: ({ w }) => `عدد حروف «${w}»`,
      L1: ({ w }) => `عدد حروف «${w}» زائد واحد`,
      L2: ({ w }) => `عدد حروف «${w}» ناقص واحد`,
      DBL: ({ w }) => `ضعف عدد حروف «${w}» (خانة الآحاد فقط)`,
      FIX: ({ d }) => `الرقم الثابت ${d}`,
    },
    joiner: "،",
    close: "ما هو الرمز؟",
  },
  de: {
    intro: "Ein vierstelliger Code wartet auf dich",
    ordinals: ["die erste Ziffer", "die zweite Ziffer", "die dritte Ziffer", "die vierte Ziffer"],
    ops: {
      L: ({ w }) => `die Zahl der Buchstaben in „${w}“`,
      L1: ({ w }) => `die Zahl der Buchstaben in „${w}“ plus eins`,
      L2: ({ w }) => `die Zahl der Buchstaben in „${w}“ minus eins`,
      DBL: ({ w }) => `das Doppelte der Buchstaben in „${w}“ (nur die Einerstelle)`,
      FIX: ({ d }) => `die feste Ziffer ${d}`,
    },
    joiner: ", ",
    close: "Wie lautet der Code?",
  },
  es: {
    intro: "Un código de cuatro dígitos te espera",
    ordinals: ["la primera cifra", "la segunda cifra", "la tercera cifra", "la cuarta cifra"],
    ops: {
      L: ({ w }) => `el número de letras de «${w}»`,
      L1: ({ w }) => `el número de letras de «${w}» más uno`,
      L2: ({ w }) => `el número de letras de «${w}» menos uno`,
      DBL: ({ w }) => `el doble de las letras de «${w}» (solo la cifra de las unidades)`,
      FIX: ({ d }) => `la cifra fija ${d}`,
    },
    joiner: ", ",
    close: "¿Cuál es el código?",
  },
  fr: {
    intro: "Un code à quatre chiffres t'attend",
    ordinals: ["le premier chiffre", "le deuxième chiffre", "le troisième chiffre", "le quatrième chiffre"],
    ops: {
      L: ({ w }) => `le nombre de lettres de «${w}»`,
      L1: ({ w }) => `le nombre de lettres de «${w}» plus un`,
      L2: ({ w }) => `le nombre de lettres de «${w}» moins un`,
      DBL: ({ w }) => `le double des lettres de «${w}» (uniquement le chiffre des unités)`,
      FIX: ({ d }) => `le chiffre fixe ${d}`,
    },
    joiner: ", ",
    close: "Quel est le code ?",
  },
  hi: {
    intro: "चार अंकों का एक कोड आपका इंतज़ार कर रहा है",
    ordinals: ["पहला अंक", "दूसरा अंक", "तीसरा अंक", "चौथा अंक"],
    ops: {
      L: ({ w }) => `«${w}» में अक्षरों की संख्या`,
      L1: ({ w }) => `«${w}» में अक्षरों की संख्या प्लस एक`,
      L2: ({ w }) => `«${w}» में अक्षरों की संख्या माइनस एक`,
      DBL: ({ w }) => `«${w}» के अक्षरों का दोगुना (केवल इकाई अंक)`,
      FIX: ({ d }) => `निश्चित अंक ${d}`,
    },
    joiner: ", ",
    close: "कोड क्या है?",
  },
  id: {
    intro: "Sebuah kode empat digit menantimu",
    ordinals: ["digit pertama", "digit kedua", "digit ketiga", "digit keempat"],
    ops: {
      L: ({ w }) => `jumlah huruf pada «${w}»`,
      L1: ({ w }) => `jumlah huruf pada «${w}» ditambah satu`,
      L2: ({ w }) => `jumlah huruf pada «${w}» dikurangi satu`,
      DBL: ({ w }) => `dua kali jumlah huruf pada «${w}» (hanya digit satuan)`,
      FIX: ({ d }) => `digit tetap ${d}`,
    },
    joiner: ", ",
    close: "Berapa kodenya?",
  },
  it: {
    intro: "Un codice a quattro cifre ti aspetta",
    ordinals: ["la prima cifra", "la seconda cifra", "la terza cifra", "la quarta cifra"],
    ops: {
      L: ({ w }) => `il numero di lettere di «${w}»`,
      L1: ({ w }) => `il numero di lettere di «${w}» più uno`,
      L2: ({ w }) => `il numero di lettere di «${w}» meno uno`,
      DBL: ({ w }) => `il doppio delle lettere di «${w}» (solo la cifra delle unità)`,
      FIX: ({ d }) => `la cifra fissa ${d}`,
    },
    joiner: ", ",
    close: "Qual è il codice?",
  },
  ja: {
    intro: "4桁のコードがあなたを待っている",
    ordinals: ["1桁目", "2桁目", "3桁目", "4桁目"],
    ops: {
      L: ({ w }) => `「${w}」の文字数`,
      L1: ({ w }) => `「${w}」の文字数に1を足した数`,
      L2: ({ w }) => `「${w}」の文字数から1を引いた数`,
      DBL: ({ w }) => `「${w}」の文字数の2倍（一の位だけ）`,
      FIX: ({ d }) => `固定の数字 ${d}`,
    },
    joiner: "、",
    close: "コードは何？",
  },
  ko: {
    intro: "네 자리 코드가 당신을 기다린다",
    ordinals: ["첫째 자리", "둘째 자리", "셋째 자리", "넷째 자리"],
    ops: {
      L: ({ w }) => `「${w}」의 글자 수`,
      L1: ({ w }) => `「${w}」의 글자 수에 1을 더한 값`,
      L2: ({ w }) => `「${w}」의 글자 수에서 1을 뺀 값`,
      DBL: ({ w }) => `「${w}」의 글자 수의 두 배 (일의 자리만)`,
      FIX: ({ d }) => `고정 숫자 ${d}`,
    },
    joiner: ", ",
    close: "코드는 무엇인가요?",
  },
  nl: {
    intro: "Een viercijferige code wacht op je",
    ordinals: ["het eerste cijfer", "het tweede cijfer", "het derde cijfer", "het vierde cijfer"],
    ops: {
      L: ({ w }) => `het aantal letters van «${w}»`,
      L1: ({ w }) => `het aantal letters van «${w}» plus één`,
      L2: ({ w }) => `het aantal letters van «${w}» min één`,
      DBL: ({ w }) => `het dubbele van de letters van «${w}» (alleen de eenheden)`,
      FIX: ({ d }) => `het vaste cijfer ${d}`,
    },
    joiner: ", ",
    close: "Wat is de code?",
  },
  pt: {
    intro: "Um código de quatro dígitos espera por você",
    ordinals: ["o primeiro dígito", "o segundo dígito", "o terceiro dígito", "o quarto dígito"],
    ops: {
      L: ({ w }) => `o número de letras de «${w}»`,
      L1: ({ w }) => `o número de letras de «${w}» mais um`,
      L2: ({ w }) => `o número de letras de «${w}» menos um`,
      DBL: ({ w }) => `o dobro das letras de «${w}» (apenas o dígito das unidades)`,
      FIX: ({ d }) => `o dígito fixo ${d}`,
    },
    joiner: ", ",
    close: "Qual é o código?",
  },
  ru: {
    intro: "Четырёхзначный код ждёт тебя",
    ordinals: ["первая цифра", "вторая цифра", "третья цифра", "четвёртая цифра"],
    ops: {
      L: ({ w }) => `число букв в слове «${w}»`,
      L1: ({ w }) => `число букв в слове «${w}» плюс один`,
      L2: ({ w }) => `число букв в слове «${w}» минус один`,
      DBL: ({ w }) => `удвоенное число букв в слове «${w}» (только цифра единиц)`,
      FIX: ({ d }) => `фиксированная цифра ${d}`,
    },
    joiner: ", ",
    close: "Какой это код?",
  },
  tr: {
    intro: "Dört haneli bir kod seni bekliyor",
    ordinals: ["ilk hane", "ikinci hane", "üçüncü hane", "dördüncü hane"],
    ops: {
      L: ({ w }) => `«${w}» kelimesindeki harf sayısı`,
      L1: ({ w }) => `«${w}» kelimesindeki harf sayısı artı bir`,
      L2: ({ w }) => `«${w}» kelimesindeki harf sayısı eksi bir`,
      DBL: ({ w }) => `«${w}» kelimesindeki harf sayısının iki katı (sadece birler basamağı)`,
      FIX: ({ d }) => `sabit hane ${d}`,
    },
    joiner: ", ",
    close: "Kod nedir?",
  },
  ur: {
    intro: "چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے",
    ordinals: ["پہلا ہندسہ", "دوسرا ہندسہ", "تیسرا ہندسہ", "چوتھا ہندسہ"],
    ops: {
      L: ({ w }) => `«${w}» میں حروف کی تعداد`,
      L1: ({ w }) => `«${w}» میں حروف کی تعداد جمع ایک`,
      L2: ({ w }) => `«${w}» میں حروف کی تعداد منفی ایک`,
      DBL: ({ w }) => `«${w}» کے حروف کی تعداد کا دوگنا (صرف اکائی ہندسہ)`,
      FIX: ({ d }) => `مقررہ ہندسہ ${d}`,
    },
    joiner: "،",
    close: "کوڈ کیا ہے؟",
  },
  zh: {
    intro: "一个四位数密码在等你",
    ordinals: ["第一位", "第二位", "第三位", "第四位"],
    ops: {
      L: ({ w }) => `「${w}」的字数`,
      L1: ({ w }) => `「${w}」的字数加一`,
      L2: ({ w }) => `「${w}」的字数减一`,
      DBL: ({ w }) => `「${w}」字数的两倍（只看个位）`,
      FIX: ({ d }) => `固定数字 ${d}`,
    },
    joiner: "，",
    close: "密码是什么？",
  },
};

// Letter-level clue sentences, one per concept (7 used per locale + buffer).
const LETTER_CLUES = {
  ar: {
    sun: "أضيء النهار بضوئي الذهبي",
    moon: "أضيء الليل من السماء",
    star: "تلمع في سماء الليل",
    water: "أروي العطش وأجري في الأنهار",
    fire: "أحرق بلهبي وأدفئ البيت",
    tree: "أظلّل الأرض بأغصاني",
    sea: "أمواجي لا تنتهي",
    cloud: "أطوف في السماء حاملة المطر",
    rain: "أنزل من السماء قطرات",
    wind: "أتحرك بلا أن تُرى",
    mountain: "قمتُ تلامس الغيوم",
    river: "أسير نحو البحر",
    bird: "أطير في السماء",
    fish: "أعيش في الماء",
    cat: "سيد المنزل الهادئ",
    dog: "وفيُّ صديق الإنسان",
    house: "مأوى الإنسان",
    door: "أفتح للمدخل والمخرج",
    key: "أفتح بها الأقفال",
    book: "كنوز الحكمة بين صفحاتي",
    bread: "خبز يومي",
    milk: "شراب أبيض من المزرعة",
    hand: "يُكتب بها وتُصافح",
    clock: "أقيس الوقت",
  },
  de: {
    sun: "Ich scheine am Tag",
    moon: "Ich leuchte nachts am Himmel",
    star: "Ich funkeln am Nachthimmel",
    water: "Ich lösche den Durst",
    fire: "Ich wärme und brenne",
    tree: "Ich schattiere den Boden",
    sea: "Meine Wellen sind endlos",
    cloud: "Ich bringe den Regen am Himmel",
    rain: "Ich falle als Tropfen",
    wind: "Ich bewege mich unsichtbar",
    mountain: "Mein Gipfel berührt die Wolken",
    river: "Ich fließe zum Meer",
    bird: "Ich fliege am Himmel",
    fish: "Ich lebe im Wasser",
    cat: "das ruhige Tier im Haus",
    dog: "der treue Freund des Menschen",
    house: "die Behausung des Menschen",
    door: "ich öffne den Eingang",
    key: "ich öffne Schlösser",
    book: "Weisheit zwischen meinen Seiten",
    bread: "mein tägliches Brot",
    milk: "das weiße Getränk vom Bauernhof",
    hand: "man schreibt und begrüßt mit mir",
    clock: "ich messe die Zeit",
  },
  es: {
    sun: "ilumino el día",
    moon: "ilumino la noche desde el cielo",
    star: "brillo en el cielo nocturno",
    water: "calmo la sed",
    fire: "quemo y caliento",
    tree: "doy sombra al suelo",
    sea: "mis olas no terminan nunca",
    cloud: "vago por el cielo",
    rain: "caigo en gotas",
    wind: "me muevo sin que se me vea",
    mountain: "mi cima toca las nubes",
    river: "camino hacia el mar",
    bird: "vuelo por el cielo",
    fish: "vivo en el agua",
    cat: "el animal tranquilo de la casa",
    dog: "el amigo fiel del hombre",
    house: "el refugio de las personas",
    door: "abro la entrada",
    key: "abro cerraduras",
    book: "la sabiduría entre mis páginas",
    bread: "el pan de cada día",
    milk: "la bebida blanca de la granja",
    hand: "conmigo se escribe y se saluda",
    clock: "mido el tiempo",
  },
  fr: {
    sun: "j'éclaire le jour",
    moon: "j'éclaire la nuit dans le ciel",
    star: "je brille dans le ciel de nuit",
    water: "je désaltère",
    fire: "je brûle et je réchauffe",
    tree: "je fais de l'ombre",
    sea: "mes vagues sont infinies",
    cloud: "je voyage dans le ciel",
    rain: "je tombe en gouttes",
    wind: "je me déplace invisible",
    mountain: "mon sommet touche les nuages",
    river: "je coule vers la mer",
    bird: "je vole dans le ciel",
    fish: "je vis dans l'eau",
    cat: "l'animal tranquille de la maison",
    dog: "le fidèle ami de l'homme",
    house: "l'abri des humains",
    door: "j'ouvre l'entrée",
    key: "j'ouvre les serrures",
    book: "la sagesse entre mes pages",
    bread: "mon pain quotidien",
    milk: "la boisson blanche de la ferme",
    hand: "on écrit et on salue avec moi",
    clock: "je mesure le temps",
  },
  hi: {
    sun: "मैं दिन में रोशनी देती हूँ",
    moon: "मैं रात में चमकती हूँ",
    star: "मैं रात के आसमान में टिमटिमाता हूँ",
    water: "मैं प्यास बुझाता हूँ",
    fire: "मैं जलाता और गर्म करता हूँ",
    tree: "मैं धरती को छाया देता हूँ",
    sea: "मेरी लहरें कभी खत्म नहीं होतीं",
    cloud: "मैं आसमान में घूमता हूँ",
    rain: "मैं बूँदों में गिरता हूँ",
    wind: "मैं अदृश्य चलता हूँ",
    mountain: "मेरी चोटी बादलों को छूती है",
    river: "मैं समुद्र की ओर बहती हूँ",
    bird: "मैं आसमान में उड़ता हूँ",
    fish: "मैं पानी में रहता हूँ",
    cat: "घर का शांत साथी",
    dog: "मनुष्य का वफादार दोस्त",
    house: "मनुष्य का आश्रय",
    door: "मैं प्रवेश खोलती हूँ",
    key: "मैं ताले खोलती हूँ",
    book: "मेरे पन्नों में ज्ञान है",
    bread: "मेरी रोज़ की रोटी",
    milk: "खेत का सफ़ेद पेय",
    hand: "मुझसे लिखा और मिलाया जाता है",
    clock: "मैं समय मापती हूँ",
  },
  id: {
    sun: "aku menyinari siang",
    moon: "aku bercahaya di malam hari",
    star: "aku berkilau di langit malam",
    water: "aku menghilangkan dahaga",
    fire: "aku membakar dan menghangatkan",
    tree: "aku menaungi tanah",
    sea: "ombakku tak berujung",
    cloud: "aku melayang di langit",
    rain: "aku jatuh sebagai tetesan",
    wind: "aku bergerak tanpa terlihat",
    mountain: "puncakku menyentuh awan",
    river: "aku mengalir ke laut",
    bird: "aku terbang di langit",
    fish: "aku hidup di air",
    cat: "teman tenang di rumah",
    dog: "sahabat setia manusia",
    house: "tempat tinggal manusia",
    door: "aku membuka pintu masuk",
    key: "aku membuka gembok",
    book: "kebijaksanaan di antara halamanku",
    bread: "roti harianku",
    milk: "minuman putih dari peternakan",
    hand: "dengan aku orang menulis dan menyapa",
    clock: "aku mengukur waktu",
  },
  it: {
    sun: "illumino il giorno",
    moon: "illumino la notte dal cielo",
    star: "brillo nel cielo notturno",
    water: "spengo la sete",
    fire: "brucio e scaldo",
    tree: "faccio ombra al terreno",
    sea: "le mie onde sono infinite",
    cloud: "vago nel cielo",
    rain: "cado in gocce",
    wind: "mi muovo senza essere visto",
    mountain: "la mia cima tocca le nuvole",
    river: "scorro verso il mare",
    bird: "volo nel cielo",
    fish: "vivo nell'acqua",
    cat: "l'animale tranquillo di casa",
    dog: "il fedele amico dell'uomo",
    house: "il riparo delle persone",
    door: "apro l'ingresso",
    key: "apro le serrature",
    book: "la saggezza tra le mie pagine",
    bread: "il mio pane quotidiano",
    milk: "la bevanda bianca della fattoria",
    hand: "con me si scrive e si saluta",
    clock: "misuro il tempo",
  },
  ja: {
    sun: "昼を照らす",
    moon: "夜の空で光る",
    star: "夜空に輝く",
    water: "のどの渇きをいやす",
    fire: "燃えて暖める",
    tree: "地面に木陰をつくる",
    sea: "果てしない波",
    cloud: "空を旅する",
    rain: "雫になって降る",
    wind: "見えないまま動く",
    mountain: "頂上が雲に届く",
    river: "海へ流れる",
    bird: "空を飛ぶ",
    fish: "水に住む",
    cat: "家でおとなしい動物",
    dog: "人間の忠実な友",
    house: "人の住まい",
    door: "入口を開く",
    key: "かぎを開ける",
    book: "ページの間の知恵",
    bread: "毎日のパン",
    milk: "農場の白い飲み物",
    hand: "書いたり握手したりする",
    clock: "時間を測る",
  },
  ko: {
    sun: "낮을 밝힌다",
    moon: "밤하늘에서 빛난다",
    star: "밤하늘에 반짝인다",
    water: "목마름을 해소한다",
    fire: "타오르며 따뜻하게 한다",
    tree: "땅에 그늘을 만든다",
    sea: "끝없는 파도",
    cloud: "하늘을 떠돈다",
    rain: "빗방울로 내린다",
    wind: "보이지 않게 움직인다",
    mountain: "정상이 구름에 닿는다",
    river: "바다로 흐른다",
    bird: "하늘을 난다",
    fish: "물에 산다",
    cat: "집에서 조용한 동물",
    dog: "사람의 충실한 친구",
    house: "사람이 사는 곳",
    door: "입구를 연다",
    key: "자물쇠를 연다",
    book: "페이지 사이의 지혜",
    bread: "매일의 빵",
    milk: "농장의 하얀 음료",
    hand: "쓰고 악수하는 손",
    clock: "시간을 잰다",
  },
  nl: {
    sun: "ik verlicht de dag",
    moon: "ik schijn 's nachts aan de hemel",
    star: "ik schitter aan de nachthemel",
    water: "ik les de dorst",
    fire: "ik brand en verwarm",
    tree: "ik geef schaduw",
    sea: "mijn golven zijn eindeloos",
    cloud: "ik reis door de lucht",
    rain: "ik val in druppels",
    wind: "ik beweeg onzichtbaar",
    mountain: "mijn top raakt de wolken",
    river: "ik stroom naar de zee",
    bird: "ik vlieg door de lucht",
    fish: "ik leef in het water",
    cat: "het rustige dier in huis",
    dog: "de trouwe vriend van de mens",
    house: "het onderkomen van de mens",
    door: "ik open de ingang",
    key: "ik open sloten",
    book: "wijsheid tussen mijn bladzijden",
    bread: "mijn dagelijks brood",
    milk: "de witte drank van de boerderij",
    hand: "met mij schrijf en groet je",
    clock: "ik meet de tijd",
  },
  pt: {
    sun: "eu ilumino o dia",
    moon: "eu ilumino a noite no céu",
    star: "eu brilho no céu noturno",
    water: "eu mato a sede",
    fire: "eu queimo e aqueço",
    tree: "eu faço sombra no chão",
    sea: "minhas ondas são infinitas",
    cloud: "eu viajo pelo céu",
    rain: "eu caio em gotas",
    wind: "eu me movo invisível",
    mountain: "meu topo toca as nuvens",
    river: "eu corro até o mar",
    bird: "eu voo pelo céu",
    fish: "eu vivo na água",
    cat: "o animal tranquilo da casa",
    dog: "o amigo fiel do homem",
    house: "o abrigo das pessoas",
    door: "eu abro a entrada",
    key: "eu abro fechaduras",
    book: "a sabedoria entre minhas páginas",
    bread: "meu pão de cada dia",
    milk: "a bebida branca da fazenda",
    hand: "comigo se escreve e se cumprimenta",
    clock: "eu meço o tempo",
  },
  ru: {
    sun: "я освещаю день",
    moon: "я светлю ночью в небе",
    star: "я сверкаю на ночном небе",
    water: "я утоляю жажду",
    fire: "я горю и согреваю",
    tree: "я даю тень земле",
    sea: "мои волны бесконечны",
    cloud: "я плыву по небу",
    rain: "я падаю каплями",
    wind: "я движусь невидимо",
    mountain: "моя вершина касается облаков",
    river: "я теку к морю",
    bird: "я летаю в небе",
    fish: "я живу в воде",
    cat: "тихий зверёк в доме",
    dog: "верный друг человека",
    house: "жилище человека",
    door: "я открываю вход",
    key: "я открываю замки",
    book: "мудрость между моими страницами",
    bread: "мой хлеб насущный",
    milk: "белый напиток с фермы",
    hand: "мной пишут и здороваются",
    clock: "я измеряю время",
  },
  tr: {
    sun: "gündüzü aydınlatırım",
    moon: "gece gökyüzünde parlarım",
    star: "gece gökyüzünde pırıldarım",
    water: "susuzluğu gideririm",
    fire: "yakar ve ısıtırım",
    tree: "yere gölge yaparım",
    sea: "dalgalarım sonsuzdur",
    cloud: "gökyüzünde gezerim",
    rain: "damlalar hâlinde düşerim",
    wind: "görünmeden eserim",
    mountain: "tepe'm bulutlara değer",
    river: "denize akarım",
    bird: "gökyüzünde uçarım",
    fish: "suda yaşarım",
    cat: "evin sessiz hayvanı",
    dog: "insanın sadık dostu",
    house: "insanın sığınağı",
    door: "girişi açarım",
    key: "kilitleri açarım",
    book: "sayfalarım arasında bilgelik",
    bread: "her günün ekmeği",
    milk: "çiftliğin beyaz içeceği",
    hand: "benimle yazılır ve selamlaşılır",
    clock: "zamanı ölçerim",
  },
  ur: {
    sun: "میں دن کو روشن کرتا ہوں",
    moon: "میں رات کو آسمان سے چمکتا ہوں",
    star: "میں رات کے آسمان میں جھلملاتا ہوں",
    water: "میں پیاس بجھاتا ہوں",
    fire: "میں جلتا اور گرم کرتا ہوں",
    tree: "میں زمین کو سایہ دیتا ہوں",
    sea: "میری لہریں کبھی ختم نہیں ہوتیں",
    cloud: "میں آسمان میں گھومتا ہوں",
    rain: "میں قطرے بن کر گرتا ہوں",
    wind: "میں بغیر نظر آئے چلتا ہوں",
    mountain: "میری چوٹی بادلوں کو چھوتی ہے",
    river: "میں سمندر کی طرف بہتا ہوں",
    bird: "میں آسمان میں اڑتا ہوں",
    fish: "میں پانی میں رہتا ہوں",
    cat: "گھر کا خاموش ساتھی",
    dog: "انسان کا وفادار دوست",
    house: "انسان کا مسکن",
    door: "میں داخلی راستہ کھولتا ہوں",
    key: "میں تالے کھولتا ہوں",
    book: "میرے صفحات میں حکمت",
    bread: "میری روز کی روٹی",
    milk: "کھیت کا سفید مشروب",
    hand: "مجھ سے لکھا اور مصافحہ کیا جاتا ہے",
    clock: "میں وقت ناپتا ہوں",
  },
  zh: {
    sun: "我照亮白天",
    moon: "我在夜空发光",
    star: "我在夜空中闪烁",
    water: "我解渴",
    fire: "我燃烧并温暖",
    tree: "我给大地遮阴",
    sea: "我的波浪没有尽头",
    cloud: "我在天空飘游",
    rain: "我化作水滴落下",
    wind: "我看不见地移动",
    mountain: "我的顶峰碰到云",
    river: "我流向大海",
    bird: "我在天空飞翔",
    fish: "我生活在水里",
    cat: "家里安静的小动物",
    dog: "人类忠实的朋友",
    house: "人的住所",
    door: "我打开入口",
    key: "我打开锁",
    book: "我书页之间的智慧",
    bread: "我每天的面包",
    milk: "农场的白色饮品",
    hand: "用它写字和握手",
    clock: "我测量时间",
  },
};

// ---------------------------------------------------------------------------
// Letter level concept selection: 7 distinct concepts per locale, rotated so
// different locales map different concepts onto the same letter level.
// ---------------------------------------------------------------------------

function letterConceptsFor(locale, salt = "") {
  const available = CONCEPT_ORDER.filter((concept) => LETTER_CLUES[locale]?.[concept]);
  const shuffled = seededShuffle(available, locale, "letters", salt);
  if (shuffled.length < 7) {
    throw new Error(`Locale ${locale} has only ${shuffled.length} letter concepts`);
  }
  return shuffled.slice(0, 7);
}

// ---------------------------------------------------------------------------
// Localized digit glyphs inside prompt text (not the stored answer, which
// stays canonical): ar → Arabic-Indic, ur → Extended Arabic-Indic,
// hi → Devanagari, everything else → Latin. The client stores/validates
// canonical digits everywhere; only the rendered riddle text uses these.
// ---------------------------------------------------------------------------

const DIGIT_SETS = {
  latn: "0123456789",
  arab: "٠١٢٣٤٥٦٧٨٩",
  arabext: "۰۱۲۳۴۵۶۷۸۹",
  deva: "०१२३४५६७८९",
};

const LOCALE_DIGIT_SET = {
  ar: "arab",
  ur: "arabext",
  hi: "deva",
};

function localizeDigits(locale, value) {
  const setName = LOCALE_DIGIT_SET[locale] || "latn";
  if (setName === "latn") return String(value);
  const digits = DIGIT_SETS[setName];
  return String(value).replace(/[0-9]/g, (char) => digits[Number(char)]);
}

// ---------------------------------------------------------------------------
// Per-level operation recipes for digit levels. Structure is identical across
// locales (requirement); only the embedded words differ.
// Ops: L = letter count, L1 = +1, L2 = −1, DBL = 2×len mod 10, FIX = fixed.
// ---------------------------------------------------------------------------

const LEVEL_RECIPES = {
  1: ["L", "L1", "L2", "DBL"],
  2: ["L", "FIX", "L1", "L"],
  3: null, // letters
  4: ["L1", "L", "DBL", "L2"],
  5: ["L", "L", "FIX", "L1"],
  6: ["DBL", "L", "L1", "L"],
  7: ["L2", "L", "DBL", "FIX"],
  8: null,
  9: ["L", "L1", "L", "FIX"],
  10: null,
  11: ["FIX", "L", "L2", "L"],
  12: ["L", "DBL", "L1", "L2"],
  13: null,
  14: ["L1", "L2", "L", "FIX"],
  15: ["L", "L", "L", "L1"],
  16: ["DBL", "FIX", "L", "L2"],
  17: ["L", "L1", "FIX", "L"],
  18: null,
  19: ["L2", "DBL", "L", "L1"],
  20: ["FIX", "L", "L1", "DBL"],
  21: ["L", "L2", "FIX", "L1"],
  22: ["L1", "L", "DBL", "FIX"],
  23: null,
  24: ["L", "FIX", "L2", "DBL"],
  25: ["DBL", "L1", "L", "L"],
  26: ["L", "L", "L2", "FIX"],
  27: ["L1", "DBL", "FIX", "L"],
  28: null,
  29: ["L", "L1", "L2", "L"],
  30: ["FIX", "L", "DBL", "L1"],
};

// ---------------------------------------------------------------------------
// Letter count: Unicode code points excluding whitespace (matches what a
// player counts in the rendered glyphs, no diacritic stripping).
// ---------------------------------------------------------------------------

function letterCount(word) {
  if (!word) return 0;
  return [...word].filter((character) => !/\s/u.test(character)).length;
}

// Digit payload for each op (fails → null so caller picks a different word).
function applyOp(op, word, fixedDigit) {
  const length = letterCount(word);
  switch (op) {
    case "L":
      return length >= 1 && length <= 9 ? length : null;
    case "L1":
      return length >= 1 && length <= 8 ? length + 1 : null;
    case "L2":
      return length >= 2 && length <= 9 ? length - 1 : null;
    case "DBL":
      return length >= 1 && length <= 9 ? (2 * length) % 10 : null;
    case "FIX":
      return fixedDigit;
    default:
      return null;
  }
}

// Pick a concept for a digit slot whose op produces a valid single digit.
// Deterministic: iterate the locale word bank in seeded order. For slot 0 the
// candidate must not produce 0 (a code never starts with 0).
function pickDigitConcept(locale, level, slot, op, usedConcepts, salt = "") {
  const bank = WORD_BANKS[locale];
  const concepts = seededShuffle(CONCEPT_ORDER, locale, `digit:${level}:${slot}`, salt);
  for (const concept of concepts) {
    if (usedConcepts.has(concept)) continue;
    if (!bank[concept]) continue;
    const word = bank[concept];
    if (op === "FIX") return { concept, word };
    const computed = applyOp(op, word);
    if (computed === null) continue;
    if (slot === 0 && computed === 0) continue;
    return { concept, word };
  }
  // Deterministic fallback: plain letter count is always 1..9 for bank words.
  for (const concept of concepts) {
    if (usedConcepts.has(concept)) continue;
    if (bank[concept] && applyOp("L", bank[concept]) !== null) {
      return { concept, word: bank[concept] };
    }
  }
  return null;
}

function buildDigitPrompt(locale, level, recipe, salt = "") {
  const template = DIGIT_TEMPLATES[locale];
  const rand = mulberry32(hashString(`${locale}:digit:${level}:${salt}`));
  const usedConcepts = new Set();
  const clauses = [];
  const digits = [];

  for (let slot = 0; slot < 4; slot += 1) {
    const op = recipe[slot];
    if (op === "FIX") {
      const fixedDigit = Math.floor(rand() * 9) + 1; // 1..9
      clauses.push(`${template.ordinals[slot]} ${template.ops.FIX({ d: localizeDigits(locale, fixedDigit) })}`);
      digits.push(fixedDigit);
      continue;
    }
    const picked = pickDigitConcept(locale, level, slot, op, usedConcepts, salt);
    if (!picked) throw new Error(`No concept for ${locale}/${level}/${slot}`);
    usedConcepts.add(picked.concept);
    const { word } = picked;
    const computed = applyOp(op, word);
    if (computed === null) throw new Error(`Op ${op} failed for ${locale}/${level}/${slot}`);
    if (slot === 0 && computed === 0) {
      throw new Error(`Slot 0 produced 0 for ${locale}/${level}`);
    }
    clauses.push(`${template.ordinals[slot]} ${template.ops[op]({ w: word })}`);
    digits.push(computed);
  }

  const prompt = `${template.intro} — ${clauses.join(template.joiner + " ")}. ${template.close}`;
  return { prompt, answer: digits.join("") };
}

// Letter-level prompt framing per locale: each locale owns its grammatical
// phrasing for "a word of N letters: «clue». Which word is it?".
function buildLetterPrompt(locale, level, concept) {
  const clue = LETTER_CLUES[locale][concept];
  const word = WORD_BANKS[locale][concept];
  const count = letterCount(word);
  const frame = letterFrame(locale);
  const prompt = frame(localizeDigits(locale, count), clue);
  return {
    prompt,
    answer: word,
    count,
  };
}

function letterFrame(locale) {
  const frames = {
    ar: (count, clue) => `أنت تبحث عن كلمة من ${count} حروف: «${clue}». ما هي؟`,
    de: (count, clue) => `Du suchst ein Wort mit ${count} Buchstaben: „${clue}“. Welches ist es?`,
    es: (count, clue) => `Buscas una palabra de ${count} letras: «${clue}». ¿Cuál es?`,
    fr: (count, clue) => `Tu cherches un mot de ${count} lettres : «${clue}». Lequel est-ce ?`,
    hi: (count, clue) => `आप ${count} अक्षरों वाला एक शब्द खोज रहे हैं: «${clue}». वह कौन सा है?`,
    id: (count, clue) => `Kamu mencari sebuah kata dengan ${count} huruf: «${clue}». Kata apa itu?`,
    it: (count, clue) => `Cerchi una parola di ${count} lettere: «${clue}». Qual è?`,
    ja: (count, clue) => `${count}文字の言葉を探している: 「${clue}」。それは何？`,
    ko: (count, clue) => `${count}글자 단어를 찾고 있다: 「${clue}」。그것은 무엇인가요?`,
    nl: (count, clue) => `Je zoekt een woord van ${count} letters: «${clue}». Welk woord is het?`,
    pt: (count, clue) => `Você procura uma palavra de ${count} letras: «${clue}». Qual é?`,
    ru: (count, clue) => `Ты ищешь слово из ${count} букв: «${clue}». Какое это слово?`,
    tr: (count, clue) => `${count} harfli bir kelime arıyorsun: «${clue}». Hangi kelime?`,
    ur: (count, clue) => `آپ ${count} حروف کا ایک لفظ تلاش کر رہے ہیں: «${clue}». کون سا لفظ ہے؟`,
    zh: (count, clue) => `你在找一个 ${count} 个字的词： 「${clue}」。是哪个词？`,
  };
  return frames[locale] || frames.ar;
}

// ---------------------------------------------------------------------------
// Generate the full content matrix.
// ---------------------------------------------------------------------------

// Generate the full content matrix. For every level the 15 locales' answers
// are pairwise distinct (bumped deterministically via a per-(locale, level)
// salt when a collision occurs), and within a locale the 7 letter levels use
// 7 distinct concepts (index-based assignment to the sorted letter levels).
function generate() {
  const data = {};
  const usedByLevel = {};
  for (const level of ALL_LEVELS) usedByLevel[level] = new Set();

  for (const locale of LOCALES) {
    data[locale] = {};
    const letterConcepts = letterConceptsFor(locale);
    const usedLetterConcepts = new Set();

    for (const level of ALL_LEVELS) {
      if (LETTER_LEVELS.has(level)) {
        const levelIndex = LETTER_LEVEL_ORDER.indexOf(level);
        let concept = letterConcepts[levelIndex];
        let built = buildLetterPrompt(locale, level, concept);
        let salt = 0;
        while (
          usedByLevel[level].has(built.answer) ||
          usedLetterConcepts.has(concept)
        ) {
          salt += 1;
          const reShuffled = letterConceptsFor(locale, `collision:${salt}`);
          concept = reShuffled[levelIndex];
          built = buildLetterPrompt(locale, level, concept);
        }
        usedLetterConcepts.add(concept);
        usedByLevel[level].add(built.answer);
        data[locale][level] = {
          prompt: built.prompt,
          answer: built.answer,
          answerType: "letters",
        };
      } else {
        const recipe = LEVEL_RECIPES[level];
        let built = buildDigitPrompt(locale, level, recipe);
        let salt = 0;
        while (usedByLevel[level].has(built.answer)) {
          salt += 1;
          built = buildDigitPrompt(locale, level, recipe, `collision:${salt}`);
        }
        usedByLevel[level].add(built.answer);
        data[locale][level] = {
          prompt: built.prompt,
          answer: built.answer,
          answerType: "digits",
        };
      }
    }
  }

  for (const level of ALL_LEVELS) {
    if (usedByLevel[level].size !== LOCALES.length) {
      throw new Error(`Level ${level} did not reach ${LOCALES.length} distinct answers`);
    }
  }
  return data;
}

// ---------------------------------------------------------------------------
// Self-verification: re-derive each answer from its prompt text.
// Digit prompts embed the exact words of each non-FIX recipe slot inside
// locale-native quotes («», „…“, 「」); we parse them out in slot order and
// recompute the digits. FIX slots render the fixed digit inside the clause, so
// we re-render the exact clause and assert it is present. Letter prompts embed
// the clue; we map the clue back to its concept word and check the letter count.
// ---------------------------------------------------------------------------

const QUOTES = {
  ar: ["«", "»"],
  de: ["„", "“"],
  es: ["«", "»"],
  fr: ["«", "»"],
  hi: ["«", "»"],
  id: ["«", "»"],
  it: ["«", "»"],
  ja: ["「", "」"],
  ko: ["「", "」"],
  nl: ["«", "»"],
  pt: ["«", "»"],
  ru: ["«", "»"],
  tr: ["«", "»"],
  ur: ["«", "»"],
  zh: ["「", "」"],
};

function extractQuoted(prompt, locale) {
  const [open, close] = QUOTES[locale] || ["«", "»"];
  const out = [];
  let index = 0;
  for (;;) {
    const start = prompt.indexOf(open, index);
    if (start === -1) break;
    const end = prompt.indexOf(close, start + open.length);
    if (end === -1) break;
    out.push(prompt.slice(start + open.length, end));
    index = end + close.length;
  }
  return out;
}

function verify(data) {
  // 1. Letter levels use distinct answers within each locale.
  for (const locale of LOCALES) {
    const letterAnswers = LETTER_LEVEL_ORDER.map(
      (level) => data[locale][level].answer,
    );
    if (new Set(letterAnswers).size !== letterAnswers.length) {
      throw new Error(`Locale ${locale} repeats a letter answer across levels`);
    }
  }

  // 2. Answers are pairwise distinct per level across all 15 locales.
  for (const level of ALL_LEVELS) {
    const answers = LOCALES.map((locale) => data[locale][level].answer);
    if (new Set(answers).size !== answers.length) {
      throw new Error(`Level ${level} collides across locales: ${answers.join(", ")}`);
    }
  }

  // 3. Every prompt's embedded words re-derive the answer.
  for (const locale of LOCALES) {
    for (const level of ALL_LEVELS) {
      const row = data[locale][level];

      if (row.answerType === "digits") {
        if (!/^\d{4}$/.test(row.answer)) {
          throw new Error(`Digit answer not 4 digits ${locale}/${level}: ${row.answer}`);
        }
        const recipe = LEVEL_RECIPES[level];
        const words = extractQuoted(row.prompt, locale);
        const nonFixedOps = recipe.filter((op) => op !== "FIX");
        if (words.length !== nonFixedOps.length) {
          throw new Error(`Quoted word count mismatch ${locale}/${level}`);
        }
        let wordIndex = 0;
        for (let slot = 0; slot < 4; slot += 1) {
          const op = recipe[slot];
          const answerDigit = row.answer[slot];
          if (op === "FIX") {
            const expectedClause = `${DIGIT_TEMPLATES[locale].ordinals[slot]} ${DIGIT_TEMPLATES[locale].ops.FIX({ d: localizeDigits(locale, Number(answerDigit)) })}`;
            if (!row.prompt.includes(expectedClause)) {
              throw new Error(`FIX clause missing ${locale}/${level} slot ${slot}`);
            }
          } else {
            const word = words[wordIndex];
            wordIndex += 1;
            const computed = applyOp(op, word);
            if (computed === null || String(computed) !== answerDigit) {
              throw new Error(
                `Digit derivation failed ${locale}/${level} slot ${slot}: «${word}» -> ${computed} vs ${answerDigit}`,
              );
            }
          }
        }
      } else {
        const quoted = extractQuoted(row.prompt, locale);
        if (quoted.length !== 1) {
          throw new Error(`Letter prompt should embed exactly one clue ${locale}/${level}`);
        }
        const clue = quoted[0];
        const concept = CONCEPT_ORDER.find((c) => LETTER_CLUES[locale]?.[c] === clue);
        if (!concept) {
          throw new Error(`No concept maps clue «${clue}» ${locale}/${level}`);
        }
        const expectedWord = WORD_BANKS[locale][concept];
        if (expectedWord !== row.answer) {
          throw new Error(`Letter answer mismatch ${locale}/${level}: «${clue}» -> ${expectedWord} vs ${row.answer}`);
        }
        // Reconstruct the full prompt deterministically from the same inputs
        // (localized count glyphs included) and require byte-identical output.
        const rebuilt = buildLetterPrompt(locale, level, concept);
        if (rebuilt.prompt !== row.prompt) {
          throw new Error(`Letter prompt mismatch ${locale}/${level}`);
        }
      }
    }
  }

  // 4. Letter answers are composed of the locale's real word (never empty),
  //    and their letter count is a sane 1..9 (as printed in the prompt).
  for (const locale of LOCALES) {
    for (const level of ALL_LEVELS) {
      if (data[locale][level].answerType !== "letters") continue;
      const answer = data[locale][level].answer;
      if (!answer) {
        throw new Error(`Empty letter answer ${locale}/${level}`);
      }
      const count = letterCount(answer);
      if (count < 1 || count > 9) {
        throw new Error(`Letter count out of range ${locale}/${level}: ${count} («${answer}»)`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Writers
// ---------------------------------------------------------------------------

function writeClientData(data) {
  const lines = [
    "// Auto-generated by scripts/generate-locale-puzzles.mjs — do not edit.",
    "// Per-locale puzzle content (riddles + answers) for all non-English",
    "// locales. Keyed by locale → level. English content lives in puzzles.js",
    "// and is intentionally NOT present here.",
    "",
    "export const LOCALE_PUZZLES = {",
  ];
  for (const locale of LOCALES) {
    lines.push(`  ${JSON.stringify(locale)}: {`);
    for (const level of ALL_LEVELS) {
      const row = data[locale][level];
      lines.push(
        `    ${level}: ${JSON.stringify({ prompt: row.prompt, answer: row.answer, answerType: row.answerType })},`,
      );
    }
    lines.push("  },");
  }
  lines.push("};");
  lines.push("");
  lines.push("export const LOCALE_COUNT = 450;");
  lines.push("");
  return lines.join("\n");
}

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function writeMigration(data) {
  const header = `-- Locale puzzle content: genuinely different riddles AND answers per
-- language for every single-player level and for multiplayer rounds.
--
--  * puzzle_locale_content is keyed by (locale, level) — content is per level
--    and shared across difficulties, matching the client's per-level model.
--  * Letter levels (3, 8, 10, 13, 18, 23, 28) stay letters; other levels stay
--    digits. Only the content varies.
--  * submit_single_answer_localized and submit_multiplayer_answer_localized
--    are re-created to overlay the locale row onto the base content_puzzles
--    row (locale wins; English / missing locale falls back to the base row).
--  * The table is server-side only: no browser grants, RLS denies everything.

begin;

create table public.puzzle_locale_content (
  locale text not null,
  level smallint not null check (level between 1 and 30),
  answer_type text not null check (answer_type in ('digits', 'letters')),
  answer_code text not null check (char_length(answer_code) between 1 and 64),
  answer_key text,
  prompt text not null,
  active boolean not null default true,
  primary key (locale, level)
);

insert into public.puzzle_locale_content(locale, level, answer_type, answer_code, answer_key, prompt, active)
values
`;
  const rows = [];
  for (const locale of LOCALES) {
    for (const level of ALL_LEVELS) {
      const row = data[locale][level];
      rows.push(
        `  (${sqlLiteral(locale)}, ${level}, ${sqlLiteral(row.answerType)}, ${sqlLiteral(row.answer)}, null, ${sqlLiteral(row.prompt)}, true)`,
      );
    }
  }
  const body = header + rows.join(",\n") + "\non conflict (locale, level) do update set\n" +
    "  answer_type = excluded.answer_type,\n" +
    "  answer_code = excluded.answer_code,\n" +
    "  answer_key = excluded.answer_key,\n" +
    "  prompt = excluded.prompt,\n" +
    "  active = true;\n\n";

  const rpcSingle = `-- Single-player: overlay the locale row onto the base puzzle row.
-- Recording semantics mirror submit_single_answer byte-for-byte (best-score
-- refresh on repeat solves, reward only on first solve); only the expected
-- answer comparison is overlaid with locale content.
create or replace function public.submit_single_answer_localized(
  p_difficulty public.difficulty,
  p_level smallint,
  p_answer text,
  p_locale text,
  p_attempts integer,
  p_time_ms integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_puzzle public.content_puzzles;
  v_locale public.puzzle_locale_content;
  v_answer_type text;
  v_answer_code text;
  v_correct boolean;
  v_already_completed boolean := false;
  v_score integer;
  v_reward integer := 0;
  v_balance bigint;
begin
  if v_profile_id is null then raise exception 'Authentication required'; end if;
  if p_level < 1 or p_level > 30 then raise exception 'Invalid level'; end if;

  select * into v_puzzle
  from public.content_puzzles
  where difficulty = p_difficulty and level = p_level and active
  for share;
  if v_puzzle.id is null then
    return jsonb_build_object('correct', false, 'reason', 'puzzle_not_found');
  end if;

  -- Locale content wins when present (English/missing falls back to base row).
  select * into v_locale
  from public.puzzle_locale_content
  where locale = lower(trim(coalesce(p_locale, 'en')))
    and level = p_level
    and active;

  if v_locale.locale is not null then
    v_answer_type := v_locale.answer_type;
    v_answer_code := v_locale.answer_code;
  else
    v_answer_type := v_puzzle.answer_type;
    v_answer_code := v_puzzle.answer_code;
  end if;

  if v_answer_type = 'digits' then
    v_correct := regexp_replace(coalesce(p_answer, ''), '[^0-9]', '', 'g') = v_answer_code;
  else
    v_correct := lower(regexp_replace(trim(coalesce(p_answer, '')), '[^[:alnum:]]', '', 'g'))
      = lower(regexp_replace(trim(v_answer_code), '[^[:alnum:]]', '', 'g'));
  end if;

  if not v_correct then
    insert into public.single_player_progress(
      profile_id, difficulty, level, completed, best_score, attempts, best_time_ms
    )
    values (
      v_profile_id, p_difficulty, p_level, false, 0, greatest(1, p_attempts), greatest(0, p_time_ms)
    )
    on conflict (profile_id, difficulty, level) do update set
      attempts = public.single_player_progress.attempts + excluded.attempts,
      best_time_ms = least(
        coalesce(public.single_player_progress.best_time_ms, excluded.best_time_ms),
        excluded.best_time_ms
      );
    return jsonb_build_object('correct', false, 'reason', 'incorrect');
  end if;

  perform 1 from public.profiles where id = v_profile_id for update;
  select exists (
    select 1 from public.single_player_progress
    where profile_id = v_profile_id and difficulty = p_difficulty and level = p_level and completed
  ) into v_already_completed;

  v_score := greatest(10, 400 - least(20, greatest(1, p_attempts)) * 20 - least(240, greatest(0, p_time_ms) / 1000 / 12));
  insert into public.single_player_progress(
    profile_id, difficulty, level, completed, best_score, attempts, best_time_ms, solved_at
  )
  values (
    v_profile_id, p_difficulty, p_level, true, v_score,
    greatest(1, p_attempts), greatest(0, p_time_ms), now()
  )
  on conflict (profile_id, difficulty, level) do update set
    completed = true,
    best_score = greatest(public.single_player_progress.best_score, excluded.best_score),
    attempts = public.single_player_progress.attempts + excluded.attempts,
    best_time_ms = least(
      coalesce(public.single_player_progress.best_time_ms, excluded.best_time_ms),
      excluded.best_time_ms
    ),
    solved_at = coalesce(public.single_player_progress.solved_at, excluded.solved_at);

  if not v_already_completed then
    v_reward := greatest(1, least(500, v_score / 10));
    update public.single_player_profiles
    set total_score = total_score + v_score, codes_cracked = codes_cracked + 1
    where profile_id = v_profile_id;
    insert into public.single_player_wallets(profile_id, balance, lifetime_earned)
    values (v_profile_id, v_reward, v_reward)
    on conflict (profile_id) do update set
      balance = public.single_player_wallets.balance + excluded.balance,
      lifetime_earned = public.single_player_wallets.lifetime_earned + excluded.lifetime_earned;
    insert into public.wallet_transactions(profile_id, scope, amount, reason, reference_id)
    values (v_profile_id, 'single', v_reward, 'single_win', p_level::text);
    insert into public.game_events(profile_id, scope, event_type, payload)
    values (
      v_profile_id,
      'single',
      'level_cleared',
      jsonb_build_object('difficulty', p_difficulty, 'level', p_level, 'score', v_score)
    );
  end if;

  select balance into v_balance from public.single_player_wallets where profile_id = v_profile_id;
  return jsonb_build_object(
    'correct', true,
    'score', v_score,
    'reward', v_reward,
    'balance', coalesce(v_balance, 0),
    'already_completed', v_already_completed
  );
end;
$$;

grants_single_placeholder`;

  const rpcMulti = `-- Multiplayer: each player's answer is validated against their own locale.
create or replace function public.submit_multiplayer_answer_localized(
  p_room_id uuid,
  p_answer text,
  p_locale text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid := auth.uid();
  v_room public.multiplayer_rooms;
  v_round public.multiplayer_rounds;
  v_puzzle public.content_puzzles;
  v_locale public.puzzle_locale_content;
  v_expected_answer text;
  v_answer_type text;
  v_answer_code text;
  v_normalized_submitted text;
  v_normalized_expected text;
  v_correct boolean;
  v_gained integer;
  v_next_round smallint;
  v_next_puzzle public.content_puzzles;
  v_response_ms integer;
begin
  if v_profile_id is null then
    raise exception 'Authentication required';
  end if;
  if not exists (
    select 1
    from public.multiplayer_players
    where room_id = p_room_id and profile_id = v_profile_id
  ) then
    raise exception 'Join the room first';
  end if;

  select * into v_room
  from public.multiplayer_rooms
  where id = p_room_id and status = 'playing'
  for update;
  if v_room.id is null then
    raise exception 'Room is not accepting answers';
  end if;
  if v_room.deadline_at is not null and v_room.deadline_at <= now() then
    update public.multiplayer_rooms
    set status = 'finished', deadline_at = null, finished_at = coalesce(finished_at, now())
    where id = p_room_id;
    return jsonb_build_object(
      'correct', false, 'expired', true, 'round', v_room.current_round
    );
  end if;

  select * into v_round
  from public.multiplayer_rounds
  where room_id = p_room_id and round_number = v_room.current_round;
  if v_round.puzzle_id is null then
    raise exception 'Round puzzle is not ready';
  end if;

  select * into v_puzzle
  from public.content_puzzles
  where id = v_round.puzzle_id and active;
  if v_puzzle.id is null then
    raise exception 'Round puzzle is not ready';
  end if;

  -- Overlay the answerer's locale content onto the base round puzzle.
  select * into v_locale
  from public.puzzle_locale_content
  where locale = lower(trim(coalesce(p_locale, 'en')))
    and level = v_puzzle.level
    and active;

  if v_locale.locale is not null then
    v_answer_type := v_locale.answer_type;
    v_answer_code := v_locale.answer_code;
    v_expected_answer := v_locale.answer_code;
  else
    v_answer_type := v_puzzle.answer_type;
    v_answer_code := v_puzzle.answer_code;
    v_expected_answer := v_puzzle.answer_code;
  end if;

  v_response_ms := greatest(
    0,
    least(
      600000,
      floor(extract(epoch from (now() - coalesce(v_round.started_at, now()))) * 1000)::integer
    )
  );

  if exists (
    select 1
    from public.multiplayer_answers
    where room_id = p_room_id
      and round_number = v_room.current_round
      and profile_id = v_profile_id
      and is_correct
  ) then
    return jsonb_build_object(
      'correct', true,
      'already_correct', true,
      'round', v_room.current_round,
      'response_ms', v_response_ms
    );
  end if;

  v_normalized_submitted := lower(
    regexp_replace(trim(coalesce(p_answer, '')), '[^[:alnum:]]', '', 'g')
  );
  if v_answer_type = 'digits' then
    v_correct := regexp_replace(coalesce(p_answer, ''), '[^0-9]', '', 'g') = v_answer_code;
  else
    v_normalized_expected := lower(
      regexp_replace(trim(v_expected_answer), '[^[:alnum:]]', '', 'g')
    );
    v_correct := v_normalized_submitted = v_normalized_expected;
  end if;

  insert into public.multiplayer_answers(
    room_id, round_number, profile_id, submitted_code, is_correct, response_ms
  )
  values (
    p_room_id,
    v_room.current_round,
    v_profile_id,
    left(coalesce(p_answer, ''), 64),
    v_correct,
    v_response_ms
  );
  if not v_correct then
    return jsonb_build_object(
      'correct', false,
      'round', v_room.current_round,
      'response_ms', v_response_ms
    );
  end if;

  v_gained := greatest(20, 100 - v_room.current_round * 3);
  update public.multiplayer_players
  set score = score + v_gained, codes_cracked = codes_cracked + 1
  where room_id = p_room_id and profile_id = v_profile_id;
  insert into public.game_events(profile_id, scope, event_type, payload)
  values (
    v_profile_id,
    'multi',
    'round_cleared',
    jsonb_build_object(
      'roomId', p_room_id,
      'round', v_room.current_round,
      'score', v_gained,
      'response_ms', v_response_ms
    )
  );

  if v_room.mode = 'first_to_crack' then
    update public.multiplayer_rounds
    set winner_profile_id = v_profile_id
    where room_id = p_room_id and round_number = v_room.current_round;
    if v_room.current_round + 1 >= v_room.rounds then
      update public.multiplayer_rooms
      set status = 'finished', finished_at = now()
      where id = p_room_id;
    else
      update public.multiplayer_rooms
      set status = 'round_won'
      where id = p_room_id;
    end if;
  else
    v_next_round := v_room.current_round + 1;
    if v_next_round >= v_room.rounds then
      update public.multiplayer_rooms
      set status = 'finished', finished_at = now(), deadline_at = null
      where id = p_room_id;
    else
      select * into v_next_puzzle
      from public.content_puzzles
      where active and (v_room.category = 'random' or category = v_room.category)
      order by random()
      limit 1;
      if v_next_puzzle.id is null then
        raise exception 'No active puzzle is available';
      end if;
      update public.multiplayer_rooms
      set status = 'playing',
          current_round = v_next_round,
          deadline_at = now() + interval '60 seconds'
      where id = p_room_id;
      insert into public.multiplayer_rounds(
        room_id, round_number, category, puzzle_id
      )
      values (p_room_id, v_next_round, v_next_puzzle.category, v_next_puzzle.id)
      on conflict (room_id, round_number) do update
      set category = excluded.category,
          puzzle_id = excluded.puzzle_id,
          winner_profile_id = null,
          started_at = now();
    end if;
  end if;

  return jsonb_build_object(
    'correct', true,
    'gained', v_gained,
    'round', v_room.current_round,
    'response_ms', v_response_ms,
    'answer', v_expected_answer
  );
end;
$$;

-- Server-side table only: no browser grants and RLS denies everything.
revoke all on table public.puzzle_locale_content from anon, authenticated;
alter table public.puzzle_locale_content enable row level security;
create policy "puzzle_locale_content server only"
  on public.puzzle_locale_content
  for all
  using (false)
  with check (false);

commit;
`;

  // Preserve existing execute grants for the re-created functions.
  const grants = `revoke execute on function public.submit_single_answer_localized(public.difficulty, smallint, text, text, integer, integer) from public, anon;
grant execute on function public.submit_single_answer_localized(public.difficulty, smallint, text, text, integer, integer) to authenticated;
revoke execute on function public.submit_multiplayer_answer_localized(uuid, text, text) from public, anon;
grant execute on function public.submit_multiplayer_answer_localized(uuid, text, text) to authenticated;
`;

  // rpcSingle carries the grants placeholder so execute grants are re-applied
  // after the functions are re-created (revoke from public/anon first, then
  // grant only to authenticated, preserving the 007/012 posture).
  const sql = body + "\n" + rpcSingle.replace("grants_single_placeholder", grants) + "\n" + rpcMulti;
  return sql;
}

function writeSeed(data) {
  const rows = [];
  for (const locale of LOCALES) {
    for (const level of ALL_LEVELS) {
      const row = data[locale][level];
      rows.push(
        `  (${sqlLiteral(locale)}, ${level}, ${sqlLiteral(row.answerType)}, ${sqlLiteral(row.answer)}, null, ${sqlLiteral(row.prompt)}, true)`,
      );
    }
  }
  return `-- Generated by scripts/generate-locale-puzzles.mjs — do not edit.
-- Seed parity for puzzle_locale_content (matches migration 019 rows).
insert into public.puzzle_locale_content(locale, level, answer_type, answer_code, answer_key, prompt, active)
values
${rows.join(",\n")}
on conflict (locale, level) do update set
  answer_type = excluded.answer_type,
  answer_code = excluded.answer_code,
  answer_key = excluded.answer_key,
  prompt = excluded.prompt,
  active = true;
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const data = generate();
  verify(data);

  const clientPath = path.join(ROOT, "src", "data", "locale_puzzles.js");
  const migrationPath = path.join(ROOT, "supabase", "migrations", "019_locale_puzzle_content.sql");
  const seedPath = path.join(ROOT, "supabase", "locale_puzzle_seed.sql");

  fs.writeFileSync(clientPath, writeClientData(data), "utf8");
  fs.writeFileSync(migrationPath, writeMigration(data), "utf8");
  fs.writeFileSync(seedPath, writeSeed(data), "utf8");

  const totals = { digits: 0, letters: 0 };
  for (const locale of LOCALES) {
    for (const level of ALL_LEVELS) {
      totals[data[locale][level].answerType] += 1;
    }
  }
  console.log(`Generated ${LOCALES.length} locales × 30 levels = ${LOCALES.length * 30} rows`);
  console.log(`  digits: ${totals.digits}, letters: ${totals.letters} (letter levels: ${[...LETTER_LEVELS].join(", ")})`);
  console.log(`  client: ${path.relative(ROOT, clientPath)}`);
  console.log(`  migration: ${path.relative(ROOT, migrationPath)}`);
  console.log(`  seed: ${path.relative(ROOT, seedPath)}`);
  console.log("  self-verification: PASSED (answers recomputed from prompts)");
}

main();