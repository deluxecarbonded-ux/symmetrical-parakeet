import { notificationOverrides } from "./notificationOverrides.js";

const titles = {
  en: {
    "achievement.single.first_crack.title": "First crack",
    "achievement.single.level_hunter.title": "Level hunter",
    "achievement.single.all_difficulties.title": "Full spectrum",
    "achievement.single.sharp_shooter.title": "Sharp shooter",
    "achievement.single.speed_runner.title": "Speed runner",
    "achievement.single.collector.title": "Signal collector",
    "achievement.single.rich.title": "Code investor",
    "achievement.multi.first_duel.title": "First duel",
    "achievement.multi.first_win.title": "First victory",
    "achievement.multi.duel_regular.title": "Duel regular",
    "achievement.multi.champion.title": "Duel champion",
    "achievement.multi.code_crack.title": "Code breaker",
    "achievement.multi.collector.title": "Duel collector",
  },
  ar: {
    "achievement.single.first_crack.title": "أول كسر",
    "achievement.single.level_hunter.title": "صياد المستويات",
    "achievement.single.all_difficulties.title": "طيف كامل",
    "achievement.single.sharp_shooter.title": "دقة عالية",
    "achievement.single.speed_runner.title": "عدّاء السرعة",
    "achievement.single.collector.title": "جامع الإشارات",
    "achievement.single.rich.title": "مستثمر الأكواد",
    "achievement.multi.first_duel.title": "أول مبارزة",
    "achievement.multi.first_win.title": "أول فوز",
    "achievement.multi.duel_regular.title": "محترف المبارزات",
    "achievement.multi.champion.title": "بطل المبارزات",
    "achievement.multi.code_crack.title": "كاسر الأكواد",
    "achievement.multi.collector.title": "جامع المبارزات",
  },
  fr: {
    "achievement.single.first_crack.title": "Premier code brisé",
    "achievement.single.level_hunter.title": "Chasseur de niveaux",
    "achievement.single.all_difficulties.title": "Spectre complet",
    "achievement.single.sharp_shooter.title": "Tireur précis",
    "achievement.single.speed_runner.title": "Coureur rapide",
    "achievement.single.collector.title": "Collecteur de signaux",
    "achievement.single.rich.title": "Investisseur de codes",
    "achievement.multi.first_duel.title": "Premier duel",
    "achievement.multi.first_win.title": "Première victoire",
    "achievement.multi.duel_regular.title": "Habitué des duels",
    "achievement.multi.champion.title": "Champion des duels",
    "achievement.multi.code_crack.title": "Casseur de codes",
    "achievement.multi.collector.title": "Collecteur de duels",
  },
  es: {
    "achievement.single.first_crack.title": "Primer código roto",
    "achievement.single.level_hunter.title": "Cazador de niveles",
    "achievement.single.all_difficulties.title": "Espectro completo",
    "achievement.single.sharp_shooter.title": "Tirador certero",
    "achievement.single.speed_runner.title": "Corredor veloz",
    "achievement.single.collector.title": "Coleccionista de señales",
    "achievement.single.rich.title": "Inversor de códigos",
    "achievement.multi.first_duel.title": "Primer duelo",
    "achievement.multi.first_win.title": "Primera victoria",
    "achievement.multi.duel_regular.title": "Habitual de duelos",
    "achievement.multi.champion.title": "Campeón de duelos",
    "achievement.multi.code_crack.title": "Rompecódigos",
    "achievement.multi.collector.title": "Coleccionista de duelos",
  },
  de: {
    "achievement.single.first_crack.title": "Erster geknackter Code",
    "achievement.single.level_hunter.title": "Leveljäger",
    "achievement.single.all_difficulties.title": "Volles Spektrum",
    "achievement.single.sharp_shooter.title": "Scharfschütze",
    "achievement.single.speed_runner.title": "Speedrunner",
    "achievement.single.collector.title": "Signalsammler",
    "achievement.single.rich.title": "Code-Investor",
    "achievement.multi.first_duel.title": "Erstes Duell",
    "achievement.multi.first_win.title": "Erster Sieg",
    "achievement.multi.duel_regular.title": "Duell-Veteran",
    "achievement.multi.champion.title": "Duellchampion",
    "achievement.multi.code_crack.title": "Codeknacker",
    "achievement.multi.collector.title": "Duell-Sammler",
  },
  pt: {
    "achievement.single.first_crack.title": "Primeiro código quebrado",
    "achievement.single.level_hunter.title": "Caçador de níveis",
    "achievement.single.all_difficulties.title": "Espectro completo",
    "achievement.single.sharp_shooter.title": "Atirador preciso",
    "achievement.single.speed_runner.title": "Corredor veloz",
    "achievement.single.collector.title": "Colecionador de sinais",
    "achievement.single.rich.title": "Investidor de códigos",
    "achievement.multi.first_duel.title": "Primeiro duelo",
    "achievement.multi.first_win.title": "Primeira vitória",
    "achievement.multi.duel_regular.title": "Habitual de duelos",
    "achievement.multi.champion.title": "Campeão de duelos",
    "achievement.multi.code_crack.title": "Quebra-códigos",
    "achievement.multi.collector.title": "Colecionador de duelos",
  },
  it: {
    "achievement.single.first_crack.title": "Primo codice spezzato",
    "achievement.single.level_hunter.title": "Caccia-livelli",
    "achievement.single.all_difficulties.title": "Spettro completo",
    "achievement.single.sharp_shooter.title": "Tiratore preciso",
    "achievement.single.speed_runner.title": "Corridore veloce",
    "achievement.single.collector.title": "Collezionista di segnali",
    "achievement.single.rich.title": "Investitore di codici",
    "achievement.multi.first_duel.title": "Primo duello",
    "achievement.multi.first_win.title": "Prima vittoria",
    "achievement.multi.duel_regular.title": "Veterano dei duelli",
    "achievement.multi.champion.title": "Campione dei duelli",
    "achievement.multi.code_crack.title": "Spezzacodici",
    "achievement.multi.collector.title": "Collezionista di duelli",
  },
  nl: {
    "achievement.single.first_crack.title": "Eerste gekraakte code",
    "achievement.single.level_hunter.title": "Niveaujager",
    "achievement.single.all_difficulties.title": "Volledig spectrum",
    "achievement.single.sharp_shooter.title": "Scherpschutter",
    "achievement.single.speed_runner.title": "Snelheidsloper",
    "achievement.single.collector.title": "Signaalverzamelaar",
    "achievement.single.rich.title": "Code-investeerder",
    "achievement.multi.first_duel.title": "Eerste duel",
    "achievement.multi.first_win.title": "Eerste overwinning",
    "achievement.multi.duel_regular.title": "Duelveteraan",
    "achievement.multi.champion.title": "Duelkampioen",
    "achievement.multi.code_crack.title": "Codekraker",
    "achievement.multi.collector.title": "Duelverzamelaar",
  },
  ru: {
    "achievement.single.first_crack.title": "Первый взломанный код",
    "achievement.single.level_hunter.title": "Охотник за уровнями",
    "achievement.single.all_difficulties.title": "Полный спектр",
    "achievement.single.sharp_shooter.title": "Меткий стрелок",
    "achievement.single.speed_runner.title": "Спидраннер",
    "achievement.single.collector.title": "Сборщик сигналов",
    "achievement.single.rich.title": "Инвестор кодов",
    "achievement.multi.first_duel.title": "Первая дуэль",
    "achievement.multi.first_win.title": "Первая победа",
    "achievement.multi.duel_regular.title": "Ветеран дуэлей",
    "achievement.multi.champion.title": "Чемпион дуэлей",
    "achievement.multi.code_crack.title": "Взломщик кодов",
    "achievement.multi.collector.title": "Сборщик дуэлей",
  },
  tr: {
    "achievement.single.first_crack.title": "İlk kırılan kod",
    "achievement.single.level_hunter.title": "Level avcısı",
    "achievement.single.all_difficulties.title": "Tam spektrum",
    "achievement.single.sharp_shooter.title": "Keskin nişancı",
    "achievement.single.speed_runner.title": "Hız koşucusu",
    "achievement.single.collector.title": "Sinyal toplayıcı",
    "achievement.single.rich.title": "Kod yatırımcısı",
    "achievement.multi.first_duel.title": "İlk düello",
    "achievement.multi.first_win.title": "İlk zafer",
    "achievement.multi.duel_regular.title": "Düello düzenlisi",
    "achievement.multi.champion.title": "Düello şampiyonu",
    "achievement.multi.code_crack.title": "Kod kırıcı",
    "achievement.multi.collector.title": "Düello toplayıcı",
  },
  ja: {
    "achievement.single.first_crack.title": "初コード解除",
    "achievement.single.level_hunter.title": "レベルハンター",
    "achievement.single.all_difficulties.title": "フルスペクトラム",
    "achievement.single.sharp_shooter.title": "シャープシューター",
    "achievement.single.speed_runner.title": "スピードランナー",
    "achievement.single.collector.title": "シグナルコレクター",
    "achievement.single.rich.title": "コード投資家",
    "achievement.multi.first_duel.title": "初バトル",
    "achievement.multi.first_win.title": "初勝利",
    "achievement.multi.duel_regular.title": "バトル熟練者",
    "achievement.multi.champion.title": "バトルチャンピオン",
    "achievement.multi.code_crack.title": "コードクラッカー",
    "achievement.multi.collector.title": "バトルコレクター",
  },
  ko: {
    "achievement.single.first_crack.title": "첫 코드 해독",
    "achievement.single.level_hunter.title": "레벨 헌터",
    "achievement.single.all_difficulties.title": "풀 스펙트럼",
    "achievement.single.sharp_shooter.title": "명중수",
    "achievement.single.speed_runner.title": "스피드 러너",
    "achievement.single.collector.title": "신호 수집가",
    "achievement.single.rich.title": "코드 투자자",
    "achievement.multi.first_duel.title": "첫 결투",
    "achievement.multi.first_win.title": "첫 승리",
    "achievement.multi.duel_regular.title": "결투 전문가",
    "achievement.multi.champion.title": "결투 챔피언",
    "achievement.multi.code_crack.title": "코드 해독자",
    "achievement.multi.collector.title": "결투 수집가",
  },
  zh: {
    "achievement.single.first_crack.title": "首次破译",
    "achievement.single.level_hunter.title": "关卡猎人",
    "achievement.single.all_difficulties.title": "全难度通关",
    "achievement.single.sharp_shooter.title": "神准射手",
    "achievement.single.speed_runner.title": "极速挑战者",
    "achievement.single.collector.title": "信号收藏家",
    "achievement.single.rich.title": "代码投资者",
    "achievement.multi.first_duel.title": "首次对决",
    "achievement.multi.first_win.title": "首次胜利",
    "achievement.multi.duel_regular.title": "对决常客",
    "achievement.multi.champion.title": "对决冠军",
    "achievement.multi.code_crack.title": "破码高手",
    "achievement.multi.collector.title": "对决收藏家",
  },
  hi: {
    "achievement.single.first_crack.title": "पहला कोड तोड़ा",
    "achievement.single.level_hunter.title": "लेवल शिकारी",
    "achievement.single.all_difficulties.title": "पूर्ण स्पेक्ट्रम",
    "achievement.single.sharp_shooter.title": "निशाना सच्चा",
    "achievement.single.speed_runner.title": "स्पीड रनर",
    "achievement.single.collector.title": "सिग्नल संग्राहक",
    "achievement.single.rich.title": "कोड निवेशक",
    "achievement.multi.first_duel.title": "पहली द्वंद्ववी",
    "achievement.multi.first_win.title": "पहली जीत",
    "achievement.multi.duel_regular.title": "द्वंद्ववी नियमित",
    "achievement.multi.champion.title": "द्वंद्ववी चैंपियन",
    "achievement.multi.code_crack.title": "कोड तोड़ने वाला",
    "achievement.multi.collector.title": "द्वंद्व संग्राहक",
  },
  id: {
    "achievement.single.first_crack.title": "Kode pertama terpecahkan",
    "achievement.single.level_hunter.title": "Pemburu level",
    "achievement.single.all_difficulties.title": "Spektrum lengkap",
    "achievement.single.sharp_shooter.title": "Penembak tajam",
    "achievement.single.speed_runner.title": "Pelari cepat",
    "achievement.single.collector.title": "Pengoleksi sinyal",
    "achievement.single.rich.title": "Investor kode",
    "achievement.multi.first_duel.title": "Duel pertama",
    "achievement.multi.first_win.title": "Kemenangan pertama",
    "achievement.multi.duel_regular.title": "Pemb-Regular duel",
    "achievement.multi.champion.title": "Juara duel",
    "achievement.multi.code_crack.title": "Pemecah kode",
    "achievement.multi.collector.title": "Pengoleksi duel",
  },
  ur: {
    "achievement.single.first_crack.title": "پہلا کوڈ توڑا",
    "achievement.single.level_hunter.title": "لیول شکاری",
    "achievement.single.all_difficulties.title": "مکمل سپیکٹرام",
    "achievement.single.sharp_shooter.title": "تیز نشانہ",
    "achievement.single.speed_runner.title": "رفتار رَنر",
    "achievement.single.collector.title": "سگنل جمع کرنے والا",
    "achievement.single.rich.title": "کوڈ سرمایہ کار",
    "achievement.multi.first_duel.title": "پہلی دوائل",
    "achievement.multi.first_win.title": "پہلی فتح",
    "achievement.multi.duel_regular.title": "باقاعدہ دوائلر",
    "achievement.multi.champion.title": "دوائل چیمپئن",
    "achievement.multi.code_crack.title": "کوڈ توڑنے والا",
    "achievement.multi.collector.title": "دوائل جمع کرنے والا",
  },
};

