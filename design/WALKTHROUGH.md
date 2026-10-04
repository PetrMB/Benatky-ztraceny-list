# ZTRACENÝ LIST — kompletní walkthrough
Ruční průchod dependency grafem z `GAME_DESIGN.md` (kap. 5.3), krok za krokem,
proti skutečné implementaci (`40_dialogues.js` + `50_puzzles.js`).
Ověřeno i strojovou simulací (stub BNJ, celý řetězec H1→H10→finále prošel).

Legenda: **[item]** = předmět v inventáři, `flag` = herní flag, (H*) = hádanka.

---

## AKT I — „Voda bere"

1. **Nová hra** → start ve scéně `river_bank`, automaticky běží `dlg_intro`
   (monolog o prasklém ledu). Efekt: **[mokry_list]**.
2. Jdi **uličkou na náměstí** (exit vlevo) → `square`, **cestou vzhůru k zámku**
   → `castle_yard`, **dveřmi věže** → `observatory`.
3. Promluv s **Brahem** → `brahe_intro`: přiznání, zadání úkolu.
   Efekt: `knows_quest`, fakt `fact_brahe_arrival`.
   *(Volitelně hned: ruka na polici se skalicí → **[skalice]** — dovoleno až po
   `knows_quest`.)*
4. Zpět na `square`. Promluv s **Bětkou** (stánek) → `trhovkyne_intro`
   (fakt `fact_nove_benatky_1343`), volba „Potřeboval bych cedník, zrní a
   svíčku" → `trhovkyne_trade` (**H2**): drby ze zámku výměnou za
   **[cednik] + [zrno] + [svicka]**, `gossip_told`.
5. Ulička k řece → `river_bank`. Promluv s **Vávrou** → `prevoznik_intro`
   (**H1**): volba o druhém břehu → **[bidlo]**, `met_prevoznik`
   (fakt `fact_name_venice` z větve o jménu Benátek). Tím se odemyká cesta
   po ledu (hotspot-závora `hs_rb_ice_path` se skryje, funguje exit).
6. V inventáři **zkombinuj [cednik] + [bidlo]** → **[podberak]** (H3a,
   „astronomický podběrák“).
7. **[podberak] na jez s vírem** (`hs_rb_weir`) → cutscéna lovení (H3b)
   → **[frag_a]**.
8. **[zrno] na husu Markytu** (`hs_rb_goose`) → `goose_lured` (H4a; zrno se
   vysype — dál není potřeba). Ruka na **hnízdo** (`hs_rb_nest`) →
   **[frag_b] + [brk]** (H4b).
9. Po ledu → `old_town`. *(Volitelně: oko na zvonici → `fact_first_mention_1259`,
   oko na tkalcovnu → `fact_benda_family`.)* Pěšinou → `marsh`.
10. **[svicka] na zamrzlou tůň** (`hs_ma_ice_pool`) → cutscéna vytavení (**H5**)
    → **[frag_c]**. Svíčka zůstává v inventáři.
11. Ruka na **starý dub** (`hs_ma_oak`) → **[dubenky]**.

**Stav po aktu I:** mokry_list, frag_a, frag_b, frag_c, svicka, dubenky,
(skalice), brk, podberak; flagy knows_quest, met_prevoznik, gossip_told,
goose_lured.

## AKT II — „Inkoust a paměť"

12. *(Pokud ještě nemáš)* v observatoři ruka na **polici** → **[skalice]**.
13. **[dubenky] (nebo [skalice]) na hmoždíř** (`hs_ob_mortar`) → cutscéna tření
    (**H7**) → **[inkoust]**, fakt `fact_gall_ink`. *(Kombinace
    dubenky+skalice v inventáři dá nápovědu „chce to hmoždíř“.)*
14. **[frag_a], [frag_b], [frag_c] postupně na velký sextant**
    (`hs_ob_sextant`) → po třetím se spustí zaměřovací dialog `_sextant_aim`
    (**H6**). Správná volba: **„Měsíc nízko nad obzorem, zrcátkem šikmo na
    pult.“** (špatné volby jen baví, netrestají). Efekt: `letter_read`,
    fakt `fact_gall_ink`; Brahe napoví formuli u šumaře a vyjmenuje, co chybí
    k přepisu.
15. `old_town`: promluv s **Bendou** → `benda_intro` → volba o císařské formuli
    → `benda_song` (**H8**): poskládej verše v pořadí
    **„Z Boží milosti My…“ → „Rudolf Druhý…“ → „volený císař římský…“ →
    „uherský a český král!“** Dvě chyby = Benda spustí píseň znovu (jinak
    zamíchanou). Efekt: `formule_known`.

## AKT III — „Pečeť a sníh"

