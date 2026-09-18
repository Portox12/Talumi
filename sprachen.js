/* =====================================================================
   Talumi — Sprachen
   199 Schlüssel in sieben Sprachen. Wird vor spiel.js geladen; beide teilen
   sich denselben globalen Bereich, deshalb sieht spiel.js LANGS und LANGNAMES.
   Neue Sprache: einen weiteren Block anlegen und per Object.assign anfügen.
   ===================================================================== */

const LANGNAMES = {en:"English", de:"Deutsch", es:"Español", pt:"Português", fr:"Français", tr:"Türkçe", ru:"Русский"};
const LANGS = {
  en:{play:"Play as guest", start:"Start", forming:"Forming…", skins:"Designs", friends:"Friends", settings:"Settings", legal:"Legal", back:"Back", done:"Done", again:"Play again", addfriend:"Add friend", remove:"Remove", language:"Language", mode:"Mode", designation:"Name", surfacepick:"Design — tap to switch", playername:"Player name", tagline:"You begin as a grain of dust. Swallow debris, swallow rivals, and pull yourself into a world with rings and moons of your own.", namerule:"Letters, numbers, space, . _ - only — so anyone can type it.", earned:"No lasting advantages for sale. Every design can be earned by playing.", ctrlmouse:"Move with the mouse · Space splits · W sheds mass", ctrltouch:"Drag anywhere to steer · the two buttons split and shed mass", guestnote:"Sign-in needs a server and is switched off here. Progress is saved in this browser.", friendsinfo:"You can only add players whose name you can type. That is why names are limited to letters, numbers, space and . _ -", friendspending:"Invites and online status arrive with the server.", nofriends:"No friends added yet.", mass:"mass", objectives:"Objectives", largest:"Largest bodies", integrity:"Integrity", protected:"Protected {0}s — splitting ends it", feast:"Split wide — you can swallow pulsars now", bodiesleft:"Bodies left", fieldcloses:"Field closes in", final:"final", clanbattle:"Clan battle", yourclan:"Your clan", rivals:"Rivals", royale:"Battle royale", st0:"Dust", st1:"Rubble", st2:"Planetesimal", st3:"Protoplanet", st4:"World", m_open:"Open space", m_open_b:"Free-for-all on the full map. Full rewards.", m_royale:"Battle royale", m_royale_b:"Everyone starts equal, the field closes in. Last body standing wins.", m_clan:"Clan battle", m_clan_b:"Two clans, mirrored arena, five minutes. Highest clan mass wins.", m_friendly:"Friendly match", m_friendly_b:"Mirrored arena, everyone starts equal. Practice — no rewards.", scattered:"Scattered", oreearned:"Ore earned", peakmass:"Peak mass", swallowed:"Bodies swallowed", reached:"Reached", newbest:"New personal best", wonround:"Battle royale won", objective:"Objective", levelup:"Level {0} reached. Unlocked:", practice:"Friendly match — practice only, no Ore and no XP.", enterstarts:"Enter or space starts the next run", shortof:"{0} mass short of your best.", owned:"Owned", levelreq:"Level {0}", orereq:"{0} Ore", ownedcount:"{0} of {1} owned", nextup:"Next:", allunlocked:"Everything unlocked.", selected:"{0} selected.", bought:"Bought {0} for {1} Ore.", needlevel:"{0} unlocks at level {1}.", needore:"{0} costs {1} Ore.", maxlevel:"max level", level:"Level", bestmass:"best mass"},
  de:{play:"Als Gast spielen", start:"Spielen", forming:"Formiert sich …", skins:"Designs", friends:"Freunde", settings:"Einstellungen", legal:"Rechtliches", back:"Zurück", done:"Fertig", again:"Nochmal spielen", addfriend:"Freund hinzufügen", remove:"Entfernen", language:"Sprache", mode:"Spielart", designation:"Name", surfacepick:"Design — antippen zum Wechseln", playername:"Spielername", tagline:"Du beginnst als Staubkorn. Verschling Trümmer, verschling Rivalen und zieh dich zu einer Welt mit eigenen Ringen und Monden zusammen.", namerule:"Nur Buchstaben, Ziffern, Leerzeichen, . _ - — damit jeder den Namen tippen kann.", earned:"Keine dauerhaften Vorteile käuflich. Jedes Design kann man sich erspielen.", ctrlmouse:"Maus zum Steuern · Leertaste teilt · W wirft Masse ab", ctrltouch:"Irgendwo ziehen zum Steuern · die zwei Tasten teilen und werfen Masse ab", guestnote:"Anmeldung braucht einen Server und ist hier abgeschaltet. Der Fortschritt bleibt in diesem Browser gespeichert.", friendsinfo:"Du kannst nur Spieler hinzufügen, deren Namen du tippen kannst. Deshalb sind Namen auf Buchstaben, Ziffern, Leerzeichen und . _ - begrenzt.", friendspending:"Einladungen und Online-Status kommen mit dem Server.", nofriends:"Noch keine Freunde hinzugefügt.", mass:"Masse", objectives:"Aufgaben", largest:"Größte Körper", integrity:"Integrität", protected:"Geschützt {0}s — Teilen beendet es", feast:"Weit geteilt — du kannst jetzt Pulsare fressen", bodiesleft:"Körper übrig", fieldcloses:"Feld schrumpft in", final:"Ende", clanbattle:"Clankampf", yourclan:"Dein Clan", rivals:"Rivalen", royale:"Battle Royale", st0:"Staub", st1:"Geröll", st2:"Planetesimal", st3:"Protoplanet", st4:"Welt", m_open:"Freier Raum", m_open_b:"Alle gegen alle auf der ganzen Karte. Volle Belohnung.", m_royale:"Battle Royale", m_royale_b:"Alle starten gleich, das Feld schrumpft. Der letzte Körper gewinnt.", m_clan:"Clankampf", m_clan_b:"Zwei Clans, gespiegelte Arena, fünf Minuten. Die höchste Clanmasse gewinnt.", m_friendly:"Freundschaftsspiel", m_friendly_b:"Gespiegelte Arena, alle starten gleich. Übung — keine Belohnung.", scattered:"Zerstreut", oreearned:"Ore verdient", peakmass:"Spitzenmasse", swallowed:"Verschlungene Körper", reached:"Erreicht", newbest:"Neuer Bestwert", wonround:"Battle Royale gewonnen", objective:"Aufgabe", levelup:"Level {0} erreicht. Freigeschaltet:", practice:"Freundschaftsspiel — nur Übung, kein Ore und kein XP.", enterstarts:"Enter oder Leertaste startet die nächste Runde", shortof:"{0} Masse unter deinem Bestwert.", owned:"Im Besitz", levelreq:"Level {0}", orereq:"{0} Ore", ownedcount:"{0} von {1} im Besitz", nextup:"Als Nächstes:", allunlocked:"Alles freigeschaltet.", selected:"{0} gewählt.", bought:"{0} für {1} Ore gekauft.", needlevel:"{0} wird ab Level {1} frei.", needore:"{0} kostet {1} Ore.", maxlevel:"Höchststufe", level:"Level", bestmass:"Bestmasse"},
  es:{play:"Jugar como invitado", start:"Empezar", forming:"Formando…", skins:"Designs", friends:"Amigos", settings:"Ajustes", legal:"Legal", back:"Volver", done:"Listo", again:"Jugar otra vez", addfriend:"Añadir amigo", remove:"Quitar", language:"Idioma", mode:"Modo", designation:"Nombre", surfacepick:"Diseño — toca para cambiar", playername:"Nombre del jugador", tagline:"Empiezas como un grano de polvo. Devora escombros, devora rivales y conviértete en un mundo con anillos y lunas propias.", namerule:"Solo letras, números, espacio, . _ - — para que cualquiera pueda escribirlo.", earned:"Sin ventajas duraderas a la venta. Todos los diseños se pueden ganar jugando.", ctrlmouse:"Mueve con el ratón · Espacio divide · W suelta masa", ctrltouch:"Arrastra para dirigir · los dos botones dividen y sueltan masa", guestnote:"El inicio de sesión necesita un servidor y está desactivado. El progreso se guarda en este navegador.", friendsinfo:"Solo puedes añadir jugadores cuyo nombre puedas escribir. Por eso los nombres se limitan a letras, números, espacio y . _ -", friendspending:"Las invitaciones y el estado en línea llegan con el servidor.", nofriends:"Aún no hay amigos.", mass:"masa", objectives:"Objetivos", largest:"Cuerpos mayores", integrity:"Integridad", protected:"Protegido {0}s — dividir lo termina", feast:"Muy dividido — ahora puedes tragar púlsares", bodiesleft:"Cuerpos restantes", fieldcloses:"El campo cierra en", final:"final", clanbattle:"Batalla de clanes", yourclan:"Tu clan", rivals:"Rivales", royale:"Battle royale", st0:"Polvo", st1:"Escombros", st2:"Planetesimal", st3:"Protoplaneta", st4:"Mundo", m_open:"Espacio abierto", m_open_b:"Todos contra todos en el mapa completo. Recompensa completa.", m_royale:"Battle royale", m_royale_b:"Todos empiezan igual, el campo se cierra. Gana el último cuerpo.", m_clan:"Batalla de clanes", m_clan_b:"Dos clanes, arena reflejada, cinco minutos. Gana la mayor masa del clan.", m_friendly:"Partida amistosa", m_friendly_b:"Arena reflejada, todos empiezan igual. Práctica — sin recompensas.", scattered:"Disperso", oreearned:"Ore ganado", peakmass:"Masa máxima", swallowed:"Cuerpos tragados", reached:"Alcanzado", newbest:"Nuevo récord personal", wonround:"Battle royale ganado", objective:"Objetivo", levelup:"Nivel {0} alcanzado. Desbloqueado:", practice:"Partida amistosa — solo práctica, sin Ore ni XP.", enterstarts:"Enter o espacio inicia la siguiente ronda", shortof:"{0} de masa por debajo de tu récord.", owned:"Obtenida", levelreq:"Nivel {0}", orereq:"{0} Ore", ownedcount:"{0} de {1} obtenidos", nextup:"Siguiente:", allunlocked:"Todo desbloqueado.", selected:"{0} seleccionado.", bought:"Compraste {0} por {1} Ore.", needlevel:"{0} se desbloquea en el nivel {1}.", needore:"{0} cuesta {1} Ore.", maxlevel:"nivel máximo", level:"Nivel", bestmass:"masa récord"},
  pt:{play:"Jogar como convidado", start:"Começar", forming:"Formando…", skins:"Designs", friends:"Amigos", settings:"Ajustes", legal:"Jurídico", back:"Voltar", done:"Pronto", again:"Jogar de novo", addfriend:"Adicionar amigo", remove:"Remover", language:"Idioma", mode:"Modo", designation:"Nome", surfacepick:"Design — toque para trocar", playername:"Nome do jogador", tagline:"Você começa como um grão de poeira. Devore destroços, devore rivais e torne-se um mundo com anéis e luas próprias.", namerule:"Apenas letras, números, espaço, . _ - — para qualquer um conseguir digitar.", earned:"Sem vantagens duradouras à venda. Todo design pode ser conquistado jogando.", ctrlmouse:"Mova com o mouse · Espaço divide · W solta massa", ctrltouch:"Arraste para dirigir · os dois botões dividem e soltam massa", guestnote:"O login precisa de um servidor e está desativado. O progresso fica guardado neste navegador.", friendsinfo:"Só dá para adicionar jogadores cujo nome você consiga digitar. Por isso os nomes se limitam a letras, números, espaço e . _ -", friendspending:"Convites e status online chegam com o servidor.", nofriends:"Nenhum amigo ainda.", mass:"massa", objectives:"Objetivos", largest:"Maiores corpos", integrity:"Integridade", protected:"Protegido {0}s — dividir encerra", feast:"Bem dividido — agora pode engolir pulsares", bodiesleft:"Corpos restantes", fieldcloses:"O campo fecha em", final:"final", clanbattle:"Batalha de clãs", yourclan:"Seu clã", rivals:"Rivais", royale:"Battle royale", st0:"Poeira", st1:"Cascalho", st2:"Planetesimal", st3:"Protoplaneta", st4:"Mundo", m_open:"Espaço aberto", m_open_b:"Todos contra todos no mapa inteiro. Recompensa total.", m_royale:"Battle royale", m_royale_b:"Todos começam iguais, o campo fecha. Vence o último corpo.", m_clan:"Batalha de clãs", m_clan_b:"Dois clãs, arena espelhada, cinco minutos. Vence a maior massa do clã.", m_friendly:"Partida amistosa", m_friendly_b:"Arena espelhada, todos começam iguais. Treino — sem recompensas.", scattered:"Disperso", oreearned:"Ore ganho", peakmass:"Massa máxima", swallowed:"Corpos engolidos", reached:"Alcançado", newbest:"Novo recorde pessoal", wonround:"Battle royale vencido", objective:"Objetivo", levelup:"Nível {0} alcançado. Desbloqueado:", practice:"Partida amistosa — só treino, sem Ore nem XP.", enterstarts:"Enter ou espaço começa a próxima rodada", shortof:"{0} de massa abaixo do seu recorde.", owned:"Obtida", levelreq:"Nível {0}", orereq:"{0} Ore", ownedcount:"{0} de {1} obtidos", nextup:"Próximo:", allunlocked:"Tudo desbloqueado.", selected:"{0} selecionado.", bought:"Você comprou {0} por {1} Ore.", needlevel:"{0} libera no nível {1}.", needore:"{0} custa {1} Ore.", maxlevel:"nível máximo", level:"Nível", bestmass:"massa recorde"},
  fr:{play:"Jouer en invité", start:"Démarrer", forming:"Formation…", skins:"Designs", friends:"Amis", settings:"Réglages", legal:"Mentions légales", back:"Retour", done:"Terminé", again:"Rejouer", addfriend:"Ajouter un ami", remove:"Retirer", language:"Langue", mode:"Mode", designation:"Nom", surfacepick:"Design — touchez pour changer", playername:"Nom du joueur", tagline:"Vous commencez comme un grain de poussière. Dévorez débris et rivaux, et devenez un monde avec vos propres anneaux et lunes.", namerule:"Lettres, chiffres, espace, . _ - uniquement — pour que chacun puisse le taper.", earned:"Aucun avantage durable à vendre. Chaque design peut se gagner en jouant.", ctrlmouse:"Souris pour se déplacer · Espace divise · W éjecte de la masse", ctrltouch:"Glissez pour diriger · les deux boutons divisent et éjectent la masse", guestnote:"La connexion nécessite un serveur et est désactivée. La progression est enregistrée dans ce navigateur.", friendsinfo:"Vous ne pouvez ajouter que des joueurs dont vous pouvez taper le nom. D'où la limite aux lettres, chiffres, espace et . _ -", friendspending:"Les invitations et le statut en ligne viendront avec le serveur.", nofriends:"Aucun ami pour l'instant.", mass:"masse", objectives:"Objectifs", largest:"Plus grands corps", integrity:"Intégrité", protected:"Protégé {0}s — se diviser y met fin", feast:"Bien divisé — vous pouvez avaler des pulsars", bodiesleft:"Corps restants", fieldcloses:"Le champ se referme dans", final:"final", clanbattle:"Combat de clans", yourclan:"Votre clan", rivals:"Rivaux", royale:"Battle royale", st0:"Poussière", st1:"Gravats", st2:"Planétésimal", st3:"Protoplanète", st4:"Monde", m_open:"Espace libre", m_open_b:"Chacun pour soi sur toute la carte. Récompense complète.", m_royale:"Battle royale", m_royale_b:"Tous égaux au départ, le champ se referme. Le dernier corps gagne.", m_clan:"Combat de clans", m_clan_b:"Deux clans, arène en miroir, cinq minutes. La plus grande masse gagne.", m_friendly:"Match amical", m_friendly_b:"Arène en miroir, tous égaux. Entraînement — sans récompense.", scattered:"Dispersé", oreearned:"Minerai gagné", peakmass:"Masse maximale", swallowed:"Corps avalés", reached:"Atteint", newbest:"Nouveau record personnel", wonround:"Battle royale gagné", objective:"Objectif", levelup:"Niveau {0} atteint. Débloqué :", practice:"Match amical — entraînement seul, ni minerai ni XP.", enterstarts:"Entrée ou espace lance la manche suivante", shortof:"{0} de masse sous votre record.", owned:"Obtenue", levelreq:"Niveau {0}", orereq:"{0} minerai", ownedcount:"{0} sur {1} obtenus", nextup:"Ensuite :", allunlocked:"Tout est débloqué.", selected:"{0} sélectionné.", bought:"{0} acheté pour {1} minerai.", needlevel:"{0} se débloque au niveau {1}.", needore:"{0} coûte {1} minerai.", maxlevel:"niveau max", level:"Niveau", bestmass:"meilleure masse"},
  tr:{play:"Misafir olarak oyna", start:"Başla", forming:"Oluşuyor…", skins:"Tasarımlar", friends:"Arkadaşlar", settings:"Ayarlar", legal:"Yasal", back:"Geri", done:"Bitti", again:"Tekrar oyna", addfriend:"Arkadaş ekle", remove:"Kaldır", language:"Dil", mode:"Mod", designation:"Ad", surfacepick:"Tasarım — değiştirmek için dokun", playername:"Oyuncu adı", tagline:"Bir toz zerresi olarak başlarsın. Enkazı ve rakipleri yut, kendi halkaları ve uyduları olan bir dünyaya dönüş.", namerule:"Yalnızca harf, rakam, boşluk, . _ - — herkes yazabilsin diye.", earned:"Kalıcı avantaj satılmaz. Her tasarım oynayarak kazanılabilir.", ctrlmouse:"Fareyle hareket · Boşluk böler · W kütle atar", ctrltouch:"Sürükleyerek yönlendir · iki düğme böler ve kütle atar", guestnote:"Giriş bir sunucu gerektirir ve kapalıdır. İlerleme bu tarayıcıda saklanır.", friendsinfo:"Yalnızca adını yazabildiğin oyuncuları ekleyebilirsin. Bu yüzden adlar harf, rakam, boşluk ve . _ - ile sınırlıdır.", friendspending:"Davetler ve çevrimiçi durumu sunucuyla gelir.", nofriends:"Henüz arkadaş yok.", mass:"kütle", objectives:"Görevler", largest:"En büyük cisimler", integrity:"Bütünlük", protected:"Korumalı {0}s — bölünmek bitirir", feast:"Geniş bölündün — artık pulsarları yutabilirsin", bodiesleft:"Kalan cisim", fieldcloses:"Alan kapanıyor", final:"son", clanbattle:"Klan savaşı", yourclan:"Klanın", rivals:"Rakipler", royale:"Battle royale", st0:"Toz", st1:"Moloz", st2:"Gezegenimsi", st3:"Ön gezegen", st4:"Dünya", m_open:"Açık uzay", m_open_b:"Haritanın tamamında herkes herkese karşı. Tam ödül.", m_royale:"Battle royale", m_royale_b:"Herkes eşit başlar, alan daralır. Ayakta kalan son cisim kazanır.", m_clan:"Klan savaşı", m_clan_b:"İki klan, aynalı arena, beş dakika. En yüksek klan kütlesi kazanır.", m_friendly:"Hazırlık maçı", m_friendly_b:"Aynalı arena, herkes eşit başlar. Antrenman — ödül yok.", scattered:"Dağıldın", oreearned:"Kazanılan cevher", peakmass:"Zirve kütle", swallowed:"Yutulan cisim", reached:"Ulaşıldı", newbest:"Yeni kişisel rekor", wonround:"Battle royale kazanıldı", objective:"Görev", levelup:"Seviye {0}. Açıldı:", practice:"Hazırlık maçı — sadece antrenman, cevher ve XP yok.", enterstarts:"Enter veya boşluk sonraki turu başlatır", shortof:"Rekorunun {0} kütle altında.", owned:"Sende var", levelreq:"Seviye {0}", orereq:"{0} cevher", ownedcount:"{1} tasarımdan {0} tanesi", nextup:"Sıradaki:", allunlocked:"Her şey açıldı.", selected:"{0} seçildi.", bought:"{0}, {1} cevhere alındı.", needlevel:"{0} seviye {1}'de açılır.", needore:"{0} {1} cevher değerinde.", maxlevel:"en yüksek seviye", level:"Seviye", bestmass:"en iyi kütle"},
  ru:{play:"Играть как гость", start:"Начать", forming:"Формируется…", skins:"Дизайны", friends:"Друзья", settings:"Настройки", legal:"Правовое", back:"Назад", done:"Готово", again:"Играть снова", addfriend:"Добавить друга", remove:"Убрать", language:"Язык", mode:"Режим", designation:"Имя", surfacepick:"Дизайн — нажмите, чтобы сменить", playername:"Имя игрока", tagline:"Вы начинаете как пылинка. Поглощайте обломки и соперников и станьте миром с собственными кольцами и лунами.", namerule:"Только буквы, цифры, пробел, . _ - — чтобы имя мог набрать любой.", earned:"Долгих преимуществ в продаже нет. Любой дизайн можно заработать игрой.", ctrlmouse:"Мышь — движение · Пробел — деление · W — сброс массы", ctrltouch:"Проведите пальцем для управления · две кнопки делят и сбрасывают массу", guestnote:"Вход требует сервера и отключён. Прогресс сохраняется в этом браузере.", friendsinfo:"Добавить можно только игроков, чьё имя вы способны набрать. Поэтому имена ограничены буквами, цифрами, пробелом и . _ -", friendspending:"Приглашения и статус онлайн появятся вместе с сервером.", nofriends:"Друзей пока нет.", mass:"масса", objectives:"Задачи", largest:"Крупнейшие тела", integrity:"Целостность", protected:"Защита {0}с — деление снимает её", feast:"Широко разделён — теперь можно глотать пульсары", bodiesleft:"Осталось тел", fieldcloses:"Поле сжимается через", final:"финал", clanbattle:"Битва кланов", yourclan:"Ваш клан", rivals:"Соперники", royale:"Королевская битва", st0:"Пыль", st1:"Обломки", st2:"Планетезималь", st3:"Протопланета", st4:"Мир", m_open:"Открытый космос", m_open_b:"Все против всех на всей карте. Полная награда.", m_royale:"Королевская битва", m_royale_b:"Все начинают одинаково, поле сжимается. Побеждает последний.", m_clan:"Битва кланов", m_clan_b:"Два клана, зеркальная арена, пять минут. Побеждает большая масса клана.", m_friendly:"Товарищеский матч", m_friendly_b:"Зеркальная арена, все равны. Тренировка — без наград.", scattered:"Рассеян", oreearned:"Добыто руды", peakmass:"Пиковая масса", swallowed:"Поглощено тел", reached:"Достигнуто", newbest:"Новый личный рекорд", wonround:"Королевская битва выиграна", objective:"Задача", levelup:"Уровень {0}. Открыто:", practice:"Товарищеский матч — только тренировка, без руды и опыта.", enterstarts:"Enter или пробел начинает следующий заход", shortof:"На {0} массы меньше рекорда.", owned:"Есть", levelreq:"Уровень {0}", orereq:"{0} руды", ownedcount:"{0} из {1}", nextup:"Далее:", allunlocked:"Всё открыто.", selected:"Выбрано: {0}.", bought:"{0} куплено за {1} руды.", needlevel:"{0} открывается на уровне {1}.", needore:"{0} стоит {1} руды.", maxlevel:"макс. уровень", level:"Уровень", bestmass:"лучшая масса"},
};
const LANGS2 = {
  en:{h_move:"Move the mouse to steer. Sweep up the dust to grow.", h_move_t:"Drag anywhere to steer. Sweep up the dust to grow.", h_prey:"Anything clearly smaller than you can be swallowed. Just run it over.", h_threat:"That one can eat you — but you are faster. Small bodies always outrun large ones.", h_split:"Space splits you toward the cursor — the only way to catch something running.", h_split_t:"Tap Split to lunge — the only way to catch something running away.", h_hide:"Those spiked bodies are pulsars. They shred large players — while you are small, they are cover.", h_bite:"You are large enough now — covering a pulsar will tear you into pieces.", h_shed:"W throws mass. Feed a pulsar five times and it spits out a new one along your line of fire.", h_shed_t:"Shed throws mass. Feed a pulsar five times and it spits out a new one.", g_st2:"Reach Planetesimal", g_st3:"Reach Protoplanet", g_st4:"Reach World", g_k5:"Swallow 5 bodies", g_k12:"Swallow 12 bodies", g_pul:"Feed a pulsar until it spawns another", g_spl:"Swallow a body within 6s of splitting", g_deb:"Sweep up 300 debris", g_srv:"Stay alive for three minutes", g_top5:"Finish in the top five", g_win:"Win the round", g_clan:"Lead with your clan at the end", l_split:"You split and could not finish the kill. Split pieces move apart and stay vulnerable for several seconds — only split when the target is already within reach.", l_split2:"You split, then met something bigger. Halving yourself halves what you can survive.", l_close:"Only slightly bigger than you. Bodies near your own size are the real danger — you can outrun the giants, not the close ones.", l_shrunk:"You had already lost a third of your peak before this. Above 1200 mass you shrink steadily; keep feeding or stay small on purpose.", l_early:"Caught early. Use the five protected seconds to put distance between yourself and anything large.", l_watch:"Watch the leaderboard: the top bodies are worth knowing the position of before they are close enough to matter.", l_zone:"The field closed while you were outside it. The edge drains mass faster the bigger you are — move at the first warning, not the last.", r_by:"Swallowed by {0} at {1} mass", r_pieces:"while you were split into {0} pieces", r_after:"{0}s after splitting", r_zone:"Caught outside the closing field.", r_line:"{0} reached {1} mass — {2} — swallowed {3} and held together for {4} seconds.", r_last:"Last body standing.", r_placed:"Placed {0} of {1}.", r_timeup:"Time up.", r_biggest:"Largest body when time ran out.", r_clanwin:"Your clan wins, {0} to {1}.", r_clanlose:"Rivals win, {0} to {1}.", r_even:"Dead even.", r_bodies:"{0} bodies", r_body:"one body"},
  de:{h_move:"Maus bewegen zum Steuern. Sammle den Staub ein, um zu wachsen.", h_move_t:"Irgendwo ziehen zum Steuern. Sammle den Staub ein, um zu wachsen.", h_prey:"Alles deutlich Kleinere kannst du verschlingen. Einfach überfahren.", h_threat:"Der kann dich fressen — aber du bist schneller. Kleine Körper entkommen großen immer.", h_split:"Leertaste teilt dich Richtung Zeiger — der einzige Weg, Fliehende zu fangen.", h_split_t:"Split antippen für den Sprung — der einzige Weg, Fliehende zu fangen.", h_hide:"Die stacheligen Körper sind Pulsare. Sie zerreißen Große — solange du klein bist, sind sie Deckung.", h_bite:"Du bist jetzt groß genug — einen Pulsar zu überdecken zerreißt dich in Stücke.", h_shed:"W wirft Masse ab. Füttere einen Pulsar fünfmal, und er stößt einen neuen in Wurfrichtung aus.", h_shed_t:"Shed wirft Masse ab. Füttere einen Pulsar fünfmal, und er stößt einen neuen aus.", g_st2:"Planetesimal erreichen", g_st3:"Protoplanet erreichen", g_st4:"Welt erreichen", g_k5:"5 Körper verschlingen", g_k12:"12 Körper verschlingen", g_pul:"Einen Pulsar füttern, bis er einen neuen ausstößt", g_spl:"Innerhalb 6s nach dem Teilen einen Körper fressen", g_deb:"300 Trümmer aufsammeln", g_srv:"Drei Minuten überleben", g_top5:"Unter die besten fünf kommen", g_win:"Die Runde gewinnen", g_clan:"Am Ende mit dem Clan führen", l_split:"Du hast geteilt und den Angriff nicht zu Ende gebracht. Geteilte Stücke driften auseinander und bleiben Sekunden lang verwundbar — teile nur, wenn das Ziel schon in Reichweite ist.", l_split2:"Du hast geteilt und bist dann auf etwas Größeres getroffen. Wer sich halbiert, halbiert auch, was er überlebt.", l_close:"Nur wenig größer als du. Körper in deiner Größenordnung sind die eigentliche Gefahr — den Riesen entkommst du, den Ähnlichen nicht.", l_shrunk:"Du hattest schon ein Drittel deiner Spitzenmasse verloren. Ab 1200 Masse schrumpfst du stetig — friss weiter oder bleib absichtlich klein.", l_early:"Früh erwischt. Nutz die fünf geschützten Sekunden, um Abstand zu allem Großen zu gewinnen.", l_watch:"Behalte die Rangliste im Blick: Wo die größten Körper stehen, sollte man wissen, bevor sie nah genug sind, um zu zählen.", l_zone:"Das Feld schloss sich, während du draußen warst. Die Kante zehrt umso schneller, je größer du bist — lauf bei der ersten Warnung los, nicht bei der letzten.", r_by:"Verschlungen von {0} mit {1} Masse", r_pieces:"während du in {0} Stücke geteilt warst", r_after:"{0}s nach dem Teilen", r_zone:"Außerhalb des schrumpfenden Feldes erwischt.", r_line:"{0} erreichte {1} Masse — {2} — verschlang {3} und hielt {4} Sekunden zusammen.", r_last:"Letzter Körper im Feld.", r_placed:"Platz {0} von {1}.", r_timeup:"Zeit abgelaufen.", r_biggest:"Größter Körper bei Ablauf der Zeit.", r_clanwin:"Dein Clan gewinnt, {0} zu {1}.", r_clanlose:"Die Rivalen gewinnen, {0} zu {1}.", r_even:"Unentschieden.", r_bodies:"{0} Körper", r_body:"einen Körper"},
  es:{h_move:"Mueve el ratón para dirigir. Recoge el polvo para crecer.", h_move_t:"Arrastra para dirigir. Recoge el polvo para crecer.", h_prey:"Puedes tragar todo lo claramente más pequeño. Solo pásale por encima.", h_threat:"Ese puede comerte — pero tú eres más rápido. Los pequeños siempre escapan de los grandes.", h_split:"Espacio te divide hacia el cursor — la única forma de atrapar a quien huye.", h_split_t:"Toca Split para lanzarte — la única forma de atrapar a quien huye.", h_hide:"Esos cuerpos con púas son púlsares. Destrozan a los grandes — mientras seas pequeño, son refugio.", h_bite:"Ya eres bastante grande — cubrir un púlsar te hará pedazos.", h_shed:"W lanza masa. Alimenta un púlsar cinco veces y escupirá uno nuevo en tu línea de tiro.", h_shed_t:"Shed lanza masa. Alimenta un púlsar cinco veces y escupirá uno nuevo.", g_st2:"Llega a Planetesimal", g_st3:"Llega a Protoplaneta", g_st4:"Llega a Mundo", g_k5:"Traga 5 cuerpos", g_k12:"Traga 12 cuerpos", g_pul:"Alimenta un púlsar hasta que genere otro", g_spl:"Traga un cuerpo en los 6s tras dividirte", g_deb:"Recoge 300 escombros", g_srv:"Sobrevive tres minutos", g_top5:"Termina entre los cinco primeros", g_win:"Gana la ronda", g_clan:"Lidera con tu clan al final", l_split:"Te dividiste y no remataste. Los trozos se separan y quedan vulnerables varios segundos — divídete solo cuando el objetivo ya esté a tu alcance.", l_split2:"Te dividiste y luego te topaste con algo mayor. Partirte en dos parte en dos lo que puedes sobrevivir.", l_close:"Solo un poco mayor que tú. Los cuerpos de tu tamaño son el peligro real — puedes huir de los gigantes, no de los parecidos.", l_shrunk:"Ya habías perdido un tercio de tu máximo. Por encima de 1200 de masa encoges sin parar: sigue comiendo o quédate pequeño a propósito.", l_early:"Te pillaron pronto. Usa los cinco segundos de protección para alejarte de todo lo grande.", l_watch:"Mira la clasificación: conviene saber dónde están los mayores antes de que estén lo bastante cerca.", l_zone:"El campo se cerró contigo fuera. El borde consume más rápido cuanto mayor eres — muévete con el primer aviso, no con el último.", r_by:"Tragado por {0} con {1} de masa", r_pieces:"mientras estabas dividido en {0} trozos", r_after:"{0}s tras dividirte", r_zone:"Atrapado fuera del campo que se cierra.", r_line:"{0} alcanzó {1} de masa — {2} — tragó {3} y aguantó {4} segundos.", r_last:"Último cuerpo en pie.", r_placed:"Puesto {0} de {1}.", r_timeup:"Tiempo agotado.", r_biggest:"El cuerpo más grande al acabar el tiempo.", r_clanwin:"Tu clan gana, {0} a {1}.", r_clanlose:"Ganan los rivales, {0} a {1}.", r_even:"Empate total.", r_bodies:"{0} cuerpos", r_body:"un cuerpo"},
  pt:{h_move:"Mova o mouse para dirigir. Recolha a poeira para crescer.", h_move_t:"Arraste para dirigir. Recolha a poeira para crescer.", h_prey:"Você pode engolir tudo bem menor que você. É só passar por cima.", h_threat:"Aquele pode te comer — mas você é mais rápido. Os pequenos sempre escapam dos grandes.", h_split:"Espaço divide você na direção do cursor — o único jeito de pegar quem foge.", h_split_t:"Toque em Split para avançar — o único jeito de pegar quem foge.", h_hide:"Aqueles corpos espinhosos são pulsares. Eles rasgam os grandes — enquanto você é pequeno, são abrigo.", h_bite:"Você já está grande — cobrir um pulsar vai te despedaçar.", h_shed:"W solta massa. Alimente um pulsar cinco vezes e ele cospe um novo na sua direção de tiro.", h_shed_t:"Shed solta massa. Alimente um pulsar cinco vezes e ele cospe um novo.", g_st2:"Chegue a Planetesimal", g_st3:"Chegue a Protoplaneta", g_st4:"Chegue a Mundo", g_k5:"Engula 5 corpos", g_k12:"Engula 12 corpos", g_pul:"Alimente um pulsar até ele gerar outro", g_spl:"Engula um corpo em 6s após dividir", g_deb:"Recolha 300 destroços", g_srv:"Sobreviva três minutos", g_top5:"Termine entre os cinco primeiros", g_win:"Vença a rodada", g_clan:"Lidere com seu clã no final", l_split:"Você dividiu e não concluiu o ataque. Os pedaços se separam e ficam vulneráveis por segundos — divida só quando o alvo já estiver ao alcance.", l_split2:"Você dividiu e então encontrou algo maior. Dividir-se pela metade reduz pela metade o que você sobrevive.", l_close:"Só um pouco maior que você. Corpos do seu tamanho são o perigo real — dos gigantes você foge, dos parecidos não.", l_shrunk:"Você já tinha perdido um terço do seu pico. Acima de 1200 de massa você encolhe sem parar: continue comendo ou fique pequeno de propósito.", l_early:"Pego cedo. Use os cinco segundos de proteção para se afastar de tudo que é grande.", l_watch:"Fique de olho no ranking: vale saber onde estão os maiores antes de eles chegarem perto.", l_zone:"O campo fechou com você do lado de fora. A borda consome mais rápido quanto maior você é — corra ao primeiro aviso, não ao último.", r_by:"Engolido por {0} com {1} de massa", r_pieces:"enquanto você estava dividido em {0} pedaços", r_after:"{0}s após dividir", r_zone:"Pego fora do campo que fecha.", r_line:"{0} alcançou {1} de massa — {2} — engoliu {3} e resistiu {4} segundos.", r_last:"Último corpo de pé.", r_placed:"Lugar {0} de {1}.", r_timeup:"Tempo esgotado.", r_biggest:"O maior corpo quando o tempo acabou.", r_clanwin:"Seu clã vence, {0} a {1}.", r_clanlose:"Os rivais vencem, {0} a {1}.", r_even:"Empate total.", r_bodies:"{0} corpos", r_body:"um corpo"},
  fr:{h_move:"Bougez la souris pour diriger. Ramassez la poussière pour grandir.", h_move_t:"Glissez pour diriger. Ramassez la poussière pour grandir.", h_prey:"Tout ce qui est nettement plus petit peut être avalé. Passez dessus.", h_threat:"Celui-là peut vous manger — mais vous êtes plus rapide. Les petits distancent toujours les grands.", h_split:"Espace vous divise vers le curseur — le seul moyen d'attraper un fuyard.", h_split_t:"Touchez Split pour bondir — le seul moyen d'attraper un fuyard.", h_hide:"Ces corps hérissés sont des pulsars. Ils déchirent les grands — tant que vous êtes petit, ils vous abritent.", h_bite:"Vous êtes assez grand — recouvrir un pulsar vous mettra en pièces.", h_shed:"W éjecte de la masse. Nourrissez un pulsar cinq fois et il en crache un nouveau dans votre axe de tir.", h_shed_t:"Shed éjecte de la masse. Nourrissez un pulsar cinq fois, il en crache un nouveau.", g_st2:"Atteindre Planétésimal", g_st3:"Atteindre Protoplanète", g_st4:"Atteindre Monde", g_k5:"Avaler 5 corps", g_k12:"Avaler 12 corps", g_pul:"Nourrir un pulsar jusqu'à ce qu'il en crée un autre", g_spl:"Avaler un corps dans les 6s après division", g_deb:"Ramasser 300 débris", g_srv:"Survivre trois minutes", g_top5:"Finir dans les cinq premiers", g_win:"Gagner la manche", g_clan:"Mener avec votre clan à la fin", l_split:"Vous vous êtes divisé sans achever l'attaque. Les morceaux s'écartent et restent vulnérables plusieurs secondes — ne divisez que si la cible est déjà à portée.", l_split2:"Vous vous êtes divisé puis avez croisé plus gros. Se couper en deux divise aussi ce que l'on survit.", l_close:"À peine plus gros que vous. Les corps de votre taille sont le vrai danger — on distance les géants, pas les semblables.", l_shrunk:"Vous aviez déjà perdu un tiers de votre maximum. Au-delà de 1200 de masse, on rétrécit sans cesse : continuez à manger ou restez petit exprès.", l_early:"Pris tôt. Profitez des cinq secondes de protection pour vous éloigner de tout ce qui est gros.", l_watch:"Surveillez le classement : mieux vaut savoir où sont les plus gros avant qu'ils ne soient trop proches.", l_zone:"Le champ s'est refermé alors que vous étiez dehors. Le bord draine d'autant plus vite que vous êtes gros — partez au premier avertissement.", r_by:"Avalé par {0} à {1} de masse", r_pieces:"alors que vous étiez divisé en {0} morceaux", r_after:"{0}s après la division", r_zone:"Pris hors du champ qui se referme.", r_line:"{0} a atteint {1} de masse — {2} — a avalé {3} et a tenu {4} secondes.", r_last:"Dernier corps debout.", r_placed:"Classé {0} sur {1}.", r_timeup:"Temps écoulé.", r_biggest:"Le plus grand corps à la fin du temps.", r_clanwin:"Votre clan gagne, {0} à {1}.", r_clanlose:"Les rivaux gagnent, {0} à {1}.", r_even:"Parfaitement à égalité.", r_bodies:"{0} corps", r_body:"un corps"},
  tr:{h_move:"Yönlenmek için fareyi hareket ettir. Büyümek için tozu topla.", h_move_t:"Yönlenmek için sürükle. Büyümek için tozu topla.", h_prey:"Senden belirgin küçük olan her şeyi yutabilirsin. Üzerinden geç.", h_threat:"O seni yiyebilir — ama sen daha hızlısın. Küçükler büyüklerden hep kaçar.", h_split:"Boşluk seni imlece doğru böler — kaçanı yakalamanın tek yolu.", h_split_t:"Atılmak için Split'e dokun — kaçanı yakalamanın tek yolu.", h_hide:"O dikenli cisimler pulsar. Büyükleri paramparça eder — sen küçükken siper olur.", h_bite:"Artık yeterince büyüksün — bir pulsarı örtmek seni parçalara ayırır.", h_shed:"W kütle atar. Bir pulsarı beş kez besle, atış hattında yenisini çıkarsın.", h_shed_t:"Shed kütle atar. Bir pulsarı beş kez besle, yenisini çıkarsın.", g_st2:"Gezegenimsiye ulaş", g_st3:"Ön gezegene ulaş", g_st4:"Dünyaya ulaş", g_k5:"5 cisim yut", g_k12:"12 cisim yut", g_pul:"Bir pulsarı yenisini doğurana dek besle", g_spl:"Bölündükten sonra 6s içinde bir cisim yut", g_deb:"300 enkaz topla", g_srv:"Üç dakika hayatta kal", g_top5:"İlk beşte bitir", g_win:"Turu kazan", g_clan:"Sonda klanınla önde ol", l_split:"Böldün ama işi bitiremedin. Parçalar birbirinden uzaklaşır ve saniyelerce savunmasız kalır — yalnızca hedef menzildeyken böl.", l_split2:"Böldün, sonra daha büyüğüne rastladın. Kendini ikiye bölmek, hayatta kalabileceğini de ikiye böler.", l_close:"Senden sadece biraz büyüktü. Asıl tehlike kendi boyutundakiler — devlerden kaçarsın, yakınlardan kaçamazsın.", l_shrunk:"Zirvenin üçte birini çoktan kaybetmiştin. 1200 kütlenin üstünde sürekli küçülürsün: ya beslenmeye devam et ya da bilerek küçük kal.", l_early:"Erken yakalandın. Beş saniyelik korumayı büyük her şeyden uzaklaşmak için kullan.", l_watch:"Sıralamayı takip et: en büyüklerin nerede olduğunu, yaklaşmadan önce bilmekte fayda var.", l_zone:"Alan sen dışarıdayken kapandı. Kenar, büyüdükçe daha hızlı kütle emer — son uyarıyı değil, ilkini dikkate al.", r_by:"{0} tarafından {1} kütleyle yutuldun", r_pieces:"{0} parçaya bölünmüşken", r_after:"bölünmeden {0}s sonra", r_zone:"Kapanan alanın dışında yakalandın.", r_line:"{0}, {1} kütleye ulaştı — {2} — {3} yuttu ve {4} saniye dayandı.", r_last:"Ayakta kalan son cisim.", r_placed:"{1} içinde {0}. sıra.", r_timeup:"Süre doldu.", r_biggest:"Süre bitince en büyük cisim.", r_clanwin:"Klanın kazandı, {0}'a {1}.", r_clanlose:"Rakipler kazandı, {0}'a {1}.", r_even:"Tam berabere.", r_bodies:"{0} cisim", r_body:"bir cisim"},
  ru:{h_move:"Двигайте мышью, чтобы управлять. Собирайте пыль, чтобы расти.", h_move_t:"Проведите пальцем для управления. Собирайте пыль, чтобы расти.", h_prey:"Всё заметно меньшее можно поглотить. Просто наезжайте.", h_threat:"Он может вас съесть — но вы быстрее. Малые всегда убегают от крупных.", h_split:"Пробел делит вас в сторону курсора — единственный способ догнать беглеца.", h_split_t:"Нажмите Split для рывка — единственный способ догнать беглеца.", h_hide:"Эти шипастые тела — пульсары. Они рвут крупных, а мелким служат укрытием.", h_bite:"Теперь вы достаточно велики — накрыв пульсар, вы разлетитесь на куски.", h_shed:"W сбрасывает массу. Накормите пульсар пять раз — он выбросит новый по линии броска.", h_shed_t:"Shed сбрасывает массу. Накормите пульсар пять раз — он выбросит новый.", g_st2:"Достичь планетезимали", g_st3:"Достичь протопланеты", g_st4:"Достичь мира", g_k5:"Поглотить 5 тел", g_k12:"Поглотить 12 тел", g_pul:"Кормить пульсар, пока он не породит новый", g_spl:"Поглотить тело в течение 6с после деления", g_deb:"Собрать 300 обломков", g_srv:"Продержаться три минуты", g_top5:"Финишировать в пятёрке", g_win:"Выиграть раунд", g_clan:"Лидировать кланом в конце", l_split:"Вы разделились и не довели атаку. Части расходятся и остаются уязвимыми несколько секунд — делитесь, только когда цель уже в пределах досягаемости.", l_split2:"Вы разделились и встретили кого-то крупнее. Разделившись пополам, вы вдвое сокращаете то, что переживёте.", l_close:"Лишь немного крупнее вас. Настоящая опасность — тела вашего размера: от гигантов вы убежите, от близких нет.", l_shrunk:"Вы уже потеряли треть своего пика. Свыше 1200 массы вы неуклонно уменьшаетесь: продолжайте есть или намеренно оставайтесь малыми.", l_early:"Поймали рано. Используйте пять защищённых секунд, чтобы уйти подальше от всего крупного.", l_watch:"Следите за таблицей: где крупнейшие тела, лучше знать до того, как они окажутся рядом.", l_zone:"Поле сомкнулось, пока вы были снаружи. Край тем быстрее съедает массу, чем вы крупнее — двигайтесь по первому предупреждению.", r_by:"Вас поглотил {0} при массе {1}", r_pieces:"когда вы были разделены на {0} частей", r_after:"через {0}с после деления", r_zone:"Пойманы за пределами сжимающегося поля.", r_line:"{0} достиг массы {1} — {2} — поглотил {3} и продержался {4} секунд.", r_last:"Последний выживший.", r_placed:"Место {0} из {1}.", r_timeup:"Время вышло.", r_biggest:"Крупнейшее тело на момент окончания.", r_clanwin:"Ваш клан побеждает, {0} против {1}.", r_clanlose:"Побеждают соперники, {0} против {1}.", r_even:"Ровно поровну.", r_bodies:"{0} тел", r_body:"одно тело"},
};
for (const c in LANGS2) Object.assign(LANGS[c], LANGS2[c]);
const LANGS3 = {
  en:{boost:"Start bonus", boostoff:"Off", boostnote:"Open space only. Bigger also means slower and easier to spot. Paid with Ore you earned.", boostpoor:"Not enough Ore — starting at normal size.", boostonly:"Start bonus works in Open space only.",},
  de:{boost:"Startbonus", boostoff:"Aus", boostnote:"Nur im freien Raum. Größer heißt auch langsamer und auffälliger. Bezahlt mit erspieltem Ore.", boostpoor:"Zu wenig Ore — Start in normaler Größe.", boostonly:"Der Startbonus wirkt nur im freien Raum.",},
  es:{boost:"Bono inicial", boostoff:"No", boostnote:"Solo en espacio abierto. Más grande también es más lento y más visible. Se paga con Ore ganado.", boostpoor:"Ore insuficiente — empiezas en tamaño normal.", boostonly:"El bono inicial solo funciona en espacio abierto.",},
  pt:{boost:"Bônus inicial", boostoff:"Não", boostnote:"Só no espaço aberto. Maior também é mais lento e mais visível. Pago com Ore conquistado.", boostpoor:"Ore insuficiente — começando no tamanho normal.", boostonly:"O bônus inicial só funciona no espaço aberto.",},
  fr:{boost:"Bonus de départ", boostoff:"Non", boostnote:"Uniquement en espace libre. Plus gros veut dire plus lent et plus visible. Payé en minerai gagné.", boostpoor:"Pas assez de minerai — départ en taille normale.", boostonly:"Le bonus de départ ne fonctionne qu'en espace libre.",},
  tr:{boost:"Başlangıç bonusu", boostoff:"Kapalı", boostnote:"Yalnızca açık uzayda. Daha büyük olmak daha yavaş ve daha görünür demek. Kazanılan cevherle ödenir.", boostpoor:"Yetersiz cevher — normal boyutta başlıyorsun.", boostonly:"Başlangıç bonusu yalnızca açık uzayda çalışır.",},
  ru:{boost:"Стартовый бонус", boostoff:"Нет", boostnote:"Только в открытом космосе. Крупнее — значит медленнее и заметнее. Оплата заработанной рудой.", boostpoor:"Недостаточно руды — старт обычного размера.", boostonly:"Стартовый бонус работает только в открытом космосе.",},
};
for (const c in LANGS3) Object.assign(LANGS[c], LANGS3[c]);
const LANGS4 = {
  en:{lvlup:"Level {0}", lvlskin:"New design: {0}", lvlworn:"Now worn"},
  de:{lvlup:"Level {0}", lvlskin:"Neues Design: {0}", lvlworn:"Jetzt getragen"},
  es:{lvlup:"Nivel {0}", lvlskin:"Nuevo diseño: {0}", lvlworn:"Ya equipada"},
  pt:{lvlup:"Nível {0}", lvlskin:"Novo design: {0}", lvlworn:"Já equipada"},
  fr:{lvlup:"Niveau {0}", lvlskin:"Nouveau design : {0}", lvlworn:"Maintenant portée"},
  tr:{lvlup:"Seviye {0}", lvlskin:"Yeni tasarım: {0}", lvlworn:"Şimdi takılı"},
  ru:{lvlup:"Уровень {0}", lvlskin:"Новый дизайн: {0}", lvlworn:"Надета"},
};
for (const c in LANGS4) Object.assign(LANGS[c], LANGS4[c]);
const LANGS5 = {
  en:{earned:"No lasting advantages for sale. Every design can be earned by playing."},
  de:{earned:"Keine dauerhaften Vorteile käuflich. Jedes Design kann man sich erspielen."},
  es:{earned:"Sin ventajas duraderas a la venta. Todos los diseños se pueden ganar jugando."},
  pt:{earned:"Sem vantagens duradouras à venda. Todo design pode ser conquistado jogando."},
  fr:{earned:"Aucun avantage durable à vendre. Chaque design peut se gagner en jouant."},
  tr:{earned:"Kalıcı avantaj satılmaz. Her tasarım oynayarak kazanılabilir."},
  ru:{earned:"Долгих преимуществ в продаже нет. Любой дизайн можно заработать игрой."},
};
for (const c in LANGS5) Object.assign(LANGS[c], LANGS5[c]);
const LANGS6 = {
  en:{unnamed:"Unnamed body", checkhead:"Quick check", checksub:"Your input reads as automated. Drag the grain into the well to continue.", checkdrag:"Drag it, don't click it. The motion itself is what's measured.", checksmooth:"That path was too smooth. Drag it again, by hand.", checkwell:"The grain has to reach the well. Try again.", shoppick:"Pick a design, or buy one you can afford.", shopintro:"21 unlock by level, 25 by Ore. Ore comes from peak mass, from bodies you swallow, and from beating your own best.", shoprank:"Rank I to VI changes the design itself — higher ranks glow, spike and carry shards, so others can read how far you have come.", fr_added:"Added {0}. They will show as online once the server runs.", fr_removed:"Removed {0}.", fr_already:"{0} is already on your list.", fr_own:"That is your own name.", fr_type:"Type a player name first.", fr_full:"List is full at 50.", namefix:"Removed characters that are not on every keyboard. Allowed: A-Z, 0-9, space, . _ -"},
  de:{unnamed:"Namenloser Körper", checkhead:"Kurze Prüfung", checksub:"Deine Eingaben wirken maschinell. Zieh das Korn in den Ring, dann geht es weiter.", checkdrag:"Ziehen, nicht klicken. Gemessen wird die Bewegung selbst.", checksmooth:"Die Bahn war zu gleichmäßig. Zieh noch einmal, mit der Hand.", checkwell:"Das Korn muss in den Ring. Noch einmal.", shoppick:"Wähl ein Design oder kauf eins, das du dir leisten kannst.", shopintro:"21 werden durch Level frei, 25 durch Ore. Ore kommt aus Spitzenmasse, verschlungenen Körpern und dem Schlagen des eigenen Bestwerts.", shoprank:"Rang I bis VI verändert das Design selbst — höhere Ränge glühen, tragen Stacheln und Splitter, damit andere sehen, wie weit du bist.", fr_added:"{0} hinzugefügt. Online-Status kommt, sobald der Server läuft.", fr_removed:"{0} entfernt.", fr_already:"{0} steht schon auf deiner Liste.", fr_own:"Das ist dein eigener Name.", fr_type:"Tipp zuerst einen Spielernamen ein.", fr_full:"Die Liste ist bei 50 voll.", namefix:"Zeichen entfernt, die nicht auf jeder Tastatur sind. Erlaubt: A-Z, 0-9, Leerzeichen, . _ -"},
  es:{unnamed:"Cuerpo sin nombre", checkhead:"Comprobación rápida", checksub:"Tus entradas parecen automáticas. Arrastra el grano al anillo para continuar.", checkdrag:"Arrastra, no hagas clic. Se mide el movimiento en sí.", checksmooth:"Ese trazo fue demasiado uniforme. Arrastra otra vez, a mano.", checkwell:"El grano tiene que llegar al anillo. Inténtalo otra vez.", shoppick:"Elige un diseño o compra uno que puedas pagar.", shopintro:"21 se desbloquean por nivel, 25 con Ore. El Ore viene de la masa máxima, de los cuerpos que tragas y de superar tu récord.", shoprank:"El rango I a VI cambia el diseño en sí: los rangos altos brillan, tienen púas y fragmentos, para que otros vean hasta dónde llegaste.", fr_added:"{0} añadido. Aparecerá en línea cuando el servidor funcione.", fr_removed:"{0} eliminado.", fr_already:"{0} ya está en tu lista.", fr_own:"Ese es tu propio nombre.", fr_type:"Escribe primero un nombre de jugador.", fr_full:"La lista está llena con 50.", namefix:"Se quitaron caracteres que no están en todos los teclados. Permitido: A-Z, 0-9, espacio, . _ -"},
  pt:{unnamed:"Corpo sem nome", checkhead:"Verificação rápida", checksub:"Suas entradas parecem automáticas. Arraste o grão até o anel para continuar.", checkdrag:"Arraste, não clique. O que se mede é o movimento.", checksmooth:"Esse traço foi uniforme demais. Arraste de novo, com a mão.", checkwell:"O grão precisa chegar ao anel. Tente de novo.", shoppick:"Escolha um design ou compre um que possa pagar.", shopintro:"21 liberam por nível, 25 com Ore. O Ore vem da massa máxima, dos corpos que você engole e de superar seu recorde.", shoprank:"O rank I a VI muda o design em si: ranks altos brilham, têm espinhos e fragmentos, para que outros vejam até onde você chegou.", fr_added:"{0} adicionado. Vai aparecer online quando o servidor rodar.", fr_removed:"{0} removido.", fr_already:"{0} já está na sua lista.", fr_own:"Esse é o seu próprio nome.", fr_type:"Digite primeiro um nome de jogador.", fr_full:"A lista está cheia com 50.", namefix:"Removidos caracteres que não existem em todo teclado. Permitido: A-Z, 0-9, espaço, . _ -"},
  fr:{unnamed:"Corps sans nom", checkhead:"Vérification rapide", checksub:"Vos entrées semblent automatisées. Faites glisser le grain dans l'anneau pour continuer.", checkdrag:"Glissez, ne cliquez pas. C'est le mouvement qui est mesuré.", checksmooth:"Ce tracé était trop régulier. Recommencez, à la main.", checkwell:"Le grain doit atteindre l'anneau. Réessayez.", shoppick:"Choisissez un design ou achetez-en un à votre portée.", shopintro:"21 se débloquent par niveau, 25 avec du minerai. Le minerai vient de la masse maximale, des corps avalés et des records battus.", shoprank:"Le rang I à VI change le design lui-même : les rangs élevés brillent, portent des pointes et des éclats, pour montrer où vous en êtes.", fr_added:"{0} ajouté. Apparaîtra en ligne dès que le serveur tournera.", fr_removed:"{0} retiré.", fr_already:"{0} est déjà dans votre liste.", fr_own:"C'est votre propre nom.", fr_type:"Saisissez d'abord un nom de joueur.", fr_full:"La liste est pleine à 50.", namefix:"Caractères absents de certains claviers retirés. Autorisé : A-Z, 0-9, espace, . _ -"},
  tr:{unnamed:"İsimsiz cisim", checkhead:"Kısa kontrol", checksub:"Girişlerin otomatik görünüyor. Devam etmek için taneyi halkaya sürükle.", checkdrag:"Tıklama, sürükle. Ölçülen şey hareketin kendisi.", checksmooth:"Bu yol fazla düzgündü. Elinle bir daha sürükle.", checkwell:"Tane halkaya ulaşmalı. Yeniden dene.", shoppick:"Bir tasarım seç ya da gücünün yettiği birini al.", shopintro:"21'i seviyeyle, 25'i cevherle açılır. Cevher zirve kütleden, yuttuğun cisimlerden ve kendi rekorunu kırmaktan gelir.", shoprank:"Rütbe I'den VI'ya tasarımın kendisini değiştirir — yüksek rütbeler parlar, dikenler ve parçalar taşır; herkes ne kadar ilerlediğini görür.", fr_added:"{0} eklendi. Sunucu çalışınca çevrimiçi görünecek.", fr_removed:"{0} kaldırıldı.", fr_already:"{0} zaten listende.", fr_own:"Bu senin kendi adın.", fr_type:"Önce bir oyuncu adı yaz.", fr_full:"Liste 50'de dolu.", namefix:"Her klavyede olmayan karakterler kaldırıldı. İzin verilen: A-Z, 0-9, boşluk, . _ -"},
  ru:{unnamed:"Безымянное тело", checkhead:"Быстрая проверка", checksub:"Ваш ввод выглядит автоматическим. Перетащите крупицу в кольцо, чтобы продолжить.", checkdrag:"Тяните, а не щёлкайте. Измеряется само движение.", checksmooth:"Траектория была слишком ровной. Протяните ещё раз, рукой.", checkwell:"Крупица должна попасть в кольцо. Ещё раз.", shoppick:"Выберите дизайн или купите тот, что по карману.", shopintro:"21 открывается за уровень, 25 — за руду. Руда идёт от пиковой массы, поглощённых тел и побитых рекордов.", shoprank:"Ранг с I по VI меняет сам дизайн: высокие ранги светятся, обрастают шипами и осколками, чтобы другие видели ваш путь.", fr_added:"{0} добавлен. Появится в сети, когда заработает сервер.", fr_removed:"{0} удалён.", fr_already:"{0} уже в списке.", fr_own:"Это ваше собственное имя.", fr_type:"Сначала введите имя игрока.", fr_full:"Список заполнен на 50.", namefix:"Удалены символы, которых нет на всех клавиатурах. Разрешено: A-Z, 0-9, пробел, . _ -"},
};
for (const c in LANGS6) Object.assign(LANGS[c], LANGS6[c]);
const LANGS7 = {
  en:{st0h:"Sweep up debris. Nothing out here is smaller than you yet.", st1h:"Craters now. You can take anything loose and slow.", st2h:"Your core is melting. Heat shows through the cracks.", st3h:"An atmosphere is holding. Pulsars will shatter you now.", st4h:"Rings and moons. Everything left is worth eating.", i_ok:"Input looks human.", i_auto:"Automated browser detected.", i_synth:"Events not produced by a device.", i_speed:"Cursor speed is unnaturally even.", i_straight:"Path is too straight to be a hand.", i_timing:"Input timing is machine-regular.", i_aim:"Targeting is too precise.", i_fast:"Actions arriving too fast.", i_pass:"Check passed.", p_split:"Split", p_shed:"Shed", rotate:"Turn your device sideways. Talumi plays in landscape.", setnote:"These are kept on this device, not in your account.", k_start:"Hangar", k_stat:"Stats", k_next:"Next achievements", k_manage:"manage", k_guest:"Guest"},
  de:{st0h:"Sammle Trümmer ein. Hier draußen ist noch nichts kleiner als du.", st1h:"Jetzt mit Kratern. Alles Lose und Langsame kannst du nehmen.", st2h:"Dein Kern schmilzt. Die Glut zeigt sich in den Rissen.", st3h:"Eine Atmosphäre hält. Pulsare zerreißen dich jetzt.", st4h:"Ringe und Monde. Alles Verbliebene lohnt sich zu fressen.", i_ok:"Eingaben wirken menschlich.", i_auto:"Automatisierter Browser erkannt.", i_synth:"Eingaben stammen nicht vom Gerät.", i_speed:"Zeigertempo ist unnatürlich gleichmäßig.", i_straight:"Die Bahn ist zu gerade für eine Hand.", i_timing:"Der Eingabetakt ist maschinell regelmäßig.", i_aim:"Die Zielwahl ist zu genau.", i_fast:"Aktionen kommen zu schnell.", i_pass:"Prüfung bestanden.", p_split:"Teilen", p_shed:"Abwerfen", rotate:"Dreh dein Gerät quer. Talumi läuft im Querformat.", setnote:"Diese Einstellungen bleiben auf diesem Gerät, nicht im Konto.", k_start:"Hangar", k_stat:"Statistik", k_next:"Nächste Errungenschaften", k_manage:"verwalten", k_guest:"Gast"},
  es:{st0h:"Recoge escombros. Aquí fuera nada es más pequeño que tú todavía.", st1h:"Ahora con cráteres. Puedes con todo lo suelto y lento.", st2h:"Tu núcleo se funde. El calor asoma por las grietas.", st3h:"Se sostiene una atmósfera. Ahora los púlsares te destrozan.", st4h:"Anillos y lunas. Todo lo que queda vale la pena comérselo.", i_ok:"Las entradas parecen humanas.", i_auto:"Navegador automatizado detectado.", i_synth:"Eventos no producidos por un dispositivo.", i_speed:"La velocidad del cursor es antinaturalmente uniforme.", i_straight:"El trazo es demasiado recto para una mano.", i_timing:"El ritmo de entrada es de máquina.", i_aim:"La puntería es demasiado precisa.", i_fast:"Las acciones llegan demasiado rápido.", i_pass:"Comprobación superada.", p_split:"Dividir", p_shed:"Soltar", rotate:"Gira el dispositivo. Talumi se juega en horizontal.", setnote:"Se guardan en este dispositivo, no en tu cuenta.", k_start:"Hangar", k_stat:"Estadísticas", k_next:"Próximos logros", k_manage:"gestionar", k_guest:"Invitado"},
  pt:{st0h:"Recolha destroços. Aqui fora nada é menor que você ainda.", st1h:"Agora com crateras. Você dá conta de tudo que é solto e lento.", st2h:"Seu núcleo está derretendo. O calor aparece nas fendas.", st3h:"Uma atmosfera se mantém. Agora os pulsares te despedaçam.", st4h:"Anéis e luas. Tudo o que resta vale a pena comer.", i_ok:"As entradas parecem humanas.", i_auto:"Navegador automatizado detectado.", i_synth:"Eventos não vindos de um dispositivo.", i_speed:"A velocidade do cursor é uniforme demais.", i_straight:"O traço é reto demais para uma mão.", i_timing:"O ritmo das entradas é de máquina.", i_aim:"A mira é precisa demais.", i_fast:"As ações chegam rápido demais.", i_pass:"Verificação aprovada.", p_split:"Dividir", p_shed:"Soltar", rotate:"Vire o aparelho. Talumi roda na horizontal.", setnote:"Ficam guardadas neste aparelho, não na sua conta.", k_start:"Hangar", k_stat:"Estatísticas", k_next:"Próximas conquistas", k_manage:"gerenciar", k_guest:"Convidado"},
  fr:{st0h:"Ramassez des débris. Rien ici n'est encore plus petit que vous.", st1h:"Des cratères, désormais. Tout ce qui est isolé et lent est à vous.", st2h:"Votre noyau fond. La chaleur perce par les fissures.", st3h:"Une atmosphère tient. Les pulsars vous déchirent désormais.", st4h:"Anneaux et lunes. Tout ce qui reste vaut d'être avalé.", i_ok:"Les entrées semblent humaines.", i_auto:"Navigateur automatisé détecté.", i_synth:"Événements non produits par un appareil.", i_speed:"La vitesse du curseur est anormalement régulière.", i_straight:"Le tracé est trop droit pour une main.", i_timing:"Le rythme des entrées est celui d'une machine.", i_aim:"La visée est trop précise.", i_fast:"Les actions arrivent trop vite.", i_pass:"Vérification réussie.", p_split:"Diviser", p_shed:"Éjecter", rotate:"Tournez votre appareil. Talumi se joue en paysage.", setnote:"Elles restent sur cet appareil, pas dans votre compte.", k_start:"Hangar", k_stat:"Statistiques", k_next:"Prochains hauts faits", k_manage:"gérer", k_guest:"Invité"},
  tr:{st0h:"Enkaz topla. Burada henüz senden küçük bir şey yok.", st1h:"Artık kraterlisin. Başıboş ve yavaş olan her şeyi alabilirsin.", st2h:"Çekirdeğin eriyor. Isı çatlaklardan görünüyor.", st3h:"Bir atmosfer tutunuyor. Artık pulsarlar seni parçalar.", st4h:"Halkalar ve uydular. Kalan her şey yemeye değer.", i_ok:"Girişler insana benziyor.", i_auto:"Otomatik tarayıcı tespit edildi.", i_synth:"Girdiler bir cihazdan gelmiyor.", i_speed:"İmleç hızı doğal olmayan biçimde düzgün.", i_straight:"Yol bir el için fazla düz.", i_timing:"Giriş ritmi makine düzeninde.", i_aim:"Nişan alma fazla isabetli.", i_fast:"Eylemler çok hızlı geliyor.", i_pass:"Kontrol geçildi.", p_split:"Böl", p_shed:"At", rotate:"Cihazını yan çevir. Talumi yatay oynanır.", setnote:"Bu ayarlar bu cihazda kalır, hesabında değil.", k_start:"Hangar", k_stat:"İstatistik", k_next:"Sıradaki başarımlar", k_manage:"yönet", k_guest:"Misafir"},
  ru:{st0h:"Собирайте обломки. Здесь пока нет никого меньше вас.", st1h:"Теперь с кратерами. Всё рыхлое и медленное — ваше.", st2h:"Ядро плавится. Жар пробивается сквозь трещины.", st3h:"Атмосфера держится. Пульсары теперь вас разорвут.", st4h:"Кольца и луны. Всё, что осталось, стоит съесть.", i_ok:"Ввод выглядит человеческим.", i_auto:"Обнаружен автоматический браузер.", i_synth:"События созданы не устройством.", i_speed:"Скорость курсора неестественно ровная.", i_straight:"Траектория слишком прямая для руки.", i_timing:"Ритм ввода машинно ровный.", i_aim:"Прицеливание слишком точное.", i_fast:"Действия поступают слишком часто.", i_pass:"Проверка пройдена.", p_split:"Делить", p_shed:"Сбросить", rotate:"Поверните устройство. Talumi играется горизонтально.", setnote:"Эти настройки хранятся на этом устройстве, а не в аккаунте.", k_start:"Ангар", k_stat:"Статистика", k_next:"Следующие достижения", k_manage:"изменить", k_guest:"Гость"},
};
for (const c in LANGS7) Object.assign(LANGS[c], LANGS7[c]);
const LANGS8 = {
  en:{s_sound:"Sound", s_shake:"Screen shake", s_stick:"Stick travel", s_side:"Button side", s_clan:"Clan colours", s_names:"Names", s_hints:"Beginner hints", s_edge:"HUD edge", s_perf:"Performance mode", s_sound_h:"Off silences everything, including the level chime.", s_shake_h:"Fires when a pulsar tears you apart.", s_stick_h:"Shorter travel turns quicker but overshoots more.", s_side_h:"Split and shed for left-handed play.", s_clan_h:"Green and red are the hardest pair for red-green colour blindness.", s_names_h:"Sixteen pieces can carry sixteen labels.", s_hints_h:"Situational one-liners during your first two runs. Switching back on replays them.", s_edge_h:"Move the numbers inwards if a camera cutout covers them.", s_perf_h:"Fewer stars, flat shading, no atmosphere glow. For older phones.", o_on:"On", o_off:"Off", o_quiet:"Quiet", o_normal:"Normal", o_loud:"Loud", o_short:"Short", o_long:"Long", o_right:"Right", o_left:"Left", o_gr:"Green–red", o_bo:"Blue–orange", o_all:"All", o_largest:"Largest", o_tight:"Tight", o_safe:"Safe"},
  de:{s_sound:"Ton", s_shake:"Bildwackeln", s_stick:"Stick-Weg", s_side:"Tastenseite", s_clan:"Clanfarben", s_names:"Namen", s_hints:"Anfängerhinweise", s_edge:"Rand der Anzeige", s_perf:"Sparmodus", s_sound_h:"Aus schaltet alles stumm, auch den Klang beim Levelaufstieg.", s_shake_h:"Tritt auf, wenn dich ein Pulsar zerreißt.", s_stick_h:"Kürzerer Weg dreht schneller, schießt aber öfter übers Ziel.", s_side_h:"Teilen und Abwerfen für Linkshänder.", s_clan_h:"Grün und Rot sind bei Rot-Grün-Schwäche das schwierigste Paar.", s_names_h:"Sechzehn Stücke tragen sechzehn Namen.", s_hints_h:"Kurze Hinweise zur Lage in den ersten zwei Runden. Wiedereinschalten zeigt sie erneut.", s_edge_h:"Rückt die Zahlen nach innen, falls eine Kamera-Aussparung sie verdeckt.", s_perf_h:"Weniger Sterne, flache Füllung, kein Atmosphärenschein. Für ältere Handys.", o_on:"An", o_off:"Aus", o_quiet:"Leise", o_normal:"Normal", o_loud:"Laut", o_short:"Kurz", o_long:"Lang", o_right:"Rechts", o_left:"Links", o_gr:"Grün–Rot", o_bo:"Blau–Orange", o_all:"Alle", o_largest:"Größtes", o_tight:"Eng", o_safe:"Sicher"},
  es:{s_sound:"Sonido", s_shake:"Sacudida de pantalla", s_stick:"Recorrido del stick", s_side:"Lado de los botones", s_clan:"Colores de clan", s_names:"Nombres", s_hints:"Ayuda para principiantes", s_edge:"Borde de la interfaz", s_perf:"Modo de rendimiento", s_sound_h:"Apagado silencia todo, incluido el sonido de subida de nivel.", s_shake_h:"Ocurre cuando un púlsar te destroza.", s_stick_h:"Un recorrido corto gira más rápido pero se pasa más.", s_side_h:"Dividir y soltar para zurdos.", s_clan_h:"Verde y rojo es el par más difícil con daltonismo rojo-verde.", s_names_h:"Dieciséis trozos pueden llevar dieciséis nombres.", s_hints_h:"Avisos breves según la situación en tus dos primeras partidas. Volver a activarlos los repite.", s_edge_h:"Mueve los números hacia dentro si una muesca de cámara los tapa.", s_perf_h:"Menos estrellas, sombreado plano, sin brillo atmosférico. Para móviles antiguos.", o_on:"Sí", o_off:"No", o_quiet:"Bajo", o_normal:"Normal", o_loud:"Alto", o_short:"Corto", o_long:"Largo", o_right:"Derecha", o_left:"Izquierda", o_gr:"Verde–rojo", o_bo:"Azul–naranja", o_all:"Todos", o_largest:"El mayor", o_tight:"Ajustado", o_safe:"Seguro"},
  pt:{s_sound:"Som", s_shake:"Tremor da tela", s_stick:"Curso do stick", s_side:"Lado dos botões", s_clan:"Cores de clã", s_names:"Nomes", s_hints:"Dicas para iniciantes", s_edge:"Borda da interface", s_perf:"Modo de desempenho", s_sound_h:"Desligado silencia tudo, inclusive o som de subir de nível.", s_shake_h:"Acontece quando um pulsar te despedaça.", s_stick_h:"Curso curto vira mais rápido, mas passa mais do ponto.", s_side_h:"Dividir e soltar para canhotos.", s_clan_h:"Verde e vermelho é o par mais difícil no daltonismo vermelho-verde.", s_names_h:"Dezesseis pedaços podem levar dezesseis nomes.", s_hints_h:"Avisos curtos conforme a situação nas suas duas primeiras partidas. Reativar mostra de novo.", s_edge_h:"Move os números para dentro se um recorte de câmera os cobrir.", s_perf_h:"Menos estrelas, sombreado plano, sem brilho atmosférico. Para celulares antigos.", o_on:"Sim", o_off:"Não", o_quiet:"Baixo", o_normal:"Normal", o_loud:"Alto", o_short:"Curto", o_long:"Longo", o_right:"Direita", o_left:"Esquerda", o_gr:"Verde–vermelho", o_bo:"Azul–laranja", o_all:"Todos", o_largest:"O maior", o_tight:"Justo", o_safe:"Seguro"},
  fr:{s_sound:"Son", s_shake:"Tremblement de l'écran", s_stick:"Course du stick", s_side:"Côté des boutons", s_clan:"Couleurs de clan", s_names:"Noms", s_hints:"Conseils débutants", s_edge:"Bord de l'interface", s_perf:"Mode performance", s_sound_h:"Désactivé coupe tout, y compris le son de montée de niveau.", s_shake_h:"Se déclenche quand un pulsar vous déchire.", s_stick_h:"Une course courte tourne plus vite mais dépasse davantage.", s_side_h:"Diviser et éjecter pour les gauchers.", s_clan_h:"Le vert et le rouge sont la paire la plus difficile en daltonisme.", s_names_h:"Seize morceaux peuvent porter seize noms.", s_hints_h:"De courts conseils selon la situation lors de vos deux premières parties. Les réactiver les rejoue.", s_edge_h:"Décale les chiffres vers l'intérieur si une découpe de caméra les masque.", s_perf_h:"Moins d'étoiles, ombrage plat, pas de halo atmosphérique. Pour téléphones anciens.", o_on:"Oui", o_off:"Non", o_quiet:"Faible", o_normal:"Normal", o_loud:"Fort", o_short:"Court", o_long:"Long", o_right:"Droite", o_left:"Gauche", o_gr:"Vert–rouge", o_bo:"Bleu–orange", o_all:"Tous", o_largest:"Le plus grand", o_tight:"Serré", o_safe:"Sûr"},
  tr:{s_sound:"Ses", s_shake:"Ekran sarsıntısı", s_stick:"Çubuk mesafesi", s_side:"Düğme tarafı", s_clan:"Klan renkleri", s_names:"Adlar", s_hints:"Yeni başlayan ipuçları", s_edge:"Arayüz kenarı", s_perf:"Performans modu", s_sound_h:"Kapalı her şeyi susturur, seviye sesi dahil.", s_shake_h:"Bir pulsar seni parçaladığında olur.", s_stick_h:"Kısa mesafe daha hızlı döner ama hedefi daha çok aşar.", s_side_h:"Solaklar için böl ve at.", s_clan_h:"Kırmızı-yeşil renk körlüğünde en zor ikili yeşil ve kırmızıdır.", s_names_h:"On altı parça on altı ad taşıyabilir.", s_hints_h:"İlk iki turunda duruma göre kısa ipuçları. Yeniden açmak onları tekrar gösterir.", s_edge_h:"Kamera çentiği sayıları örtüyorsa onları içeri al.", s_perf_h:"Daha az yıldız, düz gölgeleme, atmosfer parıltısı yok. Eski telefonlar için.", o_on:"Açık", o_off:"Kapalı", o_quiet:"Kısık", o_normal:"Normal", o_loud:"Yüksek", o_short:"Kısa", o_long:"Uzun", o_right:"Sağ", o_left:"Sol", o_gr:"Yeşil–kırmızı", o_bo:"Mavi–turuncu", o_all:"Hepsi", o_largest:"En büyük", o_tight:"Dar", o_safe:"Güvenli"},
  ru:{s_sound:"Звук", s_shake:"Тряска экрана", s_stick:"Ход стика", s_side:"Сторона кнопок", s_clan:"Цвета кланов", s_names:"Имена", s_hints:"Подсказки новичку", s_edge:"Край интерфейса", s_perf:"Режим экономии", s_sound_h:"«Нет» отключает всё, включая звук повышения уровня.", s_shake_h:"Срабатывает, когда пульсар разрывает вас.", s_stick_h:"Короткий ход поворачивает быстрее, но чаще промахивается.", s_side_h:"Деление и сброс для левшей.", s_clan_h:"Зелёный и красный — самая трудная пара при дальтонизме.", s_names_h:"Шестнадцать частей несут шестнадцать имён.", s_hints_h:"Короткие подсказки по ситуации в первых двух заходах. Повторное включение покажет их снова.", s_edge_h:"Сдвигает цифры внутрь, если их закрывает вырез камеры.", s_perf_h:"Меньше звёзд, плоская заливка, без свечения атмосферы. Для старых телефонов.", o_on:"Да", o_off:"Нет", o_quiet:"Тихо", o_normal:"Обычно", o_loud:"Громко", o_short:"Короткий", o_long:"Длинный", o_right:"Справа", o_left:"Слева", o_gr:"Зелёный–красный", o_bo:"Синий–оранжевый", o_all:"Все", o_largest:"Крупнейшее", o_tight:"Близко", o_safe:"С запасом"},
};
for (const c in LANGS8) Object.assign(LANGS[c], LANGS8[c]);
const LANGS9 = {
  en:{menu:"Menu", fair:"Fair play", fair1:"Without an account your progress stays in this browser. Signed in, it is kept on the game server.", fair2:"Nothing on sale gives a lasting advantage. Every design can be earned by playing, and buying only skips the wait.", fair3:"Advertising never interrupts a running round, and never in your first minutes.", fair4:"Anti-bot checks look at input timing and movement only. Nothing is sent anywhere."},
  de:{menu:"Menü", fair:"Fairness", fair1:"Ohne Konto bleibt dein Fortschritt in diesem Browser. Angemeldet liegt er auf dem Spielserver.", fair2:"Nichts Käufliches bringt einen dauerhaften Vorteil. Jedes Design kann man sich erspielen, Kaufen spart nur Wartezeit.", fair3:"Werbung unterbricht nie eine laufende Runde und nie deine ersten Minuten.", fair4:"Der Botschutz sieht nur auf Eingabetakt und Bewegung. Es wird nichts übertragen."},
  es:{menu:"Menú", fair:"Juego limpio", fair1:"Sin cuenta, tu progreso se queda en este navegador. Con sesión iniciada, se guarda en el servidor del juego.", fair2:"Nada de lo que se vende da una ventaja duradera. Todos los diseños se ganan jugando; comprar solo ahorra espera.", fair3:"La publicidad nunca interrumpe una partida en curso ni tus primeros minutos.", fair4:"El antibots solo mira el ritmo y el movimiento de entrada. No se envía nada."},
  pt:{menu:"Menu", fair:"Jogo limpo", fair1:"Sem conta, o seu progresso fica neste navegador. Com sessão iniciada, fica guardado no servidor do jogo.", fair2:"Nada à venda dá vantagem duradoura. Todo design se conquista jogando; comprar só poupa espera.", fair3:"A publicidade nunca interrompe uma partida em andamento nem os seus primeiros minutos.", fair4:"O antibôs olha apenas o ritmo e o movimento das entradas. Nada é enviado."},
  fr:{menu:"Menu", fair:"Fair-play", fair1:"Sans compte, votre progression reste dans ce navigateur. Connecté, elle est conservée sur le serveur du jeu.", fair2:"Rien de ce qui est vendu ne donne d'avantage durable. Chaque design se gagne en jouant ; acheter fait juste gagner du temps.", fair3:"La publicité n'interrompt jamais une manche en cours, ni vos premières minutes.", fair4:"L'anti-bot n'observe que le rythme et le mouvement des entrées. Rien n'est transmis."},
  tr:{menu:"Menü", fair:"Adil oyun", fair1:"Hesapsız ilerlemen bu tarayıcıda kalır. Giriş yaptığında oyun sunucusunda saklanır.", fair2:"Satılan hiçbir şey kalıcı avantaj vermez. Her tasarım oynayarak kazanılır; satın almak yalnızca beklemeyi kısaltır.", fair3:"Reklam asla süren bir turu ve ilk dakikalarını bölmez.", fair4:"Bot koruması yalnızca giriş ritmine ve harekete bakar. Hiçbir şey gönderilmez."},
  ru:{menu:"Меню", fair:"Честная игра", fair1:"Без аккаунта прогресс хранится в этом браузере. С аккаунтом — на игровом сервере.", fair2:"Ничто из продаваемого не даёт долгого преимущества. Любой дизайн добывается игрой, покупка лишь экономит ожидание.", fair3:"Реклама никогда не прерывает идущий раунд и не появляется в первые минуты.", fair4:"Защита от ботов смотрит лишь на ритм и движение ввода. Ничего не отправляется."},
};
for (const c in LANGS9) Object.assign(LANGS[c], LANGS9[c]);
const LANGS10 = {
  en:{s_theme:"Colours", s_theme_h:"Earth is the dark palette, Sand the light one.", o_earth:"Earth (dark)", o_sand:"Sand (light)"},
  de:{s_theme:"Farben", s_theme_h:"Erde ist die dunkle Palette, Sand die helle.", o_earth:"Erde (dunkel)", o_sand:"Sand (hell)"},
  es:{s_theme:"Colores", s_theme_h:"Tierra es la paleta oscura, Arena la clara.", o_earth:"Tierra (oscuro)", o_sand:"Arena (claro)"},
  pt:{s_theme:"Cores", s_theme_h:"Terra é a paleta escura, Areia a clara.", o_earth:"Terra (escuro)", o_sand:"Areia (claro)"},
  fr:{s_theme:"Couleurs", s_theme_h:"Terre est la palette sombre, Sable la claire.", o_earth:"Terre (sombre)", o_sand:"Sable (clair)"},
  tr:{s_theme:"Renkler", s_theme_h:"Toprak koyu paleti, Kum açık paleti.", o_earth:"Toprak (koyu)", o_sand:"Kum (açık)"},
  ru:{s_theme:"Цвета", s_theme_h:"«Земля» — тёмная палитра, «Песок» — светлая.", o_earth:"Земля (тёмная)", o_sand:"Песок (светлый)"},
};
for (const c in LANGS10) Object.assign(LANGS[c], LANGS10[c]);
const LANGS11 = {
  en:{rec:"Your records", rec_mass:"Largest body", rec_kills:"Most swallowed", rec_time:"Longest run", rec_royale:"Royale wins", rec_clan:"Clan wins", rec_runs:"Rounds played", rec_none:"Play a round to set your first record."},
  de:{rec:"Deine Bestwerte", rec_mass:"Größter Körper", rec_kills:"Meiste verschlungen", rec_time:"Längste Runde", rec_royale:"Royale-Siege", rec_clan:"Clan-Siege", rec_runs:"Gespielte Runden", rec_none:"Spiel eine Runde für deinen ersten Bestwert."},
  es:{rec:"Tus récords", rec_mass:"Cuerpo mayor", rec_kills:"Más tragados", rec_time:"Partida más larga", rec_royale:"Victorias royale", rec_clan:"Victorias de clan", rec_runs:"Partidas jugadas", rec_none:"Juega una partida para tu primer récord."},
  pt:{rec:"Seus recordes", rec_mass:"Maior corpo", rec_kills:"Mais engolidos", rec_time:"Partida mais longa", rec_royale:"Vitórias royale", rec_clan:"Vitórias de clã", rec_runs:"Partidas jogadas", rec_none:"Jogue uma partida para o seu primeiro recorde."},
  fr:{rec:"Vos records", rec_mass:"Plus grand corps", rec_kills:"Plus avalés", rec_time:"Plus longue manche", rec_royale:"Victoires royale", rec_clan:"Victoires de clan", rec_runs:"Manches jouées", rec_none:"Jouez une manche pour votre premier record."},
  tr:{rec:"Rekorların", rec_mass:"En büyük cisim", rec_kills:"En çok yutulan", rec_time:"En uzun tur", rec_royale:"Royale galibiyeti", rec_clan:"Klan galibiyeti", rec_runs:"Oynanan tur", rec_none:"İlk rekorun için bir tur oyna."},
  ru:{rec:"Ваши рекорды", rec_mass:"Крупнейшее тело", rec_kills:"Больше всего поглощено", rec_time:"Самый долгий заход", rec_royale:"Победы в королевской", rec_clan:"Победы кланом", rec_runs:"Сыграно раундов", rec_none:"Сыграйте раунд, чтобы поставить первый рекорд."},
};
for (const c in LANGS11) Object.assign(LANGS[c], LANGS11[c]);
/* Nachgetragene Schlüssel: Texte, die bisher fest auf Englisch im Spiel
   standen, unabhängig von der gewählten Sprache. */