const common = {
  en: {
    "nav.achievements": "Achievements",
    "nav.leaderboard": "Leaderboard",
    "profile.username": "Username",
    "profile.editUsername": "Edit username",
    "profile.usernameInvalid": "Use 3–24 characters without spaces.",
    "profile.usernameTaken": "That username is already taken.",
    "profile.media": "Profile picture",
    "profile.mediaHint": "Upload an image or a short video. Video avatars start muted so they never interrupt play.",
    "profile.mediaUpload": "Upload picture",
    "profile.mediaReplace": "Replace picture",
    "profile.mediaInvalid": "Choose an image or video under 25 MB.",
    "profile.mediaUploadFailed": "The picture could not be uploaded.",
    "profile.mediaUpdated": "Profile picture updated.",
    "profile.avatarVideo": "Profile video",
    "profile.muteAvatar": "Mute avatar video",
    "profile.unmuteAvatar": "Unmute avatar video",
    "achievements.title": "Achievements",
    "achievements.subtitle": "Every unlock is backed by your real play record.",
    "achievements.progress": "Progress",
    "achievements.unlocked": "Unlocked",
    "achievements.locked": "In progress",
    "achievements.empty": "Play a round to start unlocking achievements.",
    "achievements.loading": "Reading your record…",
    "achievements.you": "You",
    "achievements.description": "A real gameplay milestone from your record.",
    "leaderboard.title": "Leaderboard",
    "leaderboard.subtitle": "Live rankings from the accounts that actually played.",
    "leaderboard.rank": "Rank",
    "leaderboard.player": "Player",
    "leaderboard.metric": "Rank by",
    "leaderboard.empty": "No ranked records yet. Be the first to play.",
    "leaderboard.loading": "Reading the rankings…",
    "leaderboard.you": "You",
    "leaderboard.score": "Score",
    "leaderboard.codes": "Codes",
    "leaderboard.levels": "Levels",
    "leaderboard.accuracy": "Accuracy",
    "leaderboard.wins": "Wins",
    "leaderboard.matches": "Matches",
    "leaderboard.winRate": "Win rate",
  },
  ar: {
    "nav.achievements": "الإنجازات", "nav.leaderboard": "لوحة المتصدرين", "profile.username": "اسم المستخدم", "profile.editUsername": "تعديل اسم المستخدم", "profile.usernameInvalid": "استخدم من 3 إلى 24 حرفاً بدون مساحات.", "profile.usernameTaken": "اسم المستخدم مستخدم بالفعل.", "profile.media": "صورة الملف الشخصي", "profile.mediaHint": "ارفع صورة أو فيديو قصيراً. تبدأ فيديوهات الملف الشخصي صامتة حتى لا تقطع اللعب.", "profile.mediaUpload": "رفع صورة", "profile.mediaReplace": "استبدال الصورة", "profile.mediaInvalid": "اختر صورة أو فيديو أقل من 25 ميغابايت.", "profile.mediaUploadFailed": "تعذر رفع الصورة.", "profile.mediaUpdated": "تم تحديث صورة الملف الشخصي.", "profile.avatarVideo": "فيديو الملف الشخصي", "profile.muteAvatar": "كتم فيديو الصورة الرمزية", "profile.unmuteAvatar": "تشغيل صوت فيديو الصورة الرمزية", "achievements.title": "الإنجازات", "achievements.subtitle": "كل إنجاز مدعوم بسجل لعبك الحقيقي.", "achievements.progress": "التقدم", "achievements.unlocked": "مفتوح", "achievements.locked": "قيد التقدم", "achievements.empty": "العب جولة لبدء فتح الإنجازات.", "achievements.loading": "جارٍ قراءة سجلك…", "achievements.you": "أنت", "achievements.description": "معلم لعب حقيقي من سجلك.", "leaderboard.title": "لوحة المتصدرين", "leaderboard.subtitle": "ترتيب مباشر من الحسابات التي لعبت فعلاً.", "leaderboard.rank": "الترتيب", "leaderboard.player": "اللاعب", "leaderboard.metric": "الترتيب حسب", "leaderboard.empty": "لا توجد سجلات بعد. كن أول من يلعب.", "leaderboard.loading": "جارٍ قراءة الترتيب…", "leaderboard.you": "أنت", "leaderboard.score": "النقاط", "leaderboard.codes": "الأكواد", "leaderboard.levels": "المستويات", "leaderboard.accuracy": "الدقة", "leaderboard.wins": "الانتصارات", "leaderboard.matches": "المباريات", "leaderboard.winRate": "نسبة الفوز",
  },
  fr: {
    "nav.achievements": "Succès", "nav.leaderboard": "Classement", "profile.username": "Nom d'utilisateur", "profile.editUsername": "Modifier le nom d'utilisateur", "profile.usernameInvalid": "Utilisez 3 à 24 caractères sans espaces.", "profile.usernameTaken": "Ce nom d'utilisateur est déjà pris.", "profile.media": "Photo de profil", "profile.mediaHint": "Ajoutez une image ou une courte vidéo. Les vidéos démarre en sourdine.", "profile.mediaUpload": "Ajouter une photo", "profile.mediaReplace": "Remplacer la photo", "profile.mediaInvalid": "Choisissez une image ou vidéo de moins de 25 Mo.", "profile.mediaUploadFailed": "La photo n'a pas pu être envoyée.", "profile.mediaUpdated": "Photo de profil mise à jour.", "profile.avatarVideo": "Vidéo de profil", "profile.muteAvatar": "Couper le son de la vidéo", "profile.unmuteAvatar": "Activer le son de la vidéo", "achievements.title": "Succès", "achievements.subtitle": "Chaque succès repose sur vos vraies parties.", "achievements.progress": "Progression", "achievements.unlocked": "Débloqué", "achievements.locked": "En cours", "achievements.empty": "Jouez une manche pour débloquer des succès.", "achievements.loading": "Lecture de votre record…", "achievements.you": "Vous", "achievements.description": "Un objectif de jeu réel basé sur votre record.", "leaderboard.title": "Classement", "leaderboard.subtitle": "Classement en direct des comptes ayant réellement joué.", "leaderboard.rank": "Rang", "leaderboard.player": "Joueur", "leaderboard.metric": "Classer par", "leaderboard.empty": "Aucun classement pour le moment.", "leaderboard.loading": "Lecture du classement…", "leaderboard.you": "Vous", "leaderboard.score": "Score", "leaderboard.codes": "Codes", "leaderboard.levels": "Niveaux", "leaderboard.accuracy": "Précision", "leaderboard.wins": "Victoires", "leaderboard.matches": "Parties", "leaderboard.winRate": "Taux de victoire",
  },
  es: {
    "nav.achievements": "Logros", "nav.leaderboard": "Clasificación", "profile.username": "Nombre de usuario", "profile.editUsername": "Editar nombre de usuario", "profile.usernameInvalid": "Usa entre 3 y 24 caracteres sin espacios.", "profile.usernameTaken": "Ese nombre de usuario ya está en uso.", "profile.media": "Foto de perfil", "profile.mediaHint": "Sube una imagen o un vídeo corto. Los vídeos comienzan silenciados.", "profile.mediaUpload": "Subir foto", "profile.mediaReplace": "Reemplazar foto", "profile.mediaInvalid": "Elige una imagen o vídeo de menos de 25 MB.", "profile.mediaUploadFailed": "No se pudo subir la foto.", "profile.mediaUpdated": "Foto de perfil actualizada.", "profile.avatarVideo": "Vídeo de perfil", "profile.muteAvatar": "Silenciar vídeo", "profile.unmuteAvatar": "Activar sonido del vídeo", "achievements.title": "Logros", "achievements.subtitle": "Cada desbloqueo se basa en tus partidas reales.", "achievements.progress": "Progreso", "achievements.unlocked": "Desbloqueado", "achievements.locked": "En progreso", "achievements.empty": "Juega una ronda para desbloquear logros.", "achievements.loading": "Leyendo tu récord…", "achievements.you": "Tú", "achievements.description": "Un hito real de juego basado en tu récord.", "leaderboard.title": "Clasificación", "leaderboard.subtitle": "Clasificación en vivo de quienes realmente han jugado.", "leaderboard.rank": "Puesto", "leaderboard.player": "Jugador", "leaderboard.metric": "Ordenar por", "leaderboard.empty": "Aún no hay registros. Juega primero.", "leaderboard.loading": "Leyendo la clasificación…", "leaderboard.you": "Tú", "leaderboard.score": "Puntos", "leaderboard.codes": "Códigos", "leaderboard.levels": "Niveles", "leaderboard.accuracy": "Precisión", "leaderboard.wins": "Victorias", "leaderboard.matches": "Partidas", "leaderboard.winRate": "Tasa de victoria",
  },
  de: {
    "nav.achievements": "Erfolge", "nav.leaderboard": "Bestenliste", "profile.username": "Benutzername", "profile.editUsername": "Benutzernamen bearbeiten", "profile.usernameInvalid": "Verwende 3–24 Zeichen ohne Leerzeichen.", "profile.usernameTaken": "Dieser Benutzername ist bereits vergeben.", "profile.media": "Profilbild", "profile.mediaHint": "Lade ein Bild oder kurzes Video hoch. Videos starten stummgeschaltet.", "profile.mediaUpload": "Bild hochladen", "profile.mediaReplace": "Bild ersetzen", "profile.mediaInvalid": "Wähle ein Bild oder Video unter 25 MB.", "profile.mediaUploadFailed": "Das Bild konnte nicht hochgeladen werden.", "profile.mediaUpdated": "Profilbild aktualisiert.", "profile.avatarVideo": "Profilvideo", "profile.muteAvatar": "Video stummschalten", "profile.unmuteAvatar": "Video-Ton einschalten", "achievements.title": "Erfolge", "achievements.subtitle": "Jede Freischaltung basiert auf deinem echten Spielverlauf.", "achievements.progress": "Fortschritt", "achievements.unlocked": "Freigeschaltet", "achievements.locked": "In Arbeit", "achievements.empty": "Spiele eine Runde, um Erfolge freizuschalten.", "achievements.loading": "Spielverlauf wird gelesen…", "achievements.you": "Du", "achievements.description": "Ein echtes Spielziel aus deinem Verlauf.", "leaderboard.title": "Bestenliste", "leaderboard.subtitle": "Live-Rangliste der wirklich spielenden Konten.", "leaderboard.rank": "Platz", "leaderboard.player": "Spieler", "leaderboard.metric": "Sortieren nach", "leaderboard.empty": "Noch keine Rangliste.", "leaderboard.loading": "Rangliste wird gelesen…", "leaderboard.you": "Du", "leaderboard.score": "Punkte", "leaderboard.codes": "Codes", "leaderboard.levels": "Level", "leaderboard.accuracy": "Genauigkeit", "leaderboard.wins": "Siege", "leaderboard.matches": "Spiele", "leaderboard.winRate": "Siegquote",
  },
  pt: {
    "nav.achievements": "Conquistas", "nav.leaderboard": "Ranking", "profile.username": "Nome de usuário", "profile.editUsername": "Editar nome de usuário", "profile.usernameInvalid": "Use 3–24 caracteres sem espaços.", "profile.usernameTaken": "Esse nome de usuário já está em uso.", "profile.media": "Foto de perfil", "profile.mediaHint": "Envie uma imagem ou vídeo curto. Vídeos começam sem som.", "profile.mediaUpload": "Enviar foto", "profile.mediaReplace": "Substituir foto", "profile.mediaInvalid": "Escolha uma imagem ou vídeo com menos de 25 MB.", "profile.mediaUploadFailed": "Não foi possível enviar a foto.", "profile.mediaUpdated": "Foto de perfil atualizada.", "profile.avatarVideo": "Vídeo de perfil", "profile.muteAvatar": "Silenciar vídeo", "profile.unmuteAvatar": "Ativar som do vídeo", "achievements.title": "Conquistas", "achievements.subtitle": "Cada desbloqueio vem do seu histórico real.", "achievements.progress": "Progresso", "achievements.unlocked": "Desbloqueado", "achievements.locked": "Em andamento", "achievements.empty": "Jogue uma rodada para desbloquear conquistas.", "achievements.loading": "Lendo seu histórico…", "achievements.you": "Você", "achievements.description": "Uma marca real de jogo do seu histórico.", "leaderboard.title": "Ranking", "leaderboard.subtitle": "Classificação ao vivo de quem realmente jogou.", "leaderboard.rank": "Posição", "leaderboard.player": "Jogador", "leaderboard.metric": "Classificar por", "leaderboard.empty": "Ainda não há registros.", "leaderboard.loading": "Lendo o ranking…", "leaderboard.you": "Você", "leaderboard.score": "Pontos", "leaderboard.codes": "Códigos", "leaderboard.levels": "Níveis", "leaderboard.accuracy": "Precisão", "leaderboard.wins": "Vitórias", "leaderboard.matches": "Partidas", "leaderboard.winRate": "Taxa de vitórias",
  },
  it: {
    "nav.achievements": "Obiettivi", "nav.leaderboard": "Classifica", "profile.username": "Nome utente", "profile.editUsername": "Modifica nome utente", "profile.usernameInvalid": "Usa da 3 a 24 caratteri senza spazi.", "profile.usernameTaken": "Questo nome utente è già in uso.", "profile.media": "Foto del profilo", "profile.mediaHint": "Carica un'immagine o un breve video. I video partono muti.", "profile.mediaUpload": "Carica foto", "profile.mediaReplace": "Sostituisci foto", "profile.mediaInvalid": "Scegli un'immagine o video sotto 25 MB.", "profile.mediaUploadFailed": "Caricamento foto non riuscito.", "profile.mediaUpdated": "Foto del profilo aggiornata.", "profile.avatarVideo": "Video del profilo", "profile.muteAvatar": "Disattiva audio video", "profile.unmuteAvatar": "Attiva audio video", "achievements.title": "Obiettivi", "achievements.subtitle": "Ogni sblocco deriva dalle tue partite reali.", "achievements.progress": "Progresso", "achievements.unlocked": "Sbloccato", "achievements.locked": "In corso", "achievements.empty": "Gioca un round per sbloccare obiettivi.", "achievements.loading": "Lettura del record…", "achievements.you": "Tu", "achievements.description": "Traguardo reale basato sul tuo record.", "leaderboard.title": "Classifica", "leaderboard.subtitle": "Classifica live di chi ha davvero giocato.", "leaderboard.rank": "Posizione", "leaderboard.player": "Giocatore", "leaderboard.metric": "Ordina per", "leaderboard.empty": "Ancora nessun record in classifica.", "leaderboard.loading": "Lettura della classifica…", "leaderboard.you": "Tu", "leaderboard.score": "Punteggio", "leaderboard.codes": "Codici", "leaderboard.levels": "Livelli", "leaderboard.accuracy": "Precisione", "leaderboard.wins": "Vittorie", "leaderboard.matches": "Partite", "leaderboard.winRate": "Tasso di vittoria",
  },
  nl: {
    "nav.achievements": "Prestaties", "nav.leaderboard": "Ranglijst", "profile.username": "Gebruikersnaam", "profile.editUsername": "Gebruikersnaam bewerken", "profile.usernameInvalid": "Gebruik 3–24 tekens zonder spaties.", "profile.usernameTaken": "Deze gebruikersnaam is al in gebruik.", "profile.media": "Profielfoto", "profile.mediaHint": "Upload een afbeelding of korte video. Video's starten gedempt.", "profile.mediaUpload": "Foto uploaden", "profile.mediaReplace": "Foto vervangen", "profile.mediaInvalid": "Kies een afbeelding of video onder 25 MB.", "profile.mediaUploadFailed": "De foto kon niet worden geüpload.", "profile.mediaUpdated": "Profielfoto bijgewerkt.", "profile.avatarVideo": "Profielvideo", "profile.muteAvatar": "Video dempen", "profile.unmuteAvatar": "Video geluid aanzetten", "achievements.title": "Prestaties", "achievements.subtitle": "Elke ontgrendeling komt uit je echte speelrecord.", "achievements.progress": "Voortgang", "achievements.unlocked": "Ontgrendeld", "achievements.locked": "Bezig", "achievements.empty": "Speel een ronde om prestaties te ontgrendelen.", "achievements.loading": "Je record wordt gelezen…", "achievements.you": "Jij", "achievements.description": "Een echte spelmijlpaal uit je record.", "leaderboard.title": "Ranglijst", "leaderboard.subtitle": "Live-ranglijst van accounts die echt speelden.", "leaderboard.rank": "Rang", "leaderboard.player": "Speler", "leaderboard.metric": "Rangschikken op", "leaderboard.empty": "Nog geen ranglijst.", "leaderboard.loading": "Ranglijst wordt gelezen…", "leaderboard.you": "Jij", "leaderboard.score": "Score", "leaderboard.codes": "Codes", "leaderboard.levels": "Levels", "leaderboard.accuracy": "Nauwkeurigheid", "leaderboard.wins": "Overwinningen", "leaderboard.matches": "Partijen", "leaderboard.winRate": "Winstpercentage",
  },
  ru: {
    "nav.achievements": "Достижения", "nav.leaderboard": "Таблица лидеров", "profile.username": "Имя пользователя", "profile.editUsername": "Изменить имя", "profile.usernameInvalid": "Используйте 3–24 символа без пробелов.", "profile.usernameTaken": "Это имя уже занято.", "profile.media": "Фото профиля", "profile.mediaHint": "Загрузите изображение или короткое видео. Видео начинается без звука.", "profile.mediaUpload": "Загрузить фото", "profile.mediaReplace": "Заменить фото", "profile.mediaInvalid": "Выберите изображение или видео до 25 МБ.", "profile.mediaUploadFailed": "Не удалось загрузить фото.", "profile.mediaUpdated": "Фото профиля обновлено.", "profile.avatarVideo": "Видео профиля", "profile.muteAvatar": "Выключить звук видео", "profile.unmuteAvatar": "Включить звук видео", "achievements.title": "Достижения", "achievements.subtitle": "Каждое достижение основано на вашей реальной игре.", "achievements.progress": "Прогресс", "achievements.unlocked": "Открыто", "achievements.locked": "В процессе", "achievements.empty": "Сыграйте раунд, чтобы открыть достижения.", "achievements.loading": "Читаем ваш рекорд…", "achievements.you": "Вы", "achievements.description": "Реальная игровая веха из вашего рекорда.", "leaderboard.title": "Таблица лидеров", "leaderboard.subtitle": "Рейтинг тех, кто действительно играл.", "leaderboard.rank": "Место", "leaderboard.player": "Игрок", "leaderboard.metric": "Сортировать по", "leaderboard.empty": "Рейтингов пока нет.", "leaderboard.loading": "Читаем рейтинг…", "leaderboard.you": "Вы", "leaderboard.score": "Очки", "leaderboard.codes": "Коды", "leaderboard.levels": "Уровни", "leaderboard.accuracy": "Точность", "leaderboard.wins": "Победы", "leaderboard.matches": "Матчи", "leaderboard.winRate": "Процент побед",
  },
  tr: {
    "nav.achievements": "Başarımlar", "nav.leaderboard": "Liderlik tablosu", "profile.username": "Kullanıcı adı", "profile.editUsername": "Kullanıcı adını düzenle", "profile.usernameInvalid": "Boşluk olmadan 3–24 karakter kullanın.", "profile.usernameTaken": "Bu kullanıcı adı alınmış.", "profile.media": "Profil resmi", "profile.mediaHint": "Bir görsel veya kısa video yükleyin. Videolar sessiz başlar.", "profile.mediaUpload": "Resim yükle", "profile.mediaReplace": "Resmi değiştir", "profile.mediaInvalid": "25 MB'tan küçük bir görsel veya video seçin.", "profile.mediaUploadFailed": "Resim yüklenemedi.", "profile.mediaUpdated": "Profil resmi güncellendi.", "profile.avatarVideo": "Profil videosu", "profile.muteAvatar": "Videoyu sessize al", "profile.unmuteAvatar": "Video sesini aç", "achievements.title": "Başarımlar", "achievements.subtitle": "Her açılış gerçek oyun kaydından gelir.", "achievements.progress": "İlerleme", "achievements.unlocked": "Açıldı", "achievements.locked": "Devam ediyor", "achievements.empty": "Başarım açmak için bir tur oyna.", "achievements.loading": "Kaydın okunuyor…", "achievements.you": "Sen", "achievements.description": "Kaydındaki gerçek bir oyun başarımı.", "leaderboard.title": "Liderlik tablosu", "leaderboard.subtitle": "Gerçekten oynayan hesapların canlı sıralaması.", "leaderboard.rank": "Sıra", "leaderboard.player": "Oyuncu", "leaderboard.metric": "Sıralama ölçütü", "leaderboard.empty": "Henüz sıralama kaydı yok.", "leaderboard.loading": "Sıralama okunuyor…", "leaderboard.you": "Sen", "leaderboard.score": "Skor", "leaderboard.codes": "Kodlar", "leaderboard.levels": "Seviyeler", "leaderboard.accuracy": "İsabet", "leaderboard.wins": "Zaferler", "leaderboard.matches": "Maçlar", "leaderboard.winRate": "Zafer oranı",
  },
  ja: {
    "nav.achievements": "実績", "nav.leaderboard": "ランキング", "profile.username": "ユーザー名", "profile.editUsername": "ユーザー名を編集", "profile.usernameInvalid": "空白なしで3〜24文字を使用してください。", "profile.usernameTaken": "そのユーザー名は使用済みです。", "profile.media": "プロフィール画像", "profile.mediaHint": "画像または短い動画をアップロードできます。動画は無音で始まります。", "profile.mediaUpload": "画像をアップロード", "profile.mediaReplace": "画像を交換", "profile.mediaInvalid": "25MB未満の画像または動画を選んでください。", "profile.mediaUploadFailed": "画像をアップロードできませんでした。", "profile.mediaUpdated": "プロフィール画像を更新しました。", "profile.avatarVideo": "プロフィール動画", "profile.muteAvatar": "動画の音を消す", "profile.unmuteAvatar": "動画音をオン", "achievements.title": "実績", "achievements.subtitle": "実績は実際のプレイ記録から解放されます。", "achievements.progress": "進捗", "achievements.unlocked": "解除済み", "achievements.locked": "進行中", "achievements.empty": "ラウンドをプレイして実績を解除しよう。", "achievements.loading": "記録を読み込み中…", "achievements.you": "あなた", "achievements.description": "記録に基づく実際のゲームマイルストーン。", "leaderboard.title": "ランキング", "leaderboard.subtitle": "実際にプレイしたアカウントのライブ順位。", "leaderboard.rank": "順位", "leaderboard.player": "プレイヤー", "leaderboard.metric": "並び替え", "leaderboard.empty": "まだランキングがありません。", "leaderboard.loading": "ランキングを読み込み中…", "leaderboard.you": "あなた", "leaderboard.score": "スコア", "leaderboard.codes": "コード", "leaderboard.levels": "レベル", "leaderboard.accuracy": "精度", "leaderboard.wins": "勝利", "leaderboard.matches": "試合", "leaderboard.winRate": "勝率",
  },
  ko: {
    "nav.achievements": "업적", "nav.leaderboard": "순위표", "profile.username": "사용자 이름", "profile.editUsername": "사용자 이름 편집", "profile.usernameInvalid": "공백 없이 3~24자를 사용하세요.", "profile.usernameTaken": "이미 사용 중인 사용자 이름입니다.", "profile.media": "프로필 사진", "profile.mediaHint": "이미지나 짧은 동영상을 업로드하세요. 동영상은 음소거로 시작합니다.", "profile.mediaUpload": "사진 업로드", "profile.mediaReplace": "사진 교체", "profile.mediaInvalid": "25MB 이하의 이미지나 동영상을 선택하세요.", "profile.mediaUploadFailed": "사진을 업로드할 수 없습니다.", "profile.mediaUpdated": "프로필 사진이 업데이트되었습니다.", "profile.avatarVideo": "프로필 동영상", "profile.muteAvatar": "동영상 음소거", "profile.unmuteAvatar": "동영상 소리 켜기", "achievements.title": "업적", "achievements.subtitle": "모든 업적은 실제 플레이 기록으로解锁됩니다.", "achievements.progress": "진행도", "achievements.unlocked": "해금됨", "achievements.locked": "진행 중", "achievements.empty": "라운드를 플레이해 업적을 해금하세요.", "achievements.loading": "기록을 읽는 중…", "achievements.you": "나", "achievements.description": "기록에 기반한 실제 게임 이정표입니다.", "leaderboard.title": "순위표", "leaderboard.subtitle": "실제로 플레이한 계정의 실시간 순위입니다.", "leaderboard.rank": "순위", "leaderboard.player": "플레이어", "leaderboard.metric": "정렬 기준", "leaderboard.empty": "아직 순위 기록이 없습니다.", "leaderboard.loading": "순위표를 읽는 중…", "leaderboard.you": "나", "leaderboard.score": "점수", "leaderboard.codes": "코드", "leaderboard.levels": "레벨", "leaderboard.accuracy": "정확도", "leaderboard.wins": "승리", "leaderboard.matches": "경기", "leaderboard.winRate": "승률",
  },
  zh: {
    "nav.achievements": "成就", "nav.leaderboard": "排行榜", "profile.username": "用户名", "profile.editUsername": "编辑用户名", "profile.usernameInvalid": "使用 3–24 个字符，不能包含空格。", "profile.usernameTaken": "该用户名已被使用。", "profile.media": "个人头像", "profile.mediaHint": "上传图片或短视频。视频头像默认静音，不会打扰游戏。", "profile.mediaUpload": "上传头像", "profile.mediaReplace": "更换头像", "profile.mediaInvalid": "请选择小于 25 MB 的图片或视频。", "profile.mediaUploadFailed": "头像上传失败。", "profile.mediaUpdated": "头像已更新。", "profile.avatarVideo": "头像视频", "profile.muteAvatar": "静音头像视频", "profile.unmuteAvatar": "打开头像视频声音", "achievements.title": "成就", "achievements.subtitle": "每个成就都来自你的真实游戏记录。", "achievements.progress": "进度", "achievements.unlocked": "已解锁", "achievements.locked": "进行中", "achievements.empty": "玩一局即可解锁成就。", "achievements.loading": "正在读取记录…", "achievements.you": "你", "achievements.description": "根据你的记录解锁的真实游戏里程碑。", "leaderboard.title": "排行榜", "leaderboard.subtitle": "真实游玩账号的实时排名。", "leaderboard.rank": "排名", "leaderboard.player": "玩家", "leaderboard.metric": "排名依据", "leaderboard.empty": "还没有排名记录。", "leaderboard.loading": "正在读取排名…", "leaderboard.you": "你", "leaderboard.score": "分数", "leaderboard.codes": "代码", "leaderboard.levels": "关卡", "leaderboard.accuracy": "准确率", "leaderboard.wins": "胜场", "leaderboard.matches": "对局", "leaderboard.winRate": "胜率",
  },
  hi: {
    "nav.achievements": "उपलब्धियां", "nav.leaderboard": "लीडरबोर्ड", "profile.username": "उपयोगकर्ता नाम", "profile.editUsername": "उपयोगकर्ता नाम बदलें", "profile.usernameInvalid": "बिना रिक्त स्थान के 3–24 अक्षरों का उपयोग करें।", "profile.usernameTaken": "यह उपयोगकर्ता नाम पहले से लिया जा चुका है।", "profile.media": "प्रोफ़ाइल चित्र", "profile.mediaHint": "छवि या छोटा वीडियो अपलोड करें। वीडियो मौन से शुरू होते हैं।", "profile.mediaUpload": "चित्र अपलोड करें", "profile.mediaReplace": "चित्र बदलें", "profile.mediaInvalid": "25 MB से छोली छवि या वीडियो चुनें।", "profile.mediaUploadFailed": "चित्र अपलोड नहीं हो सका।", "profile.mediaUpdated": "प्रोफ़ाइल चित्र अपडेट हो गया।", "profile.avatarVideo": "प्रोफ़ाइल वीडियो", "profile.muteAvatar": "वीडियो म्यूट करें", "profile.unmuteAvatar": "वीडियो की आवाज़ चालू करें", "achievements.title": "उपलब्धियां", "achievements.subtitle": "हर अनलॉक आपके असली खेल रिकॉर्ड से आता है।", "achievements.progress": "प्रगति", "achievements.unlocked": "अनलॉक", "achievements.locked": "जारी", "achievements.empty": "उपलब्धियां खोलने के लिए एक राउंड खेलें।", "achievements.loading": "रिकॉर्ड पढ़ा जा रहा है…", "achievements.you": "आप", "achievements.description": "आपके रिकॉर्ड से असली गेम मीलका पत्थर।", "leaderboard.title": "लीडरबोर्ड", "leaderboard.subtitle": "वास्तव में खेलने वाले खातों की लाइव रैंकिंग।", "leaderboard.rank": "रैंक", "leaderboard.player": "खिलाड़ी", "leaderboard.metric": "रैंकिंग आधार", "leaderboard.empty": "अभी कोई रैंकिंग नहीं है।", "leaderboard.loading": "रैंकिंग पढ़ी जा रही है…", "leaderboard.you": "आप", "leaderboard.score": "स्कोर", "leaderboard.codes": "कोड", "leaderboard.levels": "स्तर", "leaderboard.accuracy": "सटीकता", "leaderboard.wins": "जीत", "leaderboard.matches": "मैच", "leaderboard.winRate": "जीत दर",
  },
  id: {
    "nav.achievements": "Pencapaian", "nav.leaderboard": "Papan peringkat", "profile.username": "Nama pengguna", "profile.editUsername": "Edit nama pengguna", "profile.usernameInvalid": "Gunakan 3–24 karakter tanpa spasi.", "profile.usernameTaken": "Nama pengguna sudah digunakan.", "profile.media": "Foto profil", "profile.mediaHint": "Unggah gambar atau video pendek. Video dimulai tanpa suara.", "profile.mediaUpload": "Unggah foto", "profile.mediaReplace": "Ganti foto", "profile.mediaInvalid": "Pilih gambar atau video di bawah 25 MB.", "profile.mediaUploadFailed": "Foto tidak dapat diunggah.", "profile.mediaUpdated": "Foto profil diperbarui.", "profile.avatarVideo": "Video profil", "profile.muteAvatar": "Bisukan video", "profile.unmuteAvatar": "Aktifkan suara video", "achievements.title": "Pencapaian", "achievements.subtitle": "Setiap terbuka berasal dari catatan permainan nyata.", "achievements.progress": "Progres", "achievements.unlocked": "Terbuka", "achievements.locked": "Berjalan", "achievements.empty": "Mainkan satu ronde untuk membuka pencapaian.", "achievements.loading": "Membaca catatan…", "achievements.you": "Anda", "achievements.description": "Milestones nyata dari catatan permainan Anda.", "leaderboard.title": "Papan peringkat", "leaderboard.subtitle": "Peringkat langsung dari akun yang benar-benar bermain.", "leaderboard.rank": "Peringkat", "leaderboard.player": "Pemain", "leaderboard.metric": "Urutkan berdasarkan", "leaderboard.empty": "Belum ada peringkat.", "leaderboard.loading": "Membaca peringkat…", "leaderboard.you": "Anda", "leaderboard.score": "Skor", "leaderboard.codes": "Kode", "leaderboard.levels": "Level", "leaderboard.accuracy": "Akurasi", "leaderboard.wins": "Kemenangan", "leaderboard.matches": "Pertandingan", "leaderboard.winRate": "Tingkat kemenangan",
  },
  ur: {
    "nav.achievements": "کارنامے", "nav.leaderboard": "لیڈر بورڈ", "profile.username": "صارف نام", "profile.editUsername": "صارف نام تبدیل کریں", "profile.usernameInvalid": "بغیر خالی جگہ کے 3–24 حروف استعمال کریں۔", "profile.usernameTaken": "یہ صارف نام پہلے سے لیا جا چکا ہے۔", "profile.media": "پروفائل تصویر", "profile.mediaHint": "تصویر یا مختصر ویڈیو اپ لوڈ کریں۔ ویڈیو خاموشی سے شروع ہوتی ہے۔", "profile.mediaUpload": "تصویر اپ لوڈ کریں", "profile.mediaReplace": "تصویر تبدیل کریں", "profile.mediaInvalid": "25 MB سے کم تصویر یا ویڈیو منتخب کریں۔", "profile.mediaUploadFailed": "تصویر اپ لوڈ نہیں ہو سکی۔", "profile.mediaUpdated": "پروفائل تصویر تازہ ہو گئی۔", "profile.avatarVideo": "پروفائل ویڈیو", "profile.muteAvatar": "ویڈیو خاموش کریں", "profile.unmuteAvatar": "ویڈیو کی آواز چالو کریں", "achievements.title": "کارنامے", "achievements.subtitle": "ہر کارنامہ آپ کے حقیقی کھیل کے ریکارڈ سے ہے۔", "achievements.progress": "پیش رفت", "achievements.unlocked": "کھلا", "achievements.locked": "جاری", "achievements.empty": "کارنامے کھولنے کے لیے ایک راؤنڈ کھیلیں۔", "achievements.loading": "ریکارڈ پڑھا جا رہا ہے…", "achievements.you": "آپ", "achievements.description": "آپ کے ریکارڈ کا حقیقی گیم منسوبہ۔", "leaderboard.title": "لیڈر بورڈ", "leaderboard.subtitle": "واقعی کھیلنے والے اکاؤنٹس کی براہِ راست درجہ بندی۔", "leaderboard.rank": "درجہ", "leaderboard.player": "کھلاڑی", "leaderboard.metric": "ترتیب کا معیار", "leaderboard.empty": "ابھی کوئی ریکارڈ نہیں۔", "leaderboard.loading": "درجہ بندی پڑھی جا رہی ہے…", "leaderboard.you": "آپ", "leaderboard.score": "اسکور", "leaderboard.codes": "کوڈ", "leaderboard.levels": "لیول", "leaderboard.accuracy": "درستگی", "leaderboard.wins": "جیتیں", "leaderboard.matches": "میچ", "leaderboard.winRate": "جیت کی شرح",
  },
};

