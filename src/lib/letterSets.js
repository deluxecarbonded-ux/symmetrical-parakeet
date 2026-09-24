const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LATIN_EXTENDED =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝŠŽßŒœ";
const TURKISH = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";
const CYRILLIC = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
const ARABIC = "ابتثجحخدذرزسشصضطظعغفقكلمنهويءآأإئؤى";
const URDU = "ابتثجحخدذرزسشصضطظعغفقکگلمنھویءآأإئؤىپچڈڑژںھے";
const DEVANAGARI = "अआइईउऊऋएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह";
const KANA =
  "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
const HANGUL =
  "가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허고노도로모보소오조초코토포호구누두루무부수우주추쿠투푸후기니디리미비시이지치키티피히";
const HAN =
  "的一是了我不人在他有这个上们来到时大地为子中你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学么之都好看起发当没成只如事把还用第样道想作种开美总从无情己面最女但现前些所同日手又行意动方期它头经长儿回位分爱老因很给名法间斯知世什两次使身者被高已亲其进此话常与活正感见明问力理尔点文几定本公特做外孩相西果走将月十实向声车全信重三机工物气每并别真打太新比才便夫再书部水像眼等体却加电主界门利海受听表德少克代员许先口由死安写性马光白或住难望教命花结乐色更拉东神记处让母父应直字场平报友关放至张认接告入笑内英照等待史便具普教急林信拉";

const SETS = {
  ar: ARABIC,
  de: LATIN_EXTENDED,
  es: LATIN_EXTENDED,
  fr: LATIN_EXTENDED,
  hi: DEVANAGARI,
  id: LATIN,
  it: LATIN_EXTENDED,
  ja: KANA,
  ko: HANGUL,
  nl: LATIN,
  pt: LATIN_EXTENDED,
  ru: CYRILLIC,
  tr: TURKISH,
  ur: URDU,
  zh: HAN,
};

export function getLetterSet(locale = "en") {
  return SETS[locale] || LATIN;
}

export function getLetterCharacters(locale = "en") {
  return [...new Set([...getLetterSet(locale)])];
}
