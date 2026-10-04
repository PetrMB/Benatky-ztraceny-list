/* ==========================================================================
   40_dialogues.js — „Ztracený list" / "The Lost Letter"
   Všechny dialogové stromy (CZ + EN) dle IDS.md.
   --------------------------------------------------------------------------
   Poznámky k technice:
   - Volby (choices) pronáší VŽDY Jiřík (engine: PLAYER = 'jirka').
   - Skok do jiného dialogu: effect volá BNJ.dialog(id) — engine přes „gen"
     kontrolu korektně zahodí zbytek starého dialogu.
   - „Jump uzel": lineární uzel, jehož effect spustí jiný dialog dřív, než
     se stihne říct text (gen-check v enterNode) — text se nikdy nezobrazí.
   - Interní pomocné flagy začínají podtržítkem (mimo kánon, jako engine
     samotný: _once_*, _intro_done): _song_err, _song_round.
   - Fakta (fact:'...') se zapisují do Kroniky při vstupu do uzlu; BNJ.fact
     je idempotentní, duplicitní označení nevadí.
   ========================================================================== */
(function () {
  'use strict';

  /* Pomocník: uzel, který okamžitě skočí do jiného dialogu. */
  function jumpTo(dialogId) {
    return {
      text: { cz: '…', en: '…' },
      next: null,
      effect() { BNJ.dialog(dialogId); }
    };
  }

  /* ======================================================================
     dlg_intro — úvodní monolog: led praskl, list je v řece
     ====================================================================== */
  BNJ.registerDialog({
    id: 'dlg_intro',
    nodes: {
      start: {
        speaker: 'jirka',
        effect() { BNJ.sfx('sfx_ice_crack'); },
        text: {
          cz: '…Chlad. Mokro. Hloubka. Jizera dnes nabízí kompletní sortiment a já ochutnal všechno.',
          en: '…Cold. Wet. Deep. The Jizera is offering the full menu today, and I have sampled everything.'
        },
        next: 'i2'
      },
      i2: {
        speaker: 'jirka',
        text: {
          cz: 'Ještě ráno jsem byl Jiřík, císařský posel. Nesl jsem list od Rudolfa II. samotnému Tychonovi Brahovi. Pečeť! Peníze! Osud vědy!',
          en: 'This morning I was Jiřík, imperial courier. Carrying a letter from Rudolf II to the great Tycho Brahe himself. A seal! Money! The fate of science!'
        },
        next: 'i3'
      },
      i3: {
        speaker: 'jirka',
        effect() { BNJ.give('mokry_list'); },
        text: {
          cz: 'Teď jsem Jiřík, posel s… tímhle. Mokrý cár a půlka pečeti. Zbytek si rozebrala řeka. Na tři kusy. Počítal jsem je, když odplouvaly.',
          en: 'Now I am Jiřík, courier of… this. One soggy scrap and half a seal. The river claimed the rest. Three pieces. I counted them as they sailed away.'
        },
        next: 'i4'
      },
      i4: {
        choices: [
          {
            text: { cz: 'Zhodnotím situaci jako profesionál.', en: 'I shall assess the situation like a professional.' },
            next: 'ia'
          },
          {
            text: { cz: 'Zpanikařím.', en: 'I shall panic.' },
            next: 'ib'
          },
          {
            text: { cz: 'Budu předstírat, že se nic nestalo.', en: 'I shall pretend nothing happened.' },
            next: 'ic'
          }
        ]
      },
      ia: {
        speaker: 'jirka',
        text: {
          cz: 'List: v řece. Pečeť: rozmočená. Kariéra: pod ledem. Výborně. Vše sečteno, nic nesedí.',
          en: 'Letter: in the river. Seal: dissolved. Career: under the ice. Splendid. Everything accounted for, nothing accounted well.'
        },
        next: 'i5'
      },
      ib: {
        speaker: 'jirka',
        text: {
          cz: 'AAAA! …Tak. Hotovo. Panika nic nevyřešila, ale aspoň mi na chvíli bylo teplo.',
          en: 'AAAA! …There. Done. Panic solved nothing, but for a moment I was warm.'
        },
        next: 'i5'
      },
      ic: {
        speaker: 'jirka',
        text: {
          cz: 'Jistě. Císařský list se doručí sám. To se stává. V pohádkách. Ve špatných pohádkách, které nikdo nevypráví dvakrát.',
          en: 'Of course. Imperial letters deliver themselves. Happens all the time. In fairy tales. Bad fairy tales that nobody tells twice.'
        },
        next: 'i5'
      },
      i5: {
        speaker: 'jirka',
        text: {
          cz: 'Viděl jsem, kam pluly: jeden kus se točí ve víru pod jezem. Druhý si odnesla ta… husa. Husa! Husy jsou jen draci, co to vzdali.',
          en: 'I saw where they went: one piece is spinning in the eddy below the weir. Another was carried off by that… goose. A goose! Geese are just dragons that gave up.'
        },
        next: 'i6'
      },
      i6: {
        speaker: 'jirka',
        text: {
          cz: 'A třetí odplaval po proudu k obodřským mokřadům. Skvělé. Mlha, bažiny a bludičky. Miluju svou práci.',
          en: 'And the third floated downstream toward the Obodř marshes. Wonderful. Fog, bogs and will-o’-the-wisps. I love my job.'
        },
        next: 'i7'
      },
      i7: {
        speaker: 'jirka',
        text: {
          cz: 'Nejdřív ale na zámek. Přiznat se nejslavnějšímu hvězdáři Evropy, že jeho pošta právě… zakotvila. Prý je to cholerik. S kovovým nosem. Tohle bude skvělý den.',
          en: 'But first: the castle. To confess to the most famous astronomer in Europe that his mail has just… dropped anchor. They say he has a temper. And a metal nose. This is going to be a great day.'
        },
        next: null
      }
    }
  });

  /* ======================================================================
     brahe_intro — první setkání + opakovatelný rozcestník
     fact_brahe_arrival; flag knows_quest
     ====================================================================== */
  BNJ.registerDialog({
    id: 'brahe_intro',
    nodes: {
      start: {
        speaker: 'brahe',
        text: {
          cz: 'NEDOTÝKAT SE KVADRANTU! …Aha. Ty. Mluv rychle, chlapče — vesmír se točí a já se točím s ním, jo?',
          en: 'DO NOT TOUCH ZE QUADRANT! …Ah. You. Speak qvickly, boy — ze universe turns, and I turn vith it, ja?'
        },
        next: 'hub'
      },
      hub: {
        choices: [
          {
            text: { cz: 'Nesu vám list od císaře Rudolfa. Tedy… nesl jsem.', en: 'I bring you a letter from Emperor Rudolf. That is… I brought.' },
            cond: s => !s.flags.knows_quest,
            next: 'c1'
          },
          {
            text: { cz: 'Jak pokračuje měření vesmíru?', en: 'How goes the measuring of the universe?' },
            cond: s => !!s.flags.knows_quest && !s.flags.letter_read,
            next: 'brag1'
          },
          {
            text: { cz: 'Kdo je vlastně ten Kepler?', en: 'Who exactly is this Kepler fellow?' },
            cond: s => !!s.flags.knows_quest,
            next: 'kep1'
          },
          {
            text: { cz: 'Mám fragmenty přečtené. Potřebuji pergamen a pečetidlo.', en: 'I have read the fragments. I need parchment and your signet.' },
            cond: s => !!s.flags.letter_read && !s.flags.brahe_test_passed,
            next: null,
            effect() { BNJ.dialog('brahe_test'); }
          },
          {
            text: { cz: 'Hezký nos. Je nový?', en: 'Nice nose. Is it new?' },
            once: true,
            next: 'nose1'
          },
          {
            text: { cz: 'Můžu si brát ze zásob v laboratoři?', en: 'May I help myself to the laboratory stores?' },
            cond: s => !!s.flags.knows_quest,
            next: 'sup1'
          },
          {
            text: { cz: 'Půjdu. Vesmír počká, řeka ne.', en: 'I shall go. The universe can wait; the river cannot.' },
            next: 'bye'
          }
        ]
      },

      /* --- přiznání a zadání úkolu --------------------------------------- */
      c1: {
        speaker: 'brahe',
        text: {
          cz: 'List! KONEČNĚ! Peníze na dostavbu! A svolení pro toho počtáře ze Štýrska! Dej ho sem, chlapče!',
          en: 'Ze letter! AT LAST! Ze money for ze building! And ze permission for zat number-cruncher from Styria! Hand it over, boy!'
        },
        next: 'c2'
      },
      c2: {
        choices: [
          {
            text: { cz: 'Neztratil jsem ho. Jen jsem ho… svěřil Jizeře.', en: 'I did not lose it. I merely… entrusted it to the Jizera.' },
            next: 'r1'
          },
          {
            text: { cz: 'Led praskl. List plaval rychleji než já.', en: 'The ice cracked. The letter swam faster than I did.' },
            next: 'r2'
          },
          {
            text: { cz: 'Dobrá zpráva: pečeť jsem zachránil! Špatná zpráva: jen půlku.', en: 'Good news: I saved the seal! Bad news: only half of it.' },
            next: 'r3'
          }
        ]
      },
      r1: {
        speaker: 'brahe',
        text: {
          cz: '„Svěřil řece"?! Chlapče, řeka není BANKA! Řeka je zloděj s proudem místo rukou!',
          en: '"Entrusted to ze river"?! Boy, a river is not a BANK! A river is a thief vith a current instead of hands!'
        },
        next: 'rage'
      },
      r2: {
        speaker: 'brahe',
        text: {
          cz: 'Plaval rychleji než ty?! Pak jsi měl plavat RYCHLEJI NEŽ LIST, jo?!',
          en: 'It svam faster zan you?! Zen you should have svum FASTER ZAN ZE LETTER, ja?!'
        },
        next: 'rage'
      },
      r3: {
        speaker: 'brahe',
        text: {
          cz: 'Půlka pečeti! To je jako půlka nosu — K NIČEMU! A o tom já něco vím!',
          en: 'Half a seal! Zat is like half a nose — USELESS! And I know somesing about zat!'
        },
        next: 'rage'
      },
      rage: {
        speaker: 'brahe',
        text: {
          cz: 'Ved Gud! Já přišel o NOS, chlapče, a nesu to jako muž. Ty jsi přišel o KUS PAPÍRU!',
          en: 'Ved Gud! I lost my NOSE, boy, and I bear it like a man. You lost a PIECE OF PAPER!'
        },
        next: 'rage2'
      },
      rage2: {
        speaker: 'jirka',
        text: {
          cz: 'Technicky vzato o tři kusy papíru. Počítal jsem je.',
          en: 'Technically three pieces of paper. I counted them.'
        },
        next: 'rage3'
      },
      rage3: {
        speaker: 'brahe',
        text: {
          cz: '…Ty mi ještě POČÍTÁŠ?! …Hm. Počítat umíš. To se bude hodit. Poslouchej.',
          en: '…You COUNT at me?! …Hm. You can count. Zat vill be useful. Listen.'
        },
        next: 'quest'
      },
      quest: {
        speaker: 'brahe',
        fact: 'fact_brahe_arrival',
        text: {
          cz: 'Císař Rudolf mě pozval do Čech — dvacátého srpna léta devětadevadesátého jsem přijel na tenhle zámek. A čtvrtého února přijede Kepler. Ten list MUSÍ ležet na stole, jo?!',
          en: 'Emperor Rudolf invited me to Bohemia — on ze twentieth of August, anno ninety-nine, I arrived at zis castle. And on ze fourth of February, Kepler arrives. Zat letter MUST be on ze table, ja?!'
        },
        next: 'quest2'
      },
      quest2: {
        speaker: 'brahe',
        text: {
          cz: 'Vylov fragmenty. VŠECHNY! Řeka je vzala u jezu, víc nevím — já měřím nebe, ne vodu.',
          en: 'Fish out ze fragments. ALL of zem! Ze river took zem at ze weir, more I do not know — I measure ze sky, not ze water.'
        },
        next: 'quest3'
      },
      quest3: {
        speaker: 'jirka',
        effect() { BNJ.flag('knows_quest'); },
        text: {
          cz: 'Vylovit, usušit, doručit. Jako by se… skoro nestalo.',
          en: 'Fish out, dry off, deliver. As if it… almost never happened.'
        },
        next: 'quest4'
      },
      quest4: {
        speaker: 'brahe',
        text: {
          cz: 'A chlapče — vesmír odpouští málo. Já ještě míň.',
          en: 'And boy — ze universe forgives little. I forgive less.'
        },
        next: 'hub'
      },

      /* --- chlubení a stavitelé ------------------------------------------ */
      brag1: {
        speaker: 'brahe',
        text: {
          cz: 'Prrresnost! Měřím polohy hvězd na osminu minuty! Sextant, kvadrant, glóbus — takové přístroje nemá ani papež, jo!',
          en: 'Prrrecision! I measure star positions to an eighth of a minute! Sextant, qvadrant, globe — not even ze Pope has such instruments, ja!'
        },
        next: 'brag2'
      },
      brag2: {
        speaker: 'brahe',
        text: {
          cz: 'Ale ti STAVITELÉ! Bum, bum, BUM! Celý den! Přestavují mi zámek a dupou přitom jak stádo splašených komet!',
          en: 'But ze BUILDERS! Bang, bang, BANG! All day! Zey rebuild my castle and stomp about like a herd of runaway comets!'
        },
        next: 'brag3'
      },
      brag3: {
        speaker: 'jirka',
        text: {
          cz: 'Chápu. Těžko měřit vesmír, když se vám hýbe podlaha.',
          en: 'I understand. Hard to measure the universe when your floor keeps moving.'
        },
        next: 'brag4'
      },
      brag4: {
        speaker: 'brahe',
        text: {
          cz: 'PŘESNĚ! Konečně někdo, kdo to chápe! Škoda, že topíš dopisy.',
          en: 'EXACTLY! At last somebody who understands! A pity you drown letters.'
        },
        next: 'hub'
      },

      /* --- Kepler --------------------------------------------------------- */
      kep1: {
        speaker: 'brahe',
        text: {
          cz: 'Mladý počtář ze Štýrska. Prý génius. JÁ jsem génius. On je… slibný.',
          en: 'A young number-cruncher from Styria. Zey say he is a genius. I am a genius. He is… promising.'
        },
        next: 'kep2'
      },
      kep2: {
        speaker: 'brahe',
        text: {
          cz: 'Já mám třicet let měření — nejpřesnějších na světě, jo. On má oči, které v číslech vidí tvary. Spolu… hm. Spolu bychom mohli přeměřit nebe.',
          en: 'I have thirty years of measurements — ze most precise in ze world, ja. He has eyes zat see shapes in numbers. Togezzer… hm. Togezzer ve could re-measure heaven itself.'
        },
        next: 'kep3'
      },
      kep3: {
        speaker: 'brahe',
        text: {
          cz: 'Přijede čtvrtého února. PROTO ten list, chlapče. Bez císařova svolení je Kepler jen turista s brýlemi.',
          en: 'He arrives ze fourth of February. ZAT is vhy ze letter, boy. Vithout ze Emperor’s permission, Kepler is just a tourist vith spectacles.'
        },
        next: 'hub'
      },

      /* --- zásoby ---------------------------------------------------------- */
      sup1: {
        speaker: 'brahe',
        text: {
          cz: 'Ber, co úkol žádá. Skalice je na polici, hmoždíř na stole. Pergamen NE — ten až si zasloužíš. A NOSU SE NEDOTÝKEJ.',
          en: 'Take vhat ze task demands. Ze vitriol is on ze shelf, ze mortar on ze table. Parchment, NEJ — zat you must earn. And DO NOT TOUCH ZE NOSE.'
        },
        next: 'sup2'
      },
      sup2: {
        speaker: 'jirka',
        text: {
          cz: 'Ani mě nenapadlo. …Teda napadlo, ale nedotknu.',
          en: 'The thought never crossed my mind. …It crossed. But I shall not touch.'
        },
        next: 'hub'
      },

      /* --- nos ------------------------------------------------------------- */
      nose1: {
        speaker: 'brahe',
        text: {
          cz: 'Hezký? HEZKÝ?! Je MOSAZNÝ, chlapče! Mosaz drží líp než stříbro a leští se sama!',
          en: 'Nice? NICE?! It is BRASS, boy! Brass holds better zan silver and polishes itself!'
        },
        next: 'nose2'
      },
      nose2: {
        speaker: 'brahe',
        text: {
          cz: '…Proč se ptáš? Něco jsi slyšel? KDO co slyšel?!',
          en: '…Vhy do you ask? Have you heard somesing? VHO has heard VHAT?!'
        },
        next: 'nose3'
      },
      nose3: {
        speaker: 'jirka',
        text: {
          cz: 'Nic! Jen že vám sluší. Jako… doplněk k vesmíru.',
          en: 'Nothing! Only that it suits you. Like… an accessory to the universe.'
        },
        next: 'hub'
      },

      bye: {
        speaker: 'brahe',
        text: {
          cz: 'Běž. A přines mi ten list, nebo tě zapíšu do katalogu — mezi mlhoviny, jo!',
          en: 'Go. And bring me zat letter, or I vill enter you in my catalogue — among ze nebulae, ja!'
        },
        next: null
      }
    }
  });

  /* ======================================================================
     brahe_test — H9: tři otázky, chyták s nosem
     vyžaduje letter_read; dává pergamen + pečetidlo; flag brahe_test_passed
     fact_three_castles, fact_brahe_nose
     ====================================================================== */
  BNJ.registerDialog({
    id: 'brahe_test',
    nodes: {
      start: {
        choices: [
          {
            text: { cz: 'Potřeboval bych pergamen a vaše pečetidlo.', en: 'I shall be needing parchment and your signet.' },
            cond: s => !s.flags.letter_read,
            next: 'ng1'
          },
          {
            text: { cz: 'Text listu znám. Pergamen a pečetidlo, prosím.', en: 'I know the letter’s text. Parchment and signet, please.' },
            cond: s => !!s.flags.letter_read && !s.flags.brahe_test_passed,
            next: 'e0'
          },
          {
            text: { cz: 'Jen kontroluju, že pečetidlo je pořád… vaše.', en: 'Just checking the signet is still… yours.' },
            cond: s => !!s.flags.brahe_test_passed,
            next: 'done1'
          }
        ]
      },
      ng1: {
        speaker: 'brahe',
        text: {
          cz: 'Pečetidlo?! Poslu, který ani neví, co v listu stálo?! Nejdřív přečti fragmenty — sextant, měsíc, šikmé světlo. PAK přijď.',
          en: 'My signet?! To a courier who does not even know vhat ze letter said?! First read ze fragments — sextant, moon, slanted light. ZEN come back.'
        },
        next: null
      },
      done1: {
        speaker: 'brahe',
        text: {
          cz: 'Máš pergamen, máš pečetidlo. Tak PIŠ, chlapče, piš! Čtvrtý únor nepočká.',
          en: 'You have parchment, you have ze signet. So VRITE, boy, vrite! Ze fourth of February vill not vait.'
        },
        next: null
      },

      e0: {
        speaker: 'brahe',
        text: {
          cz: 'Pečetidlo je moje čest odlitá v kovu. Nedostane ho posel, který neví, komu slouží a u koho hostuje. TŘI otázky, jo!',
          en: 'Ze signet is my honour cast in metal. No courier gets it who knows not whom he serves and under whose roof he stands. THREE qvestions, ja!'
        },
        next: 'q1'
      },

      /* --- otázka 1: kdo mě pozval ---------------------------------------- */
      q1: {
        speaker: 'brahe',
        text: {
          cz: 'Otázka PRVNÍ: Kdo mě pozval do Čech a na tento zámek?',
          en: 'Qvestion ZE FIRST: Who invited me to Bohemia and to zis castle?'
        },
        next: 'q1c'
      },
      q1c: {
        choices: [
          {
            text: { cz: 'Císař Rudolf II.', en: 'Emperor Rudolf II.' },
            next: 'q1ok'
          },
          {
            text: { cz: 'Papež?', en: 'The Pope?' },
            once: true,
            next: 'q1b'
          },
          {
            text: { cz: 'Nikdo. Vy se prostě zjevujete tam, kde je jasno.', en: 'Nobody. You simply appear wherever the skies are clear.' },
            once: true,
            next: 'q1j'
          }
        ]
      },
      q1b: {
        speaker: 'brahe',
        text: {
          cz: 'PAPEŽ?! Chlapče, já jsem luterán z Dánska! Zkus to znovu, než tě exkomunikuju JÁ.',
          en: 'ZE POPE?! Boy, I am a Lutheran from Denmark! Try again, before I excommunicate you MYSELF.'
        },
        next: 'q1c'
      },
      q1j: {
        speaker: 'brahe',
        text: {
          cz: '…To bylo skoro lichotivé. ŠPATNĚ. Znovu!',
          en: '…Zat vas almost flattering. VRONG. Again!'
        },
        next: 'q1c'
      },
      q1ok: {
        speaker: 'brahe',
        text: {
          cz: 'Jo! Jeho Veličenstvo osobně. Jediný panovník, který chápe, že hvězdy jsou dražší než války. Tedy… skoro chápe.',
          en: 'Ja! His Majesty himself. Ze only monarch who understands zat stars cost more zan wars. Vell… almost understands.'
        },
        next: 'q2'
      },

      /* --- otázka 2: tři zámky --------------------------------------------- */
      q2: {
        speaker: 'brahe',
        text: {
          cz: 'Otázka DRUHÁ: Císař mi nabídl TŘI zámky. Který jsem si vybral — a PROČ?',
          en: 'Qvestion ZE SECOND: Ze Emperor offered me THREE castles. Vhich did I choose — and VHY?'
        },
        next: 'q2c'
      },
      q2c: {
        choices: [
          {
            text: { cz: 'Benátky. Kvůli návrší — odsud je vidět celá obloha.', en: 'Benátky. For the hill — you can see the whole sky from here.' },
            next: 'q2ok'
          },
          {
            text: { cz: 'Brandýs. Kvůli rybám?', en: 'Brandýs. For the fish?' },
            once: true,
            next: 'q2b'
          },
          {
            text: { cz: 'Lysou. Lysá — jako Měsíc. To se přece nabízí.', en: 'Lysá. "Bald" — like the Moon. It practically names itself.' },
            once: true,
            next: 'q2j'
          }
        ]
      },
      q2b: {
        speaker: 'brahe',
        text: {
          cz: 'RYBY?! Já měřím KOMETY, ne kapry! Znovu!',
          en: 'FISH?! I measure COMETS, not carp! Again!'
        },
        next: 'q2c'
      },
      q2j: {
        speaker: 'brahe',
        text: {
          cz: '…To bylo skoro vtipné. ŠPATNĚ! Znovu!',
          en: '…Zat vas almost funny. VRONG! Again!'
        },
        next: 'q2c'
      },
      q2ok: {
        speaker: 'brahe',
        fact: 'fact_three_castles',
        text: {
          cz: 'Jo! Lysá, Brandýs, Benátky — a já vybral návrší nad Jizerou. Obzor čistý jak dánské svědomí!',
          en: 'Ja! Lysá, Brandýs, Benátky — and I chose ze hill above ze Jizera. A horizon as clean as a Danish conscience!'
        },
        next: 'q3'
      },

      /* --- otázka 3: NOS (chyták) ------------------------------------------ */
      q3: {
        speaker: 'brahe',
        text: {
          cz: 'A otázka TŘETÍ. Dávej pozor, chlapče. Z čeho je… MŮJ NOS?',
          en: 'And qvestion ZE THIRD. Pay attention, boy. Of vhat is made… MY NOSE?'
        },
        next: 'q3c'
      },
      q3c: {
        choices: [
          {
            text: { cz: 'Ze stříbra. To přece ví každý.', en: 'Silver. Everybody knows that.' },
            once: true,
            next: 'q3trap'
          },
          {
            text: { cz: 'Z mosazi.', en: 'Brass.' },
            next: 'q3ok'
          },
          {
            text: { cz: 'Z toho, co zbylo, když došla skromnost.', en: 'Of whatever was left over when the modesty ran out.' },
            once: true,
            next: 'q3j'
          }
        ]
      },
      q3trap: {
        speaker: 'brahe',
        text: {
          cz: 'KAŽDÝ SE MÝLÍ! Pověst říká stříbro — pověsti se leskne líp, jo? Ale jednou, za nějakých čtyři sta deset let, si to učení pánové ověří. A najdou MOSAZ!',
          en: 'EVERYBODY IS VRONG! Ze legend says silver — legends shine better, ja? But one day, in some four hundred and ten years, learned gentlemen vill check. And zey vill find BRASS!'
        },
        next: 'q3c'
      },
      q3j: {
        speaker: 'brahe',
        text: {
          cz: '…Odvážné. Hloupé, ale odvážné. ZNOVU!',
          en: '…Brave. Stupid, but brave. AGAIN!'
        },
        next: 'q3c'
      },
      q3ok: {
        speaker: 'brahe',
        fact: 'fact_brahe_nose',
        text: {
          cz: 'JO! MOSAZ! Měď a zinek — drží líp a leští se sama! O nos jsem přišel v šestašedesátém, v souboji s Parsbergem. Pohádali jsme se o matematiku. Matematika vyhrála. Já ne.',
          en: 'JA! BRASS! Copper and zinc — holds better and polishes itself! I lost ze nose in sixty-six, duelling Parsberg. Ve qvarrelled over mathematics. Ze mathematics von. I did not.'
        },
        next: 'pass'
      },

      /* --- předání --------------------------------------------------------- */
      pass: {
        speaker: 'brahe',
        text: {
          cz: 'Hm. Posel, který poslouchá. Vzácnější než nova v Kasiopeji.',
          en: 'Hm. A courier who listens. Rarer zan a nova in Cassiopeia.'
        },
        next: 'pass2'
      },
      pass2: {
        speaker: 'brahe',
        effect() {
          BNJ.give('pergamen');
          BNJ.give('pecetidlo');
          BNJ.flag('brahe_test_passed');
        },
        text: {
          cz: 'Tady. Čistý pergamen. A moje pečetidlo — ztratíš-li ho, přeměřím tvou oběžnou dráhu OSOBNĚ.',
          en: 'Here. Blank parchment. And my signet — lose it, and I vill measure your orbit PERSONALLY.'
        },
        next: 'pass3'
      },
      pass3: {
        speaker: 'jirka',
        text: {
          cz: 'Neztratím. Nanejvýš ho svěřím— …Vtip! To byl vtip!',
          en: 'I shall not lose it. At most I might entrust it to— …A joke! That was a joke!'
        },
        next: null
      }
    }
  });

  /* ======================================================================
     prevoznik_intro — H1: Vávra, bidlo, cesta po ledu
     flag met_prevoznik; fact_name_venice
     ====================================================================== */
  BNJ.registerDialog({
    id: 'prevoznik_intro',
    nodes: {
      start: {
        speaker: 'prevoznik',
        text: {
          cz: 'Hm. Posel. Jizera dneska nemá náladu. Já taky ne. Co chceš?',
          en: 'Hm. A messenger. The Jizera’s in a mood today. So am I. What?'
        },
        next: 'hub'
      },
      hub: {
        choices: [
          {
            text: { cz: 'Potřebuju na druhý břeh. A vylovit pár… úředních dokumentů.', en: 'I need to cross. And to fish out some… official documents.' },
            cond: s => !s.flags.met_prevoznik,
            next: 'm1'
          },
          {
            text: { cz: 'Jak se dnes vede Jizeře?', en: 'How is the Jizera doing today?' },
            cond: s => !!s.flags.met_prevoznik,
            next: 'riv1'
          },
          {
            text: { cz: 'Proč se tomuhle kraji říká Benátky? Vody dost, ale gondolu nevidím.', en: 'Why is this place called Benátky — "Venice"? Plenty of water, but I see no gondola.' },
            next: 'ven1'
          },
          {
            text: { cz: 'Ta husa… kouše?', en: 'That goose… does it bite?' },
            once: true,
            next: 'goose1'
          },
          {
            text: { cz: 'Tak já poplavu. Teda PŮJDU. Po břehu.', en: 'Well, I’ll swim along. I mean WALK along. On the bank.' },
            next: 'bye'
          }
        ]
      },

      /* --- hlavní větev: bidlo a led --------------------------------------- */
      m1: {
        speaker: 'prevoznik',
        text: {
          cz: 'Vylovit. Z Jizery. V lednu.',
          en: 'Fish something out. Of the Jizera. In January.'
        },
        next: 'm2'
      },
      m2: {
        speaker: 'jirka',
        text: {
          cz: 'Je to císařský list. Roztrhaný na tři kusy. Jeden se točí ve víru pod jezem.',
          en: 'It’s an imperial letter. Torn into three pieces. One is spinning in the eddy below the weir.'
        },
        next: 'm3'
      },
      m3: {
        choices: [
          {
            text: { cz: 'Půjčíte mi bidlo? Na lovení.', en: 'Would you lend me your pole? For fishing.' },
            next: 'give1'
          },
          {
            text: { cz: 'Půjčíte mi pramici? Slibuju, že ji vrátím suchou.', en: 'Would you lend me the ferry? I promise to return it dry.' },
            once: true,
            next: 'boat1'
          },
          {
            text: { cz: 'Neumíte pískat na ryby, aby mi ho přinesly?', en: 'Can’t you whistle for the fish to fetch it for me?' },
            once: true,
            next: 'fish1'
          }
        ]
      },
      boat1: {
        speaker: 'prevoznik',
        text: {
          cz: 'Pramice si do jara pospí. Nebuď ji.',
          en: 'The ferry sleeps till spring. Don’t wake her.'
        },
        next: 'm3'
      },
      fish1: {
        speaker: 'prevoznik',
        text: {
          cz: 'Ryby v lednu spí. Jako pramice. Jako rozum, co tě poslal přes led.',
          en: 'Fish sleep in January. Like the ferry. Like whatever good sense sent you across the ice.'
        },
        next: 'm3'
      },
      give1: {
        speaker: 'prevoznik',
        text: {
          cz: 'Bidlo? …Řeka stejně stojí.',
          en: 'The pole? …The river’s standing still anyway.'
        },
        next: 'give2'
      },
      give2: {
        speaker: 'prevoznik',
        effect() {
          BNJ.give('bidlo');
          BNJ.flag('met_prevoznik');
        },
        text: {
          cz: 'Ber. Ale vrať. Bidlo je rodinné — dědil jsem ho po otci, ten po Jizeře.',
          en: 'Take it. But bring it back. It’s a family pole — I inherited it from my father, and he from the Jizera.'
        },
        next: 'give3'
      },
      give3: {
        speaker: 'prevoznik',
        text: {
          cz: 'A přes led tě převedu, kudy chodím já. Šlapej, kam šlápnu, a nemudruj.',
          en: 'And I’ll take you across the ice where I walk. Step where I step, and no philosophy.'
        },
        next: 'give4'
      },
      give4: {
        speaker: 'jirka',
        text: {
          cz: 'Bidlo, cesta po ledu a životní moudrost. Vávro, vy jste obchod roku.',
          en: 'A pole, a path across the ice, and life advice. Vávra, you are the bargain of the year.'
        },
        next: 'hub'
      },

      /* --- řeka jako osoba -------------------------------------------------- */
      riv1: {
        speaker: 'prevoznik',
        text: {
          cz: 'Stojí a myslí si své. Pod jezem vře. Tam nelez bez pořádné násady.',
          en: 'Standing still and keeping her opinions. Boiling under the weir, though. Don’t go near it without a proper handle.'
        },
        next: 'riv2'
      },
      riv2: {
        speaker: 'jirka',
        text: {
          cz: 'Mluvíte o ní, jako by byla živá.',
          en: 'You talk about her as if she were alive.'
        },
        next: 'riv3'
      },
      riv3: {
        speaker: 'prevoznik',
        text: {
          cz: 'A není?',
          en: 'Isn’t she?'
        },
        next: 'hub'
      },

      /* --- jméno Benátky ----------------------------------------------------- */
      ven1: {
        speaker: 'prevoznik',
        text: {
          cz: 'Vlaši mají město na vodě. Venetia. Slovinec řekne Benetke. Čech řekl Benátky — mokré místo u vody.',
          en: 'The Italians have a city on the water. Venetia. A Slovene says Benetke. A Czech said Benátky — a wet place by the water.'
        },
        next: 'ven2'
      },
      ven2: {
        speaker: 'prevoznik',
        fact: 'fact_name_venice',
        text: {
          cz: 'Jizera si nás pojmenovala sama. Má na to právo. Je starší.',
          en: 'The Jizera named us herself. She’s entitled. She’s older.'
        },
        next: 'ven3'
      },
      ven3: {
        speaker: 'jirka',
        text: {
          cz: 'Takže bydlíme v „Mokřině nad Mokřinou". Hned to zní vznešeně.',
          en: 'So we live in "Soggy-upon-Soggier." How very grand.'
        },
        next: 'hub'
      },

      /* --- husa --------------------------------------------------------------- */
      goose1: {
        speaker: 'prevoznik',
        text: {
          cz: 'Markyta? Nekouše. Štípe, syčí, bere a nedává.',
          en: 'Markyta? She doesn’t bite. She pinches, hisses, takes and does not give.'
        },
        next: 'goose2'
      },
      goose2: {
        speaker: 'prevoznik',
        text: {
          cz: 'Brk ti nedá. …Leda by zrovna zobala a nedávala pozor.',
          en: 'She won’t give you a quill. …Unless she happened to be pecking at something and not paying attention.'
        },
        next: 'goose3'
      },
      goose3: {
        speaker: 'jirka',
        text: {
          cz: 'Husy. Věděl jsem to. Draci, co to vzdali — ale nechali si zálohu.',
          en: 'Geese. I knew it. Dragons that gave up — but kept the deposit.'
        },
        next: 'hub'
      },

      bye: {
        speaker: 'prevoznik',
        text: { cz: 'Hm.', en: 'Hm.' },
        next: null
      }
    }
  });

  /* ======================================================================
     trhovkyne_intro — Bětka; fact_nove_benatky_1343
     ====================================================================== */
  BNJ.registerDialog({
    id: 'trhovkyne_intro',
    nodes: {
      start: {
        speaker: 'trhovkyne',
        text: {
          cz: 'Jé, mladej! Pojď blíž, u ohně je teplo a u mě jsou novinky! Co to neseš? Co to víš? Co to tajíš?',
          en: 'Ooh, young man! Come closer — the fire is warm and I have all the news! What are you carrying? What do you know? What are you hiding?'
        },
        next: 'hub'
      },
      hub: {
        choices: [
          {
            text: { cz: 'Co je nového v Benátkách?', en: 'What’s new in Benátky?' },
            once: true,
            next: 'h1'
          },
          {
            text: { cz: 'Potřeboval bych cedník, zrní a svíčku.', en: 'I could use a strainer, some grain and a candle.' },
            cond: s => !!s.flags.knows_quest && !s.flags.gossip_told,
            next: null,
            effect() { BNJ.dialog('trhovkyne_trade'); }
          },
          {
            text: { cz: 'Potřeboval bych pár věcí ze stánku.', en: 'I could use a few things from your stall.' },
            cond: s => !s.flags.knows_quest,
            next: 'poor1'
          },
          {
            text: { cz: 'Ten cedník opravdu teče.', en: 'That strainer really does leak.' },
            cond: s => !!s.flags.gossip_told,
            once: true,
            next: 'str1'
          },
          {
            text: { cz: 'Máte něco proti husám?', en: 'Do you sell anything against geese?' },
            once: true,
            next: 'g1'
          },
          {
            text: { cz: 'Musím běžet. Řeka mi dluží papíry.', en: 'I must run. The river owes me some papers.' },
            next: 'bye'
          }
        ]
      },
      h1: {
        speaker: 'trhovkyne',
        text: {
          cz: 'Nového? VŠECHNO, zlato. Na zámku bydlí hvězdář, co celou noc kouká do nebe. Slušný člověk kouká sousedům do oken!',
          en: 'New? EVERYTHING, dear. There’s a stargazer at the castle who stares at the sky all night. A decent person stares into the neighbours’ windows!'
        },
        next: 'h2'
      },
      h2: {
        speaker: 'trhovkyne',
        fact: 'fact_nove_benatky_1343',
        text: {
          cz: 'A vůbec — tohle jsou NOVÉ Benátky, ať si Staré říkají, co chtějí. Založil je biskup Jan z Dražic, dej mu pánbů lehké spaní, kolem roku třináct set čtyřicet. A od třiačtyřicátého jsme MĚSTO!',
          en: 'And mind you — this is NEW Benátky, whatever Old Benátky may say. Bishop Jan of Dražice founded it, God rest him gently, around thirteen-forty. And since forty-three we are a TOWN!'
        },
        next: 'h3'
      },
      h3: {
        speaker: 'jirka',
        text: {
          cz: 'Město s vlastním pranýřem. To už je kariéra.',
          en: 'A town with its own pillory. Now that’s a career.'
        },
        next: 'hub'
      },
      poor1: {
        speaker: 'trhovkyne',
        text: {
          cz: 'A máš čím platit, zlato? Já beru groše, vejce a drby. Nejradši drby. Ze zámku! Přijď, až budeš vonět hvězdárnou.',
          en: 'And can you pay, dear? I take groschen, eggs and gossip. Preferably gossip. From the castle! Come back once you smell of observatory.'
        },
        next: 'hub'
      },
      str1: {
        speaker: 'trhovkyne',
        text: {
          cz: 'Neteče, CEDÍ. Díry má schválně, mladej. Kdyby všechno drželo vodu, neměli bysme co cedit.',
          en: 'It doesn’t leak, it STRAINS. The holes are intentional, young man. If everything held water, we’d have nothing to strain.'
        },
        next: 'hub'
      },
      g1: {
        speaker: 'trhovkyne',
        text: {
          cz: 'Proti Markytě? Modlitbu. A zrní — husa, co zobe, nesyčí.',
          en: 'Against Markyta? A prayer. And grain — a goose that pecks doesn’t hiss.'
        },
        next: 'g2'
      },
      g2: {
        speaker: 'jirka',
        text: {
          cz: '„Husa, co zobe, nesyčí." To si vyšiju na brašnu.',
          en: '"A goose that pecks doesn’t hiss." I’m embroidering that on my satchel.'
        },
        next: 'hub'
      },
      bye: {
        speaker: 'trhovkyne',
        text: {
          cz: 'Běž, zlato. A kdyby něco — já nic neslyšela. Všechno mi zopakuj!',
          en: 'Off you go, dear. And should anything happen — I heard nothing. Tell me everything twice!'
        },
        next: null
      }
    }
  });

  /* ======================================================================
     trhovkyne_trade — H2: drby za cedník, zrní a svíčku
     vyžaduje knows_quest; flag gossip_told; dává cednik+zrno+svicka
     ====================================================================== */
  BNJ.registerDialog({
    id: 'trhovkyne_trade',
    nodes: {
      start: {
        choices: [
          {
            text: { cz: 'Tak ty drby… vlastně ještě žádné nemám.', en: 'About that gossip… I don’t actually have any yet.' },
            cond: s => !s.flags.knows_quest,
            next: 'ng'
          },
          {
            text: { cz: 'Mám drby ze zámku. Čerstvé. Ještě se z nich kouří.', en: 'I have gossip from the castle. Fresh. Still steaming.' },
            cond: s => !!s.flags.knows_quest && !s.flags.gossip_told,
            next: 't1'
          },
          {
            text: { cz: 'Ještě jednou díky za výbavu.', en: 'Thanks again for the supplies.' },
            cond: s => !!s.flags.gossip_told,
            next: 'done'
          }
        ]
      },
      ng: {
        speaker: 'trhovkyne',
        text: {
          cz: 'Beze drbů není kšeft, zlato. Zámek! Hvězdář! Chci všechno!',
          en: 'No gossip, no deal, dear. The castle! The stargazer! I want everything!'
        },
        next: null
      },
      done: {
        speaker: 'trhovkyne',
        text: {
          cz: 'Cedník, zrní, svíčka — víc stánek nedá. Tak co dál na zámku?! …Nic? Škoda.',
          en: 'Strainer, grain, candle — the stall gives no more. So, what else at the castle?! …Nothing? Pity.'
        },
        next: null
      },

      t1: {
        speaker: 'trhovkyne',
        text: {
          cz: 'POVÍDEJ! Ale pěkně od začátku. A pomalu. A dvakrát.',
          en: 'TELL ME! From the beginning. Slowly. And twice.'
        },
        next: 't2'
      },
      t2: {
        choices: [
          {
            text: { cz: 'Hvězdářův nos je z mosazi. A blýská se při svíčkách.', en: 'The stargazer’s nose is brass. And it gleams by candlelight.' },
            next: 'ta'
          },
          {
            text: { cz: 'Brahe křičí na stavitele, že mu dupou do vesmíru.', en: 'Brahe yells at the builders for stomping all over his universe.' },
            next: 'tb'
          },
          {
            text: { cz: 'Já… svěřil císařský list Jizeře.', en: 'I… entrusted an imperial letter to the Jizera.' },
            next: 'tc'
          }
        ]
      },
      ta: {
        speaker: 'trhovkyne',
        text: {
          cz: 'Prej STŘÍBRO, říkali všichni! Mosaz?! To je ještě lepší drb — stříbro má kdejaký kupec, ale mosazný nos jen jeden člověk na světě!',
          en: 'Everyone said SILVER! Brass?! That’s even better gossip — any merchant has silver, but only one man in the world has a brass nose!'
        },
        next: 't3'
      },
      tb: {
        speaker: 'trhovkyne',
        text: {
          cz: 'Na stavitele křičí každý, zlato, ale „dupou mi do vesmíru" — to si zapíšu!',
          en: 'Everyone yells at builders, dear, but "stomping all over my universe" — that one I’m writing down!'
        },
        next: 't3'
      },
      tc: {
        speaker: 'trhovkyne',
        text: {
          cz: 'TY?! To je drb roku! O tobě, zlato! Pošta plave a posel se červená!',
          en: 'YOU?! That’s the gossip of the year! About you, dear! The mail is swimming and the courier is blushing!'
        },
        next: 't3'
      },
      t3: {
        speaker: 'trhovkyne',
        text: {
          cz: 'Víc! Jeden drb je jak jedna vločka — sníh z toho nebude.',
          en: 'More! One piece of gossip is like one snowflake — it’ll never make a snowfall.'
        },
        next: 't4'
      },
      t4: {
        choices: [
          {
            text: { cz: 'Na zámek přijede učenec ze Štýrska. Prý počítá i vlastní kroky.', en: 'A scholar from Styria is coming to the castle. They say he counts his own footsteps.' },
            next: 't4a'
          },
          {
            text: { cz: 'V laboratoři to bublá a páchne. Hvězdář tomu říká věda.', en: 'The laboratory bubbles and reeks. The stargazer calls it science.' },
            next: 't4b'
          },
          {
            text: { cz: 'Sluneční hodiny na nádvoří v zimě nejdou. Skandál.', en: 'The courtyard sundial doesn’t work in winter. Scandal.' },
            next: 't4c'
          }
        ]
      },
      t4a: {
        speaker: 'trhovkyne',
        text: {
          cz: 'Počítá kroky! Chudinka. To bude z těch hvězd.',
          en: 'Counts his footsteps! Poor soul. It’ll be all those stars.'
        },
        next: 'reward'
      },
      t4b: {
        speaker: 'trhovkyne',
        text: {
          cz: 'Bublá a páchne! Jako u Dvořáků, když vaří zelí. VĚDA, jo?',
          en: 'Bubbles and reeks! Like the Dvořáks boiling cabbage. SCIENCE, is it?'
        },
        next: 'reward'
      },
      t4c: {
        speaker: 'trhovkyne',
        text: {
          cz: '…Mladej, to není drb, to je počasí. Ale beru — máš poctivé oči.',
          en: '…Young man, that’s not gossip, that’s weather. But I’ll take it — you have honest eyes.'
        },
        next: 'reward'
      },
      reward: {
        speaker: 'trhovkyne',
        effect() {
          BNJ.give('cednik');
          BNJ.give('zrno');
          BNJ.give('svicka');
          BNJ.flag('gossip_told');
        },
        text: {
          cz: 'Tumáš: cedník — díry má schválně. Pytlík zrní. A lojová svíčka — smrdí, ale hoří, i když nebe brečí.',
          en: 'Here you go: a strainer — the holes are intentional. A bag of grain. And a tallow candle — it stinks, but it burns even when the sky is crying.'
        },
        next: 'reward2'
      },
      reward2: {
        speaker: 'jirka',
        text: {
          cz: 'Schválně děravý cedník, zrní a smradlavá svíčka. Přesně tak jsem si astronomii vždycky představoval.',
          en: 'An intentionally holey strainer, grain, and a smelly candle. Exactly how I always pictured astronomy.'
        },
        next: null
      }
    }
  });

  /* ======================================================================
     benda_intro — Matěj Benda; fact_benda_family; vstup do benda_song
     ====================================================================== */
  BNJ.registerDialog({
    id: 'benda_intro',
    nodes: {
      start: {
        speaker: 'benda',
        text: {
          cz: 'Hola hej! Návštěva! Sedej k ohníčku, chlapče — zrovna ladím budoucnost a ta je pořád ještě trochu falešná!',
          en: 'Hey-ho! A visitor! Sit by the fire, lad — I’m just tuning the future, and it’s still a wee bit out of tune!'
        },
        next: 'hub'
      },
      hub: {
        choices: [
          {
            text: { cz: 'Vy jste tkadlec, nebo muzikant?', en: 'Are you a weaver or a musician?' },
            once: true,
            next: 'b1'
          },
          {
            text: { cz: 'Znáte úvodní formuli císařských listů? Tu slavnostní?', en: 'Do you know the opening formula of imperial letters? The ceremonial one?' },
            cond: s => !s.flags.formule_known,
            next: 'f1'
          },
          {
            text: { cz: 'Ta formule mi pořád zní v hlavě.', en: 'That formula is still ringing in my head.' },
            cond: s => !!s.flags.formule_known,
            next: 'k1'
          },
          {
            text: { cz: 'Nezahrál byste něco od Bacha?', en: 'Would you play something by Bach?' },
            once: true,
            next: 'j1'
          },
          {
            text: { cz: 'Musím jít. Řeka mi dluží papíry.', en: 'I must go. The river owes me some papers.' },
            next: 'bye'
          }
        ]
      },
      b1: {
        speaker: 'benda',
        text: {
          cz: 'Přes den osnova, večer struny! Tkadlec živí muzikanta a muzikant utěšuje tkalce — tak to u Bendů chodí.',
          en: 'Warp by day, strings by night! The weaver feeds the musician and the musician consoles the weaver — that’s how it goes with us Bendas.'
        },
        next: 'b2'
      },
      b2: {
        speaker: 'benda',
        fact: 'fact_benda_family',
        text: {
          cz: 'A pamatuj, chlapče: z Bendů budou jednou samí muzikanti! Slavní! U králů! Víc než… než Bachů! …Kdo to kdy je, ti Bachové. Prostě jich bude víc!',
          en: 'And mark me, lad: one day the Bendas will be all musicians! Famous! At royal courts! More than… than the Bachs! …Whoever those Bachs may be. There’ll simply be more of us!'
        },
        next: 'b3'
      },
      b3: {
        speaker: 'jirka',
        text: {
          cz: 'Jasně. Zapíšu to do Kroniky — ať si budoucnost může ověřit, že jste to říkal první.',
          en: 'Sure. I’ll put it in the Chronicle — so the future can verify you said it first.'
        },
        next: 'hub'
      },
      f1: {
        speaker: 'benda',
        text: {
          cz: 'Jestli ji znám?! Hraju na všech slavnostech od jezu po zvonici! Ale formuli neříkám, chlapče — tu ZPÍVÁM. Jinak si ji nepamatuju.',
          en: 'Do I know it?! I play every feast from the weir to the belfry! But I don’t say the formula, lad — I SING it. It’s the only way I remember.'
        },
        next: 'f2'
      },
      f2: {
        speaker: 'jirka',
        text: {
          cz: 'Tak zpívejte. Prosím. Je to úřední záležitost.',
          en: 'Then sing. Please. It’s official business.'
        },
        next: 'f3'
      },
      f3: jumpTo('benda_song'),
      k1: {
        speaker: 'benda',
        text: {
          cz: 'To má dělat! Co se zazpívá, to se neztratí. Co se napíše… no, o tom ty víš svoje, ne?',
          en: 'That’s what it’s for! What is sung is never lost. What is written down… well, you know a thing or two about that, don’t you?'
        },
        next: 'hub'
      },
      j1: {
        speaker: 'benda',
        text: {
          cz: 'Od KOHO?! …Ne, ne, chlapče. JEDNOU budou nějací Bachové hrát něco od BENDŮ. Takhle je to dějinně správně.',
          en: 'By WHOM?! …No, no, lad. ONE DAY some Bachs will play something by the BENDAS. That is the historically correct order.'
        },
        next: 'hub'
      },
      bye: {
        speaker: 'benda',
        text: {
          cz: 'Běž! A kdyby ti u jezu hrálo v uších — to jsem já a vítr, děláme duet!',
          en: 'Off you go! And if your ears ring down by the weir — that’s me and the wind, we do a duet!'
        },
        next: null
      }
    }
  });

  /* ======================================================================
     benda_song — H8: dialogová hádanka, skládání veršů císařské formule
     Správné pořadí:
       1. „Z Boží milosti My…"        / "By the grace of God, We…"
       2. „…Rudolf Druhý…"            / "…Rudolph the Second…"
       3. „…volený císař římský…"     / "…elected Emperor of the Romans…"
       4. „…uherský a český král!"    / "…King of Hungary and Bohemia!"
     Dvě chyby → restart (BNJ.dialog('benda_song')), jiné pořadí zpěvu.
     Flag: formule_known. Interní: _song_err, _song_round.
     ====================================================================== */
  BNJ.registerDialog({
    id: 'benda_song',
    nodes: {
      start: {
        choices: [
          {
            text: { cz: 'Zazpívejte mi ji ještě jednou. Jen tak, pro radost.', en: 'Sing it for me once more. Just for the joy of it.' },
            cond: s => !!s.flags.formule_known,
            next: 'rep1'
          },
          {
            text: { cz: 'Poslouchám, mistře!', en: 'I’m listening, maestro!' },
            cond: s => !s.flags.formule_known && ((s.flags._song_round || 0) % 2 === 0),
            next: 'singA'
          },
          {
            text: { cz: 'Poslouchám. Tentokrát doopravdy!', en: 'I’m listening. For real this time!' },
            cond: s => !s.flags.formule_known && ((s.flags._song_round || 0) % 2 === 1),
            next: 'singB'
          },
          {
            text: { cz: 'Vlastně… ještě si to rozmyslím.', en: 'Actually… let me think it over.' },
            cond: s => !s.flags.formule_known,
            next: 'later'
          }
        ]
      },
      later: {
        speaker: 'benda',
        text: {
          cz: 'Rozmýšlej, chlapče, ale nápěv ti stejně poleze do hlavy. Je nakažlivý!',
          en: 'Think away, lad, but the tune will crawl into your head anyway. It’s contagious!'
        },
        next: null
      },

      /* --- zpěv, varianta A (pořadí 3–1–4–2) ------------------------------- */
      singA: {
        speaker: 'benda',
        effect(s) { s.flags._song_err = 0; },
        text: {
          cz: 'Císařská formule, jak ji zpívám na slavnostech! Teda… po svém. Na přeskáčku, ať se nikdo neurazí:',
          en: 'The imperial formula, as I sing it at the feasts! Well… my way. All jumbled up, so nobody takes offence:'
        },
        next: 'singA2'
      },
      singA2: {
        speaker: 'benda',
        text: {
          cz: '♪ Volený císař římský — fidli fidli — z Boží milosti My — tramtadá — uherský a český král — hopsasa — Rudolf Druhý! ♪',
          en: '♪ Elected Emperor of the Romans — fiddle-dee — by the grace of God, We — tra-la-la — King of Hungary and Bohemia — hop-sa-sa — Rudolph the Second! ♪'
        },
        next: 'instr'
      },
      /* --- zpěv, varianta B (pořadí 2–4–1–3), po restartu ------------------- */
      singB: {
        speaker: 'benda',
        effect(s) { s.flags._song_err = 0; },
        text: {
          cz: 'Dvě rány vedle! Nevadí, nevadí — od začátku a jinak proházenou, ať se paměť nefláká:',
          en: 'Two swings and two misses! No matter — from the top, shuffled differently, so your memory doesn’t slack:'
        },
        next: 'singB2'
      },
      singB2: {
        speaker: 'benda',
        text: {
          cz: '♪ Rudolf Druhý — hej hej — uherský a český král — do kolečka — z Boží milosti My — a šup — volený císař římský! ♪',
          en: '♪ Rudolph the Second — hey hey — King of Hungary and Bohemia — round we go — by the grace of God, We — and hup — elected Emperor of the Romans! ♪'
        },
        next: 'instr'
      },
      instr: {
        speaker: 'benda',
        text: {
          cz: 'Tak! A teď ty. Na papír to patří POPOŘADĚ, verš po verši. Dvakrát šlápneš vedle — a spouštím znovu, jinak zamíchanou, ať se nešidí!',
          en: 'There! Now you. On paper it goes IN ORDER, verse by verse. Miss twice — and I start over, reshuffled, no cheating!'
        },
        next: 'p1'
      },

      /* --- krok 1: Z Boží milosti My --------------------------------------- */
      p1: {
        choices: [
          {
            text: { cz: '♪ Z Boží milosti My… ♪', en: '♪ By the grace of God, We… ♪' },
            next: 'ok1'
          },
          {
            text: { cz: '♪ Rudolf Druhý… ♪', en: '♪ Rudolph the Second… ♪' },
            next: 'w1r',
            effect(s) { s.flags._song_err = (s.flags._song_err || 0) + 1; }
          },
          {
            text: { cz: '♪ Volený císař římský… ♪', en: '♪ Elected Emperor of the Romans… ♪' },
            next: 'w1c',
            effect(s) { s.flags._song_err = (s.flags._song_err || 0) + 1; }
          },
          {
            text: { cz: '♪ Uherský a český král… ♪', en: '♪ King of Hungary and Bohemia… ♪' },
            next: 'w1k',
            effect(s) { s.flags._song_err = (s.flags._song_err || 0) + 1; }
          },
          {
            text: { cz: '♪ La la lá… něco o husách? ♪', en: '♪ La la la… something about geese? ♪' },
            next: 'w1j',
            effect(s) { s.flags._song_err = (s.flags._song_err || 0) + 1; }
          }
        ]
      },
      ok1: {
        speaker: 'benda',
        text: {
          cz: 'Tak! Boží milost napřed — ta se nepředbíhá.',
          en: 'There! God’s grace comes first — one does not queue-jump grace.'
        },
        next: 'p2'
      },
      w1r: {
        speaker: 'benda',
        text: {
          cz: 'Ne ne! Rudolf se necpe před Pána Boha. Ani císař ne!',
          en: 'No, no! Rudolph does not push in front of the Lord. Not even an emperor!'
        },
        next: 'chk1'
      },
      w1c: {
        speaker: 'benda',
        text: {
          cz: 'Au, moje uši! Titul bez milosti je jen kravál!',
          en: 'Ow, my ears! A title without grace is just noise!'
        },
        next: 'chk1'
      },
      w1k: {
        speaker: 'benda',
        text: {
          cz: 'Král až NAKONEC, chlapče! Korunovace se neuspěchá!',
          en: 'The king comes LAST, lad! One does not rush a coronation!'
        },
        next: 'chk1'
      },
      w1j: {
        speaker: 'benda',
        text: {
          cz: 'O husách mám baladu, ale císař v ní nevystupuje. Chválabohu.',
          en: 'I do have a ballad about geese, but the emperor does not appear in it. Thank heavens.'
        },
        next: 'chk1'
      },
      chk1: {
        speaker: 'benda',
        effect(s) {
          if ((s.flags._song_err || 0) >= 2) {
            s.flags._song_round = (s.flags._song_round || 0) + 1;
            BNJ.dialog('benda_song');
          }
        },
        text: {
          cz: 'Znovu ten verš! Jak to začíná?',
          en: 'That verse again! How does it begin?'
        },
        next: 'p1'
      },

      /* --- krok 2: Rudolf Druhý --------------------------------------------- */
      p2: {
        choices: [
          {
            text: { cz: '♪ …Rudolf Druhý… ♪', en: '♪ …Rudolph the Second… ♪' },
            next: 'ok2'
          },
          {
            text: { cz: '♪ …volený císař římský… ♪', en: '♪ …elected Emperor of the Romans… ♪' },
            next: 'w2c',
            effect(s) { s.flags._song_err = (s.flags._song_err || 0) + 1; }
          },
          {
            text: { cz: '♪ …uherský a český král… ♪', en: '♪ …King of Hungary and Bohemia… ♪' },
            next: 'w2k',
            effect(s) { s.flags._song_err = (s.flags._song_err || 0) + 1; }
          }
        ]
      },
      ok2: {
        speaker: 'benda',
        text: {
          cz: 'Rudolf Druhý! Jméno jak zvon. Dál!',
          en: 'Rudolph the Second! A name like a bell. Onward!'
        },
        next: 'p3'
      },
      w2c: {
        speaker: 'benda',
        text: {
          cz: 'Titul před jménem? To by se i herold zakuckal!',
          en: 'The title before the name? Even a herald would choke on that!'
        },
        next: 'chk2'
      },
      w2k: {
        speaker: 'benda',
        text: {
          cz: 'Ne! Koruny až na konec — jméno napřed!',
          en: 'No! Crowns at the end — the name comes first!'
        },
        next: 'chk2'
      },
      chk2: {
        speaker: 'benda',
        effect(s) {
          if ((s.flags._song_err || 0) >= 2) {
            s.flags._song_round = (s.flags._song_round || 0) + 1;
            BNJ.dialog('benda_song');
          }
        },
        text: {
          cz: 'Znovu! Co jde hned po Boží milosti?',
          en: 'Again! What comes right after God’s grace?'
        },
        next: 'p2'
      },

      /* --- krok 3: volený císař římský --------------------------------------- */
      p3: {
        choices: [
          {
            text: { cz: '♪ …volený císař římský… ♪', en: '♪ …elected Emperor of the Romans… ♪' },
            next: 'ok3'
          },
          {
            text: { cz: '♪ …uherský a český král… ♪', en: '♪ …King of Hungary and Bohemia… ♪' },
            next: 'w3',
            effect(s) { s.flags._song_err = (s.flags._song_err || 0) + 1; }
          }
        ]
      },
      w3: {
        speaker: 'benda',
        text: {
          cz: 'Pomalu! Napřed císař římský, pak teprve koruny uherská a česká!',
          en: 'Slow down! First the Roman emperor, only then the crowns of Hungary and Bohemia!'
        },
        next: 'chk3'
      },
      chk3: {
        speaker: 'benda',
        effect(s) {
          if ((s.flags._song_err || 0) >= 2) {
            s.flags._song_round = (s.flags._song_round || 0) + 1;
            BNJ.dialog('benda_song');
          }
        },
        text: {
          cz: 'Ještě jednou! Co je Rudolf, než je král?',
          en: 'Once more! What is Rudolph before he is a king?'
        },
        next: 'p3'
      },
      ok3: {
        speaker: 'benda',
        text: {
          cz: 'Volený císař římský! A poslední verš — SPOLU:',
          en: 'Elected Emperor of the Romans! And the last verse — TOGETHER:'
        },
        next: 'fin1'
      },

      /* --- finále --------------------------------------------------------------- */
      fin1: {
        speaker: 'benda',
        text: {
          cz: '♪ UHERSKÝ A ČESKÝ KRÁL! ♪',
          en: '♪ KING OF HUNGARY AND BOHEMIA! ♪'
        },
        next: 'fin2'
      },
      fin2: {
        speaker: 'jirka',
        effect() { BNJ.flag('formule_known'); },
        text: {
          cz: '♪ …a český král! ♪ Mám to! Celou! „Z Boží milosti My, Rudolf Druhý, volený císař římský, uherský a český král!"',
          en: '♪ …and Bohemia! ♪ I’ve got it! All of it! "By the grace of God, We, Rudolph the Second, elected Emperor of the Romans, King of Hungary and Bohemia!"'
        },
        next: 'fin3'
      },
      fin3: {
        speaker: 'benda',
        text: {
          cz: 'Zpíváš jak vrata od tkalcovny, chlapče, ale paměť máš zlatou. Z tebe by ještě byl Benda!',
          en: 'You sing like the weaving-house gate, lad, but your memory is golden. We might yet make a Benda of you!'
        },
        next: null
      },

      /* --- repríza (po formule_known) --------------------------------------------- */
      rep1: {
        speaker: 'benda',
        text: {
          cz: '♪ Z Boží milosti My — Rudolf Druhý — volený císař římský — uherský a český král! ♪',
          en: '♪ By the grace of God, We — Rudolph the Second — elected Emperor of the Romans — King of Hungary and Bohemia! ♪'
        },
        next: 'rep2'
      },
      rep2: {
        speaker: 'benda',
        text: {
          cz: 'Rovně a popořadě — jako osnova. Jen na slavnostech to zamíchám, aby lidi poslouchali.',
          en: 'Straight and in order — like a warp on the loom. I only shuffle it at feasts so people actually listen.'
        },
        next: null
      }
    }
  });

  /* ======================================================================
     kepler_arrival — finále 4. 2. 1600; fact_kepler_arrival; flag finale_started
     ====================================================================== */
  BNJ.registerDialog({
    id: 'kepler_arrival',
    nodes: {
      start: {
        speaker: 'jirka',
        effect() {
          BNJ.flag('finale_started');
          BNJ.sfx('sfx_sleigh');
        },
        text: {
          cz: 'Rolničky? …Saně! To jsou saně! Čtvrtého února — přesně, jak mistr říkal!',
          en: 'Sleigh bells? …A sleigh! It’s a sleigh! The fourth of February — exactly as the master said!'
        },
        next: 'k1'
      },
      k1: {
        speaker: 'kepler',
        text: {
          cz: 'D-dobrý den. Johannes Kepler, ze Štýrska. Cesta byla dlouhá… šest set dvanáct tisíc kroků. Počítal jsem je.',
          en: 'G-good day. Johannes Kepler, from Styria. The road was long… six hundred and twelve thousand steps. I counted them.'
        },
        next: 'k2'
      },
      k2: {
        choices: [
          {
            text: { cz: 'Vítejte v Benátkách, pane! Nesu vám a mistru Brahovi list od císaře.', en: 'Welcome to Benátky, sir! I bring you and Master Brahe a letter from the Emperor.' },
            next: 'give'
          },
          {
            text: { cz: 'Všechny kroky? I ty malé?', en: 'All the steps? Even the little ones?' },
            once: true,
            next: 'kj1'
          },
          {
            text: { cz: 'Máte sníh na brýlích. Vidíte mě vůbec?', en: 'You have snow on your spectacles. Can you even see me?' },
            once: true,
            next: 'kj2'
          }
        ]
      },
      kj1: {
        speaker: 'kepler',
        text: {
          cz: 'Zvláště ty malé. Malé věci se ztrácejí nejsnáz. Kroky. Desetinná místa. Odvaha.',
          en: 'Especially the little ones. Little things get lost the easiest. Steps. Decimal places. Courage.'
        },
        next: 'k2'
      },
      kj2: {
        speaker: 'kepler',
        text: {
          cz: 'Vidím vás dvakrát, mladý pane. Průměruju.',
          en: 'I see two of you, young sir. I am taking the average.'
        },
        next: 'k2'
      },
      give: {
        speaker: 'jirka',
        fact: 'fact_kepler_arrival',
        text: {
          cz: 'List od Jeho Veličenstva! Císařské svolení, peníze na dostavbu — všechno. Pečeť je ještě teplá!',
          en: 'A letter from His Majesty! Imperial permission, money for the building — everything. The seal is still warm!'
        },
        next: 'g2'
      },
      g2: {
        speaker: 'kepler',
        text: {
          cz: 'Děkuji. …Ta pečeť je opravdu ještě teplá. To je u pošty… neobvyklé.',
          en: 'Thank you. …The seal really is still warm. That is… unusual, for the post.'
        },
        next: 'g3'
      },
      g3: {
        speaker: 'jirka',
        text: {
          cz: 'Jsme tu velmi… čerství. Rychlá pošta. Benátská.',
          en: 'We are very… fresh around here. Express post. Benátky style.'
        },
        next: 'g4'
      },
      g4: {
        speaker: 'kepler',
        text: {
          cz: 'Pan Brahe má data. Já mám jen otázky. Tohle bude buď zázrak, nebo katastrofa.',
          en: 'Master Brahe has the data. I have only questions. This will be either a miracle or a disaster.'
        },
        next: 'g5'
      },
      g5: {
        speaker: 'brahe',
        text: {
          cz: 'Vítejte, pane Keplere! Doufám, že s čísly zacházíte lépe než zdejší pošta s papírem.',
          en: 'Velcome, Herr Kepler! I trust you handle numbers better zan ze local post handles paper.'
        },
        next: 'g6'
      },
      g6: {
        speaker: 'jirka',
        text: {
          cz: '„Pošta." Slyšíte to? Ráno jsem byl „ten kluk, co topí listy", večer jsem celá pošta. Povýšení!',
          en: '"The post." Hear that? This morning I was "the boy who drowns letters," by evening I am the entire postal service. Promotion!'
        },
        next: 'g7'
      },
      g7: {
        speaker: 'brahe',
        text: {
          cz: 'Pojďte, Keplere. Ukážu vám sextant, kvadrant a hvězdy, jaké jste ve Štýrsku neviděl!',
          en: 'Come, Kepler. I vill show you ze sextant, ze qvadrant, and stars such as you never saw in Styria!'
        },
        next: 'g8'
      },
      g8: {
        speaker: 'kepler',
        text: {
          cz: 'A já vám ukážu, co s vašimi čísly dokážou elipsy… totiž — počty! Chtěl jsem říct počty.',
          en: 'And I shall show you what ellipses can do with your numbers… that is — arithmetic! I meant to say arithmetic.'
        },
        next: 'g9'
      },
      g9: {
        speaker: 'brahe',
        text: {
          cz: 'ELIPSY?! …Kruhy, mladý muži! Slušné dráhy jsou KULATÉ, jo?!',
          en: 'ELLIPSES?! …Circles, young man! Respectable orbits are ROUND, ja?!'
        },
        next: 'g10'
      },
      g10: {
        speaker: 'jirka',
        text: {
          cz: 'A hádají se. Už na schodech. Myslím, že to bude krásné přátelství.',
          en: 'And they’re arguing. On the stairs already. I think this is the beginning of a beautiful friendship.'
        },
        next: 'fin'
      },
      fin: jumpTo('epilog')
    }
  });

  /* ======================================================================
     epilog — titulky: fact_kepler_mars, fact_brahe_prague, fact_merger_1944
     ====================================================================== */
  BNJ.registerDialog({
    id: 'epilog',
    nodes: {
      start: {
        speaker: 'jirka',
        text: {
          cz: 'Tak. List doručen, nos oleštěn, dějiny zachráněny. A co bylo dál? Když už jste hráli až sem, zasloužíte si to vědět.',
          en: 'So. Letter delivered, nose polished, history saved. And what happened next? You played this far — you’ve earned the ending.'
        },
        next: 'p2'
      },
      p2: {
        speaker: 'jirka',
        fact: 'fact_kepler_mars',
        text: {
          cz: 'Pan Kepler dostal od mistra čísla o Marsu. A za pár let z nich vyčetl, že planety neběhají v kruzích, ale po elipsách. Říkal jsem, že ty jeho počty k něčemu budou.',
          en: 'Master Kepler got the master’s numbers on Mars. And within a few years he read out of them that planets run not in circles but in ellipses. Told you his arithmetic would amount to something.'
        },
        next: 'p3'
      },
      p3: {
        speaker: 'jirka',
        fact: 'fact_brahe_prague',
        text: {
          cz: 'Mistr Brahe se v červnu přestěhoval do Prahy, i s přístroji. A o rok později… ho vesmír povolal k sobě. Nejspíš potřeboval přeměřit.',
          en: 'Master Brahe moved to Prague in June, instruments and all. And a year later… the universe called him home. It probably needed re-measuring.'
        },
        next: 'p4'
      },
      p4: {
        choices: [
          {
            text: { cz: 'Povím vám o Benátkách.', en: 'Let me tell you about Benátky.' },
            next: 'p5'
          },
          {
            text: { cz: 'Povím vám o Markytě.', en: 'Let me tell you about Markyta.' },
            once: true,
            next: 'pg'
          },
          {
            text: { cz: 'Povím vám o Bendech.', en: 'Let me tell you about the Bendas.' },
            once: true,
            next: 'pb'
          }
        ]
      },
      pg: {
        speaker: 'jirka',
        text: {
          cz: 'Markyta? Ta vládne jezu dodnes. Bere, nedává. Některé věci se nemění ani za čtyři sta let.',
          en: 'Markyta? She rules the weir to this day. Takes, does not give. Some things don’t change even in four hundred years.'
        },
        next: 'p4'
      },
      pb: {
        speaker: 'benda',
        fact: 'fact_benda_family',
        text: {
          cz: 'Z Bendů BYLI muzikanti! Jan Jiří! František — houslista u pruského krále! VÍC NEŽ BACHŮ! …Kdo to kdy— aha. Už vím. TAK TEDY PŘESTO!',
          en: 'The Bendas DID become musicians! Jan Jiří! František — violinist to the King of Prussia! MORE THAN THE BACHS! …Whoever those— ah. Now I know. WELL, EVEN SO!'
        },
        next: 'p4'
      },
      p5: {
        speaker: 'jirka',
        fact: 'fact_merger_1944',
        text: {
          cz: 'Nové Benátky, Staré Benátky a Obodř se jednou — píše se rok 1944 — slijí v jedno město: Benátky nad Jizerou. Jizera je nakonec všechny přemluvila.',
          en: 'New Benátky, Old Benátky and Obodř will one day — the year is 1944 — merge into one town: Benátky nad Jizerou. The Jizera talked them all into it eventually.'
        },
        next: 'p6'
      },
      p6: {
        speaker: 'jirka',
        text: {
          cz: 'A já? Už nikdy jsem nevzal zkratku přes led. …Dobře, vzal. Hned příští čtvrtek. Ale to už je jiná hra.',
          en: 'And me? I never took a shortcut across the ice again. …Fine, I did. The very next Thursday. But that’s another game.'
        },
        next: 'p7'
      },
      p7: {
        speaker: 'jirka',
        text: {
          cz: 'Kroniku najdete v rohu obrazovky — co jsme spolu nasbírali, je tam. Pravda o Benátkách, o nosu i o inkoustu. Zbytek si schovám na příště. Sbohem!',
          en: 'You’ll find the Chronicle in the corner of the screen — everything we gathered together is in there. The truth about Benátky, the nose, and the ink. The rest I’m saving for next time. Farewell!'
        },
        next: null
      }
    }
  });

})();