const LANGS12 = {
  en:{field:"Field", skincount:"{0} of {1}", allskins:"all designs",
      powrun:"Running the entry check …", powdone:"Entry check cleared."},
  de:{field:"Feld", skincount:"{0} von {1}", allskins:"alle Designs",
      powrun:"Vorprüfung läuft …", powdone:"Vorprüfung bestanden."},
  es:{field:"Campo", skincount:"{0} de {1}", allskins:"todos los diseños",
      powrun:"Comprobación de entrada en curso …", powdone:"Comprobación de entrada superada."},
  pt:{field:"Campo", skincount:"{0} de {1}", allskins:"todos os designs",
      powrun:"Verificação de entrada em andamento …", powdone:"Verificação de entrada concluída."},
  fr:{field:"Champ", skincount:"{0} sur {1}", allskins:"tous les designs",
      powrun:"Vérification d'entrée en cours …", powdone:"Vérification d'entrée réussie."},
  tr:{field:"Alan", skincount:"{0} / {1}", allskins:"tüm tasarımlar",
      powrun:"Giriş kontrolü sürüyor …", powdone:"Giriş kontrolü geçildi."},
  ru:{field:"Поле", skincount:"{0} из {1}", allskins:"все дизайны",
      powrun:"Проверка входа выполняется …", powdone:"Проверка входа пройдена."},
};
for (const c in LANGS12) Object.assign(LANGS[c], LANGS12[c]);
/* Onlinebetrieb */
const LANGS13 = {
  en:{m_online:"Online", m_online_b:"Real players on an authoritative server. No rewards yet — the server has to grant them.",
      net_dial:"Connecting to the server …", net_lost:"Connection lost.",
      net_fail:"No server reachable. Playing offline against AI instead."},
  de:{m_online:"Online", m_online_b:"Echte Mitspieler auf einem autoritativen Server. Noch keine Belohnung — die darf erst der Server vergeben.",
      net_dial:"Verbindung zum Server …", net_lost:"Verbindung verloren.",
      net_fail:"Kein Server erreichbar. Stattdessen offline gegen KI."},
  es:{m_online:"En línea", m_online_b:"Jugadores reales en un servidor autoritativo. Aún sin recompensas — las otorgará el servidor.",
      net_dial:"Conectando con el servidor …", net_lost:"Conexión perdida.",
      net_fail:"Ningún servidor disponible. Se juega sin conexión contra la IA."},
  pt:{m_online:"Online", m_online_b:"Jogadores reais num servidor autoritativo. Ainda sem recompensas — o servidor vai concedê-las.",
      net_dial:"A ligar ao servidor …", net_lost:"Ligação perdida.",
      net_fail:"Nenhum servidor acessível. A jogar offline contra a IA."},
  fr:{m_online:"En ligne", m_online_b:"De vrais joueurs sur un serveur autoritatif. Pas encore de récompenses — c'est au serveur de les accorder.",
      net_dial:"Connexion au serveur …", net_lost:"Connexion perdue.",
      net_fail:"Aucun serveur joignable. Partie hors ligne contre l'IA."},
  tr:{m_online:"Çevrimiçi", m_online_b:"Yetkili bir sunucuda gerçek oyuncular. Henüz ödül yok — onu sunucu verecek.",
      net_dial:"Sunucuya bağlanılıyor …", net_lost:"Bağlantı kesildi.",
      net_fail:"Erişilebilir sunucu yok. Çevrimdışı, yapay zekâya karşı oynanıyor."},
  ru:{m_online:"Онлайн", m_online_b:"Живые игроки на авторитетном сервере. Награды пока нет — её должен выдавать сервер.",
      net_dial:"Подключение к серверу …", net_lost:"Соединение потеряно.",
      net_fail:"Сервер недоступен. Игра офлайн против ИИ."},
};
for (const c in LANGS13) Object.assign(LANGS[c], LANGS13[c]);