const pageCopy = {
  en: {
    "common.retry": "Try again", "common.refresh": "Refresh",
    "achievements.eyebrow": "YOUR MILESTONES", "achievements.modeLabel": "MODE", "achievements.unlockedCount": "unlocked", "achievements.unlockedHint": "Milestones earned", "achievements.total": "Total", "achievements.totalHint": "In this mode", "achievements.remaining": "{count} still hidden", "achievements.allUnlocked": "All clear", "achievements.catalog": "THE CATALOG", "achievements.all": "All achievements", "achievements.live": "Live progress", "achievements.unlockedOn": "Unlocked {date}", "achievements.authTitle": "Sign in to unlock your record", "achievements.authDescription": "Your progress and achievements stay private to your account.", "achievements.errorTitle": "The achievement vault is out of reach", "achievements.errorDescription": "We could not load your milestones. Check your connection and try again.",
    "leaderboard.eyebrow": "THE SIGNAL BOARD", "leaderboard.rankBy": "RANK BY", "leaderboard.duel": "Duel", "leaderboard.solo": "Solo", "leaderboard.board": "LIVE BOARD", "leaderboard.updated": "Server ranked", "leaderboard.authTitle": "Sign in to see your place", "leaderboard.authDescription": "Sign in to view the rankings and your current position.", "leaderboard.errorTitle": "The rankings are temporarily offline", "leaderboard.errorDescription": "We could not load the rankings. Check your connection and try again.",
  },
  ar: {
    "common.retry": "حاول مرة أخرى", "common.refresh": "تحديث", "achievements.eyebrow": "إنجازاتك", "achievements.modeLabel": "الوضع", "achievements.unlockedCount": "مفتوحة", "achievements.unlockedHint": "إنجازات مكتسبة", "achievements.total": "الإجمالي", "achievements.totalHint": "في هذا الوضع", "achievements.remaining": "{count} ما زالت مخفية", "achievements.allUnlocked": "كل شيء مكتمل", "achievements.catalog": "الكتالوج", "achievements.all": "كل الإنجازات", "achievements.live": "تقدم مباشر", "achievements.unlockedOn": "فُتح في {date}", "achievements.authTitle": "سجل الدخول لفتح إنجازاتك", "achievements.authDescription": "يبقى تقدمك وإنجازاتك خاصين بحسابك.", "achievements.errorTitle": "خزنة الإنجازات بعيدة عن متناولك", "achievements.errorDescription": "تعذر تحميل إنجازاتك. تحقق من الاتصال وحاول مجدداً.", "leaderboard.eyebrow": "لوحة الإشارة", "leaderboard.rankBy": "الترتيب حسب", "leaderboard.duel": "مبارزة", "leaderboard.solo": "فردي", "leaderboard.board": "لوحة مباشرة", "leaderboard.updated": "ترتيب من الخادم", "leaderboard.authTitle": "سجل الدخول لرؤية ترتيبك", "leaderboard.authDescription": "سجل الدخول لعرض الترتيب وموقعك الحالي.", "leaderboard.errorTitle": "الترتيب غير متاح مؤقتاً", "leaderboard.errorDescription": "تعذر تحميل الترتيب. تحقق من الاتصال وحاول مجدداً.",
  },
  fr: {
    "common.retry": "Réessayer", "common.refresh": "Actualiser", "achievements.eyebrow": "VOS PALMARÈS", "achievements.modeLabel": "MODE", "achievements.unlockedCount": "débloqués", "achievements.unlockedHint": "Palmarès gagnés", "achievements.total": "Total", "achievements.totalHint": "Dans ce mode", "achievements.remaining": "{count} encore cachés", "achievements.allUnlocked": "Tout est clair", "achievements.catalog": "LE CATALOGUE", "achievements.all": "Tous les succès", "achievements.live": "Progression en direct", "achievements.unlockedOn": "Débloqué le {date}", "achievements.authTitle": "Connectez-vous pour débloquer votre record", "achievements.authDescription": "Votre progression et vos succès restent privés.", "achievements.errorTitle": "Le coffre des succès est inaccessible", "achievements.errorDescription": "Impossible de charger vos succès. Vérifiez la connexion.", "leaderboard.eyebrow": "LE TABLEAU DES SIGNAUX", "leaderboard.rankBy": "CLASSER PAR", "leaderboard.duel": "Duel", "leaderboard.solo": "Solo", "leaderboard.board": "TABLEAU EN DIRECT", "leaderboard.updated": "Classement serveur", "leaderboard.authTitle": "Connectez-vous pour voir votre place", "leaderboard.authDescription": "Connectez-vous pour afficher le classement et votre position.", "leaderboard.errorTitle": "Le classement est temporairement indisponible", "leaderboard.errorDescription": "Impossible de charger le classement. Réessayez.",
  },
  es: {
    "common.retry": "Reintentar", "common.refresh": "Actualizar", "achievements.eyebrow": "TUS HITOS", "achievements.modeLabel": "MODO", "achievements.unlockedCount": "desbloqueados", "achievements.unlockedHint": "Hitos ganados", "achievements.total": "Total", "achievements.totalHint": "En este modo", "achievements.remaining": "{count} aún ocultos", "achievements.allUnlocked": "Todo despejado", "achievements.catalog": "EL CATÁLOGO", "achievements.all": "Todos los logros", "achievements.live": "Progreso en vivo", "achievements.unlockedOn": "Desbloqueado el {date}", "achievements.authTitle": "Inicia sesión para desbloquear tu récord", "achievements.authDescription": "Tu progreso y logros permanecen privados en tu cuenta.", "achievements.errorTitle": "La bóveda de logros no está disponible", "achievements.errorDescription": "No se pudieron cargar tus logros. Comprueba la conexión.", "leaderboard.eyebrow": "EL TABLERO DE SEÑALES", "leaderboard.rankBy": "ORDENAR POR", "leaderboard.duel": "Duelo", "leaderboard.solo": "Solo", "leaderboard.board": "TABLERO EN VIVO", "leaderboard.updated": "Clasificación del servidor", "leaderboard.authTitle": "Inicia sesión para ver tu lugar", "leaderboard.authDescription": "Inicia sesión para ver la clasificación y tu posición.", "leaderboard.errorTitle": "La clasificación no está disponible", "leaderboard.errorDescription": "No se pudo cargar la clasificación. Inténtalo de nuevo.",
  },
  de: {
    "common.retry": "Erneut versuchen", "common.refresh": "Aktualisieren", "achievements.eyebrow": "DEINE ERFOLGE", "achievements.modeLabel": "MODUS", "achievements.unlockedCount": "freigeschaltet", "achievements.unlockedHint": "Erhaltene Meilensteine", "achievements.total": "Gesamt", "achievements.totalHint": "In diesem Modus", "achievements.remaining": "{count} noch verborgen", "achievements.allUnlocked": "Alles geschafft", "achievements.catalog": "DER KATALOG", "achievements.all": "Alle Erfolge", "achievements.live": "Live-Fortschritt", "achievements.unlockedOn": "Freigeschaltet am {date}", "achievements.authTitle": "Melde dich an, um deinen Rekord freizuschalten", "achievements.authDescription": "Fortschritt und Erfolge bleiben in deinem Konto privat.", "achievements.errorTitle": "Der Erfolgsschrank ist nicht erreichbar", "achievements.errorDescription": "Meilensteine konnten nicht geladen werden. Prüfe die Verbindung.", "leaderboard.eyebrow": "DIE SIGNALTAFEL", "leaderboard.rankBy": "RANGLISTE NACH", "leaderboard.duel": "Duell", "leaderboard.solo": "Solo", "leaderboard.board": "LIVE-TAFEL", "leaderboard.updated": "Server-Rangliste", "leaderboard.authTitle": "Melde dich an, um deinen Platz zu sehen", "leaderboard.authDescription": "Melde dich an, um die Rangliste und deine Position zu sehen.", "leaderboard.errorTitle": "Die Rangliste ist vorübergehend offline", "leaderboard.errorDescription": "Die Rangliste konnte nicht geladen werden. Erneut versuchen.",
  },
  pt: {
    "common.retry": "Tentar novamente", "common.refresh": "Atualizar", "achievements.eyebrow": "SUAS CONQUISTAS", "achievements.modeLabel": "MODO", "achievements.unlockedCount": "desbloqueadas", "achievements.unlockedHint": "Marcos conquistados", "achievements.total": "Total", "achievements.totalHint": "Neste modo", "achievements.remaining": "{count} ainda ocultos", "achievements.allUnlocked": "Tudo concluído", "achievements.catalog": "O CATÁLOGO", "achievements.all": "Todas as conquistas", "achievements.live": "Progresso ao vivo", "achievements.unlockedOn": "Desbloqueado em {date}", "achievements.authTitle": "Entre para desbloquear seu recorde", "achievements.authDescription": "Seu progresso e conquistas ficam privados na sua conta.", "achievements.errorTitle": "O cofre de conquistas está indisponível", "achievements.errorDescription": "Não foi possível carregar suas conquistas. Verifique a conexão.", "leaderboard.eyebrow": "O QUADRO DE SINAIS", "leaderboard.rankBy": "ORDENAR POR", "leaderboard.duel": "Duelo", "leaderboard.solo": "Solo", "leaderboard.board": "QUADRO AO VIVO", "leaderboard.updated": "Classificação do servidor", "leaderboard.authTitle": "Entre para ver sua posição", "leaderboard.authDescription": "Entre para ver o ranking e sua posição atual.", "leaderboard.errorTitle": "O ranking está temporariamente indisponível", "leaderboard.errorDescription": "Não foi possível carregar o ranking. Tente novamente.",
  },
  it: {
    "common.retry": "Riprova", "common.refresh": "Aggiorna", "achievements.eyebrow": "I TUOI RISULTATI", "achievements.modeLabel": "MODALITÀ", "achievements.unlockedCount": "sbloccati", "achievements.unlockedHint": "Traguardi ottenuti", "achievements.total": "Totale", "achievements.totalHint": "In questa modalità", "achievements.remaining": "{count} ancora nascosti", "achievements.allUnlocked": "Tutto completato", "achievements.catalog": "IL CATALOGO", "achievements.all": "Tutti gli obiettivi", "achievements.live": "Progresso live", "achievements.unlockedOn": "Sbloccato il {date}", "achievements.authTitle": "Accedi per sbloccare il record", "achievements.authDescription": "Progressi e obiettivi restano privati nel tuo account.", "achievements.errorTitle": "Il caveau degli obiettivi non è raggiungibile", "achievements.errorDescription": "Impossibile caricare gli obiettivi. Controlla la connessione.", "leaderboard.eyebrow": "LA TABELLA DEI SEGNALI", "leaderboard.rankBy": "ORDINA PER", "leaderboard.duel": "Duello", "leaderboard.solo": "Solo", "leaderboard.board": "TABELLA LIVE", "leaderboard.updated": "Classifica del server", "leaderboard.authTitle": "Accedi per vedere la tua posizione", "leaderboard.authDescription": "Accedi per vedere la classifica e la tua posizione.", "leaderboard.errorTitle": "La classifica è temporaneamente offline", "leaderboard.errorDescription": "Impossibile caricare la classifica. Riprova.",
  },
  nl: {
    "common.retry": "Opnieuw proberen", "common.refresh": "Vernieuwen", "achievements.eyebrow": "JOUW PRESTATIES", "achievements.modeLabel": "MODUS", "achievements.unlockedCount": "ontgrendeld", "achievements.unlockedHint": "Verdiende mijlpalen", "achievements.total": "Totaal", "achievements.totalHint": "In deze modus", "achievements.remaining": "{count} nog verborgen", "achievements.allUnlocked": "Alles voltooid", "achievements.catalog": "DE CATALOGUS", "achievements.all": "Alle prestaties", "achievements.live": "Live voortgang", "achievements.unlockedOn": "Ontgrendeld op {date}", "achievements.authTitle": "Log in om je record te ontgrendelen", "achievements.authDescription": "Voortgang en prestaties blijven privé in je account.", "achievements.errorTitle": "De prestatiekluis is niet bereikbaar", "achievements.errorDescription": "Prestaties konden niet worden geladen. Controleer de verbinding.", "leaderboard.eyebrow": "HET SIGNAALBORD", "leaderboard.rankBy": "RANGSCHIKKEN OP", "leaderboard.duel": "Duel", "leaderboard.solo": "Solo", "leaderboard.board": "LIVE-BORD", "leaderboard.updated": "Serverranglijst", "leaderboard.authTitle": "Log in om je plaats te zien", "leaderboard.authDescription": "Log in om de ranglijst en je huidige positie te zien.", "leaderboard.errorTitle": "De ranglijst is tijdelijk offline", "leaderboard.errorDescription": "De ranglijst kon niet worden geladen. Probeer opnieuw.",
  },
  ru: {
    "common.retry": "Повторить", "common.refresh": "Обновить", "achievements.eyebrow": "ВАШИ ДОСТИЖЕНИЯ", "achievements.modeLabel": "РЕЖИМ", "achievements.unlockedCount": "открыто", "achievements.unlockedHint": "Полученные вехи", "achievements.total": "Всего", "achievements.totalHint": "В этом режиме", "achievements.remaining": "Ещё скрыто: {count}", "achievements.allUnlocked": "Всё выполнено", "achievements.catalog": "КАТАЛОГ", "achievements.all": "Все достижения", "achievements.live": "Прогресс онлайн", "achievements.unlockedOn": "Открыто {date}", "achievements.authTitle": "Войдите, чтобы открыть рекорд", "achievements.authDescription": "Прогресс и достижения остаются приватными в аккаунте.", "achievements.errorTitle": "Хранилище достижений недоступно", "achievements.errorDescription": "Не удалось загрузить достижения. Проверьте соединение.", "leaderboard.eyebrow": "ТАБЛО СИГНАЛОВ", "leaderboard.rankBy": "СОРТИРОВАТЬ ПО", "leaderboard.duel": "Дуэль", "leaderboard.solo": "Соло", "leaderboard.board": "ТАБЛО ОНЛАЙН", "leaderboard.updated": "Рейтинг сервера", "leaderboard.authTitle": "Войдите, чтобы увидеть своё место", "leaderboard.authDescription": "Войдите, чтобы увидеть рейтинг и текущую позицию.", "leaderboard.errorTitle": "Рейтинг временно недоступен", "leaderboard.errorDescription": "Не удалось загрузить рейтинг. Повторите попытку.",
  },
  tr: {
    "common.retry": "Tekrar dene", "common.refresh": "Yenile", "achievements.eyebrow": "BAŞARIMLARIN", "achievements.modeLabel": "MOD", "achievements.unlockedCount": "açıldı", "achievements.unlockedHint": "Kazanılan kilometre taşları", "achievements.total": "Toplam", "achievements.totalHint": "Bu modda", "achievements.remaining": "{count} gizli", "achievements.allUnlocked": "Hepsi tamam", "achievements.catalog": "KATALOG", "achievements.all": "Tüm başarımlar", "achievements.live": "Canlı ilerleme", "achievements.unlockedOn": "{date} tarihinde açıldı", "achievements.authTitle": "Rekorunu açmak için giriş yap", "achievements.authDescription": "İlerlemen ve başarımların hesabında gizli kalır.", "achievements.errorTitle": "Başarım kasası erişilemiyor", "achievements.errorDescription": "Başarımlar yüklenemedi. Bağlantını kontrol et.", "leaderboard.eyebrow": "SİNYAL PANOSU", "leaderboard.rankBy": "SIRALA", "leaderboard.duel": "Düello", "leaderboard.solo": "Solo", "leaderboard.board": "CANLI PANO", "leaderboard.updated": "Sunucu sıralaması", "leaderboard.authTitle": "Sıralamayı görmek için giriş yap", "leaderboard.authDescription": "Sıralamayı ve mevcut yerini görmek için giriş yap.", "leaderboard.errorTitle": "Sıralama geçici olarak çevrimdışı", "leaderboard.errorDescription": "Sıralama yüklenemedi. Tekrar dene.",
  },
  ja: {
    "common.retry": "再試行", "common.refresh": "更新", "achievements.eyebrow": "あなたの実績", "achievements.modeLabel": "モード", "achievements.unlockedCount": "解除済み", "achievements.unlockedHint": "達成したマイルストーン", "achievements.total": "合計", "achievements.totalHint": "このモード", "achievements.remaining": "残り {count}", "achievements.allUnlocked": "すべて達成", "achievements.catalog": "カタログ", "achievements.all": "すべての実績", "achievements.live": "ライブ進捗", "achievements.unlockedOn": "{date} に解除", "achievements.authTitle": "記録を解除するにはサインイン", "achievements.authDescription": "進捗と実績はアカウント内で非公開です。", "achievements.errorTitle": "実績保管庫にアクセスできません", "achievements.errorDescription": "実績を読み込めませんでした。接続を確認してください。", "leaderboard.eyebrow": "信号ボード", "leaderboard.rankBy": "ランキング基準", "leaderboard.duel": "バトル", "leaderboard.solo": "ソロ", "leaderboard.board": "ライブボード", "leaderboard.updated": "サーバーランキング", "leaderboard.authTitle": "順位を見るにはサインイン", "leaderboard.authDescription": "ランキングと現在の順位を表示するにはサインインしてください。", "leaderboard.errorTitle": "ランキングは一時的に利用できません", "leaderboard.errorDescription": "ランキングを読み込めませんでした。もう一度お試しください。",
  },
  ko: {
    "common.retry": "다시 시도", "common.refresh": "새로고침", "achievements.eyebrow": "나의 업적", "achievements.modeLabel": "모드", "achievements.unlockedCount": "해금됨", "achievements.unlockedHint": "획득한 이정표", "achievements.total": "합계", "achievements.totalHint": "이 모드", "achievements.remaining": "{count}개 숨김", "achievements.allUnlocked": "모두 완료", "achievements.catalog": "카탈로그", "achievements.all": "모든 업적", "achievements.live": "실시간 진행", "achievements.unlockedOn": "{date}에 해금", "achievements.authTitle": "기록을 해금하려면 로그인하세요", "achievements.authDescription": "진행 상황과 업적은 계정 안에서만 볼 수 있습니다.", "achievements.errorTitle": "업적 보관함에 접근할 수 없습니다", "achievements.errorDescription": "업적을 불러오지 못했습니다. 연결을 확인하세요.", "leaderboard.eyebrow": "시그널 보드", "leaderboard.rankBy": "정렬 기준", "leaderboard.duel": "결투", "leaderboard.solo": "솔로", "leaderboard.board": "라이브 보드", "leaderboard.updated": "서버 순위", "leaderboard.authTitle": "순위를 보려면 로그인하세요", "leaderboard.authDescription": "순위와 현재 위치를 보려면 로그인하세요.", "leaderboard.errorTitle": "순위표를 일시적으로 사용할 수 없습니다", "leaderboard.errorDescription": "순위표를 불러오지 못했습니다. 다시 시도하세요.",
  },
  zh: {
    "common.retry": "重试", "common.refresh": "刷新", "achievements.eyebrow": "你的成就", "achievements.modeLabel": "模式", "achievements.unlockedCount": "已解锁", "achievements.unlockedHint": "已获得的里程碑", "achievements.total": "总数", "achievements.totalHint": "此模式", "achievements.remaining": "还有 {count} 个隐藏", "achievements.allUnlocked": "全部完成", "achievements.catalog": "目录", "achievements.all": "全部成就", "achievements.live": "实时进度", "achievements.unlockedOn": "{date} 解锁", "achievements.authTitle": "登录以解锁你的记录", "achievements.authDescription": "你的进度和成就仅在账户中私密保存。", "achievements.errorTitle": "成就库暂时无法访问", "achievements.errorDescription": "无法加载成就，请检查连接后重试。", "leaderboard.eyebrow": "信号榜", "leaderboard.rankBy": "排名依据", "leaderboard.duel": "对决", "leaderboard.solo": "单人", "leaderboard.board": "实时榜单", "leaderboard.updated": "服务器排名", "leaderboard.authTitle": "登录查看你的位置", "leaderboard.authDescription": "登录后查看排行榜和当前名次。", "leaderboard.errorTitle": "排行榜暂时离线", "leaderboard.errorDescription": "无法加载排行榜，请重试。",
  },
  hi: {
    "common.retry": "फिर कोशिश करें", "common.refresh": "रिफ्रेश", "achievements.eyebrow": "आपकी उपलब्धियां", "achievements.modeLabel": "मोड", "achievements.unlockedCount": "अनलॉक", "achievements.unlockedHint": "हासिल मीलके पत्थर", "achievements.total": "कुल", "achievements.totalHint": "इस मोड में", "achievements.remaining": "{count} अभी छिपे", "achievements.allUnlocked": "सब पूरा", "achievements.catalog": "कैटलॉग", "achievements.all": "सभी उपलब्धियां", "achievements.live": "लाइव प्रगति", "achievements.unlockedOn": "{date} को अनलॉक", "achievements.authTitle": "अपना रिकॉर्ड अनलॉक करने के लिए साइन इन करें", "achievements.authDescription": "आपकी प्रगति और उपलब्धियां आपके खाते में निजी रहती हैं।", "achievements.errorTitle": "उपलब्धि वॉल्ट तक नहीं पहुँच सके", "achievements.errorDescription": "उपलब्धियां लोड नहीं हो सकीं। कनेक्शन जांचें।", "leaderboard.eyebrow": "सिग्नल बोर्ड", "leaderboard.rankBy": "रैंकिंग आधार", "leaderboard.duel": "द्वंद्व", "leaderboard.solo": "सोलो", "leaderboard.board": "लाइव बोर्ड", "leaderboard.updated": "सर्वर रैंकिंग", "leaderboard.authTitle": "अपनी जगह देखने के लिए साइन इन करें", "leaderboard.authDescription": "रैंकिंग और अपनी वर्तमान स्थिति देखने के लिए साइन इन करें।", "leaderboard.errorTitle": "रैंकिंग अस्थायी रूप से बंद है", "leaderboard.errorDescription": "रैंकिंग लोड नहीं हो सकी। फिर कोशिश करें।",
  },
  id: {
    "common.retry": "Coba lagi", "common.refresh": "Segarkan", "achievements.eyebrow": "PENCAPAIANMU", "achievements.modeLabel": "MODE", "achievements.unlockedCount": "terbuka", "achievements.unlockedHint": "Milestone diperoleh", "achievements.total": "Total", "achievements.totalHint": "Di mode ini", "achievements.remaining": "{count} masih tersembunyi", "achievements.allUnlocked": "Semua selesai", "achievements.catalog": "KATALOG", "achievements.all": "Semua pencapaian", "achievements.live": "Progres langsung", "achievements.unlockedOn": "Terbuka {date}", "achievements.authTitle": "Masuk untuk membuka rekormu", "achievements.authDescription": "Progres dan pencapaian tetap privat di akunmu.", "achievements.errorTitle": "Ruang pencapaian tidak dapat dijangkau", "achievements.errorDescription": "Pencapaian tidak dapat dimuat. Periksa koneksi.", "leaderboard.eyebrow": "PAPAN SINYAL", "leaderboard.rankBy": "URUTKAN BERDASARKAN", "leaderboard.duel": "Duel", "leaderboard.solo": "Solo", "leaderboard.board": "PAPAN LANGSUNG", "leaderboard.updated": "Peringkat server", "leaderboard.authTitle": "Masuk untuk melihat posisimu", "leaderboard.authDescription": "Masuk untuk melihat peringkat dan posisimu.", "leaderboard.errorTitle": "Peringkat sementara tidak tersedia", "leaderboard.errorDescription": "Peringkat tidak dapat dimuat. Coba lagi.",
  },
  ur: {
    "common.retry": "دوبارہ کوشش کریں", "common.refresh": "تازہ کریں", "achievements.eyebrow": "آپ کے کارنامے", "achievements.modeLabel": "موڈ", "achievements.unlockedCount": "کھلے", "achievements.unlockedHint": "حاصل کردہ اہم پیش رفت", "achievements.total": "کل", "achievements.totalHint": "اس موڈ میں", "achievements.remaining": "{count} ابھی چھپے ہیں", "achievements.allUnlocked": "سب مکمل", "achievements.catalog": "کاتلاگ", "achievements.all": "تمام کارنامے", "achievements.live": "براہِ راست پیش رفت", "achievements.unlockedOn": "{date} کو کھلا", "achievements.authTitle": "اپنا ریکارڈ کھولنے کے لیے سائن اِن کریں", "achievements.authDescription": "آپ کی پیش رفت اور کارنامے آپ کے اکاؤنٹ میں نجی رہتے ہیں۔", "achievements.errorTitle": "کارناموں کا خزانہ دستیاب نہیں", "achievements.errorDescription": "کارنامے لوڈ نہیں ہو سکے۔ کنکشن چیک کریں۔", "leaderboard.eyebrow": "سیگنل بورڈ", "leaderboard.rankBy": "درجہ بندی کا معیار", "leaderboard.duel": "دوائل", "leaderboard.solo": "سولو", "leaderboard.board": "لائیو بورڈ", "leaderboard.updated": "سرور درجہ بندی", "leaderboard.authTitle": "اپنی جگہ دیکھنے کے لیے سائن اِن کریں", "leaderboard.authDescription": "درجہ بندی اور موجودہ مقام دیکھنے کے لیے سائن اِن کریں۔", "leaderboard.errorTitle": "درجہ بندی عارضی طور پر بند ہے", "leaderboard.errorDescription": "درجہ بندی لوڈ نہیں ہو سکی۔ دوبارہ کوشش کریں۔",
  },
};

