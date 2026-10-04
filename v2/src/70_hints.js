/* =========================================================================
   ZTRACENÝ LIST v2 — 70_hints.js
   Kontextová nápověda „Co dál?" (klávesa H / tlačítko se sovou).
   BNJ.hints.get(state) → { goal:{cz,en}, steps:[{cz,en}, …] }
   goal = co je teď cílem (vždy zobrazeno), steps = postupně odkrývané
   rady od vágní po přesnou. Logika kopíruje dependency graf
   z design/WALKTHROUGH.md — mění se jen čtením flagů a inventáře.
   ========================================================================= */
(function () {
'use strict';
const BNJ = window.BNJ;
if (!BNJ) return;

const C = (cz, en) => ({ cz, en });

function get(s) {
  const F = (n) => !!(s.flags && s.flags[n]);
  const has = (n) => (s.inventory || []).indexOf(n) >= 0;
  const gotA = has('frag_a') || F('_frag_a_in') || F('letter_read');
  const gotB = has('frag_b') || F('_frag_b_in') || F('letter_read');
  const gotC = has('frag_c') || F('_frag_c_in') || F('letter_read');

  if (F('finale_started')) {
    const n = (s.facts || []).length;
    const total = Object.keys((BNJ.strings && BNJ.strings.facts) || {}).length || 13;
    return {
      goal: C('List je doručen. Benátky si tě zapamatují!', 'The letter is delivered. Benátky will remember you!'),
      steps: [
        C('Kronika má ' + n + ' z ' + total + ' pravdivých faktů. Zkus prozkoumat okem vše, co jsi přehlédl.',
          'The Chronicle holds ' + n + ' of ' + total + ' true facts. Try looking at everything you skipped.'),
        C('Fakta se skrývají v rozhovorech a v pohledu na zvonici, tkalcovnu, sextant a Marsovy poznámky.',
          'Facts hide in conversations and in looking at the belfry, the weaver’s house, the sextant and the Mars notes.')
      ]
    };
  }
  if (!F('knows_quest')) {
    return {
      goal: C('Přiznej se Tychonovi Brahemu, co se stalo s císařským listem.',
              'Confess to Tycho Brahe what happened to the imperial letter.'),
      steps: [
        C('Brahe sídlí ve věži benáteckého zámku — z náměstí vede cesta vzhůru.',
          'Brahe lives in the tower of Benátky castle — a road leads up from the square.'),
        C('Uličkou vlevo na náměstí, cestou k zámku, dveřmi věže do observatoře. Tam s Brahem promluv.',
          'Take the lane left to the square, the road up to the castle, the tower door to the observatory — and talk to Brahe.')
      ]
    };
  }
  if (!(gotA && gotB && gotC)) {
    const steps = [];
    const goal = C('Vylov všechny tři kusy listu (' + [gotA, gotB, gotC].filter(Boolean).length + ' / 3).',
                   'Fish out all three pieces of the letter (' + [gotA, gotB, gotC].filter(Boolean).length + ' / 3).');
    if (!gotA && !has('podberak')) {
      if (!F('gossip_told') && !has('cednik')) {
        steps.push(C('Kus listu se točí ve víru pod jezem. Holou rukou ho nevylovíš — chce to něco jako síto na tyči.',
                     'A piece swirls in the eddy under the weir. Bare hands won’t do — you need something like a sieve on a pole.'));
        steps.push(C('Trhovkyně Bětka na náměstí má cedník. Peníze nechce — platí se drby ze zámku. Promluv s ní.',
                     'Betka the market woman on the square has a strainer. She takes gossip, not coins. Talk to her.'));
      } else if (!F('met_prevoznik') && !has('bidlo')) {
        steps.push(C('Cedník máš. Teď ještě něco dlouhého… převozník Vávra u řeky má bidlo.',
                     'You have the strainer. Now something long… Vávra the ferryman by the river has a pole.'));
        steps.push(C('Promluv s Vávrou o cestě na druhý břeh.', 'Ask Vávra about getting to the other bank.'));
      } else {
        steps.push(C('Cedník a bidlo… co kdyby byly jedna věc?', 'A strainer and a pole… what if they were one thing?'));
        steps.push(C('V inventáři klikni na cedník a pak na bidlo — vznikne „astronomický podběrák".',
                     'In the inventory click the strainer, then the pole — behold the “astronomical landing net”.'));
      }
    } else if (!gotA) {
      steps.push(C('Podběrák je hotový. Kde že se ten kus listu točil?', 'The net is ready. Where was that piece swirling again?'));
      steps.push(C('Vyber podběrák v inventáři a použij ho na jez s vírem u řeky.', 'Select the net and use it on the weir eddy by the river.'));
    }
    if (!gotB) {
      if (!F('goose_lured')) {
        steps.push(C('Husa Markyta sedí na hnízdě u řeky — a něco tam pod sebou hlídá. Potřebuješ ji vylákat.',
                     'Markyta the goose sits on her nest by the river, guarding something. You need to lure her away.'));
        steps.push(C(has('zrno') ? 'Dej huse zrní z inventáře.' : 'Zrní má Bětka na náměstí — vyměň ho za drby, pak ho dej huse.',
                     has('zrno') ? 'Give the goose the grain from your inventory.' : 'Betka on the square has grain — trade gossip for it, then give it to the goose.'));
      } else {
        steps.push(C('Markyta opustila hnízdo!', 'Markyta has left her nest!'));
        steps.push(C('Prohledej hnízdo rukou — najdeš kus listu i husí brk.', 'Search the nest with the hand — a letter piece and a goose quill.'));
      }
    }
    if (!gotC) {
      if (!F('met_prevoznik')) {
        steps.push(C('Třetí kus odnesl proud až do mokřadů v Obodři, za Starými Benátkami. Přes led tě ale nikdo nepustí…',
                     'The current took the third piece to the Obodř marsh, beyond Old Benátky. But nobody lets you onto the ice…'));
        steps.push(C('Promluv s převozníkem Vávrou — ukáže ti bezpečnou cestu po ledu.', 'Talk to Vávra the ferryman — he’ll show you a safe way across the ice.'));
      } else {
        steps.push(C('Třetí kus zamrzl v tůni v mokřadech Obodře. Led je tvrdý jako kámen — chce to teplo.',
                     'The third piece is frozen in a pool in the Obodř marsh. The ice is rock hard — it needs warmth.'));
        steps.push(C(has('svicka') ? 'Použij svíčku na zamrzlou tůň.' : 'Svíčku prodává (za drby) Bětka na náměstí. Pak ji použij na zamrzlou tůň.',
                     has('svicka') ? 'Use the candle on the frozen pool.' : 'Betka on the square trades a candle for gossip. Then use it on the frozen pool.'));
      }
    }
    return { goal, steps: interleave(steps) };
  }
  if (!F('letter_read')) {
    const placed = (F('_frag_a_in') ? 1 : 0) + (F('_frag_b_in') ? 1 : 0) + (F('_frag_c_in') ? 1 : 0);
    return {
      goal: C('Fragmenty jsou vybledlé. Musíš je přečíst.', 'The fragments are faded. You must read them.'),
      steps: [
        C('Brahe má v observatoři přístroj, který umí pracovat se světlem…', 'Brahe has an instrument in the observatory that plays with light…'),
        C('Polož všechny tři fragmenty na velký sextant (' + placed + ' / 3).', 'Put all three fragments on the great sextant (' + placed + ' / 3).'),
        C('Při zaměřování zvol: „Měsíc nízko nad obzorem, zrcátkem šikmo na pult."', 'When aiming, choose: “The moon low on the horizon, mirror slanted onto the desk.”')
      ]
    };
  }
  if (!F('prepis_done')) {
    const steps = [];
    let todo = 0;
    if (!F('formule_known')) {
      todo++;
      steps.push(C('Chybí úvodní formule listu. Šumař Matěj Benda ve Starých Benátkách ji prý umí zazpívat.',
                   'The opening formula is missing. Matěj Benda the fiddler in Old Benátky can supposedly sing it.'));
      steps.push(C('Poskládej verše: „Z Boží milosti My…" → „Rudolf Druhý…" → „volený císař římský…" → „uherský a český král!"',
                   'Order the verses: “By the grace of God, We…” → “Rudolf the Second…” → “elected Roman Emperor…” → “King of Hungary and Bohemia!”'));
    }
    if (!has('inkoust')) {
      todo++;
      if (!has('dubenky')) {
        steps.push(C('Na přepis potřebuješ inkoust. Duběnkový — a duběnky rostou na starém dubu v Obodři.',
                     'You need ink. Oak-gall ink — and galls grow on the old oak in the Obodř marsh.'));
        steps.push(C('Použij ruku na starý dub v mokřadech.', 'Use the hand on the old oak in the marsh.'));
      } else if (!has('skalice')) {
        steps.push(C('K duběnkám patří zelená skalice. Brahe ji má v laboratoři.', 'Galls need green vitriol. Brahe keeps some in his lab.'));
        steps.push(C('Použij ruku na polici s lahvičkami v observatoři.', 'Use the hand on the shelf of jars in the observatory.'));
      } else {
        steps.push(C('Duběnky a skalici je potřeba spolu rozetřít.', 'The galls and vitriol need grinding together.'));
        steps.push(C('Použij duběnky na hmoždíř v observatoři.', 'Use the galls on the mortar in the observatory.'));
      }
    }
    if (!F('brahe_test_passed')) {
      todo++;
      steps.push(C('Pergamen a pečetidlo ti půjčí jen Brahe — ale nejdřív tě vyzkouší.', 'Only Brahe can lend you parchment and the seal — after a test.'));
      steps.push(C('Promluv s Brahem. A ten nos? Pověst praví stříbro… exhumace ale řekla mosaz.',
                   'Talk to Brahe. And the nose? Legend says silver… the exhumation said brass.'));
    }
    if (!todo) {
      steps.push(C('Máš všechno: formuli, inkoust, brk i pergamen.', 'You have it all: formula, ink, quill and parchment.'));
      steps.push(C('Použij pergamen na psací pult v observatoři.', 'Use the parchment on the writing desk in the observatory.'));
    }
    return { goal: C('Připrav všechno k přepisu listu.', 'Prepare everything to rewrite the letter.'), steps: interleave(steps) };
  }
  if (!F('letter_sealed')) {
    return {
      goal: C('Přepis je hotový. Ještě ho zapečetit.', 'The copy is done. Now seal it.'),
      steps: [
        C('Pečetní vosk se musí nahřát…', 'Sealing wax needs heat…'),
        C('Použij přepis na svícen v observatoři.', 'Use the copy on the candlestick in the observatory.')
      ]
    };
  }
  return {
    goal: C('Předej zapečetěný list Tychonovi Brahemu.', 'Hand the sealed letter to Tycho Brahe.'),
    steps: [
      C('Brahe čeká v observatoři.', 'Brahe is waiting in the observatory.'),
      C('Použij zapečetěný list na Braha.', 'Use the sealed letter on Brahe.')
    ]
  };
}

/* rady z více paralelních úkolů: nejdřív všechny vágní, pak přesné */
function interleave(steps) {
  const vague = [], exact = [];
  steps.forEach((s, i) => (i % 2 ? exact : vague).push(s));
  return vague.concat(exact);
}

BNJ.hints = { get };
})();