/* Konto, Anmeldung und täglicher Bonus */
const LANGS14 = {
  en:{k_email:"E-mail", k_pw:"Password", k_pwhint:"At least 8 characters.",
      k_signin:"Sign in", k_signup:"Create account",
      k_have:"Already have an account? Sign in", k_new:"No account yet? Create one",
      k_google:"Continue with Google", k_facebook:"Continue with Facebook",
      k_why:"With an account your progress is kept and you appear in the leaderboards. Without one it is saved only in this browser.",
      k_wait:"One moment …", k_hello:"Signed in as {0}", k_signout:"Sign out",
      k_offline:"The sign-in server is not reachable right now. Playing without an account still works.",
      k_soon:"Google and Facebook are coming. Use e-mail for now.",
      pwa_btn:"Install app", pwa_head:"Talumi on your home screen",
      pwa_why:"Installed, the game runs full screen — no address bar, no toolbar. It also starts offline.",
      pwa_ios1:"Tap the share button in Safari (the square with the arrow).",
      pwa_ios2:"Scroll down and choose “Add to Home Screen”.",
      pwa_ios3:"Confirm with “Add”. Talumi then sits next to your other apps.",
      pwa_and:"Your browser will ask once — confirm with “Install”.",
      pwa_close:"Got it",
      k_or:"or", a_more:"More about the game",
      a_pt1:"Free, in the browser, nothing to download.",
      a_pt2:"Nothing on sale gives a lasting advantage.",
      a_pt3:"46 designs, twenty ranks, four modes.",
      k_fremd_fehler:"That sign-in did not work. Try e-mail instead.",
      e_email:"That e-mail address does not look right.",
      e_pwshort:"The password needs at least 8 characters.",
      e_taken:"That e-mail address is already taken.",
      e_login:"E-mail or password is wrong.",
      e_many:"Too many attempts. Please wait a quarter of an hour.",
      e_name:"That name will not work. Letters, numbers, space and . _ - only.",
      e_blocked:"This account is blocked.",
      e_net:"The server is not answering. Try again later.",
      b_title:"Daily bonus", b_get:"Collect day {0} — {1} Ore",
      b_next:"Collected today. The run continues tomorrow.", b_got:"Day {0}: +{1} Ore"},

  de:{k_email:"E-Mail", k_pw:"Passwort", k_pwhint:"Mindestens 8 Zeichen.",
      k_signin:"Anmelden", k_signup:"Konto anlegen",
      k_have:"Schon ein Konto? Anmelden", k_new:"Noch kein Konto? Eins anlegen",
      k_google:"Weiter mit Google", k_facebook:"Weiter mit Facebook",
      k_why:"Mit Konto bleibt dein Fortschritt erhalten und du stehst in den Ranglisten. Ohne Konto bleibt er nur in diesem Browser gespeichert.",
      k_wait:"Einen Moment …", k_hello:"Angemeldet als {0}", k_signout:"Abmelden",
      k_offline:"Der Anmeldeserver ist gerade nicht erreichbar. Ohne Konto spielen geht weiter.",
      k_soon:"Google und Facebook kommen noch. Bis dahin mit E-Mail anmelden.",
      pwa_btn:"App installieren", pwa_head:"Talumi auf den Startbildschirm",
      pwa_why:"Installiert läuft das Spiel im Vollbild — ohne Adresszeile, ohne Werkzeugleiste. Und es startet auch ohne Netz.",
      pwa_ios1:"Tipp in Safari auf das Teilen-Symbol (das Quadrat mit dem Pfeil).",
      pwa_ios2:"Weiter nach unten wischen und „Zum Home-Bildschirm“ wählen.",
      pwa_ios3:"Mit „Hinzufügen“ bestätigen. Talumi liegt dann bei deinen anderen Apps.",
      pwa_and:"Dein Browser fragt einmal nach — bestätige mit „Installieren“.",
      pwa_close:"Verstanden",
      k_or:"oder", a_more:"Mehr über das Spiel",
      a_pt1:"Kostenlos, im Browser, nichts zu installieren.",
      a_pt2:"Nichts Käufliches bringt einen dauerhaften Vorteil.",
      a_pt3:"46 Designs, zwanzig Ränge, vier Spielarten.",
      k_fremd_fehler:"Diese Anmeldung hat nicht geklappt. Versuch es mit E-Mail.",
      e_email:"Diese E-Mail-Adresse sieht nicht richtig aus.",
      e_pwshort:"Das Passwort braucht mindestens 8 Zeichen.",
      e_taken:"Diese E-Mail-Adresse ist schon vergeben.",
      e_login:"E-Mail oder Passwort stimmt nicht.",
      e_many:"Zu viele Versuche. Bitte eine Viertelstunde warten.",
      e_name:"Der Name geht so nicht. Erlaubt sind Buchstaben, Ziffern, Leerzeichen und . _ -",
      e_blocked:"Dieses Konto ist gesperrt.",
      e_net:"Der Server antwortet nicht. Versuch es später noch einmal.",
      b_title:"Täglicher Bonus", b_get:"Tag {0} abholen — {1} Ore",
      b_next:"Heute abgeholt. Morgen geht die Reihe weiter.", b_got:"Tag {0}: +{1} Ore"},

  es:{k_email:"Correo electrónico", k_pw:"Contraseña", k_pwhint:"Al menos 8 caracteres.",
      k_signin:"Iniciar sesión", k_signup:"Crear cuenta",
      k_have:"¿Ya tienes cuenta? Inicia sesión", k_new:"¿Aún no tienes cuenta? Crea una",
      k_google:"Continuar con Google", k_facebook:"Continuar con Facebook",
      k_why:"Con una cuenta tu progreso se conserva y apareces en las clasificaciones. Sin ella solo se guarda en este navegador.",
      k_wait:"Un momento …", k_hello:"Sesión iniciada como {0}", k_signout:"Cerrar sesión",
      k_offline:"El servidor de acceso no está disponible ahora. Jugar sin cuenta sigue funcionando.",
      k_soon:"Google y Facebook llegarán pronto. Usa el correo por ahora.",
      pwa_btn:"Instalar app", pwa_head:"Talumi en tu pantalla de inicio",
      pwa_why:"Instalado, el juego ocupa toda la pantalla — sin barra de direcciones. Y arranca sin conexión.",
      pwa_ios1:"Pulsa el botón de compartir en Safari (el cuadrado con la flecha).",
      pwa_ios2:"Baja y elige «Añadir a pantalla de inicio».",
      pwa_ios3:"Confirma con «Añadir». Talumi quedará junto a tus otras apps.",
      pwa_and:"Tu navegador preguntará una vez — confirma con «Instalar».",
      pwa_close:"Entendido",
      k_or:"o", a_more:"Más sobre el juego",
      a_pt1:"Gratis, en el navegador, sin descargas.",
      a_pt2:"Nada de lo que se vende da ventaja duradera.",
      a_pt3:"46 diseños, veinte rangos, cuatro modos.",
      k_fremd_fehler:"Ese acceso no funcionó. Prueba con el correo.",
      e_email:"Esa dirección de correo no parece correcta.",
      e_pwshort:"La contraseña necesita al menos 8 caracteres.",
      e_taken:"Esa dirección de correo ya está en uso.",
      e_login:"El correo o la contraseña no son correctos.",
      e_many:"Demasiados intentos. Espera un cuarto de hora.",
      e_name:"Ese nombre no funciona. Solo letras, números, espacio y . _ -",
      e_blocked:"Esta cuenta está bloqueada.",
      e_net:"El servidor no responde. Inténtalo más tarde.",
      b_title:"Bono diario", b_get:"Recoger día {0} — {1} Ore",
      b_next:"Recogido hoy. La racha sigue mañana.", b_got:"Día {0}: +{1} Ore"},

  pt:{k_email:"E-mail", k_pw:"Palavra-passe", k_pwhint:"Pelo menos 8 caracteres.",
      k_signin:"Entrar", k_signup:"Criar conta",
      k_have:"Já tem conta? Entrar", k_new:"Ainda sem conta? Crie uma",
      k_google:"Continuar com Google", k_facebook:"Continuar com Facebook",
      k_why:"Com uma conta o seu progresso fica guardado e aparece nas classificações. Sem ela fica guardado só neste navegador.",
      k_wait:"Um momento …", k_hello:"Sessão iniciada como {0}", k_signout:"Sair",
      k_offline:"O servidor de acesso não está acessível agora. Jogar sem conta continua a funcionar.",
      k_soon:"Google e Facebook chegam em breve. Use o e-mail por agora.",
      pwa_btn:"Instalar app", pwa_head:"Talumi na sua tela inicial",
      pwa_why:"Instalado, o jogo ocupa a tela toda — sem barra de endereço. E abre sem internet.",
      pwa_ios1:"Toque no botão de compartilhar no Safari (o quadrado com a seta).",
      pwa_ios2:"Role para baixo e escolha «Adicionar à Tela de Início».",
      pwa_ios3:"Confirme com «Adicionar». Talumi fica junto dos seus outros apps.",
      pwa_and:"Seu navegador vai perguntar uma vez — confirme com «Instalar».",
      pwa_close:"Entendi",
      k_or:"ou", a_more:"Mais sobre o jogo",
      a_pt1:"Grátis, no navegador, sem instalar nada.",
      a_pt2:"Nada à venda dá vantagem duradoura.",
      a_pt3:"46 designs, vinte patentes, quatro modos.",
      k_fremd_fehler:"Esse acesso não funcionou. Tente com o e-mail.",
      e_email:"Esse endereço de e-mail não parece correto.",
      e_pwshort:"A palavra-passe precisa de pelo menos 8 caracteres.",
      e_taken:"Esse endereço de e-mail já está em uso.",
      e_login:"E-mail ou palavra-passe incorretos.",
      e_many:"Demasiadas tentativas. Aguarde um quarto de hora.",
      e_name:"Esse nome não funciona. Apenas letras, números, espaço e . _ -",
      e_blocked:"Esta conta está bloqueada.",
      e_net:"O servidor não responde. Tente mais tarde.",
      b_title:"Bónus diário", b_get:"Receber dia {0} — {1} Ore",
      b_next:"Recebido hoje. A série continua amanhã.", b_got:"Dia {0}: +{1} Ore"},

  fr:{k_email:"E-mail", k_pw:"Mot de passe", k_pwhint:"Au moins 8 caractères.",
      k_signin:"Se connecter", k_signup:"Créer un compte",
      k_have:"Déjà un compte ? Se connecter", k_new:"Pas encore de compte ? En créer un",
      k_google:"Continuer avec Google", k_facebook:"Continuer avec Facebook",
      k_why:"Avec un compte, votre progression est conservée et vous figurez dans les classements. Sans compte, elle n’est enregistrée que dans ce navigateur.",
      k_wait:"Un instant …", k_hello:"Connecté en tant que {0}", k_signout:"Se déconnecter",
      k_offline:"Le serveur de connexion est injoignable pour le moment. Jouer sans compte fonctionne toujours.",
      k_soon:"Google et Facebook arrivent. Utilisez l'e-mail pour l'instant.",
      pwa_btn:"Installer l’app", pwa_head:"Talumi sur votre écran d’accueil",
      pwa_why:"Installé, le jeu occupe tout l’écran — sans barre d’adresse. Et il démarre hors ligne.",
      pwa_ios1:"Touchez le bouton Partager dans Safari (le carré avec la flèche).",
      pwa_ios2:"Faites défiler et choisissez « Sur l’écran d’accueil ».",
      pwa_ios3:"Confirmez avec « Ajouter ». Talumi rejoint vos autres apps.",
      pwa_and:"Votre navigateur demandera une fois — confirmez avec « Installer ».",
      pwa_close:"Compris",
      k_or:"ou", a_more:"En savoir plus sur le jeu",
      a_pt1:"Gratuit, dans le navigateur, rien à installer.",
      a_pt2:"Rien de ce qui est vendu ne donne un avantage durable.",
      a_pt3:"46 designs, vingt rangs, quatre modes.",
      k_fremd_fehler:"Cette connexion n’a pas fonctionné. Essayez par e-mail.",
      e_email:"Cette adresse e-mail ne semble pas correcte.",
      e_pwshort:"Le mot de passe doit faire au moins 8 caractères.",
      e_taken:"Cette adresse e-mail est déjà prise.",
      e_login:"E-mail ou mot de passe incorrect.",
      e_many:"Trop de tentatives. Attendez un quart d'heure.",
      e_name:"Ce nom ne convient pas. Lettres, chiffres, espace et . _ - uniquement.",
      e_blocked:"Ce compte est bloqué.",
      e_net:"Le serveur ne répond pas. Réessayez plus tard.",
      b_title:"Bonus quotidien", b_get:"Récupérer le jour {0} — {1} Ore",
      b_next:"Récupéré aujourd'hui. La série continue demain.", b_got:"Jour {0} : +{1} Ore"},

  tr:{k_email:"E-posta", k_pw:"Parola", k_pwhint:"En az 8 karakter.",
      k_signin:"Giriş yap", k_signup:"Hesap oluştur",
      k_have:"Hesabın var mı? Giriş yap", k_new:"Hesabın yok mu? Bir tane oluştur",
      k_google:"Google ile devam et", k_facebook:"Facebook ile devam et",
      k_why:"Hesapla ilerlemen korunur ve sıralamalarda yer alırsın. Hesapsız yalnızca bu tarayıcıda saklanır.",
      k_wait:"Bir saniye …", k_hello:"{0} olarak giriş yapıldı", k_signout:"Çıkış yap",
      k_offline:"Giriş sunucusuna şu anda ulaşılamıyor. Hesapsız oynamak çalışmaya devam ediyor.",
      k_soon:"Google ve Facebook yakında. Şimdilik e-posta ile giriş yap.",
      pwa_btn:"Uygulamayı kur", pwa_head:"Talumi ana ekranında",
      pwa_why:"Kurulduğunda oyun tam ekran çalışır — adres çubuğu yok. Ayrıca çevrimdışı da açılır.",
      pwa_ios1:"Safari’de paylaş düğmesine dokun (oklu kare).",
      pwa_ios2:"Aşağı kaydır ve „Ana Ekrana Ekle“yi seç.",
      pwa_ios3:"„Ekle“ ile onayla. Talumi diğer uygulamalarının yanında olur.",
      pwa_and:"Tarayıcın bir kez soracak — „Kur“ ile onayla.",
      pwa_close:"Anladım",
      k_or:"veya", a_more:"Oyun hakkında daha fazlası",
      a_pt1:"Ücretsiz, tarayıcıda, indirme yok.",
      a_pt2:"Satılan hiçbir şey kalıcı üstünlük vermez.",
      a_pt3:"46 tasarım, yirmi rütbe, dört mod.",
      k_fremd_fehler:"Bu giriş işe yaramadı. E-posta ile dene.",
      e_email:"Bu e-posta adresi doğru görünmüyor.",
      e_pwshort:"Parola en az 8 karakter olmalı.",
      e_taken:"Bu e-posta adresi zaten alınmış.",
      e_login:"E-posta veya parola yanlış.",
      e_many:"Çok fazla deneme. Lütfen çeyrek saat bekle.",
      e_name:"Bu ad olmaz. Yalnızca harf, rakam, boşluk ve . _ -",
      e_blocked:"Bu hesap engellendi.",
      e_net:"Sunucu yanıt vermiyor. Daha sonra dene.",
      b_title:"Günlük ödül", b_get:"{0}. günü al — {1} Ore",
      b_next:"Bugün alındı. Seri yarın devam ediyor.", b_got:"{0}. gün: +{1} Ore"},

  ru:{k_email:"Эл. почта", k_pw:"Пароль", k_pwhint:"Не менее 8 символов.",
      k_signin:"Войти", k_signup:"Создать аккаунт",
      k_have:"Уже есть аккаунт? Войти", k_new:"Нет аккаунта? Создайте его",
      k_google:"Продолжить с Google", k_facebook:"Продолжить с Facebook",
      k_why:"С аккаунтом прогресс сохраняется и вы попадаете в таблицы лидеров. Без него он хранится только в этом браузере.",
      k_wait:"Минутку …", k_hello:"Вы вошли как {0}", k_signout:"Выйти",
      k_offline:"Сервер входа сейчас недоступен. Игра без аккаунта по-прежнему работает.",
      k_soon:"Google и Facebook скоро будут. Пока войдите по почте.",
      pwa_btn:"Установить", pwa_head:"Talumi на главный экран",
      pwa_why:"После установки игра идёт во весь экран — без адресной строки. И запускается без сети.",
      pwa_ios1:"Нажмите кнопку «Поделиться» в Safari (квадрат со стрелкой).",
      pwa_ios2:"Прокрутите вниз и выберите «На экран Домой».",
      pwa_ios3:"Подтвердите «Добавить». Talumi встанет рядом с другими приложениями.",
      pwa_and:"Браузер спросит один раз — подтвердите «Установить».",
      pwa_close:"Понятно",
      k_or:"или", a_more:"Подробнее об игре",
      a_pt1:"Бесплатно, в браузере, ничего не нужно ставить.",
      a_pt2:"Ничто из продаваемого не даёт долгого преимущества.",
      a_pt3:"46 дизайнов, двадцать рангов, четыре режима.",
      k_fremd_fehler:"Этот вход не сработал. Попробуйте по почте.",
      e_email:"Этот адрес почты выглядит неверно.",
      e_pwshort:"Пароль должен быть не короче 8 символов.",
      e_taken:"Этот адрес почты уже занят.",
      e_login:"Неверная почта или пароль.",
      e_many:"Слишком много попыток. Подождите четверть часа.",
      e_name:"Такое имя не подходит. Только буквы, цифры, пробел и . _ -",
      e_blocked:"Этот аккаунт заблокирован.",
      e_net:"Сервер не отвечает. Попробуйте позже.",
      b_title:"Ежедневный бонус", b_get:"Забрать день {0} — {1} Ore",
      b_next:"Сегодня получено. Серия продолжится завтра.", b_got:"День {0}: +{1} Ore"}
};
for (const c in LANGS14) Object.assign(LANGS[c], LANGS14[c]);