const metricLabels = {
  en: { "leaderboard.metric.speed": "Fast solves", "leaderboard.metric.inventory": "Items collected", "leaderboard.metric.wallet": "Lifetime earnings" },
  ar: { "leaderboard.metric.speed": "حلول سريعة", "leaderboard.metric.inventory": "العناصر المجمعة", "leaderboard.metric.wallet": "الأرباح التراكمية" },
  fr: { "leaderboard.metric.speed": "Résolutions rapides", "leaderboard.metric.inventory": "Objets collectés", "leaderboard.metric.wallet": "Gains cumulés" },
  es: { "leaderboard.metric.speed": "Resoluciones rápidas", "leaderboard.metric.inventory": "Objetos recogidos", "leaderboard.metric.wallet": "Ganancias acumuladas" },
  de: { "leaderboard.metric.speed": "Schnelle Lösungen", "leaderboard.metric.inventory": "Gesammelte Gegenstände", "leaderboard.metric.wallet": "Gesamteinnahmen" },
  pt: { "leaderboard.metric.speed": "Respostas rápidas", "leaderboard.metric.inventory": "Itens coletados", "leaderboard.metric.wallet": "Ganhos acumulados" },
  it: { "leaderboard.metric.speed": "Soluzioni rapide", "leaderboard.metric.inventory": "Oggetti raccolti", "leaderboard.metric.wallet": "Guadagni totali" },
  nl: { "leaderboard.metric.speed": "Snelle oplossingen", "leaderboard.metric.inventory": "Verzamelde voorwerpen", "leaderboard.metric.wallet": "Totale inkomsten" },
  ru: { "leaderboard.metric.speed": "Быстрые решения", "leaderboard.metric.inventory": "Собранные предметы", "leaderboard.metric.wallet": "Всего заработано" },
  tr: { "leaderboard.metric.speed": "Hızlı çözümler", "leaderboard.metric.inventory": "Toplanan eşyalar", "leaderboard.metric.wallet": "Toplam kazanç" },
  ja: { "leaderboard.metric.speed": "素早い解答", "leaderboard.metric.inventory": "収集アイテム", "leaderboard.metric.wallet": "累計獲得額" },
  ko: { "leaderboard.metric.speed": "빠른 해결", "leaderboard.metric.inventory": "수집한 아이템", "leaderboard.metric.wallet": "누적 획득" },
  zh: { "leaderboard.metric.speed": "快速解答", "leaderboard.metric.inventory": "已收集物品", "leaderboard.metric.wallet": "累计收益" },
  hi: { "leaderboard.metric.speed": "तेज़ हल", "leaderboard.metric.inventory": "एकत्रित आइटम", "leaderboard.metric.wallet": "कुल कमाई" },
  id: { "leaderboard.metric.speed": "Penyelesaian cepat", "leaderboard.metric.inventory": "Item terkumpul", "leaderboard.metric.wallet": "Total penghasilan" },
  ur: { "leaderboard.metric.speed": "تیز حل", "leaderboard.metric.inventory": "جمع شدہ اشیاء", "leaderboard.metric.wallet": "کل آمدنی" },
};