16. Observatoř: promluv s Brahem → volba „Mám fragmenty přečtené…“ →
    `brahe_test` (**H9**, vyžaduje `letter_read`): 3 otázky —
    **Rudolf II.** / **Benátky, návrší s výhledem na oblohu** /
    chyták s nosem: správně **„Z mosazi!“** (fakta `fact_three_castles`,
    `fact_brahe_nose`). Efekt: **[pergamen] + [pecetidlo]**,
    `brahe_test_passed`.
17. **[pergamen] na psací pult** (`hs_ob_desk`) → **H10a** (kontroluje
    `letter_read`, `formule_known`, inkoust, brk; chybějící věci Jiřík
    vyjmenuje) → **[prepis]**, `prepis_done`.
18. **[prepis] na svícen** (`hs_ob_candle`) → **H10b** (vyžaduje pečetidlo)
    → **[zapeceteny_list]**, `letter_sealed`; zámecký zvon ohlásí 4. únor.
19. **[zapeceteny_list] na Braha** → finální cutscéna: kontrola listu,
    rolničky, přesun na `castle_yard` (Brahe a Kepler na nádvoří),
    `kepler_arrival` (fakt `fact_kepler_arrival`, `finale_started`)
    → plynule `epilog` (fakta `fact_kepler_mars`, `fact_brahe_prague`,
    `fact_merger_1944`; větve o Markytě a Bendech). Po epilogu lze
    doprohlédnout nádvoří (nové hotspoty Braha a Keplera) a Kroniku (J).

---

## Kontrola dependency grafu (ručně, uzel po uzlu)

| Krok | Vyžaduje | Získáno dříve v kroku | OK |
|------|----------|------------------------|----|
| H1 (bidlo, led) | jen rozhovor s Vávrou | — (dostupné od startu) | ✔ |
| H2 (cedník, zrní, svíčka) | `knows_quest` | krok 3 (brahe_intro) | ✔ |
| H3a (podběrák) | cednik + bidlo | kroky 4, 5 | ✔ |
| H3b (frag_a) | podberak, přístup k jezu | krok 6; jez od startu | ✔ |
| H4 (frag_b, brk) | zrno | krok 4 | ✔ |
| H5 (frag_c) | svicka, přístup do marsh | krok 4; marsh přes old_town po H1 | ✔ |
| dubenky | přístup do marsh | po H1 | ✔ |
| skalice | `knows_quest` | krok 3 | ✔ |
| H7 (inkoust) | dubenky + skalice + hmoždíř | kroky 11, 12 | ✔ |
| H6 (letter_read) | frag_a + frag_b + frag_c | kroky 7, 8, 10 | ✔ |
| H8 (formule_known) | jen rozhovor s Bendou (přístup po H1) | krok 5 | ✔ |
| H9 (pergamen, pečetidlo) | `letter_read` | krok 14 | ✔ |
| H10a (prepis) | pergamen + inkoust + brk + letter_read + formule_known | kroky 16, 13, 8, 14, 15 | ✔ |
| H10b (zapečetěný list) | prepis + pecetidlo | kroky 17, 16 | ✔ |
| Finále | zapeceteny_list → Brahe | krok 18 | ✔ |

**Bez dead-endů:** svíčka i bidlo se nespotřebují (svíčka slouží v H5 i H10b);
zrno se vysype až husě (pak už není potřeba); všechny scény zůstávají trvale
přístupné; závora na led (`hs_rb_ice_path`) zmizí po H1 a nevrací se; žádný
předmět nelze ztratit ani použít „špatně" nevratně. Graf je acyklický a každý
požadavek vzniká dřív, než je potřeba → **hra je průchozí od startu do finále**.

## Kronika — všech 13 faktů
brahe_intro (1), trhovkyne_intro (2), prevoznik_intro — větev „proč Benátky"
(3, též bludičky), oko na sextant (4), oko na Marsovy poznámky (5), oko na
zvonici (6), oko na tkalcovnu (7, též benda_intro), H6/H7 (8),
brahe_test (9, 10), finále+epilog (11, 12, 13 — kepler_arrival, brahe_prague,
kepler_mars, merger_1944). Volitelné: hráč, který nekouká, skončí s ~9;
zvědavý se 13/13.

## Easter eggy
- **Sněhulák Tycho II.** — 3× ruka na hromadu sněhu na nádvoří →
  `snowman_built`, Brahe z okna: „TO NENÍ VTIPNÉ.", Ryšák sněhuláka sní.
- **Zvonice** — ruka rozezní zvon, Benda ladí.
- **Podběrák Brahovi** — „patentuji ho jako JEDENÁCTÝ přístroj benátecký."
- **Brk zpět Markytě** — nedoporučuje se.