/* Levelaufstieg ohne neue Oberfläche */
const LANGS15 = {
  en:{levelonly:"Level {0} reached."},
  de:{levelonly:"Level {0} erreicht."},
  es:{levelonly:"Nivel {0} alcanzado."},
  pt:{levelonly:"Nível {0} alcançado."},
  fr:{levelonly:"Niveau {0} atteint."},
  tr:{levelonly:"{0}. seviyeye ulaşıldı."},
  ru:{levelonly:"Достигнут уровень {0}."}
};
for (const c in LANGS15) Object.assign(LANGS[c], LANGS15[c]);

/* Ranglisten (Schritt 56). Gewertet wird nur, was der Server gerechnet hat —
   deshalb steht in jeder Sprache dabei, dass lokale Runden nicht zählen. */
const LANGS16 = {
  en:{r_head:"Leaderboards", r_sub:"Only online rounds count — a local round cannot be checked.",
      r_who:"Who", r_what:"Ranked by", r_world:"World", r_country:"Your country", r_friends:"Friends",
      r_best:"Best mass", r_level:"Level", r_ore:"Ore",
      r_ehre:"Honour", r_kills:"Kills", r_kills_hint:"Only swallowed players count — never NPCs.",
      r_clans_hint:"A clan's honour is the sum of its members' honour.", r_clan_n:"{0} members",
      r_loading:"Loading …", r_empty:"Nobody on this board yet.",
      r_nofriends:"Add friends first — then they appear here.",
      r_nofound:"None of your friends has an account yet.",
      r_noland:"No country on your account yet.",
      r_you:"You are number {0}.", r_guest:"Leaderboards need an account. Guest rounds are not counted.",
      r_offline:"The server is not answering. Try again later."},
  de:{r_head:"Ranglisten", r_sub:"Es zählen nur Onlinerunden — eine lokale Runde lässt sich nicht prüfen.",
      r_who:"Wer", r_what:"Gewertet nach", r_world:"Weltweit", r_country:"Dein Land", r_friends:"Freunde",
      r_best:"Bestmasse", r_level:"Level", r_ore:"Ore",
      r_ehre:"Ehre", r_kills:"Abschüsse", r_kills_hint:"Es zählen nur gefressene Spieler, nie NPCs.",
      r_clans_hint:"Die Ehre eines Clans ist die Summe der Ehre seiner Mitglieder.", r_clan_n:"{0} Mitglieder",
      r_loading:"Wird geladen …", r_empty:"Hier steht noch niemand.",
      r_nofriends:"Erst Freunde hinzufügen, dann stehen sie hier.",
      r_nofound:"Noch keiner deiner Freunde hat ein Konto.",
      r_noland:"Für dein Konto ist noch kein Land eingetragen.",
      r_you:"Du bist Nummer {0}.", r_guest:"Ranglisten brauchen ein Konto. Gastrunden werden nicht gewertet.",
      r_offline:"Der Server antwortet nicht. Später nochmal versuchen."},
  es:{r_head:"Clasificaciones", r_sub:"Solo cuentan las rondas en línea — una ronda local no se puede verificar.",
      r_who:"Quién", r_what:"Ordenado por", r_world:"Mundial", r_country:"Tu país", r_friends:"Amigos",
      r_best:"Masa récord", r_ehre:"Honor", r_kills:"Bajas", r_kills_hint:"Solo cuentan los jugadores devorados, nunca los NPC.", r_clans_hint:"El honor de un clan es la suma del honor de sus miembros.", r_clan_n:"{0} miembros", r_level:"Nivel", r_ore:"Ore",
      r_loading:"Cargando …", r_empty:"Aún no hay nadie aquí.",
      r_nofriends:"Añade amigos primero y aparecerán aquí.",
      r_nofound:"Ninguno de tus amigos tiene cuenta todavía.",
      r_noland:"Tu cuenta aún no tiene país.",
      r_you:"Eres el número {0}.", r_guest:"Las clasificaciones necesitan una cuenta. Las rondas de invitado no cuentan.",
      r_offline:"El servidor no responde. Inténtalo más tarde."},
  pt:{r_head:"Classificações", r_sub:"Só contam as rondas online — uma ronda local não pode ser verificada.",
      r_who:"Quem", r_what:"Ordenado por", r_world:"Mundial", r_country:"O teu país", r_friends:"Amigos",
      r_best:"Massa recorde", r_ehre:"Honra", r_kills:"Abates", r_kills_hint:"Só contam os jogadores devorados, nunca os NPC.", r_clans_hint:"A honra de um clã é a soma da honra dos seus membros.", r_clan_n:"{0} membros", r_level:"Nível", r_ore:"Ore",
      r_loading:"A carregar …", r_empty:"Ainda não há ninguém aqui.",
      r_nofriends:"Adicione amigos primeiro e eles aparecem aqui.",
      r_nofound:"Nenhum dos seus amigos tem conta ainda.",
      r_noland:"A sua conta ainda não tem país.",
      r_you:"Você é o número {0}.", r_guest:"As classificações precisam de uma conta. Rondas de convidado não contam.",
      r_offline:"O servidor não responde. Tente mais tarde."},
  fr:{r_head:"Classements", r_sub:"Seules les manches en ligne comptent — une manche locale n'est pas vérifiable.",
      r_who:"Qui", r_what:"Classé par", r_world:"Monde", r_country:"Votre pays", r_friends:"Amis",
      r_best:"Meilleure masse", r_ehre:"Honneur", r_kills:"Victimes", r_kills_hint:"Seuls les joueurs avalés comptent, jamais les PNJ.", r_clans_hint:"L'honneur d'un clan est la somme de l'honneur de ses membres.", r_clan_n:"{0} membres", r_level:"Niveau", r_ore:"Minerai",
      r_loading:"Chargement …", r_empty:"Personne ici pour l'instant.",
      r_nofriends:"Ajoutez d'abord des amis, ils apparaîtront ici.",
      r_nofound:"Aucun de vos amis n'a encore de compte.",
      r_noland:"Votre compte n'a pas encore de pays.",
      r_you:"Vous êtes numéro {0}.", r_guest:"Les classements nécessitent un compte. Les manches en invité ne comptent pas.",
      r_offline:"Le serveur ne répond pas. Réessayez plus tard."},
  tr:{r_head:"Sıralamalar", r_sub:"Yalnızca çevrimiçi turlar sayılır — yerel bir tur doğrulanamaz.",
      r_who:"Kim", r_what:"Sıralama ölçütü", r_world:"Dünya", r_country:"Ülkeniz", r_friends:"Arkadaşlar",
      r_best:"En iyi kütle", r_ehre:"Onur", r_kills:"Avlar", r_kills_hint:"Yalnızca yutulan oyuncular sayılır, NPC'ler asla.", r_clans_hint:"Bir klanın onuru, üyelerinin onurunun toplamıdır.", r_clan_n:"{0} üye", r_level:"Seviye", r_ore:"Cevher",
      r_loading:"Yükleniyor …", r_empty:"Burada henüz kimse yok.",
      r_nofriends:"Önce arkadaş ekle, sonra burada görünürler.",
      r_nofound:"Arkadaşlarından hiçbirinin henüz hesabı yok.",
      r_noland:"Hesabında henüz ülke yok.",
      r_you:"{0}. sıradasın.", r_guest:"Sıralamalar bir hesap gerektirir. Misafir turları sayılmaz.",
      r_offline:"Sunucu yanıt vermiyor. Daha sonra dene."},
  ru:{r_head:"Рейтинги", r_sub:"Учитываются только сетевые заходы — локальный заход проверить нельзя.",
      r_who:"Кто", r_what:"Сортировка", r_world:"Весь мир", r_country:"Ваша страна", r_friends:"Друзья",
      r_best:"Лучшая масса", r_ehre:"Честь", r_kills:"Добыча", r_kills_hint:"Считаются только съеденные игроки, никогда не NPC.", r_clans_hint:"Честь клана — сумма чести его участников.", r_clan_n:"{0} участников", r_level:"Уровень", r_ore:"Руда",
      r_loading:"Загрузка …", r_empty:"Здесь пока никого нет.",
      r_nofriends:"Сначала добавьте друзей — тогда они появятся здесь.",
      r_nofound:"Ни у кого из ваших друзей пока нет учётной записи.",
      r_noland:"У вашей учётной записи ещё нет страны.",
      r_you:"Вы номер {0}.", r_guest:"Для рейтингов нужна учётная запись. Заходы гостем не учитываются.",
      r_offline:"Сервер не отвечает. Попробуйте позже."}
};
for (const c in LANGS16) Object.assign(LANGS[c], LANGS16[c]);

/* Passwort vergessen, Adresse bestätigen, Kauf über das Konto (Schritt 56).
   `boostnote` und `boostonly` werden hier überschrieben: Der Startbonus wirkt
   seit Schritt 56 auch im Onlinebetrieb, dort abgebucht vom Server. */
const LANGS17 = {
  en:{p_head:"Forgotten password", p_ask:"Enter your address and we will send you a link.",
      p_send:"Send link",
      p_sent:"If that address has an account, a link is on its way. It is valid for one hour.",
      p_set:"Choose a new password.", p_new:"New password", p_save:"Save password",
      p_done:"Password changed — you are signed in.",
      p_bad:"This link is used up or expired. Ask for a new one.",
      p_off:"Password reset needs the mail service, which is switched off here.",
      p_confirmed:"Address confirmed.", p_confirmbad:"This confirmation link is used up or expired.",
      p_unconfirmed:"Address not confirmed yet — without it we cannot send you a reset link.",
      p_resend:"Send confirmation again", p_resent:"Confirmation sent — check your inbox.",
      p_wait:"Sending …",
      k_buyfail:"Purchase did not go through. Try again.",
      practiceacct:"Signed in: local rounds are practice. Ore and XP come from online rounds.",
      boostnote:"Open space and Online. Bigger also means slower and easier to spot. Paid with Ore you earned.",
      boostonly:"Start bonus works in Open space and Online.",
      boostacct:"Online the bonus is charged by the server — sign in to use it."},
  de:{p_head:"Passwort vergessen", p_ask:"Adresse eintragen, wir schicken einen Link.",
      p_send:"Link schicken",
      p_sent:"Gibt es zu der Adresse ein Konto, ist ein Link unterwegs. Er gilt eine Stunde.",
      p_set:"Neues Passwort wählen.", p_new:"Neues Passwort", p_save:"Passwort speichern",
      p_done:"Passwort geändert — du bist angemeldet.",
      p_bad:"Dieser Link ist verbraucht oder abgelaufen. Fordere einen neuen an.",
      p_off:"Das Zurücksetzen braucht den Mailversand, und der ist hier abgeschaltet.",
      p_confirmed:"Adresse bestätigt.", p_confirmbad:"Dieser Bestätigungslink ist verbraucht oder abgelaufen.",
      p_unconfirmed:"Adresse noch nicht bestätigt — ohne sie können wir dir kein neues Passwort schicken.",
      p_resend:"Bestätigung erneut schicken", p_resent:"Bestätigung verschickt — sieh ins Postfach.",
      p_wait:"Wird verschickt …",
      k_buyfail:"Der Kauf ging nicht durch. Nochmal versuchen.",
      practiceacct:"Angemeldet: Lokale Runden sind Übung. Ore und XP kommen aus Onlinerunden.",
      boostnote:"Im freien Raum und Online. Größer heißt auch langsamer und auffälliger. Bezahlt mit erspieltem Ore.",
      boostonly:"Der Startbonus wirkt im freien Raum und Online.",
      boostacct:"Online bucht der Server den Bonus ab — dafür musst du angemeldet sein."},
  es:{p_head:"Contraseña olvidada", p_ask:"Escribe tu dirección y te enviaremos un enlace.",
      p_send:"Enviar enlace",
      p_sent:"Si esa dirección tiene cuenta, el enlace va en camino. Vale una hora.",
      p_set:"Elige una contraseña nueva.", p_new:"Contraseña nueva", p_save:"Guardar contraseña",
      p_done:"Contraseña cambiada — has entrado.",
      p_bad:"Este enlace ya se usó o caducó. Pide uno nuevo.",
      p_off:"Restablecer la contraseña necesita el servicio de correo, y está desactivado aquí.",
      p_confirmed:"Dirección confirmada.", p_confirmbad:"Este enlace de confirmación ya se usó o caducó.",
      p_unconfirmed:"Dirección sin confirmar — sin ella no podemos enviarte un enlace de restablecimiento.",
      p_resend:"Enviar la confirmación otra vez", p_resent:"Confirmación enviada — mira tu correo.",
      p_wait:"Enviando …",
      k_buyfail:"La compra no se completó. Inténtalo otra vez.",
      practiceacct:"Con cuenta: las rondas locales son práctica. El Ore y el XP vienen de las rondas en línea.",
      boostnote:"En espacio abierto y en línea. Más grande también es más lento y más visible. Se paga con Ore ganado.",
      boostonly:"El bono inicial funciona en espacio abierto y en línea.",
      boostacct:"En línea el bono lo cobra el servidor — necesitas iniciar sesión."},
  pt:{p_head:"Senha esquecida", p_ask:"Escreva o seu endereço e enviamos um link.",
      p_send:"Enviar link",
      p_sent:"Se esse endereço tiver conta, o link está a caminho. Vale uma hora.",
      p_set:"Escolha uma senha nova.", p_new:"Senha nova", p_save:"Guardar senha",
      p_done:"Senha alterada — você entrou.",
      p_bad:"Este link já foi usado ou expirou. Peça um novo.",
      p_off:"Redefinir a senha precisa do serviço de correio, que está desativado aqui.",
      p_confirmed:"Endereço confirmado.", p_confirmbad:"Este link de confirmação já foi usado ou expirou.",
      p_unconfirmed:"Endereço não confirmado — sem ele não podemos enviar um link de redefinição.",
      p_resend:"Enviar a confirmação de novo", p_resent:"Confirmação enviada — veja a sua caixa.",
      p_wait:"A enviar …",
      k_buyfail:"A compra não passou. Tente de novo.",
      practiceacct:"Com conta: rondas locais são treino. Ore e XP vêm das rondas online.",
      boostnote:"No espaço aberto e online. Maior também é mais lento e mais visível. Pago com Ore conquistado.",
      boostonly:"O bônus inicial funciona no espaço aberto e online.",
      boostacct:"Online o bônus é cobrado pelo servidor — é preciso entrar na conta."},
  fr:{p_head:"Mot de passe oublié", p_ask:"Indiquez votre adresse, nous vous envoyons un lien.",
      p_send:"Envoyer le lien",
      p_sent:"Si un compte existe pour cette adresse, un lien est en route. Il est valable une heure.",
      p_set:"Choisissez un nouveau mot de passe.", p_new:"Nouveau mot de passe", p_save:"Enregistrer",
      p_done:"Mot de passe changé — vous êtes connecté.",
      p_bad:"Ce lien est déjà utilisé ou expiré. Demandez-en un nouveau.",
      p_off:"La réinitialisation nécessite le service d'envoi, désactivé ici.",
      p_confirmed:"Adresse confirmée.", p_confirmbad:"Ce lien de confirmation est déjà utilisé ou expiré.",
      p_unconfirmed:"Adresse non confirmée — sans elle nous ne pouvons pas envoyer de lien de réinitialisation.",
      p_resend:"Renvoyer la confirmation", p_resent:"Confirmation envoyée — regardez votre boîte.",
      p_wait:"Envoi …",
      k_buyfail:"L'achat n'a pas abouti. Réessayez.",
      practiceacct:"Connecté : les manches locales sont de l'entraînement. Minerai et XP viennent des manches en ligne.",
      boostnote:"En espace libre et en ligne. Plus gros veut dire plus lent et plus visible. Payé en minerai gagné.",
      boostonly:"Le bonus de départ fonctionne en espace libre et en ligne.",
      boostacct:"En ligne, le serveur débite le bonus — il faut être connecté."},
  tr:{p_head:"Şifremi unuttum", p_ask:"Adresinizi girin, size bir bağlantı gönderelim.",
      p_send:"Bağlantı gönder",
      p_sent:"Bu adrese ait bir hesap varsa bağlantı yolda. Bir saat geçerlidir.",
      p_set:"Yeni bir şifre seçin.", p_new:"Yeni şifre", p_save:"Şifreyi kaydet",
      p_done:"Şifre değişti — giriş yapıldı.",
      p_bad:"Bu bağlantı kullanılmış veya süresi geçmiş. Yenisini isteyin.",
      p_off:"Şifre sıfırlama posta hizmetini gerektirir, o da burada kapalı.",
      p_confirmed:"Adres onaylandı.", p_confirmbad:"Bu onay bağlantısı kullanılmış veya süresi geçmiş.",
      p_unconfirmed:"Adres henüz onaylanmadı — onaysız şifre sıfırlama bağlantısı gönderemeyiz.",
      p_resend:"Onayı yeniden gönder", p_resent:"Onay gönderildi — gelen kutunuza bakın.",
      p_wait:"Gönderiliyor …",
      k_buyfail:"Satın alma tamamlanmadı. Yeniden deneyin.",
      practiceacct:"Hesapla: yerel turlar antrenmandır. Cevher ve XP çevrimiçi turlardan gelir.",
      boostnote:"Açık uzayda ve çevrimiçi. Daha büyük aynı zamanda daha yavaş ve daha göze batar. Kazanılan cevherle ödenir.",
      boostonly:"Başlangıç bonusu açık uzayda ve çevrimiçi çalışır.",
      boostacct:"Çevrimiçinde bonusu sunucu düşer — bunun için giriş yapmalısın."},
  ru:{p_head:"Забытый пароль", p_ask:"Укажите адрес, и мы пришлём ссылку.",
      p_send:"Отправить ссылку",
      p_sent:"Если для этого адреса есть учётная запись, ссылка уже в пути. Она действует один час.",
      p_set:"Выберите новый пароль.", p_new:"Новый пароль", p_save:"Сохранить пароль",
      p_done:"Пароль изменён — вы вошли.",
      p_bad:"Эта ссылка уже использована или истекла. Запросите новую.",
      p_off:"Сброс пароля требует службы рассылки, а она здесь отключена.",
      p_confirmed:"Адрес подтверждён.", p_confirmbad:"Эта ссылка подтверждения уже использована или истекла.",
      p_unconfirmed:"Адрес ещё не подтверждён — без этого мы не сможем прислать ссылку для сброса.",
      p_resend:"Отправить подтверждение снова", p_resent:"Подтверждение отправлено — проверьте почту.",
      p_wait:"Отправка …",
      k_buyfail:"Покупка не прошла. Попробуйте снова.",
      practiceacct:"С учётной записью локальные заходы — тренировка. Руда и опыт идут из сетевых заходов.",
      boostnote:"В открытом космосе и в сети. Больше — значит медленнее и заметнее. Оплата заработанной рудой.",
      boostonly:"Стартовый бонус работает в открытом космосе и в сети.",
      boostacct:"В сети бонус списывает сервер — для этого нужно войти."}
};
for (const c in LANGS17) Object.assign(LANGS[c], LANGS17[c]);

/* Der Onlinebetrieb zahlt seit Schritt 55 aus — der Server rechnet die
   Belohnung selbst. Die alte Beschreibung („noch keine Belohnung") stand seit
   Schritt 51 da und stimmte nicht mehr. */
const LANGS18 = {
  en:{m_online_b:"Real players on an authoritative server. Ore and XP are granted by the server — the only rounds that count."},
  de:{m_online_b:"Echte Mitspieler auf einem autoritativen Server. Ore und XP vergibt der Server — nur diese Runden zählen."},
  es:{m_online_b:"Jugadores reales en un servidor autoritativo. El servidor otorga Ore y XP — solo estas rondas cuentan."},
  pt:{m_online_b:"Jogadores reais num servidor autoritativo. O servidor concede Ore e XP — só estas rondas contam."},
  fr:{m_online_b:"De vrais joueurs sur un serveur autoritatif. Le serveur accorde minerai et XP — seules ces manches comptent."},
  tr:{m_online_b:"Yetkili bir sunucuda gerçek oyuncular. Cevheri ve XP'yi sunucu verir — yalnızca bu turlar sayılır."},
  ru:{m_online_b:"Живые игроки на авторитетном сервере. Руду и опыт выдаёт сервер — учитываются только эти заходы."}
};
for (const c in LANGS18) Object.assign(LANGS[c], LANGS18[c]);

/* Computergegner in Onlineräumen: Kürzel vor dem Namen und eine ehrliche
   Beschreibung des Modus. Solange wenige online sind, füllt der Server mit
   markierten Gegnern auf — das muss man vorher lesen können, nicht erst
   nach der Runde bemerken. */
const LANGS19 = {
  en:{ai_tag:"NPC", m_online_b:"Real players on an authoritative server — while few are online, marked NPC opponents fill the room. Ore and XP are granted by the server."},
  de:{ai_tag:"NPC", m_online_b:"Echte Mitspieler auf einem autoritativen Server — solange wenige online sind, füllen markierte NPC-Gegner den Raum. Ore und XP vergibt der Server."},
  es:{ai_tag:"NPC", m_online_b:"Jugadores reales en un servidor autoritativo — mientras haya pocos conectados, rivales NPC marcados llenan la sala. El servidor otorga Ore y XP."},
  pt:{ai_tag:"NPC", m_online_b:"Jogadores reais num servidor autoritativo — enquanto houver poucos online, adversários NPC marcados enchem a sala. O servidor concede Ore e XP."},
  fr:{ai_tag:"NPC", m_online_b:"De vrais joueurs sur un serveur autoritatif — tant qu'il y a peu de monde, des adversaires NPC signalés remplissent la salle. Le serveur accorde minerai et XP."},
  tr:{ai_tag:"NPC", m_online_b:"Yetkili bir sunucuda gerçek oyuncular — çevrimiçi kişi azken işaretli NPC rakipleri odayı doldurur. Cevheri ve XP'yi sunucu verir."},
  ru:{ai_tag:"NPC", m_online_b:"Живые игроки на авторитетном сервере — пока онлайн мало, комнату заполняют отмеченные соперники-NPC. Руду и опыт выдаёт сервер."}
};
for (const c in LANGS19) Object.assign(LANGS[c], LANGS19[c]);

/* Ränge (Schritt 65). Seit v105 zwanzig Stufen, rk0 bis rk19 (vorher
   dreizehn): Die alten Namen stehen an ihrer neuen Stelle (rk2 → rk3,
   rk3 → rk5, rk4 → rk7, rk5 → rk9, rk6 → rk11, rk7 → rk13, rk8–rk12 →
   rk15–rk19), die geraden Stufen 2 bis 14 sind neu dazwischen. Allgemeine
   Marine- und Flottenbegriffe — die Gestaltung der Abzeichen ist eigen, die
   Bezeichnungen sind es bewusst nicht: Sie sollen ohne Erklärung verständlich
   sein. */