export const featureOverrides = Object.fromEntries(
  Object.keys(common).map((locale) => [
    locale,
    {
      ...common[locale],
      ...pageCopy[locale],
      ...metricLabels[locale],
      ...titles[locale],
      ...notificationOverrides[locale],
    },
  ]),
);

// Keep the server catalog's dotted/plural key shape compatible with the
// singular aliases used by the client compatibility map.
for (const locale of Object.keys(featureOverrides)) {
  for (const key of Object.keys(featureOverrides[locale])) {
    if (key.startsWith("achievement.") && key.endsWith(".title")) {
      featureOverrides[locale][`achievements.${key.slice("achievement.".length)}`] =
        featureOverrides[locale][key];
    }
  }
  for (const key of Object.keys(featureOverrides[locale])) {
    if (key.startsWith("achievement.") && key.endsWith(".description")) {
      featureOverrides[locale][`achievements.${key.slice("achievement.".length)}`] =
        featureOverrides[locale]["achievements.description"];
    }
  }
}

const serverTitleAliases = {
  "single.codebreaker": "achievement.single.level_hunter.title",
  "single.finisher": "achievement.single.level_hunter.title",
  "single.completionist": "achievement.single.all_difficulties.title",
  "single.code_hunter": "achievement.single.collector.title",
  "single.quick_thinker": "achievement.single.speed_runner.title",
  "single.speed_demon": "achievement.single.speed_runner.title",
  "single.treasurer": "achievement.single.rich.title",
  "single.high_scorer": "achievement.single.level_hunter.title",
  "multi.first_match": "achievement.multi.first_duel.title",
  "multi.regular": "achievement.multi.duel_regular.title",
  "multi.code_hunter": "achievement.multi.code_crack.title",
  "multi.sharp_shooter": "achievement.multi.champion.title",
  "multi.elite": "achievement.multi.champion.title",
  "multi.high_scorer": "achievement.multi.champion.title",
  "multi.score_machine": "achievement.multi.champion.title",
  "multi.treasurer": "achievement.multi.collector.title",
};
for (const locale of Object.keys(featureOverrides)) {
  for (const [serverKey, sourceKey] of Object.entries(serverTitleAliases)) {
    featureOverrides[locale][`achievements.${serverKey}.title`] =
      featureOverrides[locale][sourceKey];
    featureOverrides[locale][`achievements.${serverKey}.description`] =
      featureOverrides[locale]["achievements.description"];
  }
}
