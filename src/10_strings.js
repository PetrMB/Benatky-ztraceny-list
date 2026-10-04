/* =========================================================================
   ZTRACENÝ LIST — 10_strings.js
   Všechny UI stringy CZ+EN, defaultní hlášky Jiříka a texty faktů Kroniky.
   ========================================================================= */
(function () {
'use strict';

const BNJ = (window.BNJ = window.BNJ || {});

BNJ.strings = Object.assign(BNJ.strings || {}, {

  /* ---- titulní obrazovka ---- */
  title:      { cz: 'Ztracený list', en: 'The Lost Letter' },
  subtitle:   { cz: 'Benátky nad Jizerou · zima léta Páně 1600', en: 'Benátky nad Jizerou · Winter, A.D. 1600' },
  tagline:    { cz: 'Point-and-click adventura', en: 'A point-and-click adventure' },
  footer:     { cz: 'Vanilla JS · canvas · WebAudio — žádné externí soubory', en: 'Vanilla JS · canvas · WebAudio — no external files' },

  /* ---- menu ---- */
  menu_new:        { cz: 'Nová hra', en: 'New Game' },
  menu_continue:   { cz: 'Pokračovat', en: 'Continue' },
  menu_lang_label: { cz: 'Jazyk', en: 'Language' },
  lang_name:       { cz: 'Čeština', en: 'English' },
  menu_pause:      { cz: 'Přestávka', en: 'Paused' },
  menu_resume:     { cz: 'Zpět do hry', en: 'Resume' },
  menu_save:       { cz: 'Uložit hru', en: 'Save Game' },
  menu_load:       { cz: 'Nahrát hru', en: 'Load Game' },
  menu_journal:    { cz: 'Kronika', en: 'Chronicle' },
  menu_totitle:    { cz: 'Hlavní nabídka', en: 'Main Menu' },
  menu_back:       { cz: 'Zpět', en: 'Back' },

  /* ---- ukládání ---- */
  save_title: { cz: 'Uložit hru', en: 'Save Game' },
  load_title: { cz: 'Nahrát hru', en: 'Load Game' },
  slot:       { cz: 'Zápis', en: 'Slot' },
  slot_auto:  { cz: 'Samočinný zápis', en: 'Autosave' },
  slot_empty: { cz: '— prázdný pergamen —', en: '— blank parchment —' },
  saved:      { cz: 'Zapsáno do pergamenu.', en: 'Committed to parchment.' },

  /* ---- Kronika ---- */
  journal_title: { cz: 'Kronika', en: 'The Chronicle' },
  journal_sub:   { cz: 'Pravdivá fakta, jež Jiřík cestou posbíral', en: 'True facts Jiřík has gathered along the way' },
  journal_empty: { cz: 'Zatím žádný zápis. Svět je plný faktů — stačí se dívat a ptát se.', en: 'No entries yet. The world is full of facts — just look around and ask.' },
  journal_count: { cz: 'Zapsaná fakta', en: 'Facts recorded' },
  fact_toast:    { cz: 'Nový zápis v Kronice', en: 'New entry in the Chronicle' },

  /* ---- slovesa a HUD ---- */
  verb_look: { cz: 'Prohlédnout', en: 'Look at' },
  verb_use:  { cz: 'Použít', en: 'Use' },
  verb_talk: { cz: 'Promluvit', en: 'Talk to' },
  inv_empty: { cz: 'Brašna je prázdná. Jako moje kapsy. A žaludek.', en: 'The satchel is empty. Like my pockets. And my stomach.' },
  esc_hint:  { cz: 'Esc — nabídka', en: 'Esc — menu' },

  /* ---- nouzové stavy ---- */
  missing_scene: { cz: 'Tahle část Benátek je ještě pod čerstvým sněhem…', en: 'This part of Benátky still lies under fresh snow…' }
});

/* ---- defaultní hlášky Jiříka (nesmyslné akce) ---- */
BNJ.strings.defaults = {
  use: [
    { cz: 'To by nefungovalo ani v pohádce.', en: 'That wouldn\'t work even in a fairy tale.' },
    { cz: 'Hm. A co by na to řekl pan Brahe? „NE.“', en: 'Hmm. And what would Master Brahe say to that? "NO."' },
    { cz: 'Radši ne. Ještě bych o něco přišel. Třeba o nos.', en: 'Better not. I might lose something. A nose, for instance.' },
    { cz: 'Na tohle mám moc zmrzlé prsty.', en: 'My fingers are far too frozen for that.' },
    { cz: 'Nejde to. A to jsem už zkoušel divnější věci.', en: 'It won\'t work. And believe me, I\'ve tried stranger things.' },
    { cz: 'Kdyby to šlo, dávno by to udělal někdo chytřejší.', en: 'If that worked, someone smarter would have done it ages ago.' }
  ],
  look: [
    { cz: 'Pěkné. Zasněžené. Jako všechno tady.', en: 'Nice. Snow-covered. Like everything else around here.' },
    { cz: 'Nic pro posla. Leda by to umělo nosit psaní.', en: 'Nothing for a messenger. Unless it can carry letters.' },
    { cz: 'Vidím to, ale nechápu to. To se mi stává často.', en: 'I can see it, but I don\'t understand it. Happens to me a lot.' },
    { cz: 'Zima tomu na kráse nepřidala.', en: 'Winter has not improved its looks.' }
  ],
  talk: [
    { cz: 'Dobrý den!… Nic. Zase mluvím s věcmi.', en: 'Good day!… Nothing. Talking to things again.' },
    { cz: 'Neodpovídá. Moudré.', en: 'No answer. Wise.' },
    { cz: 'Na rozprávku s tímhle je moc velký mráz.', en: 'It\'s far too cold for a chat with that.' },
    { cz: 'I husa by mi odpověděla líp. A husy mě nesnášejí.', en: 'Even a goose would answer better. And geese despise me.' }
  ],
  combine: [
    { cz: 'Tyhle dvě věci k sobě pasují asi jako já a led.', en: 'Those two go together about as well as me and ice.' },
    { cz: 'Ne. To by nespočítal ani pan Brahe.', en: 'No. Not even Master Brahe could make that add up.' },
    { cz: 'Skoro… ne. Vlastně vůbec.', en: 'Almost… no. Actually not at all.' },
    { cz: 'Z tohohle by nebyl ani sněhulák.', en: 'You couldn\'t even build a snowman out of that.' }
  ]
};

/* ---- texty faktů Kroniky (kánon dle IDS.md) ---- */
BNJ.strings.facts = {
  fact_brahe_arrival: {
    cz: 'Tycho Brahe přijel na zámek Benátky 20. srpna 1599 na pozvání císaře Rudolfa II.',
    en: 'Tycho Brahe arrived at Benátky castle on 20 August 1599 at the invitation of Emperor Rudolf II.'
  },
  fact_three_castles: {
    cz: 'Rudolf II. nabídl Brahovi tři zámky: Lysou nad Labem, Brandýs nad Labem a Benátky. Brahe si vybral Benátky — návrší s výhledem na oblohu.',
    en: 'Rudolf II offered Brahe three castles: Lysá nad Labem, Brandýs nad Labem and Benátky. Brahe chose Benátky — a hilltop with a clear view of the sky.'
  },
  fact_observatory_rooms: {
    cz: 'Observatoř a alchymistická laboratoř byly ve druhém patře zámku; přístroje stály ve třinácti místnostech. Zámek se kvůli tomu přestavoval z císařských peněz.',
    en: 'The observatory and the alchemical laboratory occupied the castle\'s second floor; the instruments filled thirteen rooms. The castle was rebuilt for them with imperial money.'
  },
  fact_brahe_nose: {
    cz: 'O nos přišel Brahe roku 1566 v souboji s Manderupem Parsbergem — pohádali se o matematiku. Pověst mluví o stříbře; exhumace roku 2010 prokázala mosaz.',
    en: 'Brahe lost his nose in a 1566 duel with Manderup Parsberg — they had quarrelled over mathematics. Legend says the prosthesis was silver; the 2010 exhumation proved it was brass.'
  },
  fact_kepler_arrival: {
    cz: 'Johannes Kepler přijel za Brahem na Benátky 4. února 1600 (podle některých pramenů už 3. února). Zůstal do června.',
    en: 'Johannes Kepler joined Brahe at Benátky on 4 February 1600 (some sources say 3 February). He stayed until June.'
  },
  fact_kepler_mars: {
    cz: 'Z Brahových přesných měření Marsu Kepler později odvodil, že planety obíhají po elipsách — Keplerovy zákony.',
    en: 'From Brahe\'s precise observations of Mars, Kepler later deduced that planets move in ellipses — Kepler\'s laws.'
  },
  fact_brahe_prague: {
    cz: 'V červnu 1600 se Brahe přestěhoval do Prahy (Nový Svět, přístroje v Belvedéru). Zemřel roku 1601.',
    en: 'In June 1600 Brahe moved to Prague (Nový Svět, his instruments in the Belvedere). He died in 1601.'
  },
  fact_name_venice: {
    cz: 'Jméno Benátky pochází z italského Venetia (Venezia) přes slovinské Benetke; v češtině brzy znamenalo „mokré, bažinaté místo při vodě“. Proto je českých Benátek tolik.',
    en: 'The name Benátky comes from the Italian Venetia (Venezia) via the Slovene Benetke; in Czech it soon meant simply "a wet, marshy place by the water". Hence so many Czech Venices.'
  },
  fact_first_mention_1259: {
    cz: 'První zmínka o Benátkách je z roku 1259 — osada na levém břehu Jizery, dnešní Staré Benátky.',
    en: 'Benátky is first mentioned in 1259 — a settlement on the left bank of the Jizera, today\'s Staré Benátky (Old Benátky).'
  },
  fact_nove_benatky_1343: {
    cz: 'Kolem roku 1340 založil biskup Jan z Dražic na protějším břehu městečko Nové Benátky; k roku 1343 bylo povýšeno na město.',
    en: 'Around 1340 Bishop Jan of Dražice founded the town of Nové Benátky (New Benátky) on the opposite bank; by 1343 it held town rights.'
  },
  fact_merger_1944: {
    cz: 'Roku 1944 se Nové Benátky, Staré Benátky a obec Obodř sloučily v jedno město: Benátky nad Jizerou. Později byly připojeny Dražice a Kbel.',
    en: 'In 1944 Nové Benátky, Staré Benátky and the village of Obodř merged into one town: Benátky nad Jizerou. Dražice and Kbel were joined later.'
  },
  fact_benda_family: {
    cz: 'Ze Starých Benátek pochází rod Bendů: tkadlec a muzikant Jan Jiří Benda (1682–1757) a jeho syn František (*1709), houslový virtuos pruského krále. Muzikantů z rodu Bendů bylo víc než Bachů. (Matěj ve hře je náš vymyšlený „předek“ — hudební sláva rodu patří až 18. století.)',
    en: 'The Benda family hails from Staré Benátky: weaver and musician Jan Jiří Benda (1682–1757) and his son František (b. 1709), violin virtuoso to the King of Prussia. The Bendas produced more musicians than the Bachs. (Matěj in this game is our invented "ancestor" — the family\'s musical fame belongs to the 18th century.)'
  },
  fact_gall_ink: {
    cz: 'Inkoust se po staletí dělal z duběnek a zelené skalice — železoduběnkovým inkoustem se psaly i císařské listiny.',
    en: 'For centuries ink was made from oak galls and green vitriol — iron-gall ink wrote even imperial charters.'
  }
};

})();