const LANGS20 = {
  en:{rk0:"Cadet", rk1:"Ensign", rk2:"Senior Ensign", rk3:"Sub-Lieutenant",
      rk4:"Flight Lieutenant", rk5:"Lieutenant", rk6:"Squadron Leader", rk7:"Lieutenant Commander",
      rk8:"Wing Commander", rk9:"Commander", rk10:"Cruiser Commander", rk11:"Captain",
      rk12:"Line Captain", rk13:"Senior Captain", rk14:"Fleet Captain", rk15:"Commodore",
      rk16:"Rear Admiral", rk17:"Vice Admiral", rk18:"Admiral", rk19:"Grand Admiral",
      rang:"Rank", ehre:"Honour", rangneu:"Rank reached: {0}",
      ehredazu:"Honour earned", ehrekeine:"No honour this round.",
      ehrewie:"Honour comes from good hunting online: prey close to your own size, and each opponent counts once a day.",
      e_land:"Your country stays fixed for 30 days — the country ranking would be worthless otherwise."},
  de:{rk0:"Kadett", rk1:"Fähnrich", rk2:"Oberfähnrich", rk3:"Leutnant",
      rk4:"Flugleutnant", rk5:"Oberleutnant", rk6:"Staffelführer", rk7:"Kapitänleutnant",
      rk8:"Geschwaderführer", rk9:"Korvettenkapitän", rk10:"Kreuzerkapitän", rk11:"Fregattenkapitän",
      rk12:"Linienkapitän", rk13:"Kapitän", rk14:"Flottenkapitän", rk15:"Kommodore",
      rk16:"Konteradmiral", rk17:"Vizeadmiral", rk18:"Admiral", rk19:"Großadmiral",
      rang:"Rang", ehre:"Ehre", rangneu:"Rang erreicht: {0}",
      ehredazu:"Ehre verdient", ehrekeine:"Diese Runde ohne Ehre.",
      ehrewie:"Ehre gibt es für gute Jagd im Onlinebetrieb: Beute nahe der eigenen Größe, und jeder Gegner zählt einmal am Tag.",
      e_land:"Dein Land steht 30 Tage fest — sonst wäre die Landeswertung nichts wert."},
  es:{rk0:"Cadete", rk1:"Alférez", rk2:"Alférez superior", rk3:"Subteniente",
      rk4:"Teniente de vuelo", rk5:"Teniente", rk6:"Teniente de navío", rk7:"Capitán de corbeta",
      rk8:"Jefe de flotilla", rk9:"Capitán de fragata", rk10:"Capitán de crucero", rk11:"Capitán de navío",
      rk12:"Capitán de línea", rk13:"Capitán superior", rk14:"Capitán de flota", rk15:"Comodoro",
      rk16:"Contralmirante", rk17:"Vicealmirante", rk18:"Almirante", rk19:"Gran Almirante",
      rang:"Rango", ehre:"Honor", rangneu:"Rango alcanzado: {0}",
      ehredazu:"Honor ganado", ehrekeine:"Esta ronda sin honor.",
      ehrewie:"El honor viene de cazar bien en línea: presas cercanas a tu tamaño, y cada rival cuenta una vez al día.",
      e_land:"Tu país queda fijo 30 días — si no, la clasificación por país no valdría nada."},
  pt:{rk0:"Cadete", rk1:"Aspirante", rk2:"Guarda-marinha", rk3:"Subtenente",
      rk4:"Tenente de voo", rk5:"Tenente", rk6:"Chefe de esquadrilha", rk7:"Capitão-tenente",
      rk8:"Chefe de flotilha", rk9:"Capitão de corveta", rk10:"Capitão de cruzador", rk11:"Capitão de fragata",
      rk12:"Capitão de linha", rk13:"Capitão de mar e guerra", rk14:"Capitão de frota", rk15:"Comodoro",
      rk16:"Contra-almirante", rk17:"Vice-almirante", rk18:"Almirante", rk19:"Grão-almirante",
      rang:"Patente", ehre:"Honra", rangneu:"Patente alcançada: {0}",
      ehredazu:"Honra ganha", ehrekeine:"Esta ronda sem honra.",
      ehrewie:"A honra vem de boa caça online: presas perto do seu tamanho, e cada adversário conta uma vez por dia.",
      e_land:"O seu país fica fixo por 30 dias — senão a classificação por país não valeria nada."},
  fr:{rk0:"Cadet", rk1:"Enseigne", rk2:"Enseigne supérieur", rk3:"Sous-lieutenant",
      rk4:"Lieutenant de vol", rk5:"Lieutenant", rk6:"Chef d'escadrille", rk7:"Capitaine de corvette",
      rk8:"Chef de flottille", rk9:"Capitaine de frégate", rk10:"Capitaine de croiseur", rk11:"Capitaine de vaisseau",
      rk12:"Capitaine d'escadre", rk13:"Capitaine supérieur", rk14:"Capitaine de flotte", rk15:"Commodore",
      rk16:"Contre-amiral", rk17:"Vice-amiral", rk18:"Amiral", rk19:"Grand amiral",
      rang:"Grade", ehre:"Honneur", rangneu:"Grade atteint : {0}",
      ehredazu:"Honneur gagné", ehrekeine:"Cette manche sans honneur.",
      ehrewie:"L'honneur vient d'une bonne chasse en ligne : une proie proche de votre taille, et chaque adversaire compte une fois par jour.",
      e_land:"Votre pays reste fixé 30 jours — sinon le classement par pays ne vaudrait rien."},
  tr:{rk0:"Öğrenci", rk1:"Asteğmen", rk2:"Kıdemli Asteğmen", rk3:"Teğmen",
      rk4:"Uçuş Teğmeni", rk5:"Üsteğmen", rk6:"Kıdemli Üsteğmen", rk7:"Yüzbaşı",
      rk8:"Kıdemli Yüzbaşı", rk9:"Binbaşı", rk10:"Kruvazör Kaptanı", rk11:"Yarbay",
      rk12:"Zırhlı Kaptanı", rk13:"Albay", rk14:"Kıdemli Albay", rk15:"Komodor",
      rk16:"Tuğamiral", rk17:"Koramiral", rk18:"Oramiral", rk19:"Büyükamiral",
      rang:"Rütbe", ehre:"Şeref", rangneu:"Rütbeye ulaşıldı: {0}",
      ehredazu:"Kazanılan şeref", ehrekeine:"Bu turda şeref yok.",
      ehrewie:"Şeref, çevrimiçi iyi avdan gelir: kendi boyutuna yakın av, ve her rakip günde bir kez sayılır.",
      e_land:"Ülken 30 gün sabit kalır — yoksa ülke sıralaması hiçbir şey ifade etmezdi."},
  ru:{rk0:"Кадет", rk1:"Мичман", rk2:"Младший лейтенант", rk3:"Лейтенант",
      rk4:"Командир звена", rk5:"Старший лейтенант", rk6:"Командир катера", rk7:"Капитан-лейтенант",
      rk8:"Капитан корвета", rk9:"Капитан 3 ранга", rk10:"Капитан крейсера", rk11:"Капитан 2 ранга",
      rk12:"Капитан линкора", rk13:"Капитан 1 ранга", rk14:"Капитан флота", rk15:"Коммодор",
      rk16:"Контр-адмирал", rk17:"Вице-адмирал", rk18:"Адмирал", rk19:"Гранд-адмирал",
      rang:"Звание", ehre:"Честь", rangneu:"Получено звание: {0}",
      ehredazu:"Заработано чести", ehrekeine:"В этом заходе чести нет.",
      ehrewie:"Честь даётся за хорошую охоту в сети: добыча близкая к вашему размеру, и каждый соперник считается раз в день.",
      e_land:"Страна закрепляется на 30 дней — иначе страновой зачёт ничего бы не значил."}
};
for (const c in LANGS20) Object.assign(LANGS[c], LANGS20[c]);

/* Errungenschaften (Schritt 66). Eine Errungenschaft heißt hier wie ihre
   Bedingung — acht Muster mit einer Zahl statt einundzwanzig Fantasienamen,
   die in sieben Sprachen erst erklärt werden müssten. */
const LANGS21 = {
  en:{e_head:"Achievements", e_sub:"Each counts once and adds honour.",
      e_masse:"Reach {0} mass in one round",
      e_jagd:"Swallow {0} bodies in total",
      e_jagdrunde:"Swallow {0} bodies in one round",
      e_runden:"Play {0} online rounds",
      e_zeit:"Survive {0} minutes in one round",
      e_treue:"Collect the daily bonus {0} days in a row",
      e_skins:"Own {0} designs",
      e_level:"Reach level {0}",
      e_stand:"{0} of {1} done",
      e_konto:"Achievements need an account — they are checked by the server.",
      e_neu:"Achievement"},
  de:{e_head:"Errungenschaften", e_sub:"Jede zählt einmal und bringt Ehre.",
      e_masse:"Erreich {0} Masse in einer Runde",
      e_jagd:"Verschling insgesamt {0} Körper",
      e_jagdrunde:"Verschling {0} Körper in einer Runde",
      e_runden:"Spiel {0} Onlinerunden",
      e_zeit:"Überleb {0} Minuten in einer Runde",
      e_treue:"Hol den Tagesbonus {0} Tage in Folge",
      e_skins:"Besitz {0} Designs",
      e_level:"Erreich Level {0}",
      e_stand:"{0} von {1} geschafft",
      e_konto:"Errungenschaften brauchen ein Konto — der Server prüft sie.",
      e_neu:"Errungenschaft"},
  es:{e_head:"Logros", e_sub:"Cada uno cuenta una vez y da honor.",
      e_masse:"Alcanza {0} de masa en una ronda",
      e_jagd:"Traga {0} cuerpos en total",
      e_jagdrunde:"Traga {0} cuerpos en una ronda",
      e_runden:"Juega {0} rondas en línea",
      e_zeit:"Sobrevive {0} minutos en una ronda",
      e_treue:"Recoge el bono diario {0} días seguidos",
      e_skins:"Ten {0} diseños",
      e_level:"Alcanza el nivel {0}",
      e_stand:"{0} de {1} conseguidos",
      e_konto:"Los logros necesitan una cuenta — los comprueba el servidor.",
      e_neu:"Logro"},
  pt:{e_head:"Conquistas", e_sub:"Cada uma conta uma vez e dá honra.",
      e_masse:"Alcance {0} de massa numa ronda",
      e_jagd:"Engula {0} corpos no total",
      e_jagdrunde:"Engula {0} corpos numa ronda",
      e_runden:"Jogue {0} rondas online",
      e_zeit:"Sobreviva {0} minutos numa ronda",
      e_treue:"Recolha o bónus diário {0} dias seguidos",
      e_skins:"Tenha {0} designs",
      e_level:"Alcance o nível {0}",
      e_stand:"{0} de {1} concluídas",
      e_konto:"As conquistas precisam de uma conta — o servidor verifica-as.",
      e_neu:"Conquista"},
  fr:{e_head:"Succès", e_sub:"Chacun compte une fois et rapporte de l'honneur.",
      e_masse:"Atteignez {0} de masse en une manche",
      e_jagd:"Avalez {0} corps au total",
      e_jagdrunde:"Avalez {0} corps en une manche",
      e_runden:"Jouez {0} manches en ligne",
      e_zeit:"Survivez {0} minutes en une manche",
      e_treue:"Récupérez le bonus quotidien {0} jours d'affilée",
      e_skins:"Possédez {0} designs",
      e_level:"Atteignez le niveau {0}",
      e_stand:"{0} sur {1} réussis",
      e_konto:"Les succès nécessitent un compte — le serveur les vérifie.",
      e_neu:"Succès"},
  tr:{e_head:"Başarımlar", e_sub:"Her biri bir kez sayılır ve şeref kazandırır.",
      e_masse:"Bir turda {0} kütleye ulaş",
      e_jagd:"Toplam {0} cisim yut",
      e_jagdrunde:"Bir turda {0} cisim yut",
      e_runden:"{0} çevrimiçi tur oyna",
      e_zeit:"Bir turda {0} dakika hayatta kal",
      e_treue:"Günlük bonusu {0} gün üst üste al",
      e_skins:"{0} tasarıma sahip ol",
      e_level:"{0}. seviyeye ulaş",
      e_stand:"{1} başarımdan {0} tanesi tamam",
      e_konto:"Başarımlar bir hesap gerektirir — sunucu kontrol eder.",
      e_neu:"Başarım"},
  ru:{e_head:"Достижения", e_sub:"Каждое считается один раз и даёт честь.",
      e_masse:"Наберите {0} массы за один заход",
      e_jagd:"Поглотите {0} тел всего",
      e_jagdrunde:"Поглотите {0} тел за один заход",
      e_runden:"Сыграйте {0} сетевых заходов",
      e_zeit:"Продержитесь {0} минут за один заход",
      e_treue:"Получите ежедневный бонус {0} дней подряд",
      e_skins:"Владейте {0} дизайнами",
      e_level:"Достигните уровня {0}",
      e_stand:"{0} из {1} выполнено",
      e_konto:"Для достижений нужна учётная запись — их проверяет сервер.",
      e_neu:"Достижение"}
};
for (const c in LANGS21) Object.assign(LANGS[c], LANGS21[c]);

/* Die erste Errungenschaft der Jagd eigens benannt: „Verschling insgesamt
   1 Körper" las sich holprig, und im Russischen stimmte die Beugung nicht. */
const LANGS22 = {
  en:{e_jagd1:"Swallow your first body"},
  de:{e_jagd1:"Verschling deinen ersten Körper"},
  es:{e_jagd1:"Traga tu primer cuerpo"},
  pt:{e_jagd1:"Engula o seu primeiro corpo"},
  fr:{e_jagd1:"Avalez votre premier corps"},
  tr:{e_jagd1:"İlk cismini yut"},
  ru:{e_jagd1:"Поглотите первое тело"}
};
for (const c in LANGS22) Object.assign(LANGS[c], LANGS22[c]);

/* Errungenschaften, Schritt 102: Duelle (nur Menschen), Gesamtspielzeit, Clan. */
const LANGS22b = {
  en:{e_duell1:"Swallow your first player (NPCs don't count)", e_duell:"Swallow {0} players — NPCs don't count", e_stunden:"Play {0} hours in total", e_clan:"Join a clan"},
  de:{e_duell1:"Verschling deinen ersten Spieler (NPCs zählen nicht)", e_duell:"Verschling {0} Spieler — NPCs zählen nicht", e_stunden:"Spiele insgesamt {0} Stunden", e_clan:"Tritt einem Clan bei"},
  es:{e_duell1:"Traga a tu primer jugador (los NPC no cuentan)", e_duell:"Traga a {0} jugadores — los NPC no cuentan", e_stunden:"Juega {0} horas en total", e_clan:"Únete a un clan"},
  pt:{e_duell1:"Engula o seu primeiro jogador (NPC não contam)", e_duell:"Engula {0} jogadores — NPC não contam", e_stunden:"Jogue {0} horas no total", e_clan:"Entre num clã"},
  fr:{e_duell1:"Avalez votre premier joueur (les PNJ ne comptent pas)", e_duell:"Avalez {0} joueurs — les PNJ ne comptent pas", e_stunden:"Jouez {0} heures au total", e_clan:"Rejoignez un clan"},
  tr:{e_duell1:"İlk oyuncunu yut (NPC'ler sayılmaz)", e_duell:"{0} oyuncu yut — NPC'ler sayılmaz", e_stunden:"Toplam {0} saat oyna", e_clan:"Bir klana katıl"},
  ru:{e_duell1:"Поглотите первого игрока (NPC не считаются)", e_duell:"Поглотите {0} игроков — NPC не считаются", e_stunden:"Сыграйте {0} часов в сумме", e_clan:"Вступите в клан"}
};
for (const c in LANGS22b) Object.assign(LANGS[c], LANGS22b[c]);

/* Rangübersicht und Spielanleitung (Schritt 102). Die Anleitung selbst steht
   nur auf Deutsch in index.html (Thomas: „heute alles nur deutsch"). */
const LANGS102 = {
  en:{hilfe:"How to play", rg_head:"Ranks", rg_sub:"Honour comes from hunting other accounts online, from achievements and from the daily bonus.", rg_start:"Everyone starts here", rg_ab:"from {0} honour", rg_anteil:"top {0} % of your country, from {1} honour", rg_plaetze:"top {0} of your country, from {1} honour", rg_erster:"the best of your country, from {0} honour", rg_du:"your rank"},
  de:{hilfe:"Spielanleitung", rg_head:"Ränge", rg_sub:"Ehre bringen die Jagd auf andere Konten im Onlinespiel, Errungenschaften und der Tagesbonus.", rg_start:"Hier beginnt jeder", rg_ab:"ab {0} Ehre", rg_anteil:"die besten {0} % deines Landes, ab {1} Ehre", rg_plaetze:"die {0} Besten deines Landes, ab {1} Ehre", rg_erster:"der Beste deines Landes, ab {0} Ehre", rg_du:"dein Rang"},
  es:{hilfe:"Cómo se juega", rg_head:"Rangos", rg_sub:"El honor se gana cazando otras cuentas en línea, con logros y con el bono diario.", rg_start:"Todos empiezan aquí", rg_ab:"desde {0} de honor", rg_anteil:"el {0} % mejor de tu país, desde {1} de honor", rg_plaetze:"los {0} mejores de tu país, desde {1} de honor", rg_erster:"el mejor de tu país, desde {0} de honor", rg_du:"tu rango"},
  pt:{hilfe:"Como jogar", rg_head:"Patentes", rg_sub:"A honra vem da caça a outras contas online, das conquistas e do bónus diário.", rg_start:"Todos começam aqui", rg_ab:"a partir de {0} de honra", rg_anteil:"os {0} % melhores do seu país, a partir de {1} de honra", rg_plaetze:"os {0} melhores do seu país, a partir de {1} de honra", rg_erster:"o melhor do seu país, a partir de {0} de honra", rg_du:"a sua patente"},
  fr:{hilfe:"Comment jouer", rg_head:"Grades", rg_sub:"L'honneur vient de la chasse aux autres comptes en ligne, des succès et du bonus quotidien.", rg_start:"Tout le monde commence ici", rg_ab:"à partir de {0} d'honneur", rg_anteil:"les {0} % meilleurs de votre pays, à partir de {1} d'honneur", rg_plaetze:"les {0} meilleurs de votre pays, à partir de {1} d'honneur", rg_erster:"le meilleur de votre pays, à partir de {0} d'honneur", rg_du:"votre grade"},
  tr:{hilfe:"Nasıl oynanır", rg_head:"Rütbeler", rg_sub:"Şeref, çevrimiçi diğer hesapları avlamaktan, başarımlardan ve günlük bonustan gelir.", rg_start:"Herkes buradan başlar", rg_ab:"{0} şereften itibaren", rg_anteil:"ülke sıralamasında ilk %{0}, {1} şereften itibaren", rg_plaetze:"ülkenin en iyi {0} oyuncusu, {1} şereften itibaren", rg_erster:"ülkenin en iyisi, {0} şereften itibaren", rg_du:"senin rütben"},
  ru:{hilfe:"Как играть", rg_head:"Звания", rg_sub:"Честь приносят охота на другие учётные записи онлайн, достижения и ежедневный бонус.", rg_start:"Здесь начинают все", rg_ab:"от {0} чести", rg_anteil:"лучшие {0} % вашей страны, от {1} чести", rg_plaetze:"{0} лучших вашей страны, от {1} чести", rg_erster:"лучший в своей стране, от {0} чести", rg_du:"ваше звание"}
};
for (const c in LANGS102) Object.assign(LANGS[c], LANGS102[c]);

/* Meilenstein-Banner (Schritt 103). */
const LANGS103 = {
  en:{f_level:"New level", f_rang:"New rank", f_frei:"Unlocked: {0}"},
  de:{f_level:"Neues Level", f_rang:"Neuer Rang", f_frei:"Freigeschaltet: {0}"},
  es:{f_level:"Nuevo nivel", f_rang:"Nuevo rango", f_frei:"Desbloqueado: {0}"},
  pt:{f_level:"Novo nível", f_rang:"Nova patente", f_frei:"Desbloqueado: {0}"},
  fr:{f_level:"Nouveau niveau", f_rang:"Nouveau grade", f_frei:"Débloqué : {0}"},
  tr:{f_level:"Yeni seviye", f_rang:"Yeni rütbe", f_frei:"Açıldı: {0}"},
  ru:{f_level:"Новый уровень", f_rang:"Новое звание", f_frei:"Открыто: {0}"}
};
for (const c in LANGS103) Object.assign(LANGS[c], LANGS103[c]);

/* Werbeprogramm (Schritt 104). */
const LANGS104 = {
  en:{w_head:"Invite friends", w_text:"Share your link. When a friend you invited reaches level {0}, you get {1} Ore and they get {2} Ore. At {3} friends: {4} Ore and the design Inferno.", w_code:"Your code", w_link:"Link", w_kopieren:"Copy link", w_kopiert:"Copied", w_teilen:"Share", w_teiltext:"Play Talumi with me — from dust to planet:", w_stand:"{0} of {1} friends counted", w_bonus:"Inferno unlocked!", w_feld:"Referral code (optional)", sk_werben:"Invite 10 friends", sk_werben_note:"Inferno is only earned by inviting: 10 friends who reach level 5 (see Stats).", e_werben:"Invite {0} friends who reach level 5"},
  de:{w_head:"Freunde werben", w_text:"Teile deinen Link. Erreicht ein Geworbener Level {0}, bekommst du {1} Ore und er {2} Ore. Bei {3} Geworbenen: {4} Ore und das Design Inferno.", w_code:"Dein Code", w_link:"Link", w_kopieren:"Link kopieren", w_kopiert:"Kopiert", w_teilen:"Teilen", w_teiltext:"Spiel Talumi mit mir — aus Staub wird ein Planet:", w_stand:"{0} von {1} Geworbenen gezählt", w_bonus:"Inferno freigeschaltet!", w_feld:"Werbecode (optional)", sk_werben:"10 Freunde werben", sk_werben_note:"Inferno gibt es nur fürs Werben: 10 Freunde, die Level 5 erreichen (Reiter Statistik).", e_werben:"Wirb {0} Freunde, die Level 5 erreichen"},
  es:{w_head:"Invita amigos", w_text:"Comparte tu enlace. Cuando un invitado llega al nivel {0}, tú recibes {1} Ore y él {2} Ore. Con {3} invitados: {4} Ore y el diseño Inferno.", w_code:"Tu código", w_link:"Enlace", w_kopieren:"Copiar enlace", w_kopiert:"Copiado", w_teilen:"Compartir", w_teiltext:"Juega Talumi conmigo — de polvo a planeta:", w_stand:"{0} de {1} invitados contados", w_bonus:"¡Inferno desbloqueado!", w_feld:"Código de invitación (opcional)", sk_werben:"Invita a 10 amigos", sk_werben_note:"Inferno solo se gana invitando: 10 amigos que lleguen al nivel 5 (ver Estadísticas).", e_werben:"Invita a {0} amigos que lleguen al nivel 5"},
  pt:{w_head:"Convidar amigos", w_text:"Partilha o teu link. Quando um convidado chega ao nível {0}, recebes {1} Ore e ele {2} Ore. Com {3} convidados: {4} Ore e o design Inferno.", w_code:"O teu código", w_link:"Link", w_kopieren:"Copiar link", w_kopiert:"Copiado", w_teilen:"Partilhar", w_teiltext:"Joga Talumi comigo — de poeira a planeta:", w_stand:"{0} de {1} convidados contados", w_bonus:"Inferno desbloqueado!", w_feld:"Código de convite (opcional)", sk_werben:"Convida 10 amigos", sk_werben_note:"O Inferno só se ganha convidando: 10 amigos que cheguem ao nível 5 (ver Estatísticas).", e_werben:"Convida {0} amigos que cheguem ao nível 5"},
  fr:{w_head:"Inviter des amis", w_text:"Partagez votre lien. Quand un invité atteint le niveau {0}, vous recevez {1} minerai et lui {2}. À {3} invités : {4} minerai et le design Inferno.", w_code:"Votre code", w_link:"Lien", w_kopieren:"Copier le lien", w_kopiert:"Copié", w_teilen:"Partager", w_teiltext:"Joue à Talumi avec moi — de la poussière à la planète :", w_stand:"{0} invités sur {1} comptés", w_bonus:"Inferno débloqué !", w_feld:"Code de parrainage (facultatif)", sk_werben:"Invitez 10 amis", sk_werben_note:"Inferno ne s'obtient qu'en invitant : 10 amis qui atteignent le niveau 5 (voir Statistiques).", e_werben:"Invitez {0} amis qui atteignent le niveau 5"},
  tr:{w_head:"Arkadaş davet et", w_text:"Bağlantını paylaş. Davet ettiğin biri {0}. seviyeye ulaşınca sen {1} cevher, o {2} cevher alır. {3} davetlide: {4} cevher ve Inferno tasarımı.", w_code:"Kodun", w_link:"Bağlantı", w_kopieren:"Bağlantıyı kopyala", w_kopiert:"Kopyalandı", w_teilen:"Paylaş", w_teiltext:"Benimle Talumi oyna — tozdan gezegene:", w_stand:"{1} davetliden {0} sayıldı", w_bonus:"Inferno açıldı!", w_feld:"Davet kodu (isteğe bağlı)", sk_werben:"10 arkadaş davet et", sk_werben_note:"Inferno yalnızca davetle kazanılır: 5. seviyeye ulaşan 10 arkadaş (İstatistikler).", e_werben:"5. seviyeye ulaşan {0} arkadaş davet et"},
  ru:{w_head:"Пригласить друзей", w_text:"Поделитесь ссылкой. Когда приглашённый достигнет уровня {0}, вы получите {1} руды, а он — {2}. За {3} приглашённых: {4} руды и дизайн Inferno.", w_code:"Ваш код", w_link:"Ссылка", w_kopieren:"Копировать ссылку", w_kopiert:"Скопировано", w_teilen:"Поделиться", w_teiltext:"Сыграй со мной в Talumi — из пыли в планету:", w_stand:"{0} из {1} приглашённых засчитано", w_bonus:"Inferno открыт!", w_feld:"Код приглашения (необязательно)", sk_werben:"Пригласите 10 друзей", sk_werben_note:"Inferno даётся только за приглашения: 10 друзей, достигших уровня 5 (см. Статистику).", e_werben:"Пригласите {0} друзей, достигших уровня 5"}
};
for (const c in LANGS104) Object.assign(LANGS[c], LANGS104[c]);

/* Tagesbonus klein, Wochenreihe, Belohnung in der Mitte, Design Rime (Schritt 106). */
const LANGS106 = {
  en:{b_holen:"Collect", b_spaeter:"Later", b_woche:"week {0} of {1}", b_eis:"after {0} weeks: the design Rime", b_got3:"Day {0} collected", b_eis_da:"Ten weeks — the design is yours", sk_wochen:"10 weeks of daily bonus", sk_wochen_note:"Rime is only earned by collecting the daily bonus for ten full weeks."},
  de:{b_holen:"Abholen", b_spaeter:"Später", b_woche:"Woche {0} von {1}", b_eis:"nach {0} Wochen: das Design Rime", b_got3:"Tag {0} abgeholt", b_eis_da:"Zehn Wochen — das Design gehört dir", sk_wochen:"10 Wochen Tagesbonus", sk_wochen_note:"Rime gibt es nur für zehn volle Wochen Tagesbonus."},
  es:{b_holen:"Recoger", b_spaeter:"Más tarde", b_woche:"semana {0} de {1}", b_eis:"tras {0} semanas: el diseño Rime", b_got3:"Día {0} recogido", b_eis_da:"Diez semanas — el diseño es tuyo", sk_wochen:"10 semanas de bono diario", sk_wochen_note:"Rime solo se gana recogiendo el bono diario diez semanas completas."},
  pt:{b_holen:"Recolher", b_spaeter:"Mais tarde", b_woche:"semana {0} de {1}", b_eis:"após {0} semanas: o design Rime", b_got3:"Dia {0} recolhido", b_eis_da:"Dez semanas — o design é teu", sk_wochen:"10 semanas de bónus diário", sk_wochen_note:"O Rime só se ganha com dez semanas completas de bónus diário."},
  fr:{b_holen:"Récupérer", b_spaeter:"Plus tard", b_woche:"semaine {0} sur {1}", b_eis:"après {0} semaines : le design Rime", b_got3:"Jour {0} récupéré", b_eis_da:"Dix semaines — le design est à vous", sk_wochen:"10 semaines de bonus quotidien", sk_wochen_note:"Rime ne s'obtient qu'avec dix semaines complètes de bonus quotidien."},
  tr:{b_holen:"Al", b_spaeter:"Sonra", b_woche:"{1} haftadan {0}.", b_eis:"{0} hafta sonra: Rime tasarımı", b_got3:"{0}. gün alındı", b_eis_da:"On hafta — tasarım senin", sk_wochen:"10 hafta günlük bonus", sk_wochen_note:"Rime yalnızca on tam hafta günlük bonusla kazanılır."},
  ru:{b_holen:"Забрать", b_spaeter:"Позже", b_woche:"неделя {0} из {1}", b_eis:"через {0} недель: дизайн Rime", b_got3:"День {0} получен", b_eis_da:"Десять недель — дизайн ваш", sk_wochen:"10 недель ежедневного бонуса", sk_wochen_note:"Rime даётся только за десять полных недель ежедневного бонуса."}
};
for (const c in LANGS106) Object.assign(LANGS[c], LANGS106[c]);

/* Schritt 107: Design nach der ersten Woche, Ansporn mit Bildern. */
const LANGS107 = {
  en:{b_design:"Design {0}", b_designkurz:"Design", b_design_da:"Design unlocked", b_ansporn:"Worth coming back for", b_nach7:"after 7 days", b_nach10w:"after {0} weeks", b_besitz:"yours", sk_woche:"7 days of daily bonus", sk_woche_note:"Sunflare comes with the first full week of daily bonus."},
  de:{b_design:"Design {0}", b_designkurz:"Design", b_design_da:"Design freigeschaltet", b_ansporn:"Dafür lohnt sich das Wiederkommen", b_nach7:"nach 7 Tagen", b_nach10w:"nach {0} Wochen", b_besitz:"gehört dir", sk_woche:"7 Tage Tagesbonus", sk_woche_note:"Sunflare gibt es für die erste volle Woche Tagesbonus."},
  es:{b_design:"Diseño {0}", b_designkurz:"Diseño", b_design_da:"Diseño desbloqueado", b_ansporn:"Vale la pena volver", b_nach7:"tras 7 días", b_nach10w:"tras {0} semanas", b_besitz:"es tuyo", sk_woche:"7 días de bono diario", sk_woche_note:"Sunflare llega con la primera semana completa de bono diario."},
  pt:{b_design:"Design {0}", b_designkurz:"Design", b_design_da:"Design desbloqueado", b_ansporn:"Vale a pena voltar", b_nach7:"após 7 dias", b_nach10w:"após {0} semanas", b_besitz:"é teu", sk_woche:"7 dias de bónus diário", sk_woche_note:"O Sunflare vem com a primeira semana completa de bónus diário."},
  fr:{b_design:"Design {0}", b_designkurz:"Design", b_design_da:"Design débloqué", b_ansporn:"Ça vaut le coup de revenir", b_nach7:"après 7 jours", b_nach10w:"après {0} semaines", b_besitz:"à vous", sk_woche:"7 jours de bonus quotidien", sk_woche_note:"Sunflare vient avec la première semaine complète de bonus quotidien."},
  tr:{b_design:"{0} tasarımı", b_designkurz:"Tasarım", b_design_da:"Tasarım açıldı", b_ansporn:"Geri gelmeye değer", b_nach7:"7 gün sonra", b_nach10w:"{0} hafta sonra", b_besitz:"senin", sk_woche:"7 gün günlük bonus", sk_woche_note:"Sunflare ilk tam günlük bonus haftasıyla gelir."},
  ru:{b_design:"Дизайн {0}", b_designkurz:"Дизайн", b_design_da:"Дизайн открыт", b_ansporn:"Ради этого стоит возвращаться", b_nach7:"через 7 дней", b_nach10w:"через {0} недель", b_besitz:"ваш", sk_woche:"7 дней ежедневного бонуса", sk_woche_note:"Sunflare даётся за первую полную неделю ежедневного бонуса."}
};
for (const c in LANGS107) Object.assign(LANGS[c], LANGS107[c]);

/* Liga (Schritt 108). */
const LANGS108 = {
  en:{m_liga:"League", m_liga_b:"Levels and moons count here. Swallowing stronger players pays more XP, honour and Ore."},
  de:{m_liga:"Liga", m_liga_b:"Hier zählen Level und Monde. Wer stärkere Spieler schluckt, bekommt mehr XP, Ehre und Ore."},
  es:{m_liga:"Liga", m_liga_b:"Aquí cuentan niveles y lunas. Tragar jugadores más fuertes da más XP, honor y Ore."},
  pt:{m_liga:"Liga", m_liga_b:"Aqui contam níveis e luas. Engolir jogadores mais fortes rende mais XP, honra e Ore."},
  fr:{m_liga:"Ligue", m_liga_b:"Ici, niveaux et lunes comptent. Avaler des joueurs plus forts rapporte plus d'XP, d'honneur et de minerai."},
  tr:{m_liga:"Lig", m_liga_b:"Burada seviyeler ve aylar sayılır. Daha güçlü oyuncuları yutmak daha çok XP, onur ve cevher getirir."},
  ru:{m_liga:"Лига", m_liga_b:"Здесь важны уровни и луны. Поглощение более сильных игроков даёт больше опыта, чести и руды."}
};
for (const c in LANGS108) Object.assign(LANGS[c], LANGS108[c]);

/* Kaufleiste im Laden (Schritt 67; Geldkauf seit Schritt 101 zurückgebaut). */
const LANGS23 = {
  en:{kauf_wahl:"{0} — {1} Ore", kauf_ore:"Buy for {0} Ore"},
  de:{kauf_wahl:"{0} — {1} Ore", kauf_ore:"Für {0} Ore kaufen"},
  es:{kauf_wahl:"{0} — {1} Ore", kauf_ore:"Comprar por {0} Ore"},
  pt:{kauf_wahl:"{0} — {1} Ore", kauf_ore:"Comprar por {0} Ore"},
  fr:{kauf_wahl:"{0} — {1} minerai", kauf_ore:"Acheter pour {0} minerai"},
  tr:{kauf_wahl:"{0} — {1} cevher", kauf_ore:"{0} cevhere satın al"},
  ru:{kauf_wahl:"{0} — {1} руды", kauf_ore:"Купить за {0} руды"}
};
for (const c in LANGS23) Object.assign(LANGS[c], LANGS23[c]);

