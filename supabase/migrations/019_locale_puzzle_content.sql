-- Locale puzzle content: genuinely different riddles AND answers per
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
  ('ar', 1, 'digits', '3516', null, 'رمز من أربعة أرقام ينتظرك — الأول عدد حروف «ريح»، الثاني عدد حروف «سحاب» زائد واحد، الثالث عدد حروف «قط» ناقص واحد، الرابع ضعف عدد حروف «خبز» (خانة الآحاد فقط). ما هو الرمز؟', true),
  ('ar', 2, 'digits', '3463', null, 'رمز من أربعة أرقام ينتظرك — الأول عدد حروف «بيت»، الثاني الرقم الثابت ٤، الثالث عدد حروف «مفتاح» زائد واحد، الرابع عدد حروف «قمر». ما هو الرمز؟', true),
  ('ar', 3, 'letters', 'مفتاح', null, 'أنت تبحث عن كلمة من ٥ حروف: «أفتح بها الأقفال». ما هي؟', true),
  ('ar', 4, 'digits', '3382', null, 'رمز من أربعة أرقام ينتظرك — الأول عدد حروف «يد» زائد واحد، الثاني عدد حروف «نهر»، الثالث ضعف عدد حروف «ساعة» (خانة الآحاد فقط)، الرابع عدد حروف «سمك» ناقص واحد. ما هو الرمز؟', true),
  ('ar', 5, 'digits', '4345', null, 'رمز من أربعة أرقام ينتظرك — الأول عدد حروف «سحاب»، الثاني عدد حروف «بيت»، الثالث الرقم الثابت ٤، الرابع عدد حروف «شجرة» زائد واحد. ما هو الرمز؟', true),
  ('ar', 6, 'digits', '6443', null, 'رمز من أربعة أرقام ينتظرك — الأول ضعف عدد حروف «بحر» (خانة الآحاد فقط)، الثاني عدد حروف «حليب»، الثالث عدد حروف «نهر» زائد واحد، الرابع عدد حروف «قمر». ما هو الرمز؟', true),
  ('ar', 7, 'digits', '2302', null, 'رمز من أربعة أرقام ينتظرك — الأول عدد حروف «بحر» ناقص واحد، الثاني عدد حروف «شمس»، الثالث ضعف عدد حروف «مفتاح» (خانة الآحاد فقط)، الرابع الرقم الثابت ٢. ما هو الرمز؟', true),
  ('ar', 8, 'letters', 'مطر', null, 'أنت تبحث عن كلمة من ٣ حروف: «أنزل من السماء قطرات». ما هي؟', true),
  ('ar', 9, 'digits', '3535', null, 'رمز من أربعة أرقام ينتظرك — الأول عدد حروف «باب»، الثاني عدد حروف «كتاب» زائد واحد، الثالث عدد حروف «مطر»، الرابع الرقم الثابت ٥. ما هو الرمز؟', true),
  ('ar', 10, 'letters', 'سحاب', null, 'أنت تبحث عن كلمة من ٤ حروف: «أطوف في السماء حاملة المطر». ما هي؟', true),
  ('ar', 11, 'digits', '3324', null, 'رمز من أربعة أرقام ينتظرك — الأول الرقم الثابت ٣، الثاني عدد حروف «قمر»، الثالث عدد حروف «خبز» ناقص واحد، الرابع عدد حروف «سحاب». ما هو الرمز؟', true),
  ('ar', 12, 'digits', '3643', null, 'رمز من أربعة أرقام ينتظرك — الأول عدد حروف «بحر»، الثاني ضعف عدد حروف «ريح» (خانة الآحاد فقط)، الثالث عدد حروف «نار» زائد واحد، الرابع عدد حروف «كتاب» ناقص واحد. ما هو الرمز؟', true),
  ('ar', 13, 'letters', 'نهر', null, 'أنت تبحث عن كلمة من ٣ حروف: «أسير نحو البحر». ما هي؟', true),
  ('ar', 14, 'digits', '5342', null, 'رمز من أربعة أرقام ينتظرك — الأول عدد حروف «شجرة» زائد واحد، الثاني عدد حروف «حليب» ناقص واحد، الثالث عدد حروف «كتاب»، الرابع الرقم الثابت ٢. ما هو الرمز؟', true),
  ('ar', 15, 'digits', '5444', null, 'رمز من أربعة أرقام ينتظرك — الأول عدد حروف «مفتاح»، الثاني عدد حروف «سحاب»، الثالث عدد حروف «كتاب»، الرابع عدد حروف «مطر» زائد واحد. ما هو الرمز؟', true),
  ('ar', 16, 'digits', '6732', null, 'رمز من أربعة أرقام ينتظرك — الأول ضعف عدد حروف «طير» (خانة الآحاد فقط)، الثاني الرقم الثابت ٧، الثالث عدد حروف «قمر»، الرابع عدد حروف «نجم» ناقص واحد. ما هو الرمز؟', true),
  ('ar', 17, 'digits', '4433', null, 'رمز من أربعة أرقام ينتظرك — الأول عدد حروف «حليب»، الثاني عدد حروف «خبز» زائد واحد، الثالث الرقم الثابت ٣، الرابع عدد حروف «نار». ما هو الرمز؟', true),
  ('ar', 18, 'letters', 'شمس', null, 'أنت تبحث عن كلمة من ٣ حروف: «أضيء النهار بضوئي الذهبي». ما هي؟', true),
  ('ar', 19, 'digits', '2644', null, 'رمز من أربعة أرقام ينتظرك — الأول عدد حروف «كلب» ناقص واحد، الثاني ضعف عدد حروف «نجم» (خانة الآحاد فقط)، الثالث عدد حروف «حليب»، الرابع عدد حروف «شمس» زائد واحد. ما هو الرمز؟', true),
  ('ar', 20, 'digits', '3248', null, 'رمز من أربعة أرقام ينتظرك — الأول الرقم الثابت ٣، الثاني عدد حروف «يد»، الثالث عدد حروف «بحر» زائد واحد، الرابع ضعف عدد حروف «سحاب» (خانة الآحاد فقط). ما هو الرمز؟', true),
  ('ar', 21, 'digits', '3244', null, 'رمز من أربعة أرقام ينتظرك — الأول عدد حروف «ماء»، الثاني عدد حروف «كلب» ناقص واحد، الثالث الرقم الثابت ٤، الرابع عدد حروف «خبز» زائد واحد. ما هو الرمز؟', true),
  ('ar', 22, 'digits', '4466', null, 'رمز من أربعة أرقام ينتظرك — الأول عدد حروف «ماء» زائد واحد، الثاني عدد حروف «سحاب»، الثالث ضعف عدد حروف «شمس» (خانة الآحاد فقط)، الرابع الرقم الثابت ٦. ما هو الرمز؟', true),
  ('ar', 23, 'letters', 'نجم', null, 'أنت تبحث عن كلمة من ٣ حروف: «تلمع في سماء الليل». ما هي؟', true),
  ('ar', 24, 'digits', '2236', null, 'رمز من أربعة أرقام ينتظرك — الأول عدد حروف «يد»، الثاني الرقم الثابت ٢، الثالث عدد حروف «سحاب» ناقص واحد، الرابع ضعف عدد حروف «نجم» (خانة الآحاد فقط). ما هو الرمز؟', true),
  ('ar', 25, 'digits', '6433', null, 'رمز من أربعة أرقام ينتظرك — الأول ضعف عدد حروف «بحر» (خانة الآحاد فقط)، الثاني عدد حروف «نار» زائد واحد، الثالث عدد حروف «بيت»، الرابع عدد حروف «باب». ما هو الرمز؟', true),
  ('ar', 26, 'digits', '3337', null, 'رمز من أربعة أرقام ينتظرك — الأول عدد حروف «خبز»، الثاني عدد حروف «كلب»، الثالث عدد حروف «كتاب» ناقص واحد، الرابع الرقم الثابت ٧. ما هو الرمز؟', true),
  ('ar', 27, 'digits', '4664', null, 'رمز من أربعة أرقام ينتظرك — الأول عدد حروف «قمر» زائد واحد، الثاني ضعف عدد حروف «جبل» (خانة الآحاد فقط)، الثالث الرقم الثابت ٦، الرابع عدد حروف «حليب». ما هو الرمز؟', true),
  ('ar', 28, 'letters', 'حليب', null, 'أنت تبحث عن كلمة من ٤ حروف: «شراب أبيض من المزرعة». ما هي؟', true),
  ('ar', 29, 'digits', '3433', null, 'رمز من أربعة أرقام ينتظرك — الأول عدد حروف «ريح»، الثاني عدد حروف «شمس» زائد واحد، الثالث عدد حروف «سحاب» ناقص واحد، الرابع عدد حروف «سمك». ما هو الرمز؟', true),
  ('ar', 30, 'digits', '1364', null, 'رمز من أربعة أرقام ينتظرك — الأول الرقم الثابت ١، الثاني عدد حروف «جبل»، الثالث ضعف عدد حروف «نجم» (خانة الآحاد فقط)، الرابع عدد حروف «بحر» زائد واحد. ما هو الرمز؟', true),
  ('de', 1, 'digits', '5540', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die Zahl der Buchstaben in „Fluss“,  die zweite Ziffer die Zahl der Buchstaben in „Meer“ plus eins,  die dritte Ziffer die Zahl der Buchstaben in „Sonne“ minus eins,  die vierte Ziffer das Doppelte der Buchstaben in „Fisch“ (nur die Einerstelle). Wie lautet der Code?', true),
  ('de', 2, 'digits', '3164', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die Zahl der Buchstaben in „Uhr“,  die zweite Ziffer die feste Ziffer 1,  die dritte Ziffer die Zahl der Buchstaben in „Fisch“ plus eins,  die vierte Ziffer die Zahl der Buchstaben in „Meer“. Wie lautet der Code?', true),
  ('de', 3, 'letters', 'Buch', null, 'Du suchst ein Wort mit 4 Buchstaben: „Weisheit zwischen meinen Seiten“. Welches ist es?', true),
  ('de', 4, 'digits', '5484', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die Zahl der Buchstaben in „Hund“ plus eins,  die zweite Ziffer die Zahl der Buchstaben in „Brot“,  die dritte Ziffer das Doppelte der Buchstaben in „Berg“ (nur die Einerstelle),  die vierte Ziffer die Zahl der Buchstaben in „Katze“ minus eins. Wie lautet der Code?', true),
  ('de', 5, 'digits', '4426', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die Zahl der Buchstaben in „Mond“,  die zweite Ziffer die Zahl der Buchstaben in „Hund“,  die dritte Ziffer die feste Ziffer 2,  die vierte Ziffer die Zahl der Buchstaben in „Feuer“ plus eins. Wie lautet der Code?', true),
  ('de', 6, 'digits', '8555', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer das Doppelte der Buchstaben in „Berg“ (nur die Einerstelle),  die zweite Ziffer die Zahl der Buchstaben in „Vogel“,  die dritte Ziffer die Zahl der Buchstaben in „Brot“ plus eins,  die vierte Ziffer die Zahl der Buchstaben in „Katze“. Wie lautet der Code?', true),
  ('de', 7, 'digits', '3589', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die Zahl der Buchstaben in „Wind“ minus eins,  die zweite Ziffer die Zahl der Buchstaben in „Stern“,  die dritte Ziffer das Doppelte der Buchstaben in „Hand“ (nur die Einerstelle),  die vierte Ziffer die feste Ziffer 9. Wie lautet der Code?', true),
  ('de', 8, 'letters', 'Uhr', null, 'Du suchst ein Wort mit 3 Buchstaben: „ich messe die Zeit“. Welches ist es?', true),
  ('de', 9, 'digits', '3554', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die Zahl der Buchstaben in „Tür“,  die zweite Ziffer die Zahl der Buchstaben in „Hund“ plus eins,  die dritte Ziffer die Zahl der Buchstaben in „Katze“,  die vierte Ziffer die feste Ziffer 4. Wie lautet der Code?', true),
  ('de', 10, 'letters', 'Fisch', null, 'Du suchst ein Wort mit 5 Buchstaben: „Ich lebe im Wasser“. Welches ist es?', true),
  ('de', 11, 'digits', '8444', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die feste Ziffer 8,  die zweite Ziffer die Zahl der Buchstaben in „Buch“,  die dritte Ziffer die Zahl der Buchstaben in „Wolke“ minus eins,  die vierte Ziffer die Zahl der Buchstaben in „Hand“. Wie lautet der Code?', true),
  ('de', 12, 'digits', '5854', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die Zahl der Buchstaben in „Milch“,  die zweite Ziffer das Doppelte der Buchstaben in „Haus“ (nur die Einerstelle),  die dritte Ziffer die Zahl der Buchstaben in „Wind“ plus eins,  die vierte Ziffer die Zahl der Buchstaben in „Wolke“ minus eins. Wie lautet der Code?', true),
  ('de', 13, 'letters', 'Berg', null, 'Du suchst ein Wort mit 4 Buchstaben: „Mein Gipfel berührt die Wolken“. Welches ist es?', true),
  ('de', 14, 'digits', '5335', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die Zahl der Buchstaben in „Meer“ plus eins,  die zweite Ziffer die Zahl der Buchstaben in „Haus“ minus eins,  die dritte Ziffer die Zahl der Buchstaben in „Uhr“,  die vierte Ziffer die feste Ziffer 5. Wie lautet der Code?', true),
  ('de', 15, 'digits', '4455', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die Zahl der Buchstaben in „Hund“,  die zweite Ziffer die Zahl der Buchstaben in „Brot“,  die dritte Ziffer die Zahl der Buchstaben in „Fluss“,  die vierte Ziffer die Zahl der Buchstaben in „Baum“ plus eins. Wie lautet der Code?', true),
  ('de', 16, 'digits', '8844', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer das Doppelte der Buchstaben in „Baum“ (nur die Einerstelle),  die zweite Ziffer die feste Ziffer 8,  die dritte Ziffer die Zahl der Buchstaben in „Hand“,  die vierte Ziffer die Zahl der Buchstaben in „Vogel“ minus eins. Wie lautet der Code?', true),
  ('de', 17, 'digits', '5535', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die Zahl der Buchstaben in „Vogel“,  die zweite Ziffer die Zahl der Buchstaben in „Hund“ plus eins,  die dritte Ziffer die feste Ziffer 3,  die vierte Ziffer die Zahl der Buchstaben in „Feuer“. Wie lautet der Code?', true),
  ('de', 18, 'letters', 'Meer', null, 'Du suchst ein Wort mit 4 Buchstaben: „Meine Wellen sind endlos“. Welches ist es?', true),
  ('de', 19, 'digits', '4256', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die Zahl der Buchstaben in „Wolke“ minus eins,  die zweite Ziffer das Doppelte der Buchstaben in „Wasser“ (nur die Einerstelle),  die dritte Ziffer die Zahl der Buchstaben in „Milch“,  die vierte Ziffer die Zahl der Buchstaben in „Fluss“ plus eins. Wie lautet der Code?', true),
  ('de', 20, 'digits', '6566', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die feste Ziffer 6,  die zweite Ziffer die Zahl der Buchstaben in „Wolke“,  die dritte Ziffer die Zahl der Buchstaben in „Fisch“ plus eins,  die vierte Ziffer das Doppelte der Buchstaben in „Tür“ (nur die Einerstelle). Wie lautet der Code?', true),
  ('de', 21, 'digits', '5315', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die Zahl der Buchstaben in „Regen“,  die zweite Ziffer die Zahl der Buchstaben in „Buch“ minus eins,  die dritte Ziffer die feste Ziffer 1,  die vierte Ziffer die Zahl der Buchstaben in „Baum“ plus eins. Wie lautet der Code?', true),
  ('de', 22, 'digits', '5403', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die Zahl der Buchstaben in „Baum“ plus eins,  die zweite Ziffer die Zahl der Buchstaben in „Mond“,  die dritte Ziffer das Doppelte der Buchstaben in „Sonne“ (nur die Einerstelle),  die vierte Ziffer die feste Ziffer 3. Wie lautet der Code?', true),
  ('de', 23, 'letters', 'Haus', null, 'Du suchst ein Wort mit 4 Buchstaben: „die Behausung des Menschen“. Welches ist es?', true),
  ('de', 24, 'digits', '4138', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die Zahl der Buchstaben in „Wind“,  die zweite Ziffer die feste Ziffer 1,  die dritte Ziffer die Zahl der Buchstaben in „Baum“ minus eins,  die vierte Ziffer das Doppelte der Buchstaben in „Hund“ (nur die Einerstelle). Wie lautet der Code?', true),
  ('de', 25, 'digits', '8635', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer das Doppelte der Buchstaben in „Meer“ (nur die Einerstelle),  die zweite Ziffer die Zahl der Buchstaben in „Fluss“ plus eins,  die dritte Ziffer die Zahl der Buchstaben in „Uhr“,  die vierte Ziffer die Zahl der Buchstaben in „Feuer“. Wie lautet der Code?', true),
  ('de', 26, 'digits', '4432', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die Zahl der Buchstaben in „Brot“,  die zweite Ziffer die Zahl der Buchstaben in „Meer“,  die dritte Ziffer die Zahl der Buchstaben in „Wind“ minus eins,  die vierte Ziffer die feste Ziffer 2. Wie lautet der Code?', true),
  ('de', 27, 'digits', '5084', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die Zahl der Buchstaben in „Wind“ plus eins,  die zweite Ziffer das Doppelte der Buchstaben in „Fisch“ (nur die Einerstelle),  die dritte Ziffer die feste Ziffer 8,  die vierte Ziffer die Zahl der Buchstaben in „Berg“. Wie lautet der Code?', true),
  ('de', 28, 'letters', 'Feuer', null, 'Du suchst ein Wort mit 5 Buchstaben: „Ich wärme und brenne“. Welches ist es?', true),
  ('de', 29, 'digits', '9434', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die Zahl der Buchstaben in „Schlüssel“,  die zweite Ziffer die Zahl der Buchstaben in „Uhr“ plus eins,  die dritte Ziffer die Zahl der Buchstaben in „Buch“ minus eins,  die vierte Ziffer die Zahl der Buchstaben in „Mond“. Wie lautet der Code?', true),
  ('de', 30, 'digits', '1487', null, 'Ein vierstelliger Code wartet auf dich — die erste Ziffer die feste Ziffer 1,  die zweite Ziffer die Zahl der Buchstaben in „Mond“,  die dritte Ziffer das Doppelte der Buchstaben in „Hand“ (nur die Einerstelle),  die vierte Ziffer die Zahl der Buchstaben in „Wasser“ plus eins. Wie lautet der Code?', true),
  ('es', 1, 'digits', '6440', null, 'Un código de cuatro dígitos te espera — la primera cifra el número de letras de «puerta»,  la segunda cifra el número de letras de «sol» más uno,  la tercera cifra el número de letras de «reloj» menos uno,  la cuarta cifra el doble de las letras de «leche» (solo la cifra de las unidades). ¿Cuál es el código?', true),
  ('es', 2, 'digits', '5753', null, 'Un código de cuatro dígitos te espera — la primera cifra el número de letras de «árbol»,  la segunda cifra la cifra fija 7,  la tercera cifra el número de letras de «agua» más uno,  la cuarta cifra el número de letras de «mar». ¿Cuál es el código?', true),
  ('es', 3, 'letters', 'libro', null, 'Buscas una palabra de 5 letras: «la sabiduría entre mis páginas». ¿Cuál es?', true),
  ('es', 4, 'digits', '6302', null, 'Un código de cuatro dígitos te espera — la primera cifra el número de letras de «libro» más uno,  la segunda cifra el número de letras de «pez»,  la tercera cifra el doble de las letras de «reloj» (solo la cifra de las unidades),  la cuarta cifra el número de letras de «río» menos uno. ¿Cuál es el código?', true),
  ('es', 5, 'digits', '6494', null, 'Un código de cuatro dígitos te espera — la primera cifra el número de letras de «puerta»,  la segunda cifra el número de letras de «nube»,  la tercera cifra la cifra fija 9,  la cuarta cifra el número de letras de «pan» más uno. ¿Cuál es el código?', true),
  ('es', 6, 'digits', '8683', null, 'Un código de cuatro dígitos te espera — la primera cifra el doble de las letras de «agua» (solo la cifra de las unidades),  la segunda cifra el número de letras de «puerta»,  la tercera cifra el número de letras de «montaña» más uno,  la cuarta cifra el número de letras de «pez». ¿Cuál es el código?', true),
  ('es', 7, 'digits', '4583', null, 'Un código de cuatro dígitos te espera — la primera cifra el número de letras de «libro» menos uno,  la segunda cifra el número de letras de «fuego»,  la tercera cifra el doble de las letras de «mano» (solo la cifra de las unidades),  la cuarta cifra la cifra fija 3. ¿Cuál es el código?', true),
  ('es', 8, 'letters', 'mano', null, 'Buscas una palabra de 4 letras: «conmigo se escribe y se saluda». ¿Cuál es?', true),
  ('es', 9, 'digits', '4642', null, 'Un código de cuatro dígitos te espera — la primera cifra el número de letras de «mano»,  la segunda cifra el número de letras de «árbol» más uno,  la tercera cifra el número de letras de «agua»,  la cuarta cifra la cifra fija 2. ¿Cuál es el código?', true),
  ('es', 10, 'letters', 'pájaro', null, 'Buscas una palabra de 6 letras: «vuelo por el cielo». ¿Cuál es?', true),
  ('es', 11, 'digits', '3436', null, 'Un código de cuatro dígitos te espera — la primera cifra la cifra fija 3,  la segunda cifra el número de letras de «luna»,  la tercera cifra el número de letras de «mano» menos uno,  la cuarta cifra el número de letras de «viento». ¿Cuál es el código?', true),
  ('es', 12, 'digits', '7674', null, 'Un código de cuatro dígitos te espera — la primera cifra el número de letras de «montaña»,  la segunda cifra el doble de las letras de «mar» (solo la cifra de las unidades),  la tercera cifra el número de letras de «pájaro» más uno,  la cuarta cifra el número de letras de «libro» menos uno. ¿Cuál es el código?', true),
  ('es', 13, 'letters', 'mar', null, 'Buscas una palabra de 3 letras: «mis olas no terminan nunca». ¿Cuál es?', true),
  ('es', 14, 'digits', '4252', null, 'Un código de cuatro dígitos te espera — la primera cifra el número de letras de «mar» más uno,  la segunda cifra el número de letras de «río» menos uno,  la tercera cifra el número de letras de «fuego»,  la cuarta cifra la cifra fija 2. ¿Cuál es el código?', true),
  ('es', 15, 'digits', '5457', null, 'Un código de cuatro dígitos te espera — la primera cifra el número de letras de «reloj»,  la segunda cifra el número de letras de «luna»,  la tercera cifra el número de letras de «árbol»,  la cuarta cifra el número de letras de «pájaro» más uno. ¿Cuál es el código?', true),
  ('es', 16, 'digits', '2752', null, 'Un código de cuatro dígitos te espera — la primera cifra el doble de las letras de «puerta» (solo la cifra de las unidades),  la segunda cifra la cifra fija 7,  la tercera cifra el número de letras de «llave»,  la cuarta cifra el número de letras de «mar» menos uno. ¿Cuál es el código?', true),
  ('es', 17, 'digits', '5443', null, 'Un código de cuatro dígitos te espera — la primera cifra el número de letras de «leche»,  la segunda cifra el número de letras de «sol» más uno,  la tercera cifra la cifra fija 4,  la cuarta cifra el número de letras de «pan». ¿Cuál es el código?', true),
  ('es', 18, 'letters', 'pez', null, 'Buscas una palabra de 3 letras: «vivo en el agua». ¿Cuál es?', true),
  ('es', 19, 'digits', '5044', null, 'Un código de cuatro dígitos te espera — la primera cifra el número de letras de «pájaro» menos uno,  la segunda cifra el doble de las letras de «llave» (solo la cifra de las unidades),  la tercera cifra el número de letras de «casa»,  la cuarta cifra el número de letras de «mar» más uno. ¿Cuál es el código?', true),
  ('es', 20, 'digits', '4478', null, 'Un código de cuatro dígitos te espera — la primera cifra la cifra fija 4,  la segunda cifra el número de letras de «casa»,  la tercera cifra el número de letras de «puerta» más uno,  la cuarta cifra el doble de las letras de «mano» (solo la cifra de las unidades). ¿Cuál es el código?', true),
  ('es', 21, 'digits', '5446', null, 'Un código de cuatro dígitos te espera — la primera cifra el número de letras de «fuego»,  la segunda cifra el número de letras de «llave» menos uno,  la tercera cifra la cifra fija 4,  la cuarta cifra el número de letras de «reloj» más uno. ¿Cuál es el código?', true),
  ('es', 22, 'digits', '5565', null, 'Un código de cuatro dígitos te espera — la primera cifra el número de letras de «casa» más uno,  la segunda cifra el número de letras de «reloj»,  la tercera cifra el doble de las letras de «pan» (solo la cifra de las unidades),  la cuarta cifra la cifra fija 5. ¿Cuál es el código?', true),
  ('es', 23, 'letters', 'luna', null, 'Buscas una palabra de 4 letras: «ilumino la noche desde el cielo». ¿Cuál es?', true),
  ('es', 24, 'digits', '6846', null, 'Un código de cuatro dígitos te espera — la primera cifra el número de letras de «lluvia»,  la segunda cifra la cifra fija 8,  la tercera cifra el número de letras de «árbol» menos uno,  la cuarta cifra el doble de las letras de «pan» (solo la cifra de las unidades). ¿Cuál es el código?', true),
  ('es', 25, 'digits', '8834', null, 'Un código de cuatro dígitos te espera — la primera cifra el doble de las letras de «mano» (solo la cifra de las unidades),  la segunda cifra el número de letras de «montaña» más uno,  la tercera cifra el número de letras de «río»,  la cuarta cifra el número de letras de «nube». ¿Cuál es el código?', true),
  ('es', 26, 'digits', '5441', null, 'Un código de cuatro dígitos te espera — la primera cifra el número de letras de «reloj»,  la segunda cifra el número de letras de «agua»,  la tercera cifra el número de letras de «fuego» menos uno,  la cuarta cifra la cifra fija 1. ¿Cuál es el código?', true),
  ('es', 27, 'digits', '4673', null, 'Un código de cuatro dígitos te espera — la primera cifra el número de letras de «pan» más uno,  la segunda cifra el doble de las letras de «estrella» (solo la cifra de las unidades),  la tercera cifra la cifra fija 7,  la cuarta cifra el número de letras de «pez». ¿Cuál es el código?', true),
  ('es', 28, 'letters', 'fuego', null, 'Buscas una palabra de 5 letras: «quemo y caliento». ¿Cuál es?', true),
  ('es', 29, 'digits', '7535', null, 'Un código de cuatro dígitos te espera — la primera cifra el número de letras de «montaña»,  la segunda cifra el número de letras de «gato» más uno,  la tercera cifra el número de letras de «nube» menos uno,  la cuarta cifra el número de letras de «árbol». ¿Cuál es el código?', true),
  ('es', 30, 'digits', '1345', null, 'Un código de cuatro dígitos te espera — la primera cifra la cifra fija 1,  la segunda cifra el número de letras de «mar»,  la tercera cifra el doble de las letras de «montaña» (solo la cifra de las unidades),  la cuarta cifra el número de letras de «mano» más uno. ¿Cuál es el código?', true),
  ('fr', 1, 'digits', '5740', null, 'Un code à quatre chiffres t''attend — le premier chiffre le nombre de lettres de «arbre»,  le deuxième chiffre le nombre de lettres de «étoile» plus un,  le troisième chiffre le nombre de lettres de «pluie» moins un,  le quatrième chiffre le double des lettres de «nuage» (uniquement le chiffre des unités). Quel est le code ?', true),
  ('fr', 2, 'digits', '4885', null, 'Un code à quatre chiffres t''attend — le premier chiffre le nombre de lettres de «main»,  le deuxième chiffre le chiffre fixe 8,  le troisième chiffre le nombre de lettres de «horloge» plus un,  le quatrième chiffre le nombre de lettres de «arbre». Quel est le code ?', true),
  ('fr', 3, 'letters', 'vent', null, 'Tu cherches un mot de 4 lettres : «je me déplace invisible». Lequel est-ce ?', true),
  ('fr', 4, 'digits', '5304', null, 'Un code à quatre chiffres t''attend — le premier chiffre le nombre de lettres de «chat» plus un,  le deuxième chiffre le nombre de lettres de «eau»,  le troisième chiffre le double des lettres de «nuage» (uniquement le chiffre des unités),  le quatrième chiffre le nombre de lettres de «porte» moins un. Quel est le code ?', true),
  ('fr', 5, 'digits', '3577', null, 'Un code à quatre chiffres t''attend — le premier chiffre le nombre de lettres de «eau»,  le deuxième chiffre le nombre de lettres de «chien»,  le troisième chiffre le chiffre fixe 7,  le quatrième chiffre le nombre de lettres de «étoile» plus un. Quel est le code ?', true),
  ('fr', 6, 'digits', '8657', null, 'Un code à quatre chiffres t''attend — le premier chiffre le double des lettres de «lait» (uniquement le chiffre des unités),  le deuxième chiffre le nombre de lettres de «oiseau»,  le troisième chiffre le nombre de lettres de «lune» plus un,  le quatrième chiffre le nombre de lettres de «horloge». Quel est le code ?', true),
  ('fr', 7, 'digits', '3669', null, 'Un code à quatre chiffres t''attend — le premier chiffre le nombre de lettres de «chat» moins un,  le deuxième chiffre le nombre de lettres de «fleuve»,  le troisième chiffre le double des lettres de «montagne» (uniquement le chiffre des unités),  le quatrième chiffre le chiffre fixe 9. Quel est le code ?', true),
  ('fr', 8, 'letters', 'nuage', null, 'Tu cherches un mot de 5 lettres : «je voyage dans le ciel». Lequel est-ce ?', true),
  ('fr', 9, 'digits', '5439', null, 'Un code à quatre chiffres t''attend — le premier chiffre le nombre de lettres de «livre»,  le deuxième chiffre le nombre de lettres de «clé» plus un,  le troisième chiffre le nombre de lettres de «feu»,  le quatrième chiffre le chiffre fixe 9. Quel est le code ?', true),
  ('fr', 10, 'letters', 'feu', null, 'Tu cherches un mot de 3 lettres : «je brûle et je réchauffe». Lequel est-ce ?', true),
  ('fr', 11, 'digits', '9464', null, 'Un code à quatre chiffres t''attend — le premier chiffre le chiffre fixe 9,  le deuxième chiffre le nombre de lettres de «lune»,  le troisième chiffre le nombre de lettres de «horloge» moins un,  le quatrième chiffre le nombre de lettres de «chat». Quel est le code ?', true),
  ('fr', 12, 'digits', '4047', null, 'Un code à quatre chiffres t''attend — le premier chiffre le nombre de lettres de «pain»,  le deuxième chiffre le double des lettres de «nuage» (uniquement le chiffre des unités),  le troisième chiffre le nombre de lettres de «mer» plus un,  le quatrième chiffre le nombre de lettres de «montagne» moins un. Quel est le code ?', true),
  ('fr', 13, 'letters', 'lait', null, 'Tu cherches un mot de 4 lettres : «la boisson blanche de la ferme». Lequel est-ce ?', true),
  ('fr', 14, 'digits', '4348', null, 'Un code à quatre chiffres t''attend — le premier chiffre le nombre de lettres de «clé» plus un,  le deuxième chiffre le nombre de lettres de «lait» moins un,  le troisième chiffre le nombre de lettres de «vent»,  le quatrième chiffre le chiffre fixe 8. Quel est le code ?', true),
  ('fr', 15, 'digits', '5666', null, 'Un code à quatre chiffres t''attend — le premier chiffre le nombre de lettres de «chien»,  le deuxième chiffre le nombre de lettres de «étoile»,  le troisième chiffre le nombre de lettres de «oiseau»,  le quatrième chiffre le nombre de lettres de «porte» plus un. Quel est le code ?', true),
  ('fr', 16, 'digits', '6135', null, 'Un code à quatre chiffres t''attend — le premier chiffre le double des lettres de «clé» (uniquement le chiffre des unités),  le deuxième chiffre le chiffre fixe 1,  le troisième chiffre le nombre de lettres de «eau»,  le quatrième chiffre le nombre de lettres de «étoile» moins un. Quel est le code ?', true),
  ('fr', 17, 'digits', '6667', null, 'Un code à quatre chiffres t''attend — le premier chiffre le nombre de lettres de «fleuve»,  le deuxième chiffre le nombre de lettres de «arbre» plus un,  le troisième chiffre le chiffre fixe 6,  le quatrième chiffre le nombre de lettres de «horloge». Quel est le code ?', true),
  ('fr', 18, 'letters', 'porte', null, 'Tu cherches un mot de 5 lettres : «j''ouvre l''entrée». Lequel est-ce ?', true),
  ('fr', 19, 'digits', '5034', null, 'Un code à quatre chiffres t''attend — le premier chiffre le nombre de lettres de «maison» moins un,  le deuxième chiffre le double des lettres de «arbre» (uniquement le chiffre des unités),  le troisième chiffre le nombre de lettres de «clé»,  le quatrième chiffre le nombre de lettres de «mer» plus un. Quel est le code ?', true),
  ('fr', 20, 'digits', '2478', null, 'Un code à quatre chiffres t''attend — le premier chiffre le chiffre fixe 2,  le deuxième chiffre le nombre de lettres de «pain»,  le troisième chiffre le nombre de lettres de «maison» plus un,  le quatrième chiffre le double des lettres de «chat» (uniquement le chiffre des unités). Quel est le code ?', true),
  ('fr', 21, 'digits', '5325', null, 'Un code à quatre chiffres t''attend — le premier chiffre le nombre de lettres de «arbre»,  le deuxième chiffre le nombre de lettres de «lait» moins un,  le troisième chiffre le chiffre fixe 2,  le quatrième chiffre le nombre de lettres de «vent» plus un. Quel est le code ?', true),
  ('fr', 22, 'digits', '6624', null, 'Un code à quatre chiffres t''attend — le premier chiffre le nombre de lettres de «porte» plus un,  le deuxième chiffre le nombre de lettres de «maison»,  le troisième chiffre le double des lettres de «étoile» (uniquement le chiffre des unités),  le quatrième chiffre le chiffre fixe 4. Quel est le code ?', true),
  ('fr', 23, 'letters', 'soleil', null, 'Tu cherches un mot de 6 lettres : «j''éclaire le jour». Lequel est-ce ?', true),
  ('fr', 24, 'digits', '4648', null, 'Un code à quatre chiffres t''attend — le premier chiffre le nombre de lettres de «chat»,  le deuxième chiffre le chiffre fixe 6,  le troisième chiffre le nombre de lettres de «nuage» moins un,  le quatrième chiffre le double des lettres de «pain» (uniquement le chiffre des unités). Quel est le code ?', true),
  ('fr', 25, 'digits', '2446', null, 'Un code à quatre chiffres t''attend — le premier chiffre le double des lettres de «oiseau» (uniquement le chiffre des unités),  le deuxième chiffre le nombre de lettres de «feu» plus un,  le troisième chiffre le nombre de lettres de «lait»,  le quatrième chiffre le nombre de lettres de «soleil». Quel est le code ?', true),
  ('fr', 26, 'digits', '4841', null, 'Un code à quatre chiffres t''attend — le premier chiffre le nombre de lettres de «lune»,  le deuxième chiffre le nombre de lettres de «montagne»,  le troisième chiffre le nombre de lettres de «porte» moins un,  le quatrième chiffre le chiffre fixe 1. Quel est le code ?', true),
  ('fr', 27, 'digits', '5883', null, 'Un code à quatre chiffres t''attend — le premier chiffre le nombre de lettres de «main» plus un,  le deuxième chiffre le double des lettres de «chat» (uniquement le chiffre des unités),  le troisième chiffre le chiffre fixe 8,  le quatrième chiffre le nombre de lettres de «clé». Quel est le code ?', true),
  ('fr', 28, 'letters', 'livre', null, 'Tu cherches un mot de 5 lettres : «la sagesse entre mes pages». Lequel est-ce ?', true),
  ('fr', 29, 'digits', '7545', null, 'Un code à quatre chiffres t''attend — le premier chiffre le nombre de lettres de «horloge»,  le deuxième chiffre le nombre de lettres de «vent» plus un,  le troisième chiffre le nombre de lettres de «livre» moins un,  le quatrième chiffre le nombre de lettres de «pluie». Quel est le code ?', true),
  ('fr', 30, 'digits', '9488', null, 'Un code à quatre chiffres t''attend — le premier chiffre le chiffre fixe 9,  le deuxième chiffre le nombre de lettres de «main»,  le troisième chiffre le double des lettres de «pain» (uniquement le chiffre des unités),  le quatrième chiffre le nombre de lettres de «horloge» plus un. Quel est le code ?', true),
  ('hi', 1, 'digits', '4650', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «सूरज» में अक्षरों की संख्या,  दूसरा अंक «बारिश» में अक्षरों की संख्या प्लस एक,  तीसरा अंक «समुद्र» में अक्षरों की संख्या माइनस एक,  चौथा अंक «पक्षी» के अक्षरों का दोगुना (केवल इकाई अंक). कोड क्या है?', true),
  ('hi', 2, 'digits', '3355', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «नदी» में अक्षरों की संख्या,  दूसरा अंक निश्चित अंक ३,  तीसरा अंक «चाबी» में अक्षरों की संख्या प्लस एक,  चौथा अंक «पक्षी» में अक्षरों की संख्या. कोड क्या है?', true),
  ('hi', 3, 'letters', 'बिल्ली', null, 'आप ६ अक्षरों वाला एक शब्द खोज रहे हैं: «घर का शांत साथी». वह कौन सा है?', true),
  ('hi', 4, 'digits', '6385', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «किताब» में अक्षरों की संख्या प्लस एक,  दूसरा अंक «हाथ» में अक्षरों की संख्या,  तीसरा अंक «सूरज» के अक्षरों का दोगुना (केवल इकाई अंक),  चौथा अंक «समुद्र» में अक्षरों की संख्या माइनस एक. कोड क्या है?', true),
  ('hi', 5, 'digits', '5485', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «पहाड़» में अक्षरों की संख्या,  दूसरा अंक «मछली» में अक्षरों की संख्या,  तीसरा अंक निश्चित अंक ८,  चौथा अंक «बादल» में अक्षरों की संख्या प्लस एक. कोड क्या है?', true),
  ('hi', 6, 'digits', '2645', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «बिल्ली» के अक्षरों का दोगुना (केवल इकाई अंक),  दूसरा अंक «समुद्र» में अक्षरों की संख्या,  तीसरा अंक «नदी» में अक्षरों की संख्या प्लस एक,  चौथा अंक «बारिश» में अक्षरों की संख्या. कोड क्या है?', true),
  ('hi', 7, 'digits', '4445', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «बारिश» में अक्षरों की संख्या माइनस एक,  दूसरा अंक «चाबी» में अक्षरों की संख्या,  तीसरा अंक «दरवाज़ा» के अक्षरों का दोगुना (केवल इकाई अंक),  चौथा अंक निश्चित अंक ५. कोड क्या है?', true),
  ('hi', 8, 'letters', 'पक्षी', null, 'आप ५ अक्षरों वाला एक शब्द खोज रहे हैं: «मैं आसमान में उड़ता हूँ». वह कौन सा है?', true),
  ('hi', 9, 'digits', '7654', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «दरवाज़ा» में अक्षरों की संख्या,  दूसरा अंक «बारिश» में अक्षरों की संख्या प्लस एक,  तीसरा अंक «पक्षी» में अक्षरों की संख्या,  चौथा अंक निश्चित अंक ४. कोड क्या है?', true),
  ('hi', 10, 'letters', 'घर', null, 'आप २ अक्षरों वाला एक शब्द खोज रहे हैं: «मनुष्य का आश्रय». वह कौन सा है?', true),
  ('hi', 11, 'digits', '2335', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक निश्चित अंक २,  दूसरा अंक «दूध» में अक्षरों की संख्या,  तीसरा अंक «चाबी» में अक्षरों की संख्या माइनस एक,  चौथा अंक «पहाड़» में अक्षरों की संख्या. कोड क्या है?', true),
  ('hi', 12, 'digits', '5052', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «किताब» में अक्षरों की संख्या,  दूसरा अंक «पहाड़» के अक्षरों का दोगुना (केवल इकाई अंक),  तीसरा अंक «मछली» में अक्षरों की संख्या प्लस एक,  चौथा अंक «दूध» में अक्षरों की संख्या माइनस एक. कोड क्या है?', true),
  ('hi', 13, 'letters', 'रोटी', null, 'आप ४ अक्षरों वाला एक शब्द खोज रहे हैं: «मेरी रोज़ की रोटी». वह कौन सा है?', true),
  ('hi', 14, 'digits', '5328', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «रोटी» में अक्षरों की संख्या प्लस एक,  दूसरा अंक «चाबी» में अक्षरों की संख्या माइनस एक,  तीसरा अंक «घर» में अक्षरों की संख्या,  चौथा अंक निश्चित अंक ८. कोड क्या है?', true),
  ('hi', 15, 'digits', '7434', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «दरवाज़ा» में अक्षरों की संख्या,  दूसरा अंक «चाबी» में अक्षरों की संख्या,  तीसरा अंक «नदी» में अक्षरों की संख्या,  चौथा अंक «हाथ» में अक्षरों की संख्या प्लस एक. कोड क्या है?', true),
  ('hi', 16, 'digits', '4243', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «आग» के अक्षरों का दोगुना (केवल इकाई अंक),  दूसरा अंक निश्चित अंक २,  तीसरा अंक «घड़ी» में अक्षरों की संख्या,  चौथा अंक «रोटी» में अक्षरों की संख्या माइनस एक. कोड क्या है?', true),
  ('hi', 17, 'digits', '3634', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «हवा» में अक्षरों की संख्या,  दूसरा अंक «पहाड़» में अक्षरों की संख्या प्लस एक,  तीसरा अंक निश्चित अंक ३,  चौथा अंक «मछली» में अक्षरों की संख्या. कोड क्या है?', true),
  ('hi', 18, 'letters', 'दूध', null, 'आप ३ अक्षरों वाला एक शब्द खोज रहे हैं: «खेत का सफ़ेद पेय». वह कौन सा है?', true),
  ('hi', 19, 'digits', '3065', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «बादल» में अक्षरों की संख्या माइनस एक,  दूसरा अंक «पहाड़» के अक्षरों का दोगुना (केवल इकाई अंक),  तीसरा अंक «बिल्ली» में अक्षरों की संख्या,  चौथा अंक «सूरज» में अक्षरों की संख्या प्लस एक. कोड क्या है?', true),
  ('hi', 20, 'digits', '2454', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक निश्चित अंक २,  दूसरा अंक «बादल» में अक्षरों की संख्या,  तीसरा अंक «सूरज» में अक्षरों की संख्या प्लस एक,  चौथा अंक «आग» के अक्षरों का दोगुना (केवल इकाई अंक). कोड क्या है?', true),
  ('hi', 21, 'digits', '4375', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «घड़ी» में अक्षरों की संख्या,  दूसरा अंक «तारा» में अक्षरों की संख्या माइनस एक,  तीसरा अंक निश्चित अंक ७,  चौथा अंक «चाबी» में अक्षरों की संख्या प्लस एक. कोड क्या है?', true),
  ('hi', 22, 'digits', '5247', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «पानी» में अक्षरों की संख्या प्लस एक,  दूसरा अंक «घर» में अक्षरों की संख्या,  तीसरा अंक «दरवाज़ा» के अक्षरों का दोगुना (केवल इकाई अंक),  चौथा अंक निश्चित अंक ७. कोड क्या है?', true),
  ('hi', 23, 'letters', 'हाथ', null, 'आप ३ अक्षरों वाला एक शब्द खोज रहे हैं: «मुझसे लिखा और मिलाया जाता है». वह कौन सा है?', true),
  ('hi', 24, 'digits', '4748', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «तारा» में अक्षरों की संख्या,  दूसरा अंक निश्चित अंक ७,  तीसरा अंक «किताब» में अक्षरों की संख्या माइनस एक,  चौथा अंक «पानी» के अक्षरों का दोगुना (केवल इकाई अंक). कोड क्या है?', true),
  ('hi', 25, 'digits', '8544', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «तारा» के अक्षरों का दोगुना (केवल इकाई अंक),  दूसरा अंक «मछली» में अक्षरों की संख्या प्लस एक,  तीसरा अंक «चाबी» में अक्षरों की संख्या,  चौथा अंक «पानी» में अक्षरों की संख्या. कोड क्या है?', true),
  ('hi', 26, 'digits', '4411', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «चाबी» में अक्षरों की संख्या,  दूसरा अंक «चाँद» में अक्षरों की संख्या,  तीसरा अंक «घर» में अक्षरों की संख्या माइनस एक,  चौथा अंक निश्चित अंक १. कोड क्या है?', true),
  ('hi', 27, 'digits', '7426', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «समुद्र» में अक्षरों की संख्या प्लस एक,  दूसरा अंक «घर» के अक्षरों का दोगुना (केवल इकाई अंक),  तीसरा अंक निश्चित अंक २,  चौथा अंक «बिल्ली» में अक्षरों की संख्या. कोड क्या है?', true),
  ('hi', 28, 'letters', 'समुद्र', null, 'आप ६ अक्षरों वाला एक शब्द खोज रहे हैं: «मेरी लहरें कभी खत्म नहीं होतीं». वह कौन सा है?', true),
  ('hi', 29, 'digits', '7534', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक «दरवाज़ा» में अक्षरों की संख्या,  दूसरा अंक «बादल» में अक्षरों की संख्या प्लस एक,  तीसरा अंक «चाबी» में अक्षरों की संख्या माइनस एक,  चौथा अंक «घड़ी» में अक्षरों की संख्या. कोड क्या है?', true),
  ('hi', 30, 'digits', '7426', null, 'चार अंकों का एक कोड आपका इंतज़ार कर रहा है — पहला अंक निश्चित अंक ७,  दूसरा अंक «तारा» में अक्षरों की संख्या,  तीसरा अंक «बिल्ली» के अक्षरों का दोगुना (केवल इकाई अंक),  चौथा अंक «पक्षी» में अक्षरों की संख्या प्लस एक. कोड क्या है?', true),
  ('id', 1, 'digits', '4632', null, 'Sebuah kode empat digit menantimu — digit pertama jumlah huruf pada «ikan»,  digit kedua jumlah huruf pada «hujan» ditambah satu,  digit ketiga jumlah huruf pada «roti» dikurangi satu,  digit keempat dua kali jumlah huruf pada «kucing» (hanya digit satuan). Berapa kodenya?', true),
  ('id', 2, 'digits', '3944', null, 'Sebuah kode empat digit menantimu — digit pertama jumlah huruf pada «jam»,  digit kedua digit tetap 9,  digit ketiga jumlah huruf pada «api» ditambah satu,  digit keempat jumlah huruf pada «susu». Berapa kodenya?', true),
  ('id', 3, 'letters', 'angin', null, 'Kamu mencari sebuah kata dengan 5 huruf: «aku bergerak tanpa terlihat». Kata apa itu?', true),
  ('id', 4, 'digits', '7383', null, 'Sebuah kode empat digit menantimu — digit pertama jumlah huruf pada «sungai» ditambah satu,  digit kedua jumlah huruf pada «api»,  digit ketiga dua kali jumlah huruf pada «susu» (hanya digit satuan),  digit keempat jumlah huruf pada «roti» dikurangi satu. Berapa kodenya?', true),
  ('id', 5, 'digits', '7654', null, 'Sebuah kode empat digit menantimu — digit pertama jumlah huruf pada «bintang»,  digit kedua jumlah huruf pada «burung»,  digit ketiga digit tetap 5,  digit keempat jumlah huruf pada «air» ditambah satu. Berapa kodenya?', true),
  ('id', 6, 'digits', '4573', null, 'Sebuah kode empat digit menantimu — digit pertama dua kali jumlah huruf pada «bintang» (hanya digit satuan),  digit kedua jumlah huruf pada «pintu»,  digit ketiga jumlah huruf pada «gunung» ditambah satu,  digit keempat jumlah huruf pada «air». Berapa kodenya?', true),
  ('id', 7, 'digits', '5687', null, 'Sebuah kode empat digit menantimu — digit pertama jumlah huruf pada «gunung» dikurangi satu,  digit kedua jumlah huruf pada «kucing»,  digit ketiga dua kali jumlah huruf pada «susu» (hanya digit satuan),  digit keempat digit tetap 7. Berapa kodenya?', true),
  ('id', 8, 'letters', 'roti', null, 'Kamu mencari sebuah kata dengan 4 huruf: «roti harianku». Kata apa itu?', true),
  ('id', 9, 'digits', '6762', null, 'Sebuah kode empat digit menantimu — digit pertama jumlah huruf pada «kucing»,  digit kedua jumlah huruf pada «sungai» ditambah satu,  digit ketiga jumlah huruf pada «gunung»,  digit keempat digit tetap 2. Berapa kodenya?', true),
  ('id', 10, 'letters', 'buku', null, 'Kamu mencari sebuah kata dengan 4 huruf: «kebijaksanaan di antara halamanku». Kata apa itu?', true),
  ('id', 11, 'digits', '6325', null, 'Sebuah kode empat digit menantimu — digit pertama digit tetap 6,  digit kedua jumlah huruf pada «api»,  digit ketiga jumlah huruf pada «jam» dikurangi satu,  digit keempat jumlah huruf pada «angin». Berapa kodenya?', true),
  ('id', 12, 'digits', '5642', null, 'Sebuah kode empat digit menantimu — digit pertama jumlah huruf pada «kunci»,  digit kedua dua kali jumlah huruf pada «matahari» (hanya digit satuan),  digit ketiga jumlah huruf pada «jam» ditambah satu,  digit keempat jumlah huruf pada «air» dikurangi satu. Berapa kodenya?', true),
  ('id', 13, 'letters', 'bulan', null, 'Kamu mencari sebuah kata dengan 5 huruf: «aku bercahaya di malam hari». Kata apa itu?', true),
  ('id', 14, 'digits', '5365', null, 'Sebuah kode empat digit menantimu — digit pertama jumlah huruf pada «buku» ditambah satu,  digit kedua jumlah huruf pada «laut» dikurangi satu,  digit ketiga jumlah huruf pada «anjing»,  digit keempat digit tetap 5. Berapa kodenya?', true),
  ('id', 15, 'digits', '5475', null, 'Sebuah kode empat digit menantimu — digit pertama jumlah huruf pada «kunci»,  digit kedua jumlah huruf pada «awan»,  digit ketiga jumlah huruf pada «bintang»,  digit keempat jumlah huruf pada «roti» ditambah satu. Berapa kodenya?', true),
  ('id', 16, 'digits', '8835', null, 'Sebuah kode empat digit menantimu — digit pertama dua kali jumlah huruf pada «awan» (hanya digit satuan),  digit kedua digit tetap 8,  digit ketiga jumlah huruf pada «api»,  digit keempat jumlah huruf pada «kucing» dikurangi satu. Berapa kodenya?', true),
  ('id', 17, 'digits', '4895', null, 'Sebuah kode empat digit menantimu — digit pertama jumlah huruf pada «laut»,  digit kedua jumlah huruf pada «bintang» ditambah satu,  digit ketiga digit tetap 9,  digit keempat jumlah huruf pada «angin». Berapa kodenya?', true),
  ('id', 18, 'letters', 'matahari', null, 'Kamu mencari sebuah kata dengan 8 huruf: «aku menyinari siang». Kata apa itu?', true),
  ('id', 19, 'digits', '5657', null, 'Sebuah kode empat digit menantimu — digit pertama jumlah huruf pada «kucing» dikurangi satu,  digit kedua dua kali jumlah huruf pada «air» (hanya digit satuan),  digit ketiga jumlah huruf pada «bulan»,  digit keempat jumlah huruf pada «tangan» ditambah satu. Berapa kodenya?', true),
  ('id', 20, 'digits', '8462', null, 'Sebuah kode empat digit menantimu — digit pertama digit tetap 8,  digit kedua jumlah huruf pada «awan»,  digit ketiga jumlah huruf pada «angin» ditambah satu,  digit keempat dua kali jumlah huruf pada «burung» (hanya digit satuan). Berapa kodenya?', true),
  ('id', 21, 'digits', '4357', null, 'Sebuah kode empat digit menantimu — digit pertama jumlah huruf pada «laut»,  digit kedua jumlah huruf pada «awan» dikurangi satu,  digit ketiga digit tetap 5,  digit keempat jumlah huruf pada «tangan» ditambah satu. Berapa kodenya?', true),
  ('id', 22, 'digits', '6429', null, 'Sebuah kode empat digit menantimu — digit pertama jumlah huruf pada «rumah» ditambah satu,  digit kedua jumlah huruf pada «buku»,  digit ketiga dua kali jumlah huruf pada «kucing» (hanya digit satuan),  digit keempat digit tetap 9. Berapa kodenya?', true),
  ('id', 23, 'letters', 'kunci', null, 'Kamu mencari sebuah kata dengan 5 huruf: «aku membuka gembok». Kata apa itu?', true),
  ('id', 24, 'digits', '4238', null, 'Sebuah kode empat digit menantimu — digit pertama jumlah huruf pada «laut»,  digit kedua digit tetap 2,  digit ketiga jumlah huruf pada «buku» dikurangi satu,  digit keempat dua kali jumlah huruf pada «awan» (hanya digit satuan). Berapa kodenya?', true),
  ('id', 25, 'digits', '2485', null, 'Sebuah kode empat digit menantimu — digit pertama dua kali jumlah huruf pada «burung» (hanya digit satuan),  digit kedua jumlah huruf pada «api» ditambah satu,  digit ketiga jumlah huruf pada «matahari»,  digit keempat jumlah huruf pada «kunci». Berapa kodenya?', true),
  ('id', 26, 'digits', '5655', null, 'Sebuah kode empat digit menantimu — digit pertama jumlah huruf pada «pohon»,  digit kedua jumlah huruf pada «kucing»,  digit ketiga jumlah huruf pada «anjing» dikurangi satu,  digit keempat digit tetap 5. Berapa kodenya?', true),
  ('id', 27, 'digits', '4874', null, 'Sebuah kode empat digit menantimu — digit pertama jumlah huruf pada «jam» ditambah satu,  digit kedua dua kali jumlah huruf pada «awan» (hanya digit satuan),  digit ketiga digit tetap 7,  digit keempat jumlah huruf pada «susu». Berapa kodenya?', true),
  ('id', 28, 'letters', 'bintang', null, 'Kamu mencari sebuah kata dengan 7 huruf: «aku berkilau di langit malam». Kata apa itu?', true),
  ('id', 29, 'digits', '8545', null, 'Sebuah kode empat digit menantimu — digit pertama jumlah huruf pada «matahari»,  digit kedua jumlah huruf pada «ikan» ditambah satu,  digit ketiga jumlah huruf pada «bulan» dikurangi satu,  digit keempat jumlah huruf pada «kunci». Berapa kodenya?', true),
  ('id', 30, 'digits', '1325', null, 'Sebuah kode empat digit menantimu — digit pertama digit tetap 1,  digit kedua jumlah huruf pada «air»,  digit ketiga dua kali jumlah huruf pada «sungai» (hanya digit satuan),  digit keempat jumlah huruf pada «roti» ditambah satu. Berapa kodenya?', true),
  ('it', 1, 'digits', '4840', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il numero di lettere di «casa»,  la seconda cifra il numero di lettere di «pioggia» più uno,  la terza cifra il numero di lettere di «pesce» meno uno,  la quarta cifra il doppio delle lettere di «acqua» (solo la cifra delle unità). Qual è il codice?', true),
  ('it', 2, 'digits', '4874', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il numero di lettere di «sole»,  la seconda cifra la cifra fissa 8,  la terza cifra il numero di lettere di «stella» più uno,  la quarta cifra il numero di lettere di «pane». Qual è il codice?', true),
  ('it', 3, 'letters', 'cane', null, 'Cerchi una parola di 4 lettere: «il fedele amico dell''uomo». Qual è?', true),
  ('it', 4, 'digits', '7405', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il numero di lettere di «nuvola» più uno,  la seconda cifra il numero di lettere di «casa»,  la terza cifra il doppio delle lettere di «acqua» (solo la cifra delle unità),  la quarta cifra il numero di lettere di «stella» meno uno. Qual è il codice?', true),
  ('it', 5, 'digits', '6425', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il numero di lettere di «albero»,  la seconda cifra il numero di lettere di «sole»,  la terza cifra la cifra fissa 2,  la quarta cifra il numero di lettere di «mare» più uno. Qual è il codice?', true),
  ('it', 6, 'digits', '8565', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il doppio delle lettere di «mano» (solo la cifra delle unità),  la seconda cifra il numero di lettere di «vento»,  la terza cifra il numero di lettere di «libro» più uno,  la quarta cifra il numero di lettere di «pesce». Qual è il codice?', true),
  ('it', 7, 'digits', '5709', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il numero di lettere di «stella» meno uno,  la seconda cifra il numero di lettere di «pioggia»,  la terza cifra il doppio delle lettere di «fiume» (solo la cifra delle unità),  la quarta cifra la cifra fissa 9. Qual è il codice?', true),
  ('it', 8, 'letters', 'porta', null, 'Cerchi una parola di 5 lettere: «apro l''ingresso». Qual è?', true),
  ('it', 9, 'digits', '4663', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il numero di lettere di «mano»,  la seconda cifra il numero di lettere di «gatto» più uno,  la terza cifra il numero di lettere di «chiave»,  la quarta cifra la cifra fissa 3. Qual è il codice?', true),
  ('it', 10, 'letters', 'sole', null, 'Cerchi una parola di 4 lettere: «illumino il giorno». Qual è?', true),
  ('it', 11, 'digits', '7556', null, 'Un codice a quattro cifre ti aspetta — la prima cifra la cifra fissa 7,  la seconda cifra il numero di lettere di «acqua»,  la terza cifra il numero di lettere di «chiave» meno uno,  la quarta cifra il numero di lettere di «stella». Qual è il codice?', true),
  ('it', 12, 'digits', '5073', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il numero di lettere di «porta»,  la seconda cifra il doppio delle lettere di «fuoco» (solo la cifra delle unità),  la terza cifra il numero di lettere di «chiave» più uno,  la quarta cifra il numero di lettere di «mare» meno uno. Qual è il codice?', true),
  ('it', 13, 'letters', 'uccello', null, 'Cerchi una parola di 7 lettere: «volo nel cielo». Qual è?', true),
  ('it', 14, 'digits', '5657', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il numero di lettere di «luna» più uno,  la seconda cifra il numero di lettere di «pioggia» meno uno,  la terza cifra il numero di lettere di «pesce»,  la quarta cifra la cifra fissa 7. Qual è il codice?', true),
  ('it', 15, 'digits', '6448', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il numero di lettere di «chiave»,  la seconda cifra il numero di lettere di «mano»,  la terza cifra il numero di lettere di «cane»,  la quarta cifra il numero di lettere di «pioggia» più uno. Qual è il codice?', true),
  ('it', 16, 'digits', '2184', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il doppio delle lettere di «nuvola» (solo la cifra delle unità),  la seconda cifra la cifra fissa 1,  la terza cifra il numero di lettere di «orologio»,  la quarta cifra il numero di lettere di «fiume» meno uno. Qual è il codice?', true),
  ('it', 17, 'digits', '7565', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il numero di lettere di «uccello»,  la seconda cifra il numero di lettere di «mano» più uno,  la terza cifra la cifra fissa 6,  la quarta cifra il numero di lettere di «libro». Qual è il codice?', true),
  ('it', 18, 'letters', 'casa', null, 'Cerchi una parola di 4 lettere: «il riparo delle persone». Qual è?', true),
  ('it', 19, 'digits', '7046', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il numero di lettere di «montagna» meno uno,  la seconda cifra il doppio delle lettere di «pesce» (solo la cifra delle unità),  la terza cifra il numero di lettere di «mare»,  la quarta cifra il numero di lettere di «libro» più uno. Qual è il codice?', true),
  ('it', 20, 'digits', '6868', null, 'Un codice a quattro cifre ti aspetta — la prima cifra la cifra fissa 6,  la seconda cifra il numero di lettere di «orologio»,  la terza cifra il numero di lettere di «latte» più uno,  la quarta cifra il doppio delle lettere di «sole» (solo la cifra delle unità). Qual è il codice?', true),
  ('it', 21, 'digits', '4325', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il numero di lettere di «sole»,  la seconda cifra il numero di lettere di «pane» meno uno,  la terza cifra la cifra fissa 2,  la quarta cifra il numero di lettere di «cane» più uno. Qual è il codice?', true),
  ('it', 22, 'digits', '5707', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il numero di lettere di «luna» più uno,  la seconda cifra il numero di lettere di «pioggia»,  la terza cifra il doppio delle lettere di «acqua» (solo la cifra delle unità),  la quarta cifra la cifra fissa 7. Qual è il codice?', true),
  ('it', 23, 'letters', 'vento', null, 'Cerchi una parola di 5 lettere: «mi muovo senza essere visto». Qual è?', true),
  ('it', 24, 'digits', '5740', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il numero di lettere di «vento»,  la seconda cifra la cifra fissa 7,  la terza cifra il numero di lettere di «libro» meno uno,  la quarta cifra il doppio delle lettere di «gatto» (solo la cifra delle unità). Qual è il codice?', true),
  ('it', 25, 'digits', '8644', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il doppio delle lettere di «casa» (solo la cifra delle unità),  la seconda cifra il numero di lettere di «pesce» più uno,  la terza cifra il numero di lettere di «sole»,  la quarta cifra il numero di lettere di «luna». Qual è il codice?', true),
  ('it', 26, 'digits', '7532', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il numero di lettere di «pioggia»,  la seconda cifra il numero di lettere di «libro»,  la terza cifra il numero di lettere di «casa» meno uno,  la quarta cifra la cifra fissa 2. Qual è il codice?', true),
  ('it', 27, 'digits', '6674', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il numero di lettere di «vento» più uno,  la seconda cifra il doppio delle lettere di «orologio» (solo la cifra delle unità),  la terza cifra la cifra fissa 7,  la quarta cifra il numero di lettere di «mano». Qual è il codice?', true),
  ('it', 28, 'letters', 'acqua', null, 'Cerchi una parola di 5 lettere: «spengo la sete». Qual è?', true),
  ('it', 29, 'digits', '8634', null, 'Un codice a quattro cifre ti aspetta — la prima cifra il numero di lettere di «montagna»,  la seconda cifra il numero di lettere di «fuoco» più uno,  la terza cifra il numero di lettere di «cane» meno uno,  la quarta cifra il numero di lettere di «casa». Qual è il codice?', true),
  ('it', 30, 'digits', '2507', null, 'Un codice a quattro cifre ti aspetta — la prima cifra la cifra fissa 2,  la seconda cifra il numero di lettere di «latte»,  la terza cifra il doppio delle lettere di «libro» (solo la cifra delle unità),  la quarta cifra il numero di lettere di «stella» più uno. Qual è il codice?', true),
  ('ja', 1, 'digits', '2324', null, '4桁のコードがあなたを待っている — 1桁目 「いえ」の文字数、 2桁目 「かぜ」の文字数に1を足した数、 3桁目 「ミルク」の文字数から1を引いた数、 4桁目 「くも」の文字数の2倍（一の位だけ）. コードは何？', true),
  ('ja', 2, 'digits', '2742', null, '4桁のコードがあなたを待っている — 1桁目 「パン」の文字数、 2桁目 固定の数字 7、 3桁目 「とけい」の文字数に1を足した数、 4桁目 「ほし」の文字数. コードは何？', true),
  ('ja', 3, 'letters', 'かぜ', null, '2文字の言葉を探している: 「見えないまま動く」。それは何？', true),
  ('ja', 4, 'digits', '3261', null, '4桁のコードがあなたを待っている — 1桁目 「ドア」の文字数に1を足した数、 2桁目 「あめ」の文字数、 3桁目 「さかな」の文字数の2倍（一の位だけ）、 4桁目 「くも」の文字数から1を引いた数. コードは何？', true),
  ('ja', 5, 'digits', '2213', null, '4桁のコードがあなたを待っている — 1桁目 「ねこ」の文字数、 2桁目 「ドア」の文字数、 3桁目 固定の数字 1、 4桁目 「あめ」の文字数に1を足した数. コードは何？', true),
  ('ja', 6, 'digits', '6242', null, '4桁のコードがあなたを待っている — 1桁目 「ミルク」の文字数の2倍（一の位だけ）、 2桁目 「みず」の文字数、 3桁目 「さかな」の文字数に1を足した数、 4桁目 「パン」の文字数. コードは何？', true),
  ('ja', 7, 'digits', '1141', null, '4桁のコードがあなたを待っている — 1桁目 「ドア」の文字数から1を引いた数、 2桁目 「き」の文字数、 3桁目 「ねこ」の文字数の2倍（一の位だけ）、 4桁目 固定の数字 1. コードは何？', true),
  ('ja', 8, 'letters', 'ミルク', null, '3文字の言葉を探している: 「農場の白い飲み物」。それは何？', true),
  ('ja', 9, 'digits', '2328', null, '4桁のコードがあなたを待っている — 1桁目 「ほん」の文字数、 2桁目 「とり」の文字数に1を足した数、 3桁目 「かぜ」の文字数、 4桁目 固定の数字 8. コードは何？', true),
  ('ja', 10, 'letters', 'たいよう', null, '4文字の言葉を探している: 「昼を照らす」。それは何？', true),
  ('ja', 11, 'digits', '3212', null, '4桁のコードがあなたを待っている — 1桁目 固定の数字 3、 2桁目 「くも」の文字数、 3桁目 「かぎ」の文字数から1を引いた数、 4桁目 「かわ」の文字数. コードは何？', true),
  ('ja', 12, 'digits', '2451', null, '4桁のコードがあなたを待っている — 1桁目 「いぬ」の文字数、 2桁目 「パン」の文字数の2倍（一の位だけ）、 3桁目 「たいよう」の文字数に1を足した数、 4桁目 「ねこ」の文字数から1を引いた数. コードは何？', true),
  ('ja', 13, 'letters', 'いえ', null, '2文字の言葉を探している: 「人の住まい」。それは何？', true),
  ('ja', 14, 'digits', '3122', null, '4桁のコードがあなたを待っている — 1桁目 「くも」の文字数に1を足した数、 2桁目 「うみ」の文字数から1を引いた数、 3桁目 「みず」の文字数、 4桁目 固定の数字 2. コードは何？', true),
  ('ja', 15, 'digits', '2224', null, '4桁のコードがあなたを待っている — 1桁目 「とり」の文字数、 2桁目 「かわ」の文字数、 3桁目 「ねこ」の文字数、 4桁目 「とけい」の文字数に1を足した数. コードは何？', true),
  ('ja', 16, 'digits', '4822', null, '4桁のコードがあなたを待っている — 1桁目 「ドア」の文字数の2倍（一の位だけ）、 2桁目 固定の数字 8、 3桁目 「いぬ」の文字数、 4桁目 「とけい」の文字数から1を引いた数. コードは何？', true),
  ('ja', 17, 'digits', '2532', null, '4桁のコードがあなたを待っている — 1桁目 「かわ」の文字数、 2桁目 「たいよう」の文字数に1を足した数、 3桁目 固定の数字 3、 4桁目 「くも」の文字数. コードは何？', true),
  ('ja', 18, 'letters', 'パン', null, '2文字の言葉を探している: 「毎日のパン」。それは何？', true),
  ('ja', 19, 'digits', '2423', null, '4桁のコードがあなたを待っている — 1桁目 「さかな」の文字数から1を引いた数、 2桁目 「パン」の文字数の2倍（一の位だけ）、 3桁目 「とり」の文字数、 4桁目 「くも」の文字数に1を足した数. コードは何？', true),
  ('ja', 20, 'digits', '7134', null, '4桁のコードがあなたを待っている — 1桁目 固定の数字 7、 2桁目 「て」の文字数、 3桁目 「ほん」の文字数に1を足した数、 4桁目 「かわ」の文字数の2倍（一の位だけ）. コードは何？', true),
  ('ja', 21, 'digits', '1283', null, '4桁のコードがあなたを待っている — 1桁目 「ひ」の文字数、 2桁目 「とけい」の文字数から1を引いた数、 3桁目 固定の数字 8、 4桁目 「いえ」の文字数に1を足した数. コードは何？', true),
  ('ja', 22, 'digits', '4349', null, '4桁のコードがあなたを待っている — 1桁目 「とけい」の文字数に1を足した数、 2桁目 「ミルク」の文字数、 3桁目 「つき」の文字数の2倍（一の位だけ）、 4桁目 固定の数字 9. コードは何？', true),
  ('ja', 23, 'letters', 'ねこ', null, '2文字の言葉を探している: 「家でおとなしい動物」。それは何？', true),
  ('ja', 24, 'digits', '2614', null, '4桁のコードがあなたを待っている — 1桁目 「かぎ」の文字数、 2桁目 固定の数字 6、 3桁目 「いえ」の文字数から1を引いた数、 4桁目 「つき」の文字数の2倍（一の位だけ）. コードは何？', true),
  ('ja', 25, 'digits', '4321', null, '4桁のコードがあなたを待っている — 1桁目 「かぜ」の文字数の2倍（一の位だけ）、 2桁目 「ねこ」の文字数に1を足した数、 3桁目 「うみ」の文字数、 4桁目 「き」の文字数. コードは何？', true),
  ('ja', 26, 'digits', '1226', null, '4桁のコードがあなたを待っている — 1桁目 「き」の文字数、 2桁目 「つき」の文字数、 3桁目 「さかな」の文字数から1を引いた数、 4桁目 固定の数字 6. コードは何？', true),
  ('ja', 27, 'digits', '3651', null, '4桁のコードがあなたを待っている — 1桁目 「かわ」の文字数に1を足した数、 2桁目 「さかな」の文字数の2倍（一の位だけ）、 3桁目 固定の数字 5、 4桁目 「き」の文字数. コードは何？', true),
  ('ja', 28, 'letters', 'ドア', null, '2文字の言葉を探している: 「入口を開く」。それは何？', true),
  ('ja', 29, 'digits', '3212', null, '4桁のコードがあなたを待っている — 1桁目 「ミルク」の文字数、 2桁目 「ひ」の文字数に1を足した数、 3桁目 「くも」の文字数から1を引いた数、 4桁目 「ねこ」の文字数. コードは何？', true),
  ('ja', 30, 'digits', '7343', null, '4桁のコードがあなたを待っている — 1桁目 固定の数字 7、 2桁目 「さかな」の文字数、 3桁目 「ほん」の文字数の2倍（一の位だけ）、 4桁目 「かわ」の文字数に1を足した数. コードは何？', true),
  ('ko', 1, 'digits', '2316', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「열쇠」의 글자 수,  둘째 자리 「바람」의 글자 수에 1을 더한 값,  셋째 자리 「구름」의 글자 수에서 1을 뺀 값,  넷째 자리 「물고기」의 글자 수의 두 배 (일의 자리만). 코드는 무엇인가요?', true),
  ('ko', 2, 'digits', '3221', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「고양이」의 글자 수,  둘째 자리 고정 숫자 2,  셋째 자리 「손」의 글자 수에 1을 더한 값,  넷째 자리 「개」의 글자 수. 코드는 무엇인가요?', true),
  ('ko', 3, 'letters', '달', null, '1글자 단어를 찾고 있다: 「밤하늘에서 빛난다」。그것은 무엇인가요?', true),
  ('ko', 4, 'digits', '2342', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「비」의 글자 수에 1을 더한 값,  둘째 자리 「고양이」의 글자 수,  셋째 자리 「바람」의 글자 수의 두 배 (일의 자리만),  넷째 자리 「물고기」의 글자 수에서 1을 뺀 값. 코드는 무엇인가요?', true),
  ('ko', 5, 'digits', '1342', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「강」의 글자 수,  둘째 자리 「고양이」의 글자 수,  셋째 자리 고정 숫자 4,  넷째 자리 「해」의 글자 수에 1을 더한 값. 코드는 무엇인가요?', true),
  ('ko', 6, 'digits', '6132', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「물고기」의 글자 수의 두 배 (일의 자리만),  둘째 자리 「별」의 글자 수,  셋째 자리 「나무」의 글자 수에 1을 더한 값,  넷째 자리 「시계」의 글자 수. 코드는 무엇인가요?', true),
  ('ko', 7, 'digits', '2224', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「물고기」의 글자 수에서 1을 뺀 값,  둘째 자리 「나무」의 글자 수,  셋째 자리 「손」의 글자 수의 두 배 (일의 자리만),  넷째 자리 고정 숫자 4. 코드는 무엇인가요?', true),
  ('ko', 8, 'letters', '빵', null, '1글자 단어를 찾고 있다: 「매일의 빵」。그것은 무엇인가요?', true),
  ('ko', 9, 'digits', '1217', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「해」의 글자 수,  둘째 자리 「새」의 글자 수에 1을 더한 값,  셋째 자리 「별」의 글자 수,  넷째 자리 고정 숫자 7. 코드는 무엇인가요?', true),
  ('ko', 10, 'letters', '별', null, '1글자 단어를 찾고 있다: 「밤하늘에 반짝인다」。그것은 무엇인가요?', true),
  ('ko', 11, 'digits', '3111', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 고정 숫자 3,  둘째 자리 「해」의 글자 수,  셋째 자리 「바다」의 글자 수에서 1을 뺀 값,  넷째 자리 「물」의 글자 수. 코드는 무엇인가요?', true),
  ('ko', 12, 'digits', '1221', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「문」의 글자 수,  둘째 자리 「달」의 글자 수의 두 배 (일의 자리만),  셋째 자리 「집」의 글자 수에 1을 더한 값,  넷째 자리 「구름」의 글자 수에서 1을 뺀 값. 코드는 무엇인가요?', true),
  ('ko', 13, 'letters', '책', null, '1글자 단어를 찾고 있다: 「페이지 사이의 지혜」。그것은 무엇인가요?', true),
  ('ko', 14, 'digits', '2212', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「새」의 글자 수에 1을 더한 값,  둘째 자리 「물고기」의 글자 수에서 1을 뺀 값,  셋째 자리 「비」의 글자 수,  넷째 자리 고정 숫자 2. 코드는 무엇인가요?', true),
  ('ko', 15, 'digits', '1112', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「물」의 글자 수,  둘째 자리 「개」의 글자 수,  셋째 자리 「책」의 글자 수,  넷째 자리 「별」의 글자 수에 1을 더한 값. 코드는 무엇인가요?', true),
  ('ko', 16, 'digits', '6411', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「고양이」의 글자 수의 두 배 (일의 자리만),  둘째 자리 고정 숫자 4,  셋째 자리 「강」의 글자 수,  넷째 자리 「나무」의 글자 수에서 1을 뺀 값. 코드는 무엇인가요?', true),
  ('ko', 17, 'digits', '3462', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「물고기」의 글자 수,  둘째 자리 「고양이」의 글자 수에 1을 더한 값,  셋째 자리 고정 숫자 6,  넷째 자리 「열쇠」의 글자 수. 코드는 무엇인가요?', true),
  ('ko', 18, 'letters', '물고기', null, '3글자 단어를 찾고 있다: 「물에 산다」。그것은 무엇인가요?', true),
  ('ko', 19, 'digits', '1213', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「구름」의 글자 수에서 1을 뺀 값,  둘째 자리 「해」의 글자 수의 두 배 (일의 자리만),  셋째 자리 「빵」의 글자 수,  넷째 자리 「바다」의 글자 수에 1을 더한 값. 코드는 무엇인가요?', true),
  ('ko', 20, 'digits', '9124', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 고정 숫자 9,  둘째 자리 「불」의 글자 수,  셋째 자리 「비」의 글자 수에 1을 더한 값,  넷째 자리 「바람」의 글자 수의 두 배 (일의 자리만). 코드는 무엇인가요?', true),
  ('ko', 21, 'digits', '1122', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「별」의 글자 수,  둘째 자리 「시계」의 글자 수에서 1을 뺀 값,  셋째 자리 고정 숫자 2,  넷째 자리 「손」의 글자 수에 1을 더한 값. 코드는 무엇인가요?', true),
  ('ko', 22, 'digits', '3141', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「바다」의 글자 수에 1을 더한 값,  둘째 자리 「문」의 글자 수,  셋째 자리 「우유」의 글자 수의 두 배 (일의 자리만),  넷째 자리 고정 숫자 1. 코드는 무엇인가요?', true),
  ('ko', 23, 'letters', '우유', null, '2글자 단어를 찾고 있다: 「농장의 하얀 음료」。그것은 무엇인가요?', true),
  ('ko', 24, 'digits', '1816', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「산」의 글자 수,  둘째 자리 고정 숫자 8,  셋째 자리 「바다」의 글자 수에서 1을 뺀 값,  넷째 자리 「고양이」의 글자 수의 두 배 (일의 자리만). 코드는 무엇인가요?', true),
  ('ko', 25, 'digits', '2313', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「새」의 글자 수의 두 배 (일의 자리만),  둘째 자리 「구름」의 글자 수에 1을 더한 값,  셋째 자리 「개」의 글자 수,  넷째 자리 「물고기」의 글자 수. 코드는 무엇인가요?', true),
  ('ko', 26, 'digits', '1318', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「강」의 글자 수,  둘째 자리 「고양이」의 글자 수,  셋째 자리 「우유」의 글자 수에서 1을 뺀 값,  넷째 자리 고정 숫자 8. 코드는 무엇인가요?', true),
  ('ko', 27, 'digits', '2242', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「집」의 글자 수에 1을 더한 값,  둘째 자리 「문」의 글자 수의 두 배 (일의 자리만),  셋째 자리 고정 숫자 4,  넷째 자리 「시계」의 글자 수. 코드는 무엇인가요?', true),
  ('ko', 28, 'letters', '집', null, '1글자 단어를 찾고 있다: 「사람이 사는 곳」。그것은 무엇인가요?', true),
  ('ko', 29, 'digits', '1223', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 「불」의 글자 수,  둘째 자리 「손」의 글자 수에 1을 더한 값,  셋째 자리 「고양이」의 글자 수에서 1을 뺀 값,  넷째 자리 「물고기」의 글자 수. 코드는 무엇인가요?', true),
  ('ko', 30, 'digits', '3223', null, '네 자리 코드가 당신을 기다린다 — 첫째 자리 고정 숫자 3,  둘째 자리 「구름」의 글자 수,  셋째 자리 「집」의 글자 수의 두 배 (일의 자리만),  넷째 자리 「바람」의 글자 수에 1을 더한 값. 코드는 무엇인가요?', true),
  ('nl', 1, 'digits', '3538', null, 'Een viercijferige code wacht op je — het eerste cijfer het aantal letters van «kat»,  het tweede cijfer het aantal letters van «boom» plus één,  het derde cijfer het aantal letters van «wind» min één,  het vierde cijfer het dubbele van de letters van «vuur» (alleen de eenheden). Wat is de code?', true),
  ('nl', 2, 'digits', '5354', null, 'Een viercijferige code wacht op je — het eerste cijfer het aantal letters van «vogel»,  het tweede cijfer het vaste cijfer 3,  het derde cijfer het aantal letters van «maan» plus één,  het vierde cijfer het aantal letters van «huis». Wat is de code?', true),
  ('nl', 3, 'letters', 'vis', null, 'Je zoekt een woord van 3 letters: «ik leef in het water». Welk woord is het?', true),
  ('nl', 4, 'digits', '6383', null, 'Een viercijferige code wacht op je — het eerste cijfer het aantal letters van «water» plus één,  het tweede cijfer het aantal letters van «zee»,  het derde cijfer het dubbele van de letters van «hand» (alleen de eenheden),  het vierde cijfer het aantal letters van «deur» min één. Wat is de code?', true),
  ('nl', 5, 'digits', '4495', null, 'Een viercijferige code wacht op je — het eerste cijfer het aantal letters van «vuur»,  het tweede cijfer het aantal letters van «ster»,  het derde cijfer het vaste cijfer 9,  het vierde cijfer het aantal letters van «berg» plus één. Wat is de code?', true),
  ('nl', 6, 'digits', '8454', null, 'Een viercijferige code wacht op je — het eerste cijfer het dubbele van de letters van «berg» (alleen de eenheden),  het tweede cijfer het aantal letters van «wolk»,  het derde cijfer het aantal letters van «boek» plus één,  het vierde cijfer het aantal letters van «maan». Wat is de code?', true),
  ('nl', 7, 'digits', '4486', null, 'Een viercijferige code wacht op je — het eerste cijfer het aantal letters van «brood» min één,  het tweede cijfer het aantal letters van «hand»,  het derde cijfer het dubbele van de letters van «huis» (alleen de eenheden),  het vierde cijfer het vaste cijfer 6. Wat is de code?', true),
  ('nl', 8, 'letters', 'hond', null, 'Je zoekt een woord van 4 letters: «de trouwe vriend van de mens». Welk woord is het?', true),
  ('nl', 9, 'digits', '3541', null, 'Een viercijferige code wacht op je — het eerste cijfer het aantal letters van «zee»,  het tweede cijfer het aantal letters van «hand» plus één,  het derde cijfer het aantal letters van «boom»,  het vierde cijfer het vaste cijfer 1. Wat is de code?', true),
  ('nl', 10, 'letters', 'boek', null, 'Je zoekt een woord van 4 letters: «wijsheid tussen mijn bladzijden». Welk woord is het?', true),
  ('nl', 11, 'digits', '1534', null, 'Een viercijferige code wacht op je — het eerste cijfer het vaste cijfer 1,  het tweede cijfer het aantal letters van «brood»,  het derde cijfer het aantal letters van «maan» min één,  het vierde cijfer het aantal letters van «berg». Wat is de code?', true),
  ('nl', 12, 'digits', '3454', null, 'Een viercijferige code wacht op je — het eerste cijfer het aantal letters van «zee»,  het tweede cijfer het dubbele van de letters van «sleutel» (alleen de eenheden),  het derde cijfer het aantal letters van «vuur» plus één,  het vierde cijfer het aantal letters van «regen» min één. Wat is de code?', true),
  ('nl', 13, 'letters', 'maan', null, 'Je zoekt een woord van 4 letters: «ik schijn ''s nachts aan de hemel». Welk woord is het?', true),
  ('nl', 14, 'digits', '5348', null, 'Een viercijferige code wacht op je — het eerste cijfer het aantal letters van «vuur» plus één,  het tweede cijfer het aantal letters van «deur» min één,  het derde cijfer het aantal letters van «melk»,  het vierde cijfer het vaste cijfer 8. Wat is de code?', true),
  ('nl', 15, 'digits', '5447', null, 'Een viercijferige code wacht op je — het eerste cijfer het aantal letters van «brood»,  het tweede cijfer het aantal letters van «hand»,  het derde cijfer het aantal letters van «ster»,  het vierde cijfer het aantal letters van «rivier» plus één. Wat is de code?', true),
  ('nl', 16, 'digits', '8253', null, 'Een viercijferige code wacht op je — het eerste cijfer het dubbele van de letters van «boom» (alleen de eenheden),  het tweede cijfer het vaste cijfer 2,  het derde cijfer het aantal letters van «vogel»,  het vierde cijfer het aantal letters van «vuur» min één. Wat is de code?', true),
  ('nl', 17, 'digits', '4533', null, 'Een viercijferige code wacht op je — het eerste cijfer het aantal letters van «klok»,  het tweede cijfer het aantal letters van «hond» plus één,  het derde cijfer het vaste cijfer 3,  het vierde cijfer het aantal letters van «zon». Wat is de code?', true),
  ('nl', 18, 'letters', 'deur', null, 'Je zoekt een woord van 4 letters: «ik open de ingang». Welk woord is het?', true),
  ('nl', 19, 'digits', '3838', null, 'Een viercijferige code wacht op je — het eerste cijfer het aantal letters van «boek» min één,  het tweede cijfer het dubbele van de letters van «deur» (alleen de eenheden),  het derde cijfer het aantal letters van «zee»,  het vierde cijfer het aantal letters van «sleutel» plus één. Wat is de code?', true),
  ('nl', 20, 'digits', '5486', null, 'Een viercijferige code wacht op je — het eerste cijfer het vaste cijfer 5,  het tweede cijfer het aantal letters van «klok»,  het derde cijfer het aantal letters van «sleutel» plus één,  het vierde cijfer het dubbele van de letters van «zee» (alleen de eenheden). Wat is de code?', true),
  ('nl', 21, 'digits', '5386', null, 'Een viercijferige code wacht op je — het eerste cijfer het aantal letters van «brood»,  het tweede cijfer het aantal letters van «huis» min één,  het derde cijfer het vaste cijfer 8,  het vierde cijfer het aantal letters van «regen» plus één. Wat is de code?', true),
  ('nl', 22, 'digits', '5404', null, 'Een viercijferige code wacht op je — het eerste cijfer het aantal letters van «hond» plus één,  het tweede cijfer het aantal letters van «klok»,  het derde cijfer het dubbele van de letters van «vogel» (alleen de eenheden),  het vierde cijfer het vaste cijfer 4. Wat is de code?', true),
  ('nl', 23, 'letters', 'kat', null, 'Je zoekt een woord van 3 letters: «het rustige dier in huis». Welk woord is het?', true),
  ('nl', 24, 'digits', '4638', null, 'Een viercijferige code wacht op je — het eerste cijfer het aantal letters van «boom»,  het tweede cijfer het vaste cijfer 6,  het derde cijfer het aantal letters van «berg» min één,  het vierde cijfer het dubbele van de letters van «wind» (alleen de eenheden). Wat is de code?', true),
  ('nl', 25, 'digits', '6544', null, 'Een viercijferige code wacht op je — het eerste cijfer het dubbele van de letters van «zon» (alleen de eenheden),  het tweede cijfer het aantal letters van «boek» plus één,  het derde cijfer het aantal letters van «hand»,  het vierde cijfer het aantal letters van «klok». Wat is de code?', true),
  ('nl', 26, 'digits', '3435', null, 'Een viercijferige code wacht op je — het eerste cijfer het aantal letters van «zon»,  het tweede cijfer het aantal letters van «huis»,  het derde cijfer het aantal letters van «berg» min één,  het vierde cijfer het vaste cijfer 5. Wat is de code?', true),
  ('nl', 27, 'digits', '5833', null, 'Een viercijferige code wacht op je — het eerste cijfer het aantal letters van «boom» plus één,  het tweede cijfer het dubbele van de letters van «boek» (alleen de eenheden),  het derde cijfer het vaste cijfer 3,  het vierde cijfer het aantal letters van «zee». Wat is de code?', true),
  ('nl', 28, 'letters', 'wolk', null, 'Je zoekt een woord van 4 letters: «ik reis door de lucht». Welk woord is het?', true),
  ('nl', 29, 'digits', '4544', null, 'Een viercijferige code wacht op je — het eerste cijfer het aantal letters van «wolk»,  het tweede cijfer het aantal letters van «hond» plus één,  het derde cijfer het aantal letters van «vogel» min één,  het vierde cijfer het aantal letters van «maan». Wat is de code?', true),
  ('nl', 30, 'digits', '4387', null, 'Een viercijferige code wacht op je — het eerste cijfer het vaste cijfer 4,  het tweede cijfer het aantal letters van «zee»,  het derde cijfer het dubbele van de letters van «deur» (alleen de eenheden),  het vierde cijfer het aantal letters van «rivier» plus één. Wat is de code?', true),
  ('pt', 1, 'digits', '4744', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o número de letras de «água»,  o segundo dígito o número de letras de «árvore» mais um,  o terceiro dígito o número de letras de «chave» menos um,  o quarto dígito o dobro das letras de «pássaro» (apenas o dígito das unidades). Qual é o código?', true),
  ('pt', 2, 'digits', '3444', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o número de letras de «cão»,  o segundo dígito o dígito fixo 4,  o terceiro dígito o número de letras de «rio» mais um,  o quarto dígito o número de letras de «água». Qual é o código?', true),
  ('pt', 3, 'letters', 'mão', null, 'Você procura uma palavra de 3 letras: «comigo se escreve e se cumprimenta». Qual é?', true),
  ('pt', 4, 'digits', '4804', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o número de letras de «mar» mais um,  o segundo dígito o número de letras de «montanha»,  o terceiro dígito o dobro das letras de «peixe» (apenas o dígito das unidades),  o quarto dígito o número de letras de «chuva» menos um. Qual é o código?', true),
  ('pt', 5, 'digits', '7336', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o número de letras de «pássaro»,  o segundo dígito o número de letras de «cão»,  o terceiro dígito o dígito fixo 3,  o quarto dígito o número de letras de «chave» mais um. Qual é o código?', true),
  ('pt', 6, 'digits', '8545', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o dobro das letras de «casa» (apenas o dígito das unidades),  o segundo dígito o número de letras de «chuva»,  o terceiro dígito o número de letras de «mar» mais um,  o quarto dígito o número de letras de «porta». Qual é o código?', true),
  ('pt', 7, 'digits', '4588', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o número de letras de «leite» menos um,  o segundo dígito o número de letras de «vento»,  o terceiro dígito o dobro das letras de «gato» (apenas o dígito das unidades),  o quarto dígito o dígito fixo 8. Qual é o código?', true),
  ('pt', 8, 'letters', 'chave', null, 'Você procura uma palavra de 5 letras: «eu abro fechaduras». Qual é?', true),
  ('pt', 9, 'digits', '3638', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o número de letras de «pão»,  o segundo dígito o número de letras de «leite» mais um,  o terceiro dígito o número de letras de «mão»,  o quarto dígito o dígito fixo 8. Qual é o código?', true),
  ('pt', 10, 'letters', 'lua', null, 'Você procura uma palavra de 3 letras: «eu ilumino a noite no céu». Qual é?', true),
  ('pt', 11, 'digits', '5437', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o dígito fixo 5,  o segundo dígito o número de letras de «fogo»,  o terceiro dígito o número de letras de «gato» menos um,  o quarto dígito o número de letras de «estrela». Qual é o código?', true),
  ('pt', 12, 'digits', '6064', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o número de letras de «árvore»,  o segundo dígito o dobro das letras de «porta» (apenas o dígito das unidades),  o terceiro dígito o número de letras de «vento» mais um,  o quarto dígito o número de letras de «chave» menos um. Qual é o código?', true),
  ('pt', 13, 'letters', 'fogo', null, 'Você procura uma palavra de 4 letras: «eu queimo e aqueço». Qual é?', true),
  ('pt', 14, 'digits', '4484', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o número de letras de «pão» mais um,  o segundo dígito o número de letras de «vento» menos um,  o terceiro dígito o número de letras de «montanha»,  o quarto dígito o dígito fixo 4. Qual é o código?', true),
  ('pt', 15, 'digits', '5335', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o número de letras de «livro»,  o segundo dígito o número de letras de «lua»,  o terceiro dígito o número de letras de «pão»,  o quarto dígito o número de letras de «água» mais um. Qual é o código?', true),
  ('pt', 16, 'digits', '6276', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o dobro das letras de «pão» (apenas o dígito das unidades),  o segundo dígito o dígito fixo 2,  o terceiro dígito o número de letras de «pássaro»,  o quarto dígito o número de letras de «estrela» menos um. Qual é o código?', true),
  ('pt', 17, 'digits', '6564', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o número de letras de «árvore»,  o segundo dígito o número de letras de «água» mais um,  o terceiro dígito o dígito fixo 6,  o quarto dígito o número de letras de «fogo». Qual é o código?', true),
  ('pt', 18, 'letters', 'montanha', null, 'Você procura uma palavra de 8 letras: «meu topo toca as nuvens». Qual é?', true),
  ('pt', 19, 'digits', '4876', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o número de letras de «leite» menos um,  o segundo dígito o dobro das letras de «casa» (apenas o dígito das unidades),  o terceiro dígito o número de letras de «estrela»,  o quarto dígito o número de letras de «chave» mais um. Qual é o código?', true),
  ('pt', 20, 'digits', '1586', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o dígito fixo 1,  o segundo dígito o número de letras de «porta»,  o terceiro dígito o número de letras de «pássaro» mais um,  o quarto dígito o dobro das letras de «cão» (apenas o dígito das unidades). Qual é o código?', true),
  ('pt', 21, 'digits', '6365', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o número de letras de «árvore»,  o segundo dígito o número de letras de «fogo» menos um,  o terceiro dígito o dígito fixo 6,  o quarto dígito o número de letras de «gato» mais um. Qual é o código?', true),
  ('pt', 22, 'digits', '4547', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o número de letras de «cão» mais um,  o segundo dígito o número de letras de «nuvem»,  o terceiro dígito o dobro das letras de «pássaro» (apenas o dígito das unidades),  o quarto dígito o dígito fixo 7. Qual é o código?', true),
  ('pt', 23, 'letters', 'gato', null, 'Você procura uma palavra de 4 letras: «o animal tranquilo da casa». Qual é?', true),
  ('pt', 24, 'digits', '5160', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o número de letras de «leite»,  o segundo dígito o dígito fixo 1,  o terceiro dígito o número de letras de «estrela» menos um,  o quarto dígito o dobro das letras de «porta» (apenas o dígito das unidades). Qual é o código?', true),
  ('pt', 25, 'digits', '6635', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o dobro das letras de «cão» (apenas o dígito das unidades),  o segundo dígito o número de letras de «chave» mais um,  o terceiro dígito o número de letras de «mar»,  o quarto dígito o número de letras de «porta». Qual é o código?', true),
  ('pt', 26, 'digits', '3449', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o número de letras de «cão»,  o segundo dígito o número de letras de «fogo»,  o terceiro dígito o número de letras de «leite» menos um,  o quarto dígito o dígito fixo 9. Qual é o código?', true),
  ('pt', 27, 'digits', '4493', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o número de letras de «cão» mais um,  o segundo dígito o dobro das letras de «relógio» (apenas o dígito das unidades),  o terceiro dígito o dígito fixo 9,  o quarto dígito o número de letras de «pão». Qual é o código?', true),
  ('pt', 28, 'letters', 'água', null, 'Você procura uma palavra de 4 letras: «eu mato a sede». Qual é?', true),
  ('pt', 29, 'digits', '5425', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o número de letras de «chave»,  o segundo dígito o número de letras de «mão» mais um,  o terceiro dígito o número de letras de «mar» menos um,  o quarto dígito o número de letras de «chuva». Qual é o código?', true),
  ('pt', 30, 'digits', '5524', null, 'Um código de quatro dígitos espera por você — o primeiro dígito o dígito fixo 5,  o segundo dígito o número de letras de «peixe»,  o terceiro dígito o dobro das letras de «árvore» (apenas o dígito das unidades),  o quarto dígito o número de letras de «sol» mais um. Qual é o código?', true),
  ('ru', 1, 'digits', '5748', null, 'Четырёхзначный код ждёт тебя — первая цифра число букв в слове «книга»,  вторая цифра число букв в слове «дерево» плюс один,  третья цифра число букв в слове «дверь» минус один,  четвёртая цифра удвоенное число букв в слове «ключ» (только цифра единиц). Какой это код?', true),
  ('ru', 2, 'digits', '5555', null, 'Четырёхзначный код ждёт тебя — первая цифра число букв в слове «ветер»,  вторая цифра фиксированная цифра 5,  третья цифра число букв в слове «вода» плюс один,  четвёртая цифра число букв в слове «огонь». Какой это код?', true),
  ('ru', 3, 'letters', 'море', null, 'Ты ищешь слово из 4 букв: «мои волны бесконечны». Какое это слово?', true),
  ('ru', 4, 'digits', '6403', null, 'Четырёхзначный код ждёт тебя — первая цифра число букв в слове «дверь» плюс один,  вторая цифра число букв в слове «река»,  третья цифра удвоенное число букв в слове «кошка» (только цифра единиц),  четвёртая цифра число букв в слове «луна» минус один. Какой это код?', true),
  ('ru', 5, 'digits', '6587', null, 'Четырёхзначный код ждёт тебя — первая цифра число букв в слове «дерево»,  вторая цифра число букв в слове «книга»,  третья цифра фиксированная цифра 8,  четвёртая цифра число букв в слове «собака» плюс один. Какой это код?', true),
  ('ru', 6, 'digits', '2464', null, 'Четырёхзначный код ждёт тебя — первая цифра удвоенное число букв в слове «облако» (только цифра единиц),  вторая цифра число букв в слове «хлеб»,  третья цифра число букв в слове «птица» плюс один,  четвёртая цифра число букв в слове «часы». Какой это код?', true),
  ('ru', 7, 'digits', '5502', null, 'Четырёхзначный код ждёт тебя — первая цифра число букв в слове «солнце» минус один,  вторая цифра число букв в слове «кошка»,  третья цифра удвоенное число букв в слове «дождь» (только цифра единиц),  четвёртая цифра фиксированная цифра 2. Какой это код?', true),
  ('ru', 8, 'letters', 'дерево', null, 'Ты ищешь слово из 6 букв: «я даю тень земле». Какое это слово?', true),
  ('ru', 9, 'digits', '4566', null, 'Четырёхзначный код ждёт тебя — первая цифра число букв в слове «ключ»,  вторая цифра число букв в слове «рыба» плюс один,  третья цифра число букв в слове «звезда»,  четвёртая цифра фиксированная цифра 6. Какой это код?', true),
  ('ru', 10, 'letters', 'река', null, 'Ты ищешь слово из 4 букв: «я теку к морю». Какое это слово?', true),
  ('ru', 11, 'digits', '6654', null, 'Четырёхзначный код ждёт тебя — первая цифра фиксированная цифра 6,  вторая цифра число букв в слове «молоко»,  третья цифра число букв в слове «облако» минус один,  четвёртая цифра число букв в слове «вода». Какой это код?', true),
  ('ru', 12, 'digits', '6063', null, 'Четырёхзначный код ждёт тебя — первая цифра число букв в слове «собака»,  вторая цифра удвоенное число букв в слове «огонь» (только цифра единиц),  третья цифра число букв в слове «кошка» плюс один,  четвёртая цифра число букв в слове «ключ» минус один. Какой это код?', true),
  ('ru', 13, 'letters', 'птица', null, 'Ты ищешь слово из 5 букв: «я летаю в небе». Какое это слово?', true),
  ('ru', 14, 'digits', '6549', null, 'Четырёхзначный код ждёт тебя — первая цифра число букв в слове «огонь» плюс один,  вторая цифра число букв в слове «дерево» минус один,  третья цифра число букв в слове «рыба»,  четвёртая цифра фиксированная цифра 9. Какой это код?', true),
  ('ru', 15, 'digits', '5356', null, 'Четырёхзначный код ждёт тебя — первая цифра число букв в слове «ветер»,  вторая цифра число букв в слове «дом»,  третья цифра число букв в слове «птица»,  четвёртая цифра число букв в слове «огонь» плюс один. Какой это код?', true),
  ('ru', 16, 'digits', '2855', null, 'Четырёхзначный код ждёт тебя — первая цифра удвоенное число букв в слове «дерево» (только цифра единиц),  вторая цифра фиксированная цифра 8,  третья цифра число букв в слове «ветер»,  четвёртая цифра число букв в слове «молоко» минус один. Какой это код?', true),
  ('ru', 17, 'digits', '6523', null, 'Четырёхзначный код ждёт тебя — первая цифра число букв в слове «звезда»,  вторая цифра число букв в слове «рука» плюс один,  третья цифра фиксированная цифра 2,  четвёртая цифра число букв в слове «дом». Какой это код?', true),
  ('ru', 18, 'letters', 'дождь', null, 'Ты ищешь слово из 5 букв: «я падаю каплями». Какое это слово?', true),
  ('ru', 19, 'digits', '5246', null, 'Четырёхзначный код ждёт тебя — первая цифра число букв в слове «собака» минус один,  вторая цифра удвоенное число букв в слове «молоко» (только цифра единиц),  третья цифра число букв в слове «хлеб»,  четвёртая цифра число букв в слове «дождь» плюс один. Какой это код?', true),
  ('ru', 20, 'digits', '1458', null, 'Четырёхзначный код ждёт тебя — первая цифра фиксированная цифра 1,  вторая цифра число букв в слове «рыба»,  третья цифра число букв в слове «хлеб» плюс один,  четвёртая цифра удвоенное число букв в слове «часы» (только цифра единиц). Какой это код?', true),
  ('ru', 21, 'digits', '5576', null, 'Четырёхзначный код ждёт тебя — первая цифра число букв в слове «птица»,  вторая цифра число букв в слове «облако» минус один,  третья цифра фиксированная цифра 7,  четвёртая цифра число букв в слове «дверь» плюс один. Какой это код?', true),
  ('ru', 22, 'digits', '7469', null, 'Четырёхзначный код ждёт тебя — первая цифра число букв в слове «звезда» плюс один,  вторая цифра число букв в слове «рыба»,  третья цифра удвоенное число букв в слове «дом» (только цифра единиц),  четвёртая цифра фиксированная цифра 9. Какой это код?', true),
  ('ru', 23, 'letters', 'луна', null, 'Ты ищешь слово из 4 букв: «я светлю ночью в небе». Какое это слово?', true),
  ('ru', 24, 'digits', '6230', null, 'Четырёхзначный код ждёт тебя — первая цифра число букв в слове «звезда»,  вторая цифра фиксированная цифра 2,  третья цифра число букв в слове «ключ» минус один,  четвёртая цифра удвоенное число букв в слове «книга» (только цифра единиц). Какой это код?', true),
  ('ru', 25, 'digits', '8556', null, 'Четырёхзначный код ждёт тебя — первая цифра удвоенное число букв в слове «часы» (только цифра единиц),  вторая цифра число букв в слове «луна» плюс один,  третья цифра число букв в слове «птица»,  четвёртая цифра число букв в слове «солнце». Какой это код?', true),
  ('ru', 26, 'digits', '4644', null, 'Четырёхзначный код ждёт тебя — первая цифра число букв в слове «река»,  вторая цифра число букв в слове «собака»,  третья цифра число букв в слове «дверь» минус один,  четвёртая цифра фиксированная цифра 4. Какой это код?', true),
  ('ru', 27, 'digits', '6855', null, 'Четырёхзначный код ждёт тебя — первая цифра число букв в слове «ветер» плюс один,  вторая цифра удвоенное число букв в слове «часы» (только цифра единиц),  третья цифра фиксированная цифра 5,  четвёртая цифра число букв в слове «кошка». Какой это код?', true),
  ('ru', 28, 'letters', 'кошка', null, 'Ты ищешь слово из 5 букв: «тихий зверёк в доме». Какое это слово?', true),
  ('ru', 29, 'digits', '5633', null, 'Четырёхзначный код ждёт тебя — первая цифра число букв в слове «огонь»,  вторая цифра число букв в слове «дождь» плюс один,  третья цифра число букв в слове «рыба» минус один,  четвёртая цифра число букв в слове «дом». Какой это код?', true),
  ('ru', 30, 'digits', '2586', null, 'Четырёхзначный код ждёт тебя — первая цифра фиксированная цифра 2,  вторая цифра число букв в слове «птица»,  третья цифра удвоенное число букв в слове «река» (только цифра единиц),  четвёртая цифра число букв в слове «книга» плюс один. Какой это код?', true),
  ('tr', 1, 'digits', '5630', null, 'Dört haneli bir kod seni bekliyor — ilk hane «deniz» kelimesindeki harf sayısı,  ikinci hane «nehir» kelimesindeki harf sayısı artı bir,  üçüncü hane «ağaç» kelimesindeki harf sayısı eksi bir,  dördüncü hane «kitap» kelimesindeki harf sayısının iki katı (sadece birler basamağı). Kod nedir?', true),
  ('tr', 2, 'digits', '2744', null, 'Dört haneli bir kod seni bekliyor — ilk hane «su» kelimesindeki harf sayısı,  ikinci hane sabit hane 7,  üçüncü hane «kuş» kelimesindeki harf sayısı artı bir,  dördüncü hane «kapı» kelimesindeki harf sayısı. Kod nedir?', true),
  ('tr', 3, 'letters', 'bulut', null, '5 harfli bir kelime arıyorsun: «gökyüzünde gezerim». Hangi kelime?', true),
  ('tr', 4, 'digits', '6485', null, 'Dört haneli bir kod seni bekliyor — ilk hane «nehir» kelimesindeki harf sayısı artı bir,  ikinci hane «ateş» kelimesindeki harf sayısı,  üçüncü hane «ağaç» kelimesindeki harf sayısının iki katı (sadece birler basamağı),  dördüncü hane «rüzgâr» kelimesindeki harf sayısı eksi bir. Kod nedir?', true),
  ('tr', 5, 'digits', '6443', null, 'Dört haneli bir kod seni bekliyor — ilk hane «yağmur» kelimesindeki harf sayısı,  ikinci hane «saat» kelimesindeki harf sayısı,  üçüncü hane sabit hane 4,  dördüncü hane «ay» kelimesindeki harf sayısı artı bir. Kod nedir?', true),
  ('tr', 6, 'digits', '6435', null, 'Dört haneli bir kod seni bekliyor — ilk hane «süt» kelimesindeki harf sayısının iki katı (sadece birler basamağı),  ikinci hane «ağaç» kelimesindeki harf sayısı,  üçüncü hane «su» kelimesindeki harf sayısı artı bir,  dördüncü hane «bulut» kelimesindeki harf sayısı. Kod nedir?', true),
  ('tr', 7, 'digits', '4542', null, 'Dört haneli bir kod seni bekliyor — ilk hane «kitap» kelimesindeki harf sayısı eksi bir,  ikinci hane «deniz» kelimesindeki harf sayısı,  üçüncü hane «su» kelimesindeki harf sayısının iki katı (sadece birler basamağı),  dördüncü hane sabit hane 2. Kod nedir?', true),
  ('tr', 8, 'letters', 'kedi', null, '4 harfli bir kelime arıyorsun: «evin sessiz hayvanı». Hangi kelime?', true),
  ('tr', 9, 'digits', '5649', null, 'Dört haneli bir kod seni bekliyor — ilk hane «balık» kelimesindeki harf sayısı,  ikinci hane «nehir» kelimesindeki harf sayısı artı bir,  üçüncü hane «ateş» kelimesindeki harf sayısı,  dördüncü hane sabit hane 9. Kod nedir?', true),
  ('tr', 10, 'letters', 'su', null, '2 harfli bir kelime arıyorsun: «susuzluğu gideririm». Hangi kelime?', true),
  ('tr', 11, 'digits', '6335', null, 'Dört haneli bir kod seni bekliyor — ilk hane sabit hane 6,  ikinci hane «kuş» kelimesindeki harf sayısı,  üçüncü hane «kapı» kelimesindeki harf sayısı eksi bir,  dördüncü hane «ekmek» kelimesindeki harf sayısı. Kod nedir?', true),
  ('tr', 12, 'digits', '5864', null, 'Dört haneli bir kod seni bekliyor — ilk hane «ekmek» kelimesindeki harf sayısı,  ikinci hane «kapı» kelimesindeki harf sayısının iki katı (sadece birler basamağı),  üçüncü hane «balık» kelimesindeki harf sayısı artı bir,  dördüncü hane «bulut» kelimesindeki harf sayısı eksi bir. Kod nedir?', true),
  ('tr', 13, 'letters', 'yağmur', null, '6 harfli bir kelime arıyorsun: «damlalar hâlinde düşerim». Hangi kelime?', true),
  ('tr', 14, 'digits', '3658', null, 'Dört haneli bir kod seni bekliyor — ilk hane «su» kelimesindeki harf sayısı artı bir,  ikinci hane «anahtar» kelimesindeki harf sayısı eksi bir,  üçüncü hane «nehir» kelimesindeki harf sayısı,  dördüncü hane sabit hane 8. Kod nedir?', true),
  ('tr', 15, 'digits', '4254', null, 'Dört haneli bir kod seni bekliyor — ilk hane «kedi» kelimesindeki harf sayısı,  ikinci hane «el» kelimesindeki harf sayısı,  üçüncü hane «nehir» kelimesindeki harf sayısı,  dördüncü hane «dağ» kelimesindeki harf sayısı artı bir. Kod nedir?', true),
  ('tr', 16, 'digits', '4861', null, 'Dört haneli bir kod seni bekliyor — ilk hane «su» kelimesindeki harf sayısının iki katı (sadece birler basamağı),  ikinci hane sabit hane 8,  üçüncü hane «yıldız» kelimesindeki harf sayısı,  dördüncü hane «ev» kelimesindeki harf sayısı eksi bir. Kod nedir?', true),
  ('tr', 17, 'digits', '6562', null, 'Dört haneli bir kod seni bekliyor — ilk hane «yıldız» kelimesindeki harf sayısı,  ikinci hane «ağaç» kelimesindeki harf sayısı artı bir,  üçüncü hane sabit hane 6,  dördüncü hane «su» kelimesindeki harf sayısı. Kod nedir?', true),
  ('tr', 18, 'letters', 'kapı', null, '4 harfli bir kelime arıyorsun: «girişi açarım». Hangi kelime?', true),
  ('tr', 19, 'digits', '4443', null, 'Dört haneli bir kod seni bekliyor — ilk hane «balık» kelimesindeki harf sayısı eksi bir,  ikinci hane «su» kelimesindeki harf sayısının iki katı (sadece birler basamağı),  üçüncü hane «kedi» kelimesindeki harf sayısı,  dördüncü hane «ay» kelimesindeki harf sayısı artı bir. Kod nedir?', true),
  ('tr', 20, 'digits', '7530', null, 'Dört haneli bir kod seni bekliyor — ilk hane sabit hane 7,  ikinci hane «balık» kelimesindeki harf sayısı,  üçüncü hane «el» kelimesindeki harf sayısı artı bir,  dördüncü hane «köpek» kelimesindeki harf sayısının iki katı (sadece birler basamağı). Kod nedir?', true),
  ('tr', 21, 'digits', '3344', null, 'Dört haneli bir kod seni bekliyor — ilk hane «kuş» kelimesindeki harf sayısı,  ikinci hane «ağaç» kelimesindeki harf sayısı eksi bir,  üçüncü hane sabit hane 4,  dördüncü hane «süt» kelimesindeki harf sayısı artı bir. Kod nedir?', true),
  ('tr', 22, 'digits', '5548', null, 'Dört haneli bir kod seni bekliyor — ilk hane «kapı» kelimesindeki harf sayısı artı bir,  ikinci hane «bulut» kelimesindeki harf sayısı,  üçüncü hane «ay» kelimesindeki harf sayısının iki katı (sadece birler basamağı),  dördüncü hane sabit hane 8. Kod nedir?', true),
  ('tr', 23, 'letters', 'güneş', null, '5 harfli bir kelime arıyorsun: «gündüzü aydınlatırım». Hangi kelime?', true),
  ('tr', 24, 'digits', '2940', null, 'Dört haneli bir kod seni bekliyor — ilk hane «el» kelimesindeki harf sayısı,  ikinci hane sabit hane 9,  üçüncü hane «bulut» kelimesindeki harf sayısı eksi bir,  dördüncü hane «balık» kelimesindeki harf sayısının iki katı (sadece birler basamağı). Kod nedir?', true),
  ('tr', 25, 'digits', '4725', null, 'Dört haneli bir kod seni bekliyor — ilk hane «anahtar» kelimesindeki harf sayısının iki katı (sadece birler basamağı),  ikinci hane «rüzgâr» kelimesindeki harf sayısı artı bir,  üçüncü hane «ev» kelimesindeki harf sayısı,  dördüncü hane «deniz» kelimesindeki harf sayısı. Kod nedir?', true),
  ('tr', 26, 'digits', '4262', null, 'Dört haneli bir kod seni bekliyor — ilk hane «saat» kelimesindeki harf sayısı,  ikinci hane «su» kelimesindeki harf sayısı,  üçüncü hane «anahtar» kelimesindeki harf sayısı eksi bir,  dördüncü hane sabit hane 2. Kod nedir?', true),
  ('tr', 27, 'digits', '5012', null, 'Dört haneli bir kod seni bekliyor — ilk hane «kapı» kelimesindeki harf sayısı artı bir,  ikinci hane «bulut» kelimesindeki harf sayısının iki katı (sadece birler basamağı),  üçüncü hane sabit hane 1,  dördüncü hane «el» kelimesindeki harf sayısı. Kod nedir?', true),
  ('tr', 28, 'letters', 'süt', null, '3 harfli bir kelime arıyorsun: «çiftliğin beyaz içeceği». Hangi kelime?', true),
  ('tr', 29, 'digits', '4614', null, 'Dört haneli bir kod seni bekliyor — ilk hane «ateş» kelimesindeki harf sayısı,  ikinci hane «deniz» kelimesindeki harf sayısı artı bir,  üçüncü hane «su» kelimesindeki harf sayısı eksi bir,  dördüncü hane «ağaç» kelimesindeki harf sayısı. Kod nedir?', true),
  ('tr', 30, 'digits', '5503', null, 'Dört haneli bir kod seni bekliyor — ilk hane sabit hane 5,  ikinci hane «balık» kelimesindeki harf sayısı,  üçüncü hane «bulut» kelimesindeki harf sayısının iki katı (sadece birler basamağı),  dördüncü hane «ev» kelimesindeki harf sayısı artı bir. Kod nedir?', true),
  ('ur', 1, 'digits', '4336', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «درخت» میں حروف کی تعداد، دوسرا ہندسہ «آگ» میں حروف کی تعداد جمع ایک، تیسرا ہندسہ «چاند» میں حروف کی تعداد منفی ایک، چوتھا ہندسہ «بلی» کے حروف کی تعداد کا دوگنا (صرف اکائی ہندسہ). کوڈ کیا ہے؟', true),
  ('ur', 2, 'digits', '4264', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «چابی» میں حروف کی تعداد، دوسرا ہندسہ مقررہ ہندسہ ۲، تیسرا ہندسہ «پرندہ» میں حروف کی تعداد جمع ایک، چوتھا ہندسہ «سورج» میں حروف کی تعداد. کوڈ کیا ہے؟', true),
  ('ur', 3, 'letters', 'بلی', null, 'آپ ۳ حروف کا ایک لفظ تلاش کر رہے ہیں: «گھر کا خاموش ساتھی». کون سا لفظ ہے؟', true),
  ('ur', 4, 'digits', '5483', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «ہاتھ» میں حروف کی تعداد جمع ایک، دوسرا ہندسہ «پہاڑ» میں حروف کی تعداد، تیسرا ہندسہ «دریا» کے حروف کی تعداد کا دوگنا (صرف اکائی ہندسہ)، چوتھا ہندسہ «چاند» میں حروف کی تعداد منفی ایک. کوڈ کیا ہے؟', true),
  ('ur', 5, 'digits', '3565', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «بلی» میں حروف کی تعداد، دوسرا ہندسہ «پرندہ» میں حروف کی تعداد، تیسرا ہندسہ مقررہ ہندسہ ۶، چوتھا ہندسہ «کتاب» میں حروف کی تعداد جمع ایک. کوڈ کیا ہے؟', true),
  ('ur', 6, 'digits', '8266', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «روٹی» کے حروف کی تعداد کا دوگنا (صرف اکائی ہندسہ)، دوسرا ہندسہ «آگ» میں حروف کی تعداد، تیسرا ہندسہ «سمندر» میں حروف کی تعداد جمع ایک، چوتھا ہندسہ «دروازہ» میں حروف کی تعداد. کوڈ کیا ہے؟', true),
  ('ur', 7, 'digits', '3382', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «ہاتھ» میں حروف کی تعداد منفی ایک، دوسرا ہندسہ «ہوا» میں حروف کی تعداد، تیسرا ہندسہ «سورج» کے حروف کی تعداد کا دوگنا (صرف اکائی ہندسہ)، چوتھا ہندسہ مقررہ ہندسہ ۲. کوڈ کیا ہے؟', true),
  ('ur', 8, 'letters', 'بادل', null, 'آپ ۴ حروف کا ایک لفظ تلاش کر رہے ہیں: «میں آسمان میں گھومتا ہوں». کون سا لفظ ہے؟', true),
  ('ur', 9, 'digits', '4565', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «سورج» میں حروف کی تعداد، دوسرا ہندسہ «گھڑی» میں حروف کی تعداد جمع ایک، تیسرا ہندسہ «دروازہ» میں حروف کی تعداد، چوتھا ہندسہ مقررہ ہندسہ ۵. کوڈ کیا ہے؟', true),
  ('ur', 10, 'letters', 'روٹی', null, 'آپ ۴ حروف کا ایک لفظ تلاش کر رہے ہیں: «میری روز کی روٹی». کون سا لفظ ہے؟', true),
  ('ur', 11, 'digits', '6424', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ مقررہ ہندسہ ۶، دوسرا ہندسہ «بارش» میں حروف کی تعداد، تیسرا ہندسہ «بلی» میں حروف کی تعداد منفی ایک، چوتھا ہندسہ «گھڑی» میں حروف کی تعداد. کوڈ کیا ہے؟', true),
  ('ur', 12, 'digits', '4663', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «روٹی» میں حروف کی تعداد، دوسرا ہندسہ «بلی» کے حروف کی تعداد کا دوگنا (صرف اکائی ہندسہ)، تیسرا ہندسہ «مچھلی» میں حروف کی تعداد جمع ایک، چوتھا ہندسہ «چابی» میں حروف کی تعداد منفی ایک. کوڈ کیا ہے؟', true),
  ('ur', 13, 'letters', 'پہاڑ', null, 'آپ ۴ حروف کا ایک لفظ تلاش کر رہے ہیں: «میری چوٹی بادلوں کو چھوتی ہے». کون سا لفظ ہے؟', true),
  ('ur', 14, 'digits', '6353', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «ستارہ» میں حروف کی تعداد جمع ایک، دوسرا ہندسہ «چاند» میں حروف کی تعداد منفی ایک، تیسرا ہندسہ «سمندر» میں حروف کی تعداد، چوتھا ہندسہ مقررہ ہندسہ ۳. کوڈ کیا ہے؟', true),
  ('ur', 15, 'digits', '3455', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «بلی» میں حروف کی تعداد، دوسرا ہندسہ «پہاڑ» میں حروف کی تعداد، تیسرا ہندسہ «مچھلی» میں حروف کی تعداد، چوتھا ہندسہ «بادل» میں حروف کی تعداد جمع ایک. کوڈ کیا ہے؟', true),
  ('ur', 16, 'digits', '4633', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «آگ» کے حروف کی تعداد کا دوگنا (صرف اکائی ہندسہ)، دوسرا ہندسہ مقررہ ہندسہ ۶، تیسرا ہندسہ «کتا» میں حروف کی تعداد، چوتھا ہندسہ «دودھ» میں حروف کی تعداد منفی ایک. کوڈ کیا ہے؟', true),
  ('ur', 17, 'digits', '2544', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «آگ» میں حروف کی تعداد، دوسرا ہندسہ «درخت» میں حروف کی تعداد جمع ایک، تیسرا ہندسہ مقررہ ہندسہ ۴، چوتھا ہندسہ «ہاتھ» میں حروف کی تعداد. کوڈ کیا ہے؟', true),
  ('ur', 18, 'letters', 'مچھلی', null, 'آپ ۵ حروف کا ایک لفظ تلاش کر رہے ہیں: «میں پانی میں رہتا ہوں». کون سا لفظ ہے؟', true),
  ('ur', 19, 'digits', '2855', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «ہوا» میں حروف کی تعداد منفی ایک، دوسرا ہندسہ «کتاب» کے حروف کی تعداد کا دوگنا (صرف اکائی ہندسہ)، تیسرا ہندسہ «سمندر» میں حروف کی تعداد، چوتھا ہندسہ «ہاتھ» میں حروف کی تعداد جمع ایک. کوڈ کیا ہے؟', true),
  ('ur', 20, 'digits', '9668', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ مقررہ ہندسہ ۹، دوسرا ہندسہ «دروازہ» میں حروف کی تعداد، تیسرا ہندسہ «ستارہ» میں حروف کی تعداد جمع ایک، چوتھا ہندسہ «روٹی» کے حروف کی تعداد کا دوگنا (صرف اکائی ہندسہ). کوڈ کیا ہے؟', true),
  ('ur', 21, 'digits', '4565', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «روٹی» میں حروف کی تعداد، دوسرا ہندسہ «دروازہ» میں حروف کی تعداد منفی ایک، تیسرا ہندسہ مقررہ ہندسہ ۶، چوتھا ہندسہ «بارش» میں حروف کی تعداد جمع ایک. کوڈ کیا ہے؟', true),
  ('ur', 22, 'digits', '6484', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «پرندہ» میں حروف کی تعداد جمع ایک، دوسرا ہندسہ «دریا» میں حروف کی تعداد، تیسرا ہندسہ «چاند» کے حروف کی تعداد کا دوگنا (صرف اکائی ہندسہ)، چوتھا ہندسہ مقررہ ہندسہ ۴. کوڈ کیا ہے؟', true),
  ('ur', 23, 'letters', 'سمندر', null, 'آپ ۵ حروف کا ایک لفظ تلاش کر رہے ہیں: «میری لہریں کبھی ختم نہیں ہوتیں». کون سا لفظ ہے؟', true),
  ('ur', 24, 'digits', '4136', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «ہاتھ» میں حروف کی تعداد، دوسرا ہندسہ مقررہ ہندسہ ۱، تیسرا ہندسہ «دودھ» میں حروف کی تعداد منفی ایک، چوتھا ہندسہ «ہوا» کے حروف کی تعداد کا دوگنا (صرف اکائی ہندسہ). کوڈ کیا ہے؟', true),
  ('ur', 25, 'digits', '8424', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «روٹی» کے حروف کی تعداد کا دوگنا (صرف اکائی ہندسہ)، دوسرا ہندسہ «کتا» میں حروف کی تعداد جمع ایک، تیسرا ہندسہ «آگ» میں حروف کی تعداد، چوتھا ہندسہ «پہاڑ» میں حروف کی تعداد. کوڈ کیا ہے؟', true),
  ('ur', 26, 'digits', '2447', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «آگ» میں حروف کی تعداد، دوسرا ہندسہ «ہاتھ» میں حروف کی تعداد، تیسرا ہندسہ «ستارہ» میں حروف کی تعداد منفی ایک، چوتھا ہندسہ مقررہ ہندسہ ۷. کوڈ کیا ہے؟', true),
  ('ur', 27, 'digits', '5624', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «چاند» میں حروف کی تعداد جمع ایک، دوسرا ہندسہ «بلی» کے حروف کی تعداد کا دوگنا (صرف اکائی ہندسہ)، تیسرا ہندسہ مقررہ ہندسہ ۲، چوتھا ہندسہ «دودھ» میں حروف کی تعداد. کوڈ کیا ہے؟', true),
  ('ur', 28, 'letters', 'ستارہ', null, 'آپ ۵ حروف کا ایک لفظ تلاش کر رہے ہیں: «میں رات کے آسمان میں جھلملاتا ہوں». کون سا لفظ ہے؟', true),
  ('ur', 29, 'digits', '4534', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ «سورج» میں حروف کی تعداد، دوسرا ہندسہ «چابی» میں حروف کی تعداد جمع ایک، تیسرا ہندسہ «بادل» میں حروف کی تعداد منفی ایک، چوتھا ہندسہ «گھڑی» میں حروف کی تعداد. کوڈ کیا ہے؟', true),
  ('ur', 30, 'digits', '8585', null, 'چار ہندسوں کا ایک کوڈ آپ کا منتظر ہے — پہلا ہندسہ مقررہ ہندسہ ۸، دوسرا ہندسہ «سمندر» میں حروف کی تعداد، تیسرا ہندسہ «درخت» کے حروف کی تعداد کا دوگنا (صرف اکائی ہندسہ)، چوتھا ہندسہ «گھڑی» میں حروف کی تعداد جمع ایک. کوڈ کیا ہے؟', true),
  ('zh', 1, 'digits', '1212', null, '一个四位数密码在等你 — 第一位 「狗」的字数， 第二位 「书」的字数加一， 第三位 「牛奶」的字数减一， 第四位 「海」字数的两倍（只看个位）. 密码是什么？', true),
  ('zh', 2, 'digits', '1521', null, '一个四位数密码在等你 — 第一位 「云」的字数， 第二位 固定数字 5， 第三位 「鸟」的字数加一， 第四位 「鱼」的字数. 密码是什么？', true),
  ('zh', 3, 'letters', '山', null, '你在找一个 1 个字的词： 「我的顶峰碰到云」。是哪个词？', true),
  ('zh', 4, 'digits', '2221', null, '一个四位数密码在等你 — 第一位 「水」的字数加一， 第二位 「月亮」的字数， 第三位 「手」字数的两倍（只看个位）， 第四位 「面包」的字数减一. 密码是什么？', true),
  ('zh', 5, 'digits', '1253', null, '一个四位数密码在等你 — 第一位 「门」的字数， 第二位 「钥匙」的字数， 第三位 固定数字 5， 第四位 「星星」的字数加一. 密码是什么？', true),
  ('zh', 6, 'digits', '2121', null, '一个四位数密码在等你 — 第一位 「山」字数的两倍（只看个位）， 第二位 「海」的字数， 第三位 「门」的字数加一， 第四位 「钟」的字数. 密码是什么？', true),
  ('zh', 7, 'digits', '1127', null, '一个四位数密码在等你 — 第一位 「太阳」的字数减一， 第二位 「门」的字数， 第三位 「树」字数的两倍（只看个位）， 第四位 固定数字 7. 密码是什么？', true),
  ('zh', 8, 'letters', '树', null, '你在找一个 1 个字的词： 「我给大地遮阴」。是哪个词？', true),
  ('zh', 9, 'digits', '1317', null, '一个四位数密码在等你 — 第一位 「河」的字数， 第二位 「面包」的字数加一， 第三位 「鱼」的字数， 第四位 固定数字 7. 密码是什么？', true),
  ('zh', 10, 'letters', '书', null, '你在找一个 1 个字的词： 「我书页之间的智慧」。是哪个词？', true),
  ('zh', 11, 'digits', '4212', null, '一个四位数密码在等你 — 第一位 固定数字 4， 第二位 「面包」的字数， 第三位 「牛奶」的字数减一， 第四位 「星星」的字数. 密码是什么？', true),
  ('zh', 12, 'digits', '1431', null, '一个四位数密码在等你 — 第一位 「水」的字数， 第二位 「面包」字数的两倍（只看个位）， 第三位 「钥匙」的字数加一， 第四位 「房子」的字数减一. 密码是什么？', true),
  ('zh', 13, 'letters', '星星', null, '你在找一个 2 个字的词： 「我在夜空中闪烁」。是哪个词？', true),
  ('zh', 14, 'digits', '2122', null, '一个四位数密码在等你 — 第一位 「鱼」的字数加一， 第二位 「钥匙」的字数减一， 第三位 「月亮」的字数， 第四位 固定数字 2. 密码是什么？', true),
  ('zh', 15, 'digits', '2112', null, '一个四位数密码在等你 — 第一位 「钥匙」的字数， 第二位 「云」的字数， 第三位 「水」的字数， 第四位 「海」的字数加一. 密码是什么？', true),
  ('zh', 16, 'digits', '2111', null, '一个四位数密码在等你 — 第一位 「风」字数的两倍（只看个位）， 第二位 固定数字 1， 第三位 「手」的字数， 第四位 「太阳」的字数减一. 密码是什么？', true),
  ('zh', 17, 'digits', '1291', null, '一个四位数密码在等你 — 第一位 「树」的字数， 第二位 「钟」的字数加一， 第三位 固定数字 9， 第四位 「河」的字数. 密码是什么？', true),
  ('zh', 18, 'letters', '猫', null, '你在找一个 1 个字的词： 「家里安静的小动物」。是哪个词？', true),
  ('zh', 19, 'digits', '1412', null, '一个四位数密码在等你 — 第一位 「星星」的字数减一， 第二位 「牛奶」字数的两倍（只看个位）， 第三位 「火」的字数， 第四位 「山」的字数加一. 密码是什么？', true),
  ('zh', 20, 'digits', '7224', null, '一个四位数密码在等你 — 第一位 固定数字 7， 第二位 「房子」的字数， 第三位 「手」的字数加一， 第四位 「月亮」字数的两倍（只看个位）. 密码是什么？', true),
  ('zh', 21, 'digits', '1142', null, '一个四位数密码在等你 — 第一位 「火」的字数， 第二位 「太阳」的字数减一， 第三位 固定数字 4， 第四位 「鸟」的字数加一. 密码是什么？', true),
  ('zh', 22, 'digits', '2227', null, '一个四位数密码在等你 — 第一位 「河」的字数加一， 第二位 「星星」的字数， 第三位 「水」字数的两倍（只看个位）， 第四位 固定数字 7. 密码是什么？', true),
  ('zh', 23, 'letters', '风', null, '你在找一个 1 个字的词： 「我看不见地移动」。是哪个词？', true),
  ('zh', 24, 'digits', '1412', null, '一个四位数密码在等你 — 第一位 「风」的字数， 第二位 固定数字 4， 第三位 「房子」的字数减一， 第四位 「河」字数的两倍（只看个位）. 密码是什么？', true),
  ('zh', 25, 'digits', '2212', null, '一个四位数密码在等你 — 第一位 「水」字数的两倍（只看个位）， 第二位 「河」的字数加一， 第三位 「狗」的字数， 第四位 「面包」的字数. 密码是什么？', true),
  ('zh', 26, 'digits', '1114', null, '一个四位数密码在等你 — 第一位 「鸟」的字数， 第二位 「狗」的字数， 第三位 「牛奶」的字数减一， 第四位 固定数字 4. 密码是什么？', true),
  ('zh', 27, 'digits', '3481', null, '一个四位数密码在等你 — 第一位 「面包」的字数加一， 第二位 「牛奶」字数的两倍（只看个位）， 第三位 固定数字 8， 第四位 「狗」的字数. 密码是什么？', true),
  ('zh', 28, 'letters', '房子', null, '你在找一个 2 个字的词： 「人的住所」。是哪个词？', true),
  ('zh', 29, 'digits', '2211', null, '一个四位数密码在等你 — 第一位 「星星」的字数， 第二位 「云」的字数加一， 第三位 「房子」的字数减一， 第四位 「鸟」的字数. 密码是什么？', true),
  ('zh', 30, 'digits', '2222', null, '一个四位数密码在等你 — 第一位 固定数字 2， 第二位 「月亮」的字数， 第三位 「鸟」字数的两倍（只看个位）， 第四位 「风」的字数加一. 密码是什么？', true)
on conflict (locale, level) do update set
  answer_type = excluded.answer_type,
  answer_code = excluded.answer_code,
  answer_key = excluded.answer_key,
  prompt = excluded.prompt,
  active = true;


-- Single-player: overlay the locale row onto the base puzzle row.
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

revoke execute on function public.submit_single_answer_localized(public.difficulty, smallint, text, text, integer, integer) from public, anon;
grant execute on function public.submit_single_answer_localized(public.difficulty, smallint, text, text, integer, integer) to authenticated;
revoke execute on function public.submit_multiplayer_answer_localized(uuid, text, text) from public, anon;
grant execute on function public.submit_multiplayer_answer_localized(uuid, text, text) to authenticated;

-- Multiplayer: each player's answer is validated against their own locale.
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