/* Schritt 69 — „Freier Raum" und „Online" sind ein Modus geworden.

   Vorher standen beide nebeneinander im Menü und waren für Spieler nicht zu
   unterscheiden: Beides ist alle gegen alle auf der ganzen Karte. Jetzt ist
   „Freier Raum" der Onlinemodus; fehlende Mitspieler füllt der Server mit
   Computergegnern auf, und ohne erreichbaren Server läuft dieselbe Runde auf
   dem eigenen Gerät weiter. Der Beschreibungstext sagt beides, weil beides
   eintreten kann und der Spieler sonst nicht versteht, warum einmal „NPC"
   vor den Namen steht und einmal nicht. */
const LANGS24 = {
  en:{m_online:"Open space", m_online_b:"Everyone on one field. Real players first — while fewer are online, computer rivals marked NPC fill the room. Without a connection the round runs on your device."},
  de:{m_online:"Freier Raum", m_online_b:"Alle auf einem Feld. Zuerst echte Mitspieler — solange weniger online sind, füllen Computergegner mit „NPC“ im Namen den Raum auf. Ohne Verbindung läuft die Runde auf deinem Gerät."},
  es:{m_online:"Espacio abierto", m_online_b:"Todos en un campo. Primero jugadores reales — mientras haya menos conectados, rivales de la máquina marcados NPC llenan la sala. Sin conexión la ronda corre en tu dispositivo."},
  pt:{m_online:"Espaço aberto", m_online_b:"Todos num campo. Jogadores reais primeiro — enquanto houver menos online, rivais do computador marcados NPC enchem a sala. Sem ligação a ronda corre no teu aparelho."},
  fr:{m_online:"Espace libre", m_online_b:"Tous sur un même terrain. De vrais joueurs d'abord — tant qu'il y en a moins, des rivaux informatiques marqués NPC complètent la salle. Sans connexion, la manche tourne sur votre appareil."},
  tr:{m_online:"Açık uzay", m_online_b:"Herkes tek alanda. Önce gerçek oyuncular — daha az kişi çevrimiçiyken NPC işaretli bilgisayar rakipleri odayı doldurur. Bağlantı yoksa tur cihazında çalışır."},
  ru:{m_online:"Открытый космос", m_online_b:"Все на одном поле. Сначала живые игроки — пока их меньше, комнату заполняют компьютерные соперники с пометкой NPC. Без соединения раунд идёт на вашем устройстве."}
};
for (const c in LANGS24) Object.assign(LANGS[c], LANGS24[c]);

/* Schritt 70 — kürzere Texte für den Startbildschirm.

   `boostnote` nannte seit der Zusammenlegung noch „Freier Raum und Online" —
   zwei Modi, die es nicht mehr getrennt gibt. `m_online_b` war vier Zeilen
   lang und machte die Moduskacheln unterschiedlich hoch; die Erklärung, was
   NPCs sind und was ohne Verbindung passiert, steht ohnehin auf `about.html`
   und im Spiel selbst am Namen jedes Gegners. */
const LANGS25 = {
  en:{boostnote:"Open space only. Bigger also means slower and easier to spot. Paid with Ore you earned.",
      m_online_b:"Everyone on one field. Real players, topped up with NPCs. Runs offline too."},
  de:{boostnote:"Nur im freien Raum. Größer heißt auch langsamer und auffälliger. Bezahlt mit erspieltem Ore.",
      m_online_b:"Alle auf einem Feld. Echte Mitspieler, mit NPCs aufgefüllt. Geht auch offline."},
  es:{boostnote:"Solo en espacio abierto. Más grande también es más lento y más visible. Se paga con Ore ganado.",
      m_online_b:"Todos en un campo. Jugadores reales, completado con NPC. También sin conexión."},
  pt:{boostnote:"Só no espaço aberto. Maior também é mais lento e mais visível. Pago com Ore conquistado.",
      m_online_b:"Todos num campo. Jogadores reais, completado com NPC. Funciona offline."},
  fr:{boostnote:"Uniquement en espace libre. Plus gros veut dire plus lent et plus visible. Payé en minerai gagné.",
      m_online_b:"Tous sur un terrain. De vrais joueurs, complétés par des NPC. Marche hors ligne."},
  tr:{boostnote:"Yalnızca açık uzayda. Daha büyük olmak daha yavaş ve daha görünür demek. Kazanılan cevherle ödenir.",
      m_online_b:"Herkes tek alanda. Gerçek oyuncular, NPC ile tamamlanır. Çevrimdışı da çalışır."},
  ru:{boostnote:"Только в открытом космосе. Крупнее — значит медленнее и заметнее. Оплата заработанной рудой.",
      m_online_b:"Все на одном поле. Живые игроки, дополненные NPC. Работает и без сети."}
};
for (const c in LANGS25) Object.assign(LANGS[c], LANGS25[c]);

/* Schritt 70 — Zahl der Spieler unter dem Startknopf. */
const LANGS26 = {
  en:{online1:"1 player in orbit right now", onlinen:"{0} players in orbit right now"},
  de:{online1:"1 Spieler gerade im Orbit",   onlinen:"{0} Spieler gerade im Orbit"},
  es:{online1:"1 jugador en órbita ahora",   onlinen:"{0} jugadores en órbita ahora"},
  pt:{online1:"1 jogador em órbita agora",   onlinen:"{0} jogadores em órbita agora"},
  fr:{online1:"1 joueur en orbite",          onlinen:"{0} joueurs en orbite"},
  tr:{online1:"Şu anda yörüngede 1 oyuncu",  onlinen:"Şu anda yörüngede {0} oyuncu"},
  ru:{online1:"Сейчас на орбите 1 игрок",    onlinen:"Сейчас на орбите {0} игроков"}
};
for (const c in LANGS26) Object.assign(LANGS[c], LANGS26[c]);
/* LANGS27 (online0, „Noch niemand im Orbit") ist seit Schritt 101 weg — bei
   null Spielern steht gar nichts, siehe onlineZeigen() in spiel.js. */

/* Schritt 71 — Musik. Eigene Zeile in den Einstellungen, getrennt von den
   Spielgeräuschen. */
const LANGS28 = {
  en:{s_music:"Music", s_music_h:"Calm background music, generated in the game. Separate from the game sounds."},
  de:{s_music:"Musik", s_music_h:"Ruhige Hintergrundmusik, im Spiel erzeugt. Getrennt von den Spielgeräuschen."},
  es:{s_music:"Música", s_music_h:"Música de fondo tranquila, generada en el juego. Aparte de los efectos."},
  pt:{s_music:"Música", s_music_h:"Música de fundo calma, gerada no jogo. Separada dos efeitos."},
  fr:{s_music:"Musique", s_music_h:"Musique d'ambiance calme, générée dans le jeu. Séparée des effets."},
  tr:{s_music:"Müzik", s_music_h:"Oyunda üretilen sakin arka plan müziği. Oyun seslerinden ayrı."},
  ru:{s_music:"Музыка", s_music_h:"Спокойная фоновая музыка, создаётся в игре. Отдельно от звуков."}
};
for (const c in LANGS28) Object.assign(LANGS[c], LANGS28[c]);

/* Schritt 74 — Einwilligung für Werbung und Reichweitenmessung.

   Der Text sagt, was Sache ist, und beschönigt nichts: Für das Spiel selbst
   braucht Talumi keine Cookies, für Werbung schon. „Alle ablehnen" steht
   gleichberechtigt neben „Alle annehmen" — anders wäre die Einwilligung nach
   deutschem Recht unwirksam. */
const LANGS29 = {
  en:{ck_kopf:"Cookies", ck_mehr:"Privacy policy",
      ck_text:"Talumi needs no cookies for the game itself. For advertising and audience measurement it does. You decide, and you can change your mind at any time under Settings.",
      ck_ja:"Accept all", ck_nein:"Reject all", ck_fein:"Choose", ck_speichern:"Save choice",
      ck_noetig:"Necessary", ck_noetig_h:"Keeps you signed in and remembers your settings. Always on, and never used for anything else.",
      ck_werbung:"Advertising", ck_werbung_h:"Lets a third party show ads between rounds. Never during a round.",
      ck_messung:"Audience measurement", ck_messung_h:"Counts how many people play and roughly where they come from.",
      ck_aendern:"Change", ck_stand_ja:"You have allowed some of it.",
      ck_stand_nein:"You have refused everything optional.", ck_stand_offen:"Not decided yet."},
  de:{ck_kopf:"Cookies", ck_mehr:"Datenschutzerklärung",
      ck_text:"Für das Spiel selbst braucht Talumi keine Cookies. Für Werbung und Reichweitenmessung schon. Du entscheidest, und du kannst es jederzeit in den Einstellungen ändern.",
      ck_ja:"Alle annehmen", ck_nein:"Alle ablehnen", ck_fein:"Auswählen", ck_speichern:"Auswahl speichern",
      ck_noetig:"Notwendig", ck_noetig_h:"Hält dich angemeldet und merkt sich deine Einstellungen. Immer an, und für nichts anderes benutzt.",
      ck_werbung:"Werbung", ck_werbung_h:"Erlaubt einem fremden Anbieter, zwischen den Runden Werbung zu zeigen. Nie während einer Runde.",
      ck_messung:"Reichweitenmessung", ck_messung_h:"Zählt, wie viele Leute spielen und ungefähr woher sie kommen.",
      ck_aendern:"Ändern", ck_stand_ja:"Du hast etwas davon erlaubt.",
      ck_stand_nein:"Du hast alles Freiwillige abgelehnt.", ck_stand_offen:"Noch nicht entschieden."},
  es:{ck_kopf:"Cookies", ck_mehr:"Política de privacidad",
      ck_text:"Talumi no necesita cookies para el juego en sí. Para la publicidad y la medición, sí. Tú decides, y puedes cambiarlo cuando quieras en Ajustes.",
      ck_ja:"Aceptar todo", ck_nein:"Rechazar todo", ck_fein:"Elegir", ck_speichern:"Guardar elección",
      ck_noetig:"Necesarias", ck_noetig_h:"Mantiene tu sesión y recuerda tus ajustes. Siempre activas.",
      ck_werbung:"Publicidad", ck_werbung_h:"Permite que un tercero muestre anuncios entre rondas. Nunca durante una ronda.",
      ck_messung:"Medición de audiencia", ck_messung_h:"Cuenta cuánta gente juega y aproximadamente de dónde viene.",
      ck_aendern:"Cambiar", ck_stand_ja:"Has permitido parte de ello.",
      ck_stand_nein:"Has rechazado todo lo opcional.", ck_stand_offen:"Aún sin decidir."},
  pt:{ck_kopf:"Cookies", ck_mehr:"Política de privacidade",
      ck_text:"O Talumi não precisa de cookies para o jogo em si. Para publicidade e medição, precisa. Tu decides, e podes mudar quando quiseres nos Ajustes.",
      ck_ja:"Aceitar tudo", ck_nein:"Rejeitar tudo", ck_fein:"Escolher", ck_speichern:"Guardar escolha",
      ck_noetig:"Necessários", ck_noetig_h:"Mantém-te ligado e guarda os teus ajustes. Sempre ativos.",
      ck_werbung:"Publicidade", ck_werbung_h:"Permite que terceiros mostrem anúncios entre rondas. Nunca durante uma ronda.",
      ck_messung:"Medição de audiência", ck_messung_h:"Conta quantas pessoas jogam e mais ou menos de onde vêm.",
      ck_aendern:"Mudar", ck_stand_ja:"Permitiste parte disso.",
      ck_stand_nein:"Rejeitaste tudo o que é opcional.", ck_stand_offen:"Ainda não decidiste."},
  fr:{ck_kopf:"Cookies", ck_mehr:"Politique de confidentialité",
      ck_text:"Talumi n'a pas besoin de cookies pour le jeu lui-même. Pour la publicité et la mesure d'audience, si. C'est vous qui décidez, et vous pouvez changer d'avis à tout moment dans les Réglages.",
      ck_ja:"Tout accepter", ck_nein:"Tout refuser", ck_fein:"Choisir", ck_speichern:"Enregistrer",
      ck_noetig:"Nécessaires", ck_noetig_h:"Vous garde connecté et retient vos réglages. Toujours actifs.",
      ck_werbung:"Publicité", ck_werbung_h:"Permet à un tiers d'afficher des publicités entre les manches. Jamais pendant une manche.",
      ck_messung:"Mesure d'audience", ck_messung_h:"Compte combien de personnes jouent et d'où elles viennent à peu près.",
      ck_aendern:"Modifier", ck_stand_ja:"Vous en avez autorisé une partie.",
      ck_stand_nein:"Vous avez refusé tout l'optionnel.", ck_stand_offen:"Pas encore décidé."},
  tr:{ck_kopf:"Çerezler", ck_mehr:"Gizlilik politikası",
      ck_text:"Talumi oyunun kendisi için çereze ihtiyaç duymaz. Reklam ve ölçüm için duyar. Karar senin, ve istediğin zaman Ayarlar'dan değiştirebilirsin.",
      ck_ja:"Tümünü kabul et", ck_nein:"Tümünü reddet", ck_fein:"Seç", ck_speichern:"Seçimi kaydet",
      ck_noetig:"Gerekli", ck_noetig_h:"Oturumunu açık tutar ve ayarlarını hatırlar. Her zaman açık.",
      ck_werbung:"Reklam", ck_werbung_h:"Üçüncü tarafın turlar arasında reklam göstermesine izin verir. Tur sırasında asla.",
      ck_messung:"Kitle ölçümü", ck_messung_h:"Kaç kişinin oynadığını ve kabaca nereden geldiğini sayar.",
      ck_aendern:"Değiştir", ck_stand_ja:"Bir kısmına izin verdin.",
      ck_stand_nein:"İsteğe bağlı olan her şeyi reddettin.", ck_stand_offen:"Henüz karar vermedin."},
  ru:{ck_kopf:"Cookie", ck_mehr:"Политика конфиденциальности",
      ck_text:"Для самой игры Talumi не нужны cookie. Для рекламы и подсчёта аудитории — нужны. Решаете вы, и в любой момент можно изменить решение в настройках.",
      ck_ja:"Принять всё", ck_nein:"Отклонить всё", ck_fein:"Выбрать", ck_speichern:"Сохранить выбор",
      ck_noetig:"Необходимые", ck_noetig_h:"Держат вас в аккаунте и помнят настройки. Всегда включены.",
      ck_werbung:"Реклама", ck_werbung_h:"Позволяет стороннему сервису показывать рекламу между раундами. Никогда во время раунда.",
      ck_messung:"Подсчёт аудитории", ck_messung_h:"Считает, сколько людей играет и примерно откуда.",
      ck_aendern:"Изменить", ck_stand_ja:"Вы разрешили часть.",
      ck_stand_nein:"Вы отклонили всё необязательное.", ck_stand_offen:"Ещё не решено."}
};
for (const c in LANGS29) Object.assign(LANGS[c], LANGS29[c]);

/* Schritt 95: freiwillige Belohnungsanzeige auf Spieleportalen. */
const LANGS30 = {
  en:{rw_double:"▶ Watch an ad: double your Ore (+{0})", rw_done:"+{0} Ore added. Thanks for watching!", rw_none:"No ad available right now — try again later.", rw_optional:"Optional — you keep your Ore either way."},
  de:{rw_double:"▶ Werbung ansehen: Ore verdoppeln (+{0})", rw_done:"+{0} Ore gutgeschrieben. Danke fürs Ansehen!", rw_none:"Gerade keine Werbung verfügbar — später nochmal.", rw_optional:"Freiwillig — dein Ore behältst du so oder so."},
  es:{rw_double:"▶ Ver un anuncio: duplica tu Ore (+{0})", rw_done:"+{0} Ore añadido. ¡Gracias por verlo!", rw_none:"No hay anuncios ahora — inténtalo más tarde.", rw_optional:"Opcional — conservas tu Ore de todos modos."},
  pt:{rw_double:"▶ Ver um anúncio: dobre seu Ore (+{0})", rw_done:"+{0} Ore adicionado. Obrigado por assistir!", rw_none:"Nenhum anúncio disponível agora — tente mais tarde.", rw_optional:"Opcional — você mantém seu Ore de qualquer jeito."},
  fr:{rw_double:"▶ Regarder une pub : doubler votre Ore (+{0})", rw_done:"+{0} Ore ajouté. Merci d’avoir regardé !", rw_none:"Aucune pub disponible pour l’instant — réessayez plus tard.", rw_optional:"Facultatif — vous gardez votre Ore dans tous les cas."},
  tr:{rw_double:"▶ Reklam izle: Ore'unu ikiye katla (+{0})", rw_done:"+{0} Ore eklendi. İzlediğin için teşekkürler!", rw_none:"Şu an reklam yok — sonra tekrar dene.", rw_optional:"İsteğe bağlı — Ore'un her durumda sende kalır."},
  ru:{rw_double:"▶ Посмотреть рекламу: удвоить Ore (+{0})", rw_done:"+{0} Ore начислено. Спасибо за просмотр!", rw_none:"Сейчас нет рекламы — попробуйте позже.", rw_optional:"По желанию — Ore остаётся у вас в любом случае."}
};
for (const c in LANGS30) Object.assign(LANGS[c], LANGS30[c]);

/* Schritt 96: nächstes Ziel auf dem Ergebnisbildschirm. */
const LANGS31 = {
  en:{e_ziel:"{0} XP to level {1}"}, de:{e_ziel:"Noch {0} XP bis Level {1}"},
  es:{e_ziel:"Faltan {0} XP para el nivel {1}"}, pt:{e_ziel:"Faltam {0} XP para o nível {1}"},
  fr:{e_ziel:"Encore {0} XP jusqu’au niveau {1}"}, tr:{e_ziel:"Seviye {1} için {0} XP kaldı"},
  ru:{e_ziel:"До уровня {1} осталось {0} XP"}
};
for (const c in LANGS31) Object.assign(LANGS[c], LANGS31[c]);

/* Schritt 97: der Titel. Der Name steht nur hier — umbenennen heißt: diese
   sieben `titel_name` ändern, sonst nichts. */
const LANGS32 = {
  en:{titel_name:"Titan", titel_du:"You are now the {0}! Stay alive as long as you can.", titel_weg:"{1} swallowed you and took the {0} title.", titel_regel:"One body per room carries the {0} title. Swallow its bearer completely to take it. Ranked by the longest single reign.", titel_leer:"Nobody has held the {0} title yet."},
  de:{titel_name:"Titan", titel_du:"Du bist jetzt der {0}! Bleib so lange am Leben, wie du kannst.", titel_weg:"{1} hat dich verschlungen und trägt jetzt den Titel {0}.", titel_regel:"Ein Körper je Raum trägt den Titel {0}. Wer ihn ganz verschlingt, übernimmt ihn. Gewertet wird die längste Zeit am Stück.", titel_leer:"Den Titel {0} hat noch niemand getragen."},
  es:{titel_name:"Titán", titel_du:"¡Ahora eres el {0}! Sobrevive todo lo que puedas.", titel_weg:"{1} te devoró y ahora lleva el título de {0}.", titel_regel:"Un cuerpo por sala lleva el título de {0}. Devora por completo a quien lo lleve para quitárselo. Cuenta el reinado más largo.", titel_leer:"Nadie ha llevado aún el título de {0}."},
  pt:{titel_name:"Titã", titel_du:"Agora você é o {0}! Sobreviva o máximo que puder.", titel_weg:"{1} devorou você e agora é o {0}.", titel_regel:"Um corpo por sala carrega o título de {0}. Devore quem o carrega por inteiro para tomá-lo. Conta o reinado mais longo.", titel_leer:"Ninguém carregou o título de {0} ainda."},
  fr:{titel_name:"Titan", titel_du:"Vous êtes maintenant le {0} ! Survivez le plus longtemps possible.", titel_weg:"{1} vous a englouti et porte maintenant le titre de {0}.", titel_regel:"Un corps par salle porte le titre de {0}. Engloutissez entièrement son porteur pour le prendre. Classement au plus long règne.", titel_leer:"Personne n’a encore porté le titre de {0}."},
  tr:{titel_name:"Titan", titel_du:"Artık {0} sensin! Olabildiğince uzun hayatta kal.", titel_weg:"{1} seni yuttu ve artık {0} unvanı onda.", titel_regel:"Her odada bir gövde {0} unvanını taşır. Unvanı almak için taşıyanı tamamen yut. En uzun kesintisiz süre sayılır.", titel_leer:"{0} unvanını henüz kimse taşımadı."},
  ru:{titel_name:"Титан", titel_du:"Теперь вы {0}! Держитесь как можно дольше.", titel_weg:"{1} поглотил вас и теперь носит титул «{0}».", titel_regel:"В каждой комнате одно тело носит титул «{0}». Поглотите носителя целиком, чтобы забрать его. Засчитывается самое долгое правление.", titel_leer:"Титул «{0}» ещё никто не носил."}
};
for (const c in LANGS32) Object.assign(LANGS[c], LANGS32[c]);

/* Schritt 99: Konsole nach dem Entwurf B. */
const LANGS33 = {
  en:{b_tag:"Day {0} of 7", k_all:"all", namepick:"Choose a player name", e_name_gesperrt:"Your name can be changed once every 30 days."},
  de:{b_tag:"Tag {0} von 7", k_all:"alle", namepick:"Wähle einen Spielernamen", e_name_gesperrt:"Der Name lässt sich nur alle 30 Tage ändern."},
  es:{b_tag:"Día {0} de 7", k_all:"todas", namepick:"Elige un nombre de jugador", e_name_gesperrt:"El nombre solo se puede cambiar cada 30 días."},
  pt:{b_tag:"Dia {0} de 7", k_all:"todas", namepick:"Escolha um nome de jogador", e_name_gesperrt:"O nome só pode ser alterado a cada 30 dias."},
  fr:{b_tag:"Jour {0} sur 7", k_all:"tout", namepick:"Choisissez un nom de joueur", e_name_gesperrt:"Le nom ne peut être changé que tous les 30 jours."},
  tr:{b_tag:"{0}. gün / 7", k_all:"tümü", namepick:"Bir oyuncu adı seç", e_name_gesperrt:"Ad yalnızca 30 günde bir değiştirilebilir."},
  ru:{b_tag:"День {0} из 7", k_all:"все", namepick:"Выберите имя игрока", e_name_gesperrt:"Имя можно менять раз в 30 дней."}
};
for (const c in LANGS33) Object.assign(LANGS[c], LANGS33[c]);

/* Schritt 100: Happy Hour. */
const LANGS34 = {
  en:{hh_aktiv:"Happy Hour: {0}× Ore — {1} min left", hh_naechste:"Happy Hour daily at {0}: {1}× Ore for every round", hh_zeile:"Happy Hour bonus", k_pw2:"Repeat password", e_pwmatch:"The two passwords do not match.", s_eco:"Frame rate low — detail reduced for this round."},
  de:{hh_aktiv:"Happy Hour: {0}× Ore — noch {1} min", hh_naechste:"Happy Hour täglich um {0}: {1}× Ore für jede Runde", hh_zeile:"Happy-Hour-Bonus", k_pw2:"Passwort wiederholen", e_pwmatch:"Die beiden Passwörter stimmen nicht überein.", s_eco:"Bildrate niedrig — Details für diese Runde verringert."},
  es:{hh_aktiv:"Happy Hour: {0}× Ore — quedan {1} min", hh_naechste:"Happy Hour cada día a las {0}: {1}× Ore por ronda", hh_zeile:"Bono de Happy Hour", k_pw2:"Repite la contraseña", e_pwmatch:"Las dos contraseñas no coinciden.", s_eco:"Fluidez baja — menos detalle en esta ronda."},
  pt:{hh_aktiv:"Happy Hour: {0}× Ore — faltam {1} min", hh_naechste:"Happy Hour todo dia às {0}: {1}× Ore por rodada", hh_zeile:"Bônus de Happy Hour", k_pw2:"Repita a senha", e_pwmatch:"As duas senhas não coincidem.", s_eco:"Taxa de quadros baixa — menos detalhes nesta rodada."},
  fr:{hh_aktiv:"Happy Hour : {0}× Ore — encore {1} min", hh_naechste:"Happy Hour chaque jour à {0} : {1}× Ore par manche", hh_zeile:"Bonus Happy Hour", k_pw2:"Répéter le mot de passe", e_pwmatch:"Les deux mots de passe ne correspondent pas.", s_eco:"Fluidité faible — détails réduits pour cette manche."},
  tr:{hh_aktiv:"Happy Hour: {0}× Ore — {1} dk kaldı", hh_naechste:"Her gün {0}'de Happy Hour: her tur {1}× Ore", hh_zeile:"Happy Hour bonusu", k_pw2:"Parolayı tekrarla", e_pwmatch:"İki parola birbiriyle eşleşmiyor.", s_eco:"Kare hızı düşük — bu turda ayrıntı azaltıldı."},
  ru:{hh_aktiv:"Happy Hour: {0}× Ore — осталось {1} мин", hh_naechste:"Happy Hour ежедневно в {0}: {1}× Ore за каждый раунд", hh_zeile:"Бонус Happy Hour", k_pw2:"Повторите пароль", e_pwmatch:"Пароли не совпадают.", s_eco:"Низкая частота кадров — детализация снижена на этот раунд."}
};
for (const c in LANGS34) Object.assign(LANGS[c], LANGS34[c]);

/* Schritt 100: Tagesbonus mit Gutscheinen, Ehre und XP. */
const LANGS37 = {
  en:{b_get2:"Collect day {0} — {1}", b_got2:"Day {0}: +{1}", b_boost:"Start bonus ×{0}", b_gratis:"free"},
  de:{b_get2:"Tag {0} abholen — {1}", b_got2:"Tag {0}: +{1}", b_boost:"Startbonus ×{0}", b_gratis:"gratis"},
  es:{b_get2:"Recoger día {0} — {1}", b_got2:"Día {0}: +{1}", b_boost:"Bono inicial ×{0}", b_gratis:"gratis"},
  pt:{b_get2:"Receber dia {0} — {1}", b_got2:"Dia {0}: +{1}", b_boost:"Bônus inicial ×{0}", b_gratis:"grátis"},
  fr:{b_get2:"Récupérer le jour {0} — {1}", b_got2:"Jour {0} : +{1}", b_boost:"Bonus de départ ×{0}", b_gratis:"gratuit"},
  tr:{b_get2:"{0}. günü al — {1}", b_got2:"{0}. gün: +{1}", b_boost:"Başlangıç bonusu ×{0}", b_gratis:"ücretsiz"},
  ru:{b_get2:"Забрать день {0} — {1}", b_got2:"День {0}: +{1}", b_boost:"Стартовый бонус ×{0}", b_gratis:"бесплатно"}
};
for (const c in LANGS37) Object.assign(LANGS[c], LANGS37[c]);

/* Schritt 100: Saisons. */
const LANGS38 = {
  en:{s_tab:"Season", s_kopf:"Season {0}", s_rest:"{0} days left", s_rest1:"ends today", s_ehre:"Season honour", s_regel:"Honour you collect this season. Ore is paid by rank when it ends.", s_lohn:"Season {0} is over: rank {1} — +{2} Ore", s_platz:"Rank {0}"},
  de:{s_tab:"Saison", s_kopf:"Saison {0}", s_rest:"noch {0} Tage", s_rest1:"endet heute", s_ehre:"Saison-Ehre", s_regel:"Ehre, die du in dieser Saison sammelst. Am Ende gibt es Ore nach Platz.", s_lohn:"Saison {0} ist vorbei: Platz {1} — +{2} Ore", s_platz:"Platz {0}"},
  es:{s_tab:"Temporada", s_kopf:"Temporada {0}", s_rest:"quedan {0} días", s_rest1:"termina hoy", s_ehre:"Honor de temporada", s_regel:"Honor que reúnes esta temporada. Al final hay Ore según el puesto.", s_lohn:"Temporada {0} terminada: puesto {1} — +{2} Ore", s_platz:"Puesto {0}"},
  pt:{s_tab:"Temporada", s_kopf:"Temporada {0}", s_rest:"faltam {0} dias", s_rest1:"termina hoje", s_ehre:"Honra da temporada", s_regel:"Honra que você junta nesta temporada. No fim há Ore conforme a posição.", s_lohn:"Temporada {0} acabou: posição {1} — +{2} Ore", s_platz:"Posição {0}"},
  fr:{s_tab:"Saison", s_kopf:"Saison {0}", s_rest:"encore {0} jours", s_rest1:"se termine aujourd’hui", s_ehre:"Honneur de saison", s_regel:"L’honneur gagné cette saison. À la fin, du minerai selon le rang.", s_lohn:"Saison {0} terminée : rang {1} — +{2} Ore", s_platz:"Rang {0}"},
  tr:{s_tab:"Sezon", s_kopf:"Sezon {0}", s_rest:"{0} gün kaldı", s_rest1:"bugün bitiyor", s_ehre:"Sezon şerefi", s_regel:"Bu sezon topladığın şeref. Sonunda sıraya göre cevher var.", s_lohn:"Sezon {0} bitti: {1}. sıra — +{2} Ore", s_platz:"{0}. sıra"},
  ru:{s_tab:"Сезон", s_kopf:"Сезон {0}", s_rest:"осталось {0} дн.", s_rest1:"заканчивается сегодня", s_ehre:"Честь сезона", s_regel:"Честь, собранная в этом сезоне. В конце — руда по месту.", s_lohn:"Сезон {0} завершён: место {1} — +{2} Ore", s_platz:"Место {0}"}
};
for (const c in LANGS38) Object.assign(LANGS[c], LANGS38[c]);

/* Schritt 100: Errungenschaften als Zeilen je Art. */
const LANGS35 = {
  en:{ef_masse:"Growth", ef_jagd:"Hunting", ef_jagdrunde:"Hunt in one round", ef_runden:"Endurance", ef_zeit:"Staying alive", ef_treue:"Loyalty", ef_skins:"Collecting", ef_level:"Levelling", e_naechste:"next tier", e_alle:"All tiers reached"},
  de:{ef_masse:"Wachstum", ef_jagd:"Jagd", ef_jagdrunde:"Jagd in einer Runde", ef_runden:"Ausdauer", ef_zeit:"Durchhalten", ef_treue:"Treue", ef_skins:"Sammeln", ef_level:"Aufstieg", e_naechste:"nächste Stufe", e_alle:"Alle Stufen erreicht"},
  es:{ef_masse:"Crecimiento", ef_jagd:"Caza", ef_jagdrunde:"Caza en una ronda", ef_runden:"Constancia", ef_zeit:"Resistencia", ef_treue:"Lealtad", ef_skins:"Colección", ef_level:"Nivel", e_naechste:"siguiente nivel", e_alle:"Todos los niveles logrados"},
  pt:{ef_masse:"Crescimento", ef_jagd:"Caça", ef_jagdrunde:"Caça numa rodada", ef_runden:"Constância", ef_zeit:"Resistência", ef_treue:"Lealdade", ef_skins:"Coleção", ef_level:"Nível", e_naechste:"próximo nível", e_alle:"Todos os níveis alcançados"},
  fr:{ef_masse:"Croissance", ef_jagd:"Chasse", ef_jagdrunde:"Chasse en une manche", ef_runden:"Endurance", ef_zeit:"Survie", ef_treue:"Fidélité", ef_skins:"Collection", ef_level:"Niveau", e_naechste:"palier suivant", e_alle:"Tous les paliers atteints"},
  tr:{ef_masse:"Büyüme", ef_jagd:"Av", ef_jagdrunde:"Tek turda av", ef_runden:"Dayanıklılık", ef_zeit:"Hayatta kalma", ef_treue:"Sadakat", ef_skins:"Koleksiyon", ef_level:"Seviye", e_naechste:"sonraki kademe", e_alle:"Tüm kademeler tamam"},
  ru:{ef_masse:"Рост", ef_jagd:"Охота", ef_jagdrunde:"Охота за раунд", ef_runden:"Выносливость", ef_zeit:"Выживание", ef_treue:"Верность", ef_skins:"Коллекция", ef_level:"Уровень", e_naechste:"следующая ступень", e_alle:"Все ступени достигнуты"}
};
for (const c in LANGS35) Object.assign(LANGS[c], LANGS35[c]);

/* Schritt 100: Clans. */
const LANGS36 = {
  en:{clan:"Clan", cl_konto:"Clans need an account — sign in first.", cl_none:"You are not in a clan yet.", cl_gruenden:"Found a clan", cl_name:"Clan name", cl_tag:"Tag (2–4 letters)", cl_offen:"Open to everyone", cl_zu:"By invitation only", cl_beitreten:"Join", cl_verlassen:"Leave clan", cl_sicher:"Really leave?", cl_einladen:"Invite player", cl_einladungen:"Invitations", cl_keine_einl:"No invitations.", cl_offene:"Open clans", cl_beste:"Top clans", cl_mitglieder:"Members", cl_leiter:"Leader", cl_mitglied:"Member", cl_ehre:"Clan honour", cl_platz:"Rank", cl_rauswerfen:"Remove", cl_uebergeben:"Make leader", cl_von:"from {0}", cl_suchen:"Search clans", cl_keine:"No clans yet — found the first one.", cl_gegruendet:"Clan {0} founded.", cl_beigetreten:"Welcome to {0}.", cl_verlassen_ok:"You left the clan.", cl_eingeladen:"{0} invited.", cl_entfernt:"Removed.", cl_gruender:"Founded {0}", cl_max:"{0} of {1} members", e_cl_name:"Clan name: 3–20 letters, digits, spaces, . _ -", e_cl_tag:"Tag: 2–4 letters or digits.", e_cl_name_vergeben:"That clan name is taken.", e_cl_tag_vergeben:"That tag is taken.", e_schon_im_clan:"Already in a clan.", e_kein_clan:"Not in a clan.", e_clan_voll:"This clan is full.", e_clan_geschlossen:"This clan takes members by invitation only.", e_nicht_leiter:"Only the leader can do that.", e_clan_unbekannt:"Clan not found.", e_konto_unbekannt:"No player with that name.", e_selbst:"That is you."},
  de:{clan:"Clan", cl_konto:"Clans brauchen ein Konto — melde dich zuerst an.", cl_none:"Du bist noch in keinem Clan.", cl_gruenden:"Clan gründen", cl_name:"Clanname", cl_tag:"Kürzel (2–4 Zeichen)", cl_offen:"Offen für alle", cl_zu:"Nur auf Einladung", cl_beitreten:"Beitreten", cl_verlassen:"Clan verlassen", cl_sicher:"Wirklich verlassen?", cl_einladen:"Spieler einladen", cl_einladungen:"Einladungen", cl_keine_einl:"Keine Einladungen.", cl_offene:"Offene Clans", cl_beste:"Beste Clans", cl_mitglieder:"Mitglieder", cl_leiter:"Leiter", cl_mitglied:"Mitglied", cl_ehre:"Clan-Ehre", cl_platz:"Platz", cl_rauswerfen:"Entfernen", cl_uebergeben:"Zum Leiter machen", cl_von:"von {0}", cl_suchen:"Clan suchen", cl_keine:"Noch keine Clans — gründe den ersten.", cl_gegruendet:"Clan {0} gegründet.", cl_beigetreten:"Willkommen bei {0}.", cl_verlassen_ok:"Du hast den Clan verlassen.", cl_eingeladen:"{0} eingeladen.", cl_entfernt:"Entfernt.", cl_gruender:"Gegründet {0}", cl_max:"{0} von {1} Mitgliedern", e_cl_name:"Clanname: 3–20 Buchstaben, Ziffern, Leerzeichen, . _ -", e_cl_tag:"Kürzel: 2–4 Buchstaben oder Ziffern.", e_cl_name_vergeben:"Diesen Clannamen gibt es schon.", e_cl_tag_vergeben:"Dieses Kürzel gibt es schon.", e_schon_im_clan:"Schon in einem Clan.", e_kein_clan:"Nicht in einem Clan.", e_clan_voll:"Dieser Clan ist voll.", e_clan_geschlossen:"Dieser Clan nimmt nur auf Einladung auf.", e_nicht_leiter:"Das darf nur der Leiter.", e_clan_unbekannt:"Clan nicht gefunden.", e_konto_unbekannt:"Kein Spieler mit diesem Namen.", e_selbst:"Das bist du selbst."},
  es:{clan:"Clan", cl_konto:"Los clanes necesitan una cuenta — inicia sesión primero.", cl_none:"Aún no estás en ningún clan.", cl_gruenden:"Fundar clan", cl_name:"Nombre del clan", cl_tag:"Etiqueta (2–4 caracteres)", cl_offen:"Abierto a todos", cl_zu:"Solo por invitación", cl_beitreten:"Unirse", cl_verlassen:"Salir del clan", cl_sicher:"¿Salir de verdad?", cl_einladen:"Invitar jugador", cl_einladungen:"Invitaciones", cl_keine_einl:"Sin invitaciones.", cl_offene:"Clanes abiertos", cl_beste:"Mejores clanes", cl_mitglieder:"Miembros", cl_leiter:"Líder", cl_mitglied:"Miembro", cl_ehre:"Honor del clan", cl_platz:"Puesto", cl_rauswerfen:"Expulsar", cl_uebergeben:"Hacer líder", cl_von:"de {0}", cl_suchen:"Buscar clan", cl_keine:"Aún no hay clanes — funda el primero.", cl_gegruendet:"Clan {0} fundado.", cl_beigetreten:"Bienvenido a {0}.", cl_verlassen_ok:"Has salido del clan.", cl_eingeladen:"{0} invitado.", cl_entfernt:"Expulsado.", cl_gruender:"Fundado {0}", cl_max:"{0} de {1} miembros", e_cl_name:"Nombre: 3–20 letras, cifras, espacios, . _ -", e_cl_tag:"Etiqueta: 2–4 letras o cifras.", e_cl_name_vergeben:"Ese nombre de clan ya existe.", e_cl_tag_vergeben:"Esa etiqueta ya existe.", e_schon_im_clan:"Ya estás en un clan.", e_kein_clan:"No estás en un clan.", e_clan_voll:"Este clan está lleno.", e_clan_geschlossen:"Este clan solo acepta por invitación.", e_nicht_leiter:"Solo el líder puede hacerlo.", e_clan_unbekannt:"Clan no encontrado.", e_konto_unbekannt:"No hay jugador con ese nombre.", e_selbst:"Ese eres tú."},
  pt:{clan:"Clã", cl_konto:"Clãs precisam de uma conta — entre primeiro.", cl_none:"Você ainda não está em nenhum clã.", cl_gruenden:"Fundar clã", cl_name:"Nome do clã", cl_tag:"Sigla (2–4 caracteres)", cl_offen:"Aberto a todos", cl_zu:"Só por convite", cl_beitreten:"Entrar", cl_verlassen:"Sair do clã", cl_sicher:"Sair mesmo?", cl_einladen:"Convidar jogador", cl_einladungen:"Convites", cl_keine_einl:"Sem convites.", cl_offene:"Clãs abertos", cl_beste:"Melhores clãs", cl_mitglieder:"Membros", cl_leiter:"Líder", cl_mitglied:"Membro", cl_ehre:"Honra do clã", cl_platz:"Posição", cl_rauswerfen:"Remover", cl_uebergeben:"Tornar líder", cl_von:"de {0}", cl_suchen:"Buscar clã", cl_keine:"Ainda não há clãs — funde o primeiro.", cl_gegruendet:"Clã {0} fundado.", cl_beigetreten:"Bem-vindo ao {0}.", cl_verlassen_ok:"Você saiu do clã.", cl_eingeladen:"{0} convidado.", cl_entfernt:"Removido.", cl_gruender:"Fundado {0}", cl_max:"{0} de {1} membros", e_cl_name:"Nome: 3–20 letras, dígitos, espaços, . _ -", e_cl_tag:"Sigla: 2–4 letras ou dígitos.", e_cl_name_vergeben:"Esse nome de clã já existe.", e_cl_tag_vergeben:"Essa sigla já existe.", e_schon_im_clan:"Já está em um clã.", e_kein_clan:"Não está em um clã.", e_clan_voll:"Este clã está cheio.", e_clan_geschlossen:"Este clã só aceita por convite.", e_nicht_leiter:"Só o líder pode fazer isso.", e_clan_unbekannt:"Clã não encontrado.", e_konto_unbekannt:"Nenhum jogador com esse nome.", e_selbst:"Esse é você."},
  fr:{clan:"Clan", cl_konto:"Les clans demandent un compte — connectez-vous d’abord.", cl_none:"Vous n’êtes encore dans aucun clan.", cl_gruenden:"Fonder un clan", cl_name:"Nom du clan", cl_tag:"Sigle (2–4 caractères)", cl_offen:"Ouvert à tous", cl_zu:"Sur invitation seulement", cl_beitreten:"Rejoindre", cl_verlassen:"Quitter le clan", cl_sicher:"Vraiment quitter ?", cl_einladen:"Inviter un joueur", cl_einladungen:"Invitations", cl_keine_einl:"Aucune invitation.", cl_offene:"Clans ouverts", cl_beste:"Meilleurs clans", cl_mitglieder:"Membres", cl_leiter:"Chef", cl_mitglied:"Membre", cl_ehre:"Honneur du clan", cl_platz:"Rang", cl_rauswerfen:"Retirer", cl_uebergeben:"Nommer chef", cl_von:"de {0}", cl_suchen:"Chercher un clan", cl_keine:"Pas encore de clan — fondez le premier.", cl_gegruendet:"Clan {0} fondé.", cl_beigetreten:"Bienvenue chez {0}.", cl_verlassen_ok:"Vous avez quitté le clan.", cl_eingeladen:"{0} invité.", cl_entfernt:"Retiré.", cl_gruender:"Fondé le {0}", cl_max:"{0} membres sur {1}", e_cl_name:"Nom : 3–20 lettres, chiffres, espaces, . _ -", e_cl_tag:"Sigle : 2–4 lettres ou chiffres.", e_cl_name_vergeben:"Ce nom de clan existe déjà.", e_cl_tag_vergeben:"Ce sigle existe déjà.", e_schon_im_clan:"Déjà dans un clan.", e_kein_clan:"Pas dans un clan.", e_clan_voll:"Ce clan est complet.", e_clan_geschlossen:"Ce clan n’accepte que sur invitation.", e_nicht_leiter:"Seul le chef peut faire cela.", e_clan_unbekannt:"Clan introuvable.", e_konto_unbekannt:"Aucun joueur de ce nom.", e_selbst:"C’est vous."},
  tr:{clan:"Klan", cl_konto:"Klanlar için hesap gerekir — önce giriş yap.", cl_none:"Henüz bir klanda değilsin.", cl_gruenden:"Klan kur", cl_name:"Klan adı", cl_tag:"Kısaltma (2–4 karakter)", cl_offen:"Herkese açık", cl_zu:"Sadece davetle", cl_beitreten:"Katıl", cl_verlassen:"Klandan ayrıl", cl_sicher:"Gerçekten ayrılmak istiyor musun?", cl_einladen:"Oyuncu davet et", cl_einladungen:"Davetler", cl_keine_einl:"Davet yok.", cl_offene:"Açık klanlar", cl_beste:"En iyi klanlar", cl_mitglieder:"Üyeler", cl_leiter:"Lider", cl_mitglied:"Üye", cl_ehre:"Klan şerefi", cl_platz:"Sıra", cl_rauswerfen:"Çıkar", cl_uebergeben:"Lider yap", cl_von:"{0} tarafından", cl_suchen:"Klan ara", cl_keine:"Henüz klan yok — ilkini kur.", cl_gegruendet:"{0} klanı kuruldu.", cl_beigetreten:"{0} klanına hoş geldin.", cl_verlassen_ok:"Klandan ayrıldın.", cl_eingeladen:"{0} davet edildi.", cl_entfernt:"Çıkarıldı.", cl_gruender:"Kuruluş {0}", cl_max:"{1} üyeden {0}", e_cl_name:"Klan adı: 3–20 harf, rakam, boşluk, . _ -", e_cl_tag:"Kısaltma: 2–4 harf veya rakam.", e_cl_name_vergeben:"Bu klan adı zaten var.", e_cl_tag_vergeben:"Bu kısaltma zaten var.", e_schon_im_clan:"Zaten bir klandasın.", e_kein_clan:"Bir klanda değilsin.", e_clan_voll:"Bu klan dolu.", e_clan_geschlossen:"Bu klan sadece davetle üye alır.", e_nicht_leiter:"Bunu sadece lider yapabilir.", e_clan_unbekannt:"Klan bulunamadı.", e_konto_unbekannt:"Bu adda oyuncu yok.", e_selbst:"Bu sensin."},
  ru:{clan:"Клан", cl_konto:"Для кланов нужен аккаунт — сначала войдите.", cl_none:"Вы пока не в клане.", cl_gruenden:"Основать клан", cl_name:"Название клана", cl_tag:"Тег (2–4 символа)", cl_offen:"Открыт для всех", cl_zu:"Только по приглашению", cl_beitreten:"Вступить", cl_verlassen:"Покинуть клан", cl_sicher:"Точно покинуть?", cl_einladen:"Пригласить игрока", cl_einladungen:"Приглашения", cl_keine_einl:"Приглашений нет.", cl_offene:"Открытые кланы", cl_beste:"Лучшие кланы", cl_mitglieder:"Участники", cl_leiter:"Лидер", cl_mitglied:"Участник", cl_ehre:"Честь клана", cl_platz:"Место", cl_rauswerfen:"Исключить", cl_uebergeben:"Сделать лидером", cl_von:"от {0}", cl_suchen:"Найти клан", cl_keine:"Кланов пока нет — создайте первый.", cl_gegruendet:"Клан {0} основан.", cl_beigetreten:"Добро пожаловать в {0}.", cl_verlassen_ok:"Вы покинули клан.", cl_eingeladen:"{0} приглашён.", cl_entfernt:"Исключён.", cl_gruender:"Основан {0}", cl_max:"{0} из {1} участников", e_cl_name:"Название: 3–20 букв, цифр, пробелов, . _ -", e_cl_tag:"Тег: 2–4 буквы или цифры.", e_cl_name_vergeben:"Такое название клана уже есть.", e_cl_tag_vergeben:"Такой тег уже есть.", e_schon_im_clan:"Вы уже в клане.", e_kein_clan:"Вы не в клане.", e_clan_voll:"Этот клан полон.", e_clan_geschlossen:"Этот клан принимает только по приглашению.", e_nicht_leiter:"Это может только лидер.", e_clan_unbekannt:"Клан не найден.", e_konto_unbekannt:"Игрока с таким именем нет.", e_selbst:"Это вы сами."}
};
for (const c in LANGS36) Object.assign(LANGS[c], LANGS36[c]);

/* Schritt 108: Monde. */
const LANGS108M = {
  en:{k_monde:"Moons", mo_kopf:"Moons", mo_erkl:"Moons are earned, never bought. Up to three orbit your body and count only in the League — at most 8 % each. In the Free Orbit everyone is equal.",
      mo_konto:"Moons need an account — sign in first.", mo_leer:"No moons yet. Below you can see how to earn them.", mo_staub:"Moondust", mo_staub_erkl:"1 per League round, 3 with a new best mass. Upgrades a moon.",
      mo_angelegt:"Equipped", mo_platz:"free slot", mo_besitz:"Your moons", mo_anlegen:"Equip", mo_ablegen:"Unequip", mo_aufwerten:"Upgrade ({0} moondust)", mo_max:"Top tier",
      mo_stufe:"Tier {0}", mo_woher:"How to earn moons", mo_neu:"New moon: {0}", mo_staub_dazu:"Moondust", mo_voll:"All three slots are in use.",
      mo_eis:"Ice moon", mo_eis_w:"loses {0} % less mass over time", mo_eisen:"Iron moon", mo_eisen_w:"pieces merge {0} % sooner",
      mo_glut:"Ember moon", mo_glut_w:"split pieces fly {0} % farther", mo_staubm:"Dust moon", mo_staubm_w:"debris is worth {0} % more", mo_sturm:"Storm moon", mo_sturm_w:"{0} % more starting mass",
      mo_q_eis:"Ice moon: eat 500 bodies in total, or reach level 20", mo_q_staub:"Dust moon: 100 debris in one round, or level 40", mo_q_eisen:"Iron moon: 25 bodies in one round, or level 60",
      mo_q_glut:"Ember moon: 1,000 bodies in total, or level 80", mo_q_sturm:"Storm moon: reach the top mass achievement"},
  de:{k_monde:"Monde", mo_kopf:"Monde", mo_erkl:"Monde werden erspielt, nie gekauft. Bis zu drei kreisen um deinen Körper und zählen nur in der Liga — höchstens 8 % je Mond. Im Freien Raum sind alle gleich.",
      mo_konto:"Monde brauchen ein Konto — melde dich zuerst an.", mo_leer:"Noch keine Monde. Unten steht, wie du sie bekommst.", mo_staub:"Mondstaub", mo_staub_erkl:"1 je Ligarunde, 3 bei neuer Bestmasse. Wertet einen Mond auf.",
      mo_angelegt:"Angelegt", mo_platz:"freier Platz", mo_besitz:"Deine Monde", mo_anlegen:"Anlegen", mo_ablegen:"Ablegen", mo_aufwerten:"Aufwerten ({0} Mondstaub)", mo_max:"Höchste Stufe",
      mo_stufe:"Stufe {0}", mo_woher:"So bekommst du Monde", mo_neu:"Neuer Mond: {0}", mo_staub_dazu:"Mondstaub", mo_voll:"Alle drei Plätze sind belegt.",
      mo_eis:"Eismond", mo_eis_w:"verliert {0} % weniger Masse mit der Zeit", mo_eisen:"Eisenmond", mo_eisen_w:"Teile finden {0} % früher zusammen",
      mo_glut:"Glutmond", mo_glut_w:"geteilte Stücke fliegen {0} % weiter", mo_staubm:"Staubmond", mo_staubm_w:"Trümmer bringen {0} % mehr", mo_sturm:"Sturmmond", mo_sturm_w:"{0} % mehr Startmasse",
      mo_q_eis:"Eismond: insgesamt 500 Körper fressen oder Level 20", mo_q_staub:"Staubmond: 100 Trümmer in einer Runde oder Level 40", mo_q_eisen:"Eisenmond: 25 Körper in einer Runde oder Level 60",
      mo_q_glut:"Glutmond: insgesamt 1.000 Körper oder Level 80", mo_q_sturm:"Sturmmond: die höchste Masse-Errungenschaft"},
  es:{k_monde:"Lunas", mo_kopf:"Lunas", mo_erkl:"Las lunas se ganan jugando, nunca se compran. Hasta tres orbitan tu cuerpo y solo cuentan en la Liga — como máximo 8 % cada una. En el Espacio libre todos son iguales.",
      mo_konto:"Las lunas necesitan una cuenta — inicia sesión primero.", mo_leer:"Aún no tienes lunas. Abajo ves cómo conseguirlas.", mo_staub:"Polvo lunar", mo_staub_erkl:"1 por partida de Liga, 3 con nueva masa récord. Mejora una luna.",
      mo_angelegt:"Equipadas", mo_platz:"hueco libre", mo_besitz:"Tus lunas", mo_anlegen:"Equipar", mo_ablegen:"Quitar", mo_aufwerten:"Mejorar ({0} polvo lunar)", mo_max:"Nivel máximo",
      mo_stufe:"Nivel {0}", mo_woher:"Cómo conseguir lunas", mo_neu:"Nueva luna: {0}", mo_staub_dazu:"Polvo lunar", mo_voll:"Los tres huecos están ocupados.",
      mo_eis:"Luna de hielo", mo_eis_w:"pierde {0} % menos masa con el tiempo", mo_eisen:"Luna de hierro", mo_eisen_w:"las partes se unen {0} % antes",
      mo_glut:"Luna de brasa", mo_glut_w:"las partes divididas vuelan {0} % más lejos", mo_staubm:"Luna de polvo", mo_staubm_w:"los escombros valen {0} % más", mo_sturm:"Luna de tormenta", mo_sturm_w:"{0} % más masa inicial",
      mo_q_eis:"Luna de hielo: 500 cuerpos en total o nivel 20", mo_q_staub:"Luna de polvo: 100 escombros en una partida o nivel 40", mo_q_eisen:"Luna de hierro: 25 cuerpos en una partida o nivel 60",
      mo_q_glut:"Luna de brasa: 1.000 cuerpos en total o nivel 80", mo_q_sturm:"Luna de tormenta: el logro de masa más alto"},
  pt:{k_monde:"Luas", mo_kopf:"Luas", mo_erkl:"Luas são conquistadas jogando, nunca compradas. Até três orbitam seu corpo e só contam na Liga — no máximo 8 % cada. No Espaço livre todos são iguais.",
      mo_konto:"Luas precisam de uma conta — entre primeiro.", mo_leer:"Ainda sem luas. Abaixo você vê como consegui-las.", mo_staub:"Poeira lunar", mo_staub_erkl:"1 por partida de Liga, 3 com nova massa recorde. Melhora uma lua.",
      mo_angelegt:"Equipadas", mo_platz:"vaga livre", mo_besitz:"Suas luas", mo_anlegen:"Equipar", mo_ablegen:"Remover", mo_aufwerten:"Melhorar ({0} poeira lunar)", mo_max:"Nível máximo",
      mo_stufe:"Nível {0}", mo_woher:"Como conseguir luas", mo_neu:"Nova lua: {0}", mo_staub_dazu:"Poeira lunar", mo_voll:"As três vagas estão ocupadas.",
      mo_eis:"Lua de gelo", mo_eis_w:"perde {0} % menos massa com o tempo", mo_eisen:"Lua de ferro", mo_eisen_w:"as partes se juntam {0} % antes",
      mo_glut:"Lua de brasa", mo_glut_w:"as partes divididas voam {0} % mais longe", mo_staubm:"Lua de poeira", mo_staubm_w:"destroços valem {0} % mais", mo_sturm:"Lua de tempestade", mo_sturm_w:"{0} % mais massa inicial",
      mo_q_eis:"Lua de gelo: 500 corpos no total ou nível 20", mo_q_staub:"Lua de poeira: 100 destroços em uma partida ou nível 40", mo_q_eisen:"Lua de ferro: 25 corpos em uma partida ou nível 60",
      mo_q_glut:"Lua de brasa: 1.000 corpos no total ou nível 80", mo_q_sturm:"Lua de tempestade: a conquista de massa mais alta"},
  fr:{k_monde:"Lunes", mo_kopf:"Lunes", mo_erkl:"Les lunes se gagnent en jouant, jamais en payant. Jusqu’à trois orbitent autour de votre corps et ne comptent qu’en Ligue — 8 % au plus chacune. En Espace libre, tout le monde est égal.",
      mo_konto:"Les lunes demandent un compte — connectez-vous d’abord.", mo_leer:"Pas encore de lunes. Ci-dessous, comment les obtenir.", mo_staub:"Poussière lunaire", mo_staub_erkl:"1 par partie de Ligue, 3 avec un nouveau record de masse. Améliore une lune.",
      mo_angelegt:"Équipées", mo_platz:"place libre", mo_besitz:"Vos lunes", mo_anlegen:"Équiper", mo_ablegen:"Retirer", mo_aufwerten:"Améliorer ({0} poussière)", mo_max:"Niveau maximal",
      mo_stufe:"Niveau {0}", mo_woher:"Comment obtenir des lunes", mo_neu:"Nouvelle lune : {0}", mo_staub_dazu:"Poussière lunaire", mo_voll:"Les trois places sont prises.",
      mo_eis:"Lune de glace", mo_eis_w:"perd {0} % de masse en moins avec le temps", mo_eisen:"Lune de fer", mo_eisen_w:"les morceaux fusionnent {0} % plus tôt",
      mo_glut:"Lune de braise", mo_glut_w:"les morceaux divisés volent {0} % plus loin", mo_staubm:"Lune de poussière", mo_staubm_w:"les débris valent {0} % de plus", mo_sturm:"Lune de tempête", mo_sturm_w:"{0} % de masse de départ en plus",
      mo_q_eis:"Lune de glace : 500 corps au total ou niveau 20", mo_q_staub:"Lune de poussière : 100 débris en une partie ou niveau 40", mo_q_eisen:"Lune de fer : 25 corps en une partie ou niveau 60",
      mo_q_glut:"Lune de braise : 1 000 corps au total ou niveau 80", mo_q_sturm:"Lune de tempête : le plus haut haut fait de masse"},
  tr:{k_monde:"Uydular", mo_kopf:"Uydular", mo_erkl:"Uydular oynayarak kazanılır, asla satın alınmaz. En fazla üçü gövdenin etrafında döner ve yalnızca Lig’de sayılır — her biri en çok % 8. Serbest Alan’da herkes eşittir.",
      mo_konto:"Uydular için hesap gerekir — önce giriş yap.", mo_leer:"Henüz uydun yok. Aşağıda nasıl kazanacağın yazıyor.", mo_staub:"Ay tozu", mo_staub_erkl:"Lig turu başına 1, yeni rekor kütlede 3. Bir uyduyu yükseltir.",
      mo_angelegt:"Takılı", mo_platz:"boş yer", mo_besitz:"Uyduların", mo_anlegen:"Tak", mo_ablegen:"Çıkar", mo_aufwerten:"Yükselt ({0} ay tozu)", mo_max:"En üst seviye",
      mo_stufe:"Seviye {0}", mo_woher:"Uydular nasıl kazanılır", mo_neu:"Yeni uydu: {0}", mo_staub_dazu:"Ay tozu", mo_voll:"Üç yer de dolu.",
      mo_eis:"Buz uydusu", mo_eis_w:"zamanla % {0} daha az kütle kaybeder", mo_eisen:"Demir uydusu", mo_eisen_w:"parçalar % {0} daha erken birleşir",
      mo_glut:"Kor uydusu", mo_glut_w:"bölünen parçalar % {0} daha uzağa uçar", mo_staubm:"Toz uydusu", mo_staubm_w:"enkaz % {0} daha değerli", mo_sturm:"Fırtına uydusu", mo_sturm_w:"% {0} daha fazla başlangıç kütlesi",
      mo_q_eis:"Buz uydusu: toplam 500 gövde ye ya da seviye 20", mo_q_staub:"Toz uydusu: bir turda 100 enkaz ya da seviye 40", mo_q_eisen:"Demir uydusu: bir turda 25 gövde ya da seviye 60",
      mo_q_glut:"Kor uydusu: toplam 1.000 gövde ya da seviye 80", mo_q_sturm:"Fırtına uydusu: en yüksek kütle başarımı"},
  ru:{k_monde:"Луны", mo_kopf:"Луны", mo_erkl:"Луны зарабатываются игрой, их нельзя купить. До трёх вращаются вокруг вашего тела и действуют только в Лиге — не больше 8 % каждая. В Свободном пространстве все равны.",
      mo_konto:"Для лун нужен аккаунт — сначала войдите.", mo_leer:"Лун пока нет. Ниже написано, как их получить.", mo_staub:"Лунная пыль", mo_staub_erkl:"1 за раунд Лиги, 3 при новом рекорде массы. Улучшает луну.",
      mo_angelegt:"Надеты", mo_platz:"свободное место", mo_besitz:"Ваши луны", mo_anlegen:"Надеть", mo_ablegen:"Снять", mo_aufwerten:"Улучшить ({0} пыли)", mo_max:"Высший уровень",
      mo_stufe:"Уровень {0}", mo_woher:"Как получить луны", mo_neu:"Новая луна: {0}", mo_staub_dazu:"Лунная пыль", mo_voll:"Все три места заняты.",
      mo_eis:"Ледяная луна", mo_eis_w:"со временем теряет на {0} % меньше массы", mo_eisen:"Железная луна", mo_eisen_w:"части сливаются на {0} % раньше",
      mo_glut:"Тлеющая луна", mo_glut_w:"разделённые части летят на {0} % дальше", mo_staubm:"Пылевая луна", mo_staubm_w:"обломки дают на {0} % больше", mo_sturm:"Штормовая луна", mo_sturm_w:"на {0} % больше стартовой массы",
      mo_q_eis:"Ледяная луна: съесть 500 тел всего или уровень 20", mo_q_staub:"Пылевая луна: 100 обломков за раунд или уровень 40", mo_q_eisen:"Железная луна: 25 тел за раунд или уровень 60",
      mo_q_glut:"Тлеющая луна: 1 000 тел всего или уровень 80", mo_q_sturm:"Штормовая луна: высшее достижение по массе"}
};
for (const c in LANGS108M) Object.assign(LANGS[c], LANGS108M[c]);

/* Schritt 109: zwei Spielarten, Skillpunkte. */
const LANGS109 = {
  en:{m_liga:"League", m_liga_b:"The main mode: levels, skill points and moons count. Swallowing stronger players pays more XP, honour and Ore.",
      m_online:"Free play", m_online_b:"Everyone equal: no level bonus, no moons, no clan tags — only the designs differ. Without a connection the round runs on your device.",
      sp_kopf:"Skill points", sp_erkl:"One point per level (up to 100), 0.1 % each. Points you place act where you put them; unplaced points act evenly on everything.",
      sp_frei:"{0} of {1} free", sp_speichern:"Save", sp_reset:"Take all back", sp_gespeichert:"Saved.", sp_konto:"Skill points need an account.",
      sp_start:"Starting mass", sp_staub:"Debris value", sp_decay:"Less mass loss", sp_merge:"Merge sooner", sp_push:"Split farther"},
  de:{m_liga:"Liga", m_liga_b:"Der Hauptmodus: Level, Skillpunkte und Monde zählen. Wer stärkere Spieler schluckt, bekommt mehr XP, Ehre und Ore.",
      m_online:"Freies Spiel", m_online_b:"Alle gleich: keine Level-Boni, keine Monde, keine Clankürzel — nur die Designs unterscheiden. Ohne Verbindung läuft die Runde auf dem Gerät.",
      sp_kopf:"Skillpunkte", sp_erkl:"Ein Punkt je Level (bis 100), je 0,1 %. Gesetzte Punkte wirken dort, wo sie stehen; ungesetzte wirken gleichmäßig auf alles.",
      sp_frei:"{0} von {1} frei", sp_speichern:"Speichern", sp_reset:"Alle zurücknehmen", sp_gespeichert:"Gespeichert.", sp_konto:"Skillpunkte brauchen ein Konto.",
      sp_start:"Startmasse", sp_staub:"Trümmerwert", sp_decay:"Weniger Schwund", sp_merge:"Schneller zusammen", sp_push:"Weiter teilen"},
  es:{m_liga:"Liga", m_liga_b:"El modo principal: cuentan niveles, puntos de habilidad y lunas. Tragar jugadores más fuertes da más XP, honor y Ore.",
      m_online:"Juego libre", m_online_b:"Todos iguales: sin bonus de nivel, sin lunas, sin etiquetas de clan — solo los diseños cambian. Sin conexión la ronda corre en tu dispositivo.",
      sp_kopf:"Puntos de habilidad", sp_erkl:"Un punto por nivel (hasta 100), 0,1 % cada uno. Los puntos colocados actúan donde los pones; los libres actúan por igual en todo.",
      sp_frei:"{0} de {1} libres", sp_speichern:"Guardar", sp_reset:"Retirar todos", sp_gespeichert:"Guardado.", sp_konto:"Los puntos de habilidad necesitan una cuenta.",
      sp_start:"Masa inicial", sp_staub:"Valor de escombros", sp_decay:"Menos pérdida", sp_merge:"Unirse antes", sp_push:"Dividir más lejos"},
  pt:{m_liga:"Liga", m_liga_b:"O modo principal: contam níveis, pontos de habilidade e luas. Engolir jogadores mais fortes rende mais XP, honra e Ore.",
      m_online:"Jogo livre", m_online_b:"Todos iguais: sem bônus de nível, sem luas, sem siglas de clã — só os designs mudam. Sem conexão a rodada roda no seu aparelho.",
      sp_kopf:"Pontos de habilidade", sp_erkl:"Um ponto por nível (até 100), 0,1 % cada. Pontos colocados agem onde estão; pontos livres agem por igual em tudo.",
      sp_frei:"{0} de {1} livres", sp_speichern:"Salvar", sp_reset:"Retirar todos", sp_gespeichert:"Salvo.", sp_konto:"Pontos de habilidade precisam de uma conta.",
      sp_start:"Massa inicial", sp_staub:"Valor dos destroços", sp_decay:"Menos perda", sp_merge:"Juntar antes", sp_push:"Dividir mais longe"},
  fr:{m_liga:"Ligue", m_liga_b:"Le mode principal : niveaux, points de compétence et lunes comptent. Avaler des joueurs plus forts rapporte plus d’XP, d’honneur et d’Ore.",
      m_online:"Jeu libre", m_online_b:"Tous égaux : pas de bonus de niveau, pas de lunes, pas de sigle de clan — seuls les designs diffèrent. Sans connexion, la manche tourne sur votre appareil.",
      sp_kopf:"Points de compétence", sp_erkl:"Un point par niveau (jusqu’à 100), 0,1 % chacun. Les points placés agissent là où vous les mettez ; les points libres agissent également sur tout.",
      sp_frei:"{0} sur {1} libres", sp_speichern:"Enregistrer", sp_reset:"Tout reprendre", sp_gespeichert:"Enregistré.", sp_konto:"Les points de compétence demandent un compte.",
      sp_start:"Masse de départ", sp_staub:"Valeur des débris", sp_decay:"Moins de perte", sp_merge:"Fusion plus tôt", sp_push:"Division plus loin"},
  tr:{m_liga:"Lig", m_liga_b:"Ana mod: seviyeler, yetenek puanları ve uydular sayılır. Daha güçlü oyuncuları yutmak daha çok XP, onur ve Ore getirir.",
      m_online:"Serbest oyun", m_online_b:"Herkes eşit: seviye bonusu yok, uydu yok, klan kısaltması yok — yalnızca tasarımlar farklı. Bağlantı yoksa tur cihazında çalışır.",
      sp_kopf:"Yetenek puanları", sp_erkl:"Seviye başına bir puan (100’e kadar), her biri % 0,1. Yerleştirilen puanlar koyduğun yerde etki eder; boş puanlar her şeye eşit etki eder.",
      sp_frei:"{1} puandan {0} boş", sp_speichern:"Kaydet", sp_reset:"Hepsini geri al", sp_gespeichert:"Kaydedildi.", sp_konto:"Yetenek puanları için hesap gerekir.",
      sp_start:"Başlangıç kütlesi", sp_staub:"Enkaz değeri", sp_decay:"Daha az kayıp", sp_merge:"Daha erken birleşme", sp_push:"Daha uzağa bölünme"},
  ru:{m_liga:"Лига", m_liga_b:"Основной режим: считаются уровни, очки навыков и луны. Поглощение более сильных игроков даёт больше опыта, чести и Ore.",
      m_online:"Свободная игра", m_online_b:"Все равны: без бонусов уровня, без лун, без клановых тегов — отличаются только дизайны. Без связи раунд идёт на вашем устройстве.",
      sp_kopf:"Очки навыков", sp_erkl:"Одно очко за уровень (до 100), по 0,1 %. Распределённые очки действуют там, куда вы их поставили; свободные — равномерно на всё.",
      sp_frei:"{0} из {1} свободно", sp_speichern:"Сохранить", sp_reset:"Снять все", sp_gespeichert:"Сохранено.", sp_konto:"Для очков навыков нужен аккаунт.",
      sp_start:"Стартовая масса", sp_staub:"Ценность обломков", sp_decay:"Меньше потерь", sp_merge:"Быстрее слияние", sp_push:"Дальше деление"}
};
for (const c in LANGS109) Object.assign(LANGS[c], LANGS109[c]);

/* Schritt 109c: Clankampf auf Herausforderung. */
const LANGS109C = {
  en:{ck_kopf:"Clan battle", ck_erkl:"The leader challenges another clan. Once its leader accepts, the arena opens: two minutes to join, five minutes of battle. Highest clan mass wins.",
      ck_laeuft:"Battle against {0} is on", ck_offen:"open for {0} s", ck_zu:"joining closed", ck_beitreten:"Join", ck_fordern:"Challenge a clan", ck_tag:"Clan tag or name",
      ck_eingehend:"Challenges received", ck_ausgehend:"Challenges sent", ck_annehmen:"Accept", ck_ablehnen:"Decline", ck_gefordert:"{0} challenged.", ck_letzte:"Last battles",
      ck_sieg:"Win against {0}", ck_niederlage:"Loss against {0}", ck_remis:"Draw against {0}", ck_keine:"No challenges.", ck_leiter:"Only the leader can challenge and accept.",
      e_kein_kampf:"No clan battle is running for your clan right now.", e_kampf_zu:"Joining this battle is closed.", e_clan_unbekannt:"No clan with that tag.", e_kampf_selbst:"That is your own clan.",
      e_kampf_laeuft:"One of the clans is already in a battle.", e_kampf_offen:"There is already an open challenge between these clans.", e_kampf_unbekannt:"That challenge no longer exists."},
  de:{ck_kopf:"Clankampf", ck_erkl:"Der Leiter fordert einen anderen Clan heraus. Nimmt dessen Leiter an, öffnet sich die Arena: zwei Minuten zum Beitreten, fünf Minuten Kampf. Die höhere Clanmasse gewinnt.",
      ck_laeuft:"Kampf gegen {0} läuft", ck_offen:"noch {0} s offen", ck_zu:"Beitritt geschlossen", ck_beitreten:"Beitreten", ck_fordern:"Clan herausfordern", ck_tag:"Kürzel oder Name des Clans",
      ck_eingehend:"Erhaltene Herausforderungen", ck_ausgehend:"Gesendete Herausforderungen", ck_annehmen:"Annehmen", ck_ablehnen:"Ablehnen", ck_gefordert:"{0} herausgefordert.", ck_letzte:"Letzte Kämpfe",
      ck_sieg:"Sieg gegen {0}", ck_niederlage:"Niederlage gegen {0}", ck_remis:"Unentschieden gegen {0}", ck_keine:"Keine Herausforderungen.", ck_leiter:"Nur der Leiter kann herausfordern und annehmen.",
      e_kein_kampf:"Gerade läuft kein Clankampf für deinen Clan.", e_kampf_zu:"Der Beitritt zu diesem Kampf ist geschlossen.", e_clan_unbekannt:"Kein Clan mit diesem Kürzel.", e_kampf_selbst:"Das ist dein eigener Clan.",
      e_kampf_laeuft:"Einer der Clans ist schon in einem Kampf.", e_kampf_offen:"Zwischen diesen Clans läuft schon eine Herausforderung.", e_kampf_unbekannt:"Diese Herausforderung gibt es nicht mehr."},
  es:{ck_kopf:"Batalla de clanes", ck_erkl:"El líder desafía a otro clan. Cuando su líder acepta, se abre la arena: dos minutos para entrar, cinco minutos de batalla. Gana la mayor masa de clan.",
      ck_laeuft:"Batalla contra {0} en curso", ck_offen:"abierta {0} s más", ck_zu:"entrada cerrada", ck_beitreten:"Entrar", ck_fordern:"Desafiar a un clan", ck_tag:"Etiqueta o nombre del clan",
      ck_eingehend:"Desafíos recibidos", ck_ausgehend:"Desafíos enviados", ck_annehmen:"Aceptar", ck_ablehnen:"Rechazar", ck_gefordert:"{0} desafiado.", ck_letzte:"Últimas batallas",
      ck_sieg:"Victoria contra {0}", ck_niederlage:"Derrota contra {0}", ck_remis:"Empate contra {0}", ck_keine:"Sin desafíos.", ck_leiter:"Solo el líder puede desafiar y aceptar.",
      e_kein_kampf:"Ahora no hay batalla de clanes para tu clan.", e_kampf_zu:"La entrada a esta batalla está cerrada.", e_clan_unbekannt:"No hay clan con esa etiqueta.", e_kampf_selbst:"Ese es tu propio clan.",
      e_kampf_laeuft:"Uno de los clanes ya está en batalla.", e_kampf_offen:"Ya hay un desafío abierto entre estos clanes.", e_kampf_unbekannt:"Ese desafío ya no existe."},
  pt:{ck_kopf:"Batalha de clãs", ck_erkl:"O líder desafia outro clã. Quando o líder dele aceita, a arena abre: dois minutos para entrar, cinco minutos de batalha. A maior massa de clã vence.",
      ck_laeuft:"Batalha contra {0} em andamento", ck_offen:"aberta por mais {0} s", ck_zu:"entrada fechada", ck_beitreten:"Entrar", ck_fordern:"Desafiar um clã", ck_tag:"Sigla ou nome do clã",
      ck_eingehend:"Desafios recebidos", ck_ausgehend:"Desafios enviados", ck_annehmen:"Aceitar", ck_ablehnen:"Recusar", ck_gefordert:"{0} desafiado.", ck_letzte:"Últimas batalhas",
      ck_sieg:"Vitória contra {0}", ck_niederlage:"Derrota contra {0}", ck_remis:"Empate contra {0}", ck_keine:"Sem desafios.", ck_leiter:"Só o líder pode desafiar e aceitar.",
      e_kein_kampf:"Não há batalha de clãs para o seu clã agora.", e_kampf_zu:"A entrada nesta batalha está fechada.", e_clan_unbekannt:"Nenhum clã com essa sigla.", e_kampf_selbst:"Esse é o seu próprio clã.",
      e_kampf_laeuft:"Um dos clãs já está em batalha.", e_kampf_offen:"Já existe um desafio aberto entre esses clãs.", e_kampf_unbekannt:"Esse desafio não existe mais."},
  fr:{ck_kopf:"Combat de clans", ck_erkl:"Le chef défie un autre clan. Quand son chef accepte, l’arène s’ouvre : deux minutes pour rejoindre, cinq minutes de combat. La plus grande masse de clan gagne.",
      ck_laeuft:"Combat contre {0} en cours", ck_offen:"ouvert encore {0} s", ck_zu:"entrée fermée", ck_beitreten:"Rejoindre", ck_fordern:"Défier un clan", ck_tag:"Sigle ou nom du clan",
      ck_eingehend:"Défis reçus", ck_ausgehend:"Défis envoyés", ck_annehmen:"Accepter", ck_ablehnen:"Refuser", ck_gefordert:"{0} défié.", ck_letzte:"Derniers combats",
      ck_sieg:"Victoire contre {0}", ck_niederlage:"Défaite contre {0}", ck_remis:"Égalité contre {0}", ck_keine:"Aucun défi.", ck_leiter:"Seul le chef peut défier et accepter.",
      e_kein_kampf:"Aucun combat de clans en cours pour votre clan.", e_kampf_zu:"L’entrée dans ce combat est fermée.", e_clan_unbekannt:"Aucun clan avec ce sigle.", e_kampf_selbst:"C’est votre propre clan.",
      e_kampf_laeuft:"L’un des clans est déjà en combat.", e_kampf_offen:"Un défi est déjà ouvert entre ces clans.", e_kampf_unbekannt:"Ce défi n’existe plus."},
  tr:{ck_kopf:"Klan savaşı", ck_erkl:"Lider başka bir klana meydan okur. Onun lideri kabul edince arena açılır: katılmak için iki dakika, beş dakika savaş. Daha yüksek klan kütlesi kazanır.",
      ck_laeuft:"{0} ile savaş sürüyor", ck_offen:"{0} s daha açık", ck_zu:"katılım kapalı", ck_beitreten:"Katıl", ck_fordern:"Klana meydan oku", ck_tag:"Klan kısaltması ya da adı",
      ck_eingehend:"Alınan meydan okumalar", ck_ausgehend:"Gönderilen meydan okumalar", ck_annehmen:"Kabul et", ck_ablehnen:"Reddet", ck_gefordert:"{0} klanına meydan okundu.", ck_letzte:"Son savaşlar",
      ck_sieg:"{0} karşısında zafer", ck_niederlage:"{0} karşısında yenilgi", ck_remis:"{0} ile berabere", ck_keine:"Meydan okuma yok.", ck_leiter:"Yalnızca lider meydan okuyabilir ve kabul edebilir.",
      e_kein_kampf:"Şu anda klanın için klan savaşı yok.", e_kampf_zu:"Bu savaşa katılım kapandı.", e_clan_unbekannt:"Bu kısaltmayla klan yok.", e_kampf_selbst:"Bu senin kendi klanın.",
      e_kampf_laeuft:"Klanlardan biri zaten savaşta.", e_kampf_offen:"Bu klanlar arasında zaten açık bir meydan okuma var.", e_kampf_unbekannt:"Bu meydan okuma artık yok."},
  ru:{ck_kopf:"Клановая битва", ck_erkl:"Лидер бросает вызов другому клану. Когда его лидер принимает, открывается арена: две минуты на вход, пять минут битвы. Побеждает большая масса клана.",
      ck_laeuft:"Идёт битва против {0}", ck_offen:"открыто ещё {0} с", ck_zu:"вход закрыт", ck_beitreten:"Войти", ck_fordern:"Бросить вызов клану", ck_tag:"Тег или название клана",
      ck_eingehend:"Полученные вызовы", ck_ausgehend:"Отправленные вызовы", ck_annehmen:"Принять", ck_ablehnen:"Отклонить", ck_gefordert:"Вызов брошен: {0}.", ck_letzte:"Последние битвы",
      ck_sieg:"Победа над {0}", ck_niederlage:"Поражение от {0}", ck_remis:"Ничья с {0}", ck_keine:"Вызовов нет.", ck_leiter:"Только лидер может бросать вызов и принимать.",
      e_kein_kampf:"Сейчас для вашего клана нет битвы.", e_kampf_zu:"Вход в эту битву закрыт.", e_clan_unbekannt:"Клана с таким тегом нет.", e_kampf_selbst:"Это ваш собственный клан.",
      e_kampf_laeuft:"Один из кланов уже в битве.", e_kampf_offen:"Между этими кланами уже есть открытый вызов.", e_kampf_unbekannt:"Этого вызова больше нет."}
};
for (const c in LANGS109C) Object.assign(LANGS[c], LANGS109C[c]);

/* Schritt 112: Namen getauscht — Kennung `liga` = Aufstieg (Hauptmodus mit
   Levelbonus, Skillpunkten, Monden), Kennung `online` = Liga (alle gleich,
   nur Ehre und Rang). Thomas: „Im Liga-Modus sollte jeder gleich gut sein." */
const LANGS112 = {
  en:{m_liga:"Ascent", m_liga_b:"The main mode: levels, skill points and moons count. Swallowing stronger players pays more XP, honour and Ore.",
      m_online:"League", m_online_b:"The contest: everyone equal — no level bonus, no moons, no clan tags. Only honour and rank count. Without a connection the round runs on your device.",
      mo_erkl:"Moons are earned, never bought. Up to three orbit your body and count only in Ascent — at most 8 % each. In the League everyone is equal.",
      mo_staub_erkl:"1 per Ascent round, 3 with a new best mass. Upgrades a moon."},
  de:{m_liga:"Aufstieg", m_liga_b:"Der Hauptmodus: Level, Skillpunkte und Monde zählen. Wer stärkere Spieler schluckt, bekommt mehr XP, Ehre und Ore.",
      m_online:"Liga", m_online_b:"Der Wettkampf: alle gleich gut — keine Level-Boni, keine Monde, keine Clankürzel. Nur Ehre und Rang zählen. Ohne Verbindung läuft die Runde auf dem Gerät.",
      mo_erkl:"Monde werden erspielt, nie gekauft. Bis zu drei kreisen um deinen Körper und zählen nur im Aufstieg — höchstens 8 % je Mond. In der Liga sind alle gleich.",
      mo_staub_erkl:"1 je Aufstiegsrunde, 3 bei neuer Bestmasse. Wertet einen Mond auf."},
  es:{m_liga:"Ascenso", m_liga_b:"El modo principal: cuentan niveles, puntos de habilidad y lunas. Tragar jugadores más fuertes da más XP, honor y Ore.",
      m_online:"Liga", m_online_b:"La competición: todos iguales — sin bonus de nivel, sin lunas, sin etiquetas de clan. Solo cuentan honor y rango. Sin conexión la ronda corre en tu dispositivo.",
      mo_erkl:"Las lunas se ganan jugando, nunca se compran. Hasta tres orbitan tu cuerpo y solo cuentan en Ascenso — como máximo 8 % cada una. En la Liga todos son iguales.",
      mo_staub_erkl:"1 por partida de Ascenso, 3 con nueva masa récord. Mejora una luna."},
  pt:{m_liga:"Ascensão", m_liga_b:"O modo principal: contam níveis, pontos de habilidade e luas. Engolir jogadores mais fortes rende mais XP, honra e Ore.",
      m_online:"Liga", m_online_b:"A competição: todos iguais — sem bônus de nível, sem luas, sem siglas de clã. Só contam honra e patente. Sem conexão a rodada roda no seu aparelho.",
      mo_erkl:"Luas são conquistadas jogando, nunca compradas. Até três orbitam seu corpo e só contam na Ascensão — no máximo 8 % cada. Na Liga todos são iguais.",
      mo_staub_erkl:"1 por partida de Ascensão, 3 com nova massa recorde. Melhora uma lua."},
  fr:{m_liga:"Ascension", m_liga_b:"Le mode principal : niveaux, points de compétence et lunes comptent. Avaler des joueurs plus forts rapporte plus d’XP, d’honneur et d’Ore.",
      m_online:"Ligue", m_online_b:"La compétition : tous égaux — pas de bonus de niveau, pas de lunes, pas de sigle de clan. Seuls l’honneur et le rang comptent. Sans connexion, la manche tourne sur votre appareil.",
      mo_erkl:"Les lunes se gagnent en jouant, jamais en payant. Jusqu’à trois orbitent autour de votre corps et ne comptent qu’en Ascension — 8 % au plus chacune. En Ligue, tout le monde est égal.",
      mo_staub_erkl:"1 par partie d’Ascension, 3 avec un nouveau record de masse. Améliore une lune."},
  tr:{m_liga:"Yükseliş", m_liga_b:"Ana mod: seviyeler, yetenek puanları ve uydular sayılır. Daha güçlü oyuncuları yutmak daha çok XP, onur ve Ore getirir.",
      m_online:"Lig", m_online_b:"Yarışma: herkes eşit — seviye bonusu yok, uydu yok, klan kısaltması yok. Yalnızca onur ve rütbe sayılır. Bağlantı yoksa tur cihazında çalışır.",
      mo_erkl:"Uydular oynayarak kazanılır, asla satın alınmaz. En fazla üçü gövdenin etrafında döner ve yalnızca Yükseliş’te sayılır — her biri en çok % 8. Lig’de herkes eşittir.",
      mo_staub_erkl:"Yükseliş turu başına 1, yeni rekor kütlede 3. Bir uyduyu yükseltir."},
  ru:{m_liga:"Восхождение", m_liga_b:"Основной режим: считаются уровни, очки навыков и луны. Поглощение более сильных игроков даёт больше опыта, чести и Ore.",
      m_online:"Лига", m_online_b:"Состязание: все равны — без бонусов уровня, без лун, без клановых тегов. Считаются только честь и ранг. Без связи раунд идёт на вашем устройстве.",
      mo_erkl:"Луны зарабатываются игрой, их нельзя купить. До трёх вращаются вокруг вашего тела и действуют только в Восхождении — не больше 8 % каждая. В Лиге все равны.",
      mo_staub_erkl:"1 за раунд Восхождения, 3 при новом рекорде массы. Улучшает луну."}
};
for (const c in LANGS112) Object.assign(LANGS[c], LANGS112[c]);

/* Schritt 113: Spielername in den Einstellungen. */
const LANGS113 = {
  en:{namekonto:"Set at registration — change it in Settings, once every 30 days.", s_name:"Player name", s_name_note:"Only once every 30 days. Possible again from {0}.", s_name_go:"Change", s_name_ok:"Name changed."},
  de:{namekonto:"Bei der Registrierung vergeben — ändern in den Einstellungen, alle 30 Tage.", s_name:"Spielername", s_name_note:"Nur alle 30 Tage. Wieder möglich ab {0}.", s_name_go:"Ändern", s_name_ok:"Name geändert."},
  es:{namekonto:"Fijado al registrarte — cámbialo en Ajustes, cada 30 días.", s_name:"Nombre de jugador", s_name_note:"Solo cada 30 días. De nuevo posible desde {0}.", s_name_go:"Cambiar", s_name_ok:"Nombre cambiado."},
  pt:{namekonto:"Definido no cadastro — mude nas Configurações, a cada 30 dias.", s_name:"Nome do jogador", s_name_note:"Só a cada 30 dias. Possível de novo a partir de {0}.", s_name_go:"Mudar", s_name_ok:"Nome alterado."},
  fr:{namekonto:"Fixé à l’inscription — à changer dans les réglages, tous les 30 jours.", s_name:"Nom de joueur", s_name_note:"Seulement tous les 30 jours. À nouveau possible à partir du {0}.", s_name_go:"Changer", s_name_ok:"Nom modifié."},
  tr:{namekonto:"Kayıtta belirlendi — Ayarlar’dan değiştir, 30 günde bir.", s_name:"Oyuncu adı", s_name_note:"Yalnızca 30 günde bir. {0} tarihinden itibaren yeniden mümkün.", s_name_go:"Değiştir", s_name_ok:"Ad değiştirildi."},
  ru:{namekonto:"Задано при регистрации — меняется в настройках, раз в 30 дней.", s_name:"Имя игрока", s_name_note:"Только раз в 30 дней. Снова возможно с {0}.", s_name_go:"Изменить", s_name_ok:"Имя изменено."}
};
for (const c in LANGS113) Object.assign(LANGS[c], LANGS113[c]);

/* Schritt 115: Bildrate anzeigen. */
const LANGS115 = {
  en:{s_fps:"Show frame rate", s_fps_h:"Small number bottom left: frames per second. Green is smooth, red is choppy.", s_eco_kurz:"eco"},
  de:{s_fps:"Bildrate anzeigen", s_fps_h:"Kleine Zahl links unten: Bilder je Sekunde. Grün ist flüssig, Rot ruckelt.", s_eco_kurz:"Sparstufe"},
  es:{s_fps:"Mostrar fotogramas", s_fps_h:"Número pequeño abajo a la izquierda: fotogramas por segundo. Verde es fluido, rojo va a tirones.", s_eco_kurz:"ahorro"},
  pt:{s_fps:"Mostrar taxa de quadros", s_fps_h:"Número pequeno embaixo à esquerda: quadros por segundo. Verde é fluido, vermelho trava.", s_eco_kurz:"economia"},
  fr:{s_fps:"Afficher les images/s", s_fps_h:"Petit nombre en bas à gauche : images par seconde. Vert = fluide, rouge = saccadé.", s_eco_kurz:"éco"},
  tr:{s_fps:"Kare hızını göster", s_fps_h:"Sol altta küçük sayı: saniyedeki kare. Yeşil akıcı, kırmızı takılıyor.", s_eco_kurz:"tasarruf"},
  ru:{s_fps:"Показывать кадры/с", s_fps_h:"Маленькое число слева внизу: кадров в секунду. Зелёный — плавно, красный — рывки.", s_eco_kurz:"эконом"}
};
for (const c in LANGS115) Object.assign(LANGS[c], LANGS115[c]);

/* Problem melden (17.09.2026), alle sieben Sprachen — testkonto-runde.js
   verlangt, dass jede Sprache dieselben Bausteine trägt wie Englisch. */
const LANGS119 = {
  en:{md_knopf:"Report a problem", md_kopf:"Report a problem", md_erkl:"A bug, an unfair player or an idea? Write to us — a human reads every message.",
      md_ph:"What happened? The more precise, the better.", md_mail:"Your e-mail for a reply (optional)",
      md_hinweis:"Sent by e-mail to the Talumi team, together with your player name, game version and device type. Not stored on the game server.",
      md_senden:"Send", md_kurz:"Please write at least a sentence.", md_mailfalsch:"That e-mail address does not look right.",
      md_oft:"Too many messages right now. Please try again later.", md_fehl:"Could not send. Please try again later.",
      md_danke:"Thank you — your message is on its way.", md_a_fehler:"Bug", md_a_spieler:"Player", md_a_idee:"Idea", md_a_sonstiges:"Other"},
  de:{md_knopf:"Problem melden", md_kopf:"Problem melden", md_erkl:"Ein Fehler, ein unfairer Spieler oder eine Idee? Schreib uns — jede Nachricht liest ein Mensch.",
      md_ph:"Was ist passiert? Je genauer, desto besser.", md_mail:"Deine E-Mail für eine Antwort (freiwillig)",
      md_hinweis:"Geht als E-Mail an das Talumi-Team, zusammen mit Spielername, Spielfassung und Gerätetyp. Wird auf dem Spielserver nicht gespeichert.",
      md_senden:"Absenden", md_kurz:"Bitte schreib mindestens einen Satz.", md_mailfalsch:"Die E-Mail-Adresse sieht nicht richtig aus.",
      md_oft:"Gerade zu viele Meldungen. Bitte später noch einmal.", md_fehl:"Senden hat nicht geklappt. Bitte später noch einmal.",
      md_danke:"Danke — deine Nachricht ist unterwegs.", md_a_fehler:"Fehler", md_a_spieler:"Spieler", md_a_idee:"Idee", md_a_sonstiges:"Sonstiges"},
  es:{md_knopf:"Informar de un problema", md_kopf:"Informar de un problema", md_erkl:"¿Un error, un jugador tramposo o una idea? Escríbenos: una persona lee cada mensaje.",
      md_ph:"¿Qué ha pasado? Cuanto más preciso, mejor.", md_mail:"Tu correo para la respuesta (opcional)",
      md_hinweis:"Se envía por correo al equipo de Talumi junto con tu nombre de jugador, la versión del juego y el tipo de dispositivo. No se guarda en el servidor del juego.",
      md_senden:"Enviar", md_kurz:"Escribe al menos una frase, por favor.", md_mailfalsch:"La dirección de correo no parece correcta.",
      md_oft:"Demasiados mensajes ahora mismo. Inténtalo más tarde.", md_fehl:"No se pudo enviar. Inténtalo más tarde.",
      md_danke:"Gracias: tu mensaje está en camino.", md_a_fehler:"Error", md_a_spieler:"Jugador", md_a_idee:"Idea", md_a_sonstiges:"Otro"},
  pt:{md_knopf:"Relatar um problema", md_kopf:"Relatar um problema", md_erkl:"Um erro, um jogador desleal ou uma ideia? Escreva para nós — uma pessoa lê cada mensagem.",
      md_ph:"O que aconteceu? Quanto mais preciso, melhor.", md_mail:"Seu e-mail para a resposta (opcional)",
      md_hinweis:"Enviado por e-mail à equipe do Talumi com seu nome de jogador, a versão do jogo e o tipo de aparelho. Não fica guardado no servidor do jogo.",
      md_senden:"Enviar", md_kurz:"Escreva pelo menos uma frase, por favor.", md_mailfalsch:"O endereço de e-mail não parece correto.",
      md_oft:"Mensagens demais agora. Tente mais tarde.", md_fehl:"Não foi possível enviar. Tente mais tarde.",
      md_danke:"Obrigado — sua mensagem está a caminho.", md_a_fehler:"Erro", md_a_spieler:"Jogador", md_a_idee:"Ideia", md_a_sonstiges:"Outro"},
  fr:{md_knopf:"Signaler un problème", md_kopf:"Signaler un problème", md_erkl:"Un bug, un joueur déloyal ou une idée ? Écris-nous — chaque message est lu par une personne.",
      md_ph:"Que s'est-il passé ? Plus c'est précis, mieux c'est.", md_mail:"Ton e-mail pour la réponse (facultatif)",
      md_hinweis:"Envoyé par e-mail à l'équipe Talumi avec ton nom de joueur, la version du jeu et le type d'appareil. Rien n'est conservé sur le serveur de jeu.",
      md_senden:"Envoyer", md_kurz:"Écris au moins une phrase, s'il te plaît.", md_mailfalsch:"L'adresse e-mail ne semble pas correcte.",
      md_oft:"Trop de messages pour l'instant. Réessaie plus tard.", md_fehl:"Envoi impossible. Réessaie plus tard.",
      md_danke:"Merci — ton message est en route.", md_a_fehler:"Bug", md_a_spieler:"Joueur", md_a_idee:"Idée", md_a_sonstiges:"Autre"},
  tr:{md_knopf:"Sorun bildir", md_kopf:"Sorun bildir", md_erkl:"Bir hata, haksız bir oyuncu ya da bir fikir mi? Bize yaz — her mesajı bir insan okur.",
      md_ph:"Ne oldu? Ne kadar ayrıntılı, o kadar iyi.", md_mail:"Yanıt için e-postan (isteğe bağlı)",
      md_hinweis:"Oyuncu adın, oyun sürümü ve cihaz türüyle birlikte e-postayla Talumi ekibine gönderilir. Oyun sunucusunda saklanmaz.",
      md_senden:"Gönder", md_kurz:"Lütfen en az bir cümle yaz.", md_mailfalsch:"E-posta adresi doğru görünmüyor.",
      md_oft:"Şu an çok fazla mesaj var. Lütfen sonra tekrar dene.", md_fehl:"Gönderilemedi. Lütfen sonra tekrar dene.",
      md_danke:"Teşekkürler — mesajın yolda.", md_a_fehler:"Hata", md_a_spieler:"Oyuncu", md_a_idee:"Fikir", md_a_sonstiges:"Diğer"},
  ru:{md_knopf:"Сообщить о проблеме", md_kopf:"Сообщить о проблеме", md_erkl:"Ошибка, нечестный игрок или идея? Напиши нам — каждое сообщение читает человек.",
      md_ph:"Что случилось? Чем точнее, тем лучше.", md_mail:"Твой e-mail для ответа (необязательно)",
      md_hinweis:"Отправляется по e-mail команде Talumi вместе с именем игрока, версией игры и типом устройства. На игровом сервере не хранится.",
      md_senden:"Отправить", md_kurz:"Напиши, пожалуйста, хотя бы одно предложение.", md_mailfalsch:"Адрес e-mail выглядит неверно.",
      md_oft:"Сейчас слишком много сообщений. Попробуй позже.", md_fehl:"Не удалось отправить. Попробуй позже.",
      md_danke:"Спасибо — сообщение уже в пути.", md_a_fehler:"Ошибка", md_a_spieler:"Игрок", md_a_idee:"Идея", md_a_sonstiges:"Другое"}
};
for (const c in LANGS119) Object.assign(LANGS[c], LANGS119[c]);

/* Runde beenden und abgebrochene Runden (v104). */
const LANGS120 = {
  en:{q_knopf:"End round", q_frage:"End round? Tap again", q_ende:"Round ended. Your body stays on the field for 5 more seconds.", q_gut:"Interrupted round credited: {0} Ore"},
  de:{q_knopf:"Runde beenden", q_frage:"Runde beenden? Noch mal tippen", q_ende:"Runde beendet. Dein Körper bleibt noch 5 Sekunden stehen.", q_gut:"Abgebrochene Runde gutgeschrieben: {0} Ore"},
  es:{q_knopf:"Terminar ronda", q_frage:"¿Terminar ronda? Toca otra vez", q_ende:"Ronda terminada. Tu cuerpo sigue en el campo 5 segundos más.", q_gut:"Ronda interrumpida abonada: {0} Ore"},
  pt:{q_knopf:"Encerrar rodada", q_frage:"Encerrar rodada? Toque de novo", q_ende:"Rodada encerrada. Seu corpo fica no campo por mais 5 segundos.", q_gut:"Rodada interrompida creditada: {0} Ore"},
  fr:{q_knopf:"Terminer la manche", q_frage:"Terminer la manche ? Touche encore", q_ende:"Manche terminée. Ton corps reste encore 5 secondes sur le terrain.", q_gut:"Manche interrompue créditée : {0} Ore"},
  tr:{q_knopf:"Turu bitir", q_frage:"Tur bitsin mi? Tekrar dokun", q_ende:"Tur bitti. Cismin 5 saniye daha alanda kalır.", q_gut:"Yarıda kalan tur yazıldı: {0} Ore"},
  ru:{q_knopf:"Закончить раунд", q_frage:"Закончить раунд? Нажми ещё раз", q_ende:"Раунд окончен. Твоё тело останется на поле ещё 5 секунд.", q_gut:"Прерванный раунд зачтён: {0} Ore"}
};
for (const c in LANGS120) Object.assign(LANGS[c], LANGS120[c]);

/* Namen mit „NPC" vorn sind Computergegnern vorbehalten (v105) — sie tragen
   das Kürzel [NPC]. Hinweis bei der Registrierung und in den Einstellungen. */
const LANGS_NPC = {
  en:{e_name_npc:"Names may not start with “NPC” — only computer opponents are called that."},
  de:{e_name_npc:"Namen dürfen nicht mit „NPC“ beginnen — so heißen nur Computergegner."},
  es:{e_name_npc:"Los nombres no pueden empezar por «NPC»: así solo se llaman los rivales de la máquina."},
  pt:{e_name_npc:"Os nomes não podem começar por «NPC» — assim só se chamam os rivais do computador."},
  fr:{e_name_npc:"Un nom ne peut pas commencer par « NPC » — seuls les rivaux informatiques s’appellent ainsi."},
  tr:{e_name_npc:"İsimler “NPC” ile başlayamaz — bu ad yalnızca bilgisayar rakiplerine ait."},
  ru:{e_name_npc:"Имя не может начинаться с «NPC» — так называют только компьютерных соперников."}
};
for (const c in LANGS_NPC) Object.assign(LANGS[c], LANGS_NPC[c]);
