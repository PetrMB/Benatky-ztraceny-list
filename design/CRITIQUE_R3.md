# CRITIQUE R3 — „Ztracený list" vs. Monkey Island (slepý test, kolo 3)

Kritik: nemilosrdný AAA art review, 2026-08-07 (po opravách F1–F5 z R2).
Benchmark: stejný jako R1/R2 — RtMI (`critic/ref_rtmi_1.jpg`), CoMI (`critic/ref_comi_1.png`).
Metoda: 7 scén přes `shots.html` + headless Chrome (titulka bez hashe — spawn hráče „na střechách" z R2 byl artefakt harnessu, ne hry), snímky ve `scratchpad/critic_r3/`, plus zvětšené výřezy postav (`jirka_*`, `brahe`, `trhovkyne`).

## Celkový verdikt

**5/7 PASS (observatory, marsh, old_town, river_bank, title). 2/7 FAIL (square, castle_yard — obě těsně).** Trajektorie 0/7 → 2/7 → 5/7. Tohle kolo konečně zabralo tam, kde to bolelo: **F1 postavy jsou opravené** — Jirka má karikaturu (velký nos, brada, ušanky, větší boty), asymetrickou pózu (natažená ruka v river_bank, ruka u šály v old_town), fazetovanou siluetu kabátu a skutečný rim-light (studený bílý na ramenou a špičkách bot venku, teplé okrové hrany kalhot/bot u světla oken v old_town). Brahe s okružím, řetězem, mosazným nosem a hranatým pláštěm vedle RtMI postav obstojí. **F2 river_bank redesign se povedl** — lávka je tmavá silueta klesající diagonálně, sloupky prořídly a variují, popředí žije (loďka s veslem, rákosí, kotvící kůl, balvany). **F3 světlo** — kaluže z oken v old_town jsou konečně měkké elipsy se scumblem, žádné lichoběžníky. Ve slepém testu už hra nečte jako „vektorová aplikace" — čte jako svébytná stylizovaná adventura o třídu pod MI, ne o tři.

Co zbývá, jsou dvě denní frontální scény, kterých se redesign nedotkl, a hrstka P2 detailů.

## Tabulka scén

| Scéna | R1 | R2 | R3 | Proč (ne)prošla |
|---|---|---|---|---|
| observatory | FAIL | PASS | **PASS** | Hustota rekvizit, měsíční kaluž, Brahe drží úroveň. Sráží ji jen nezměněný stick-figure na kvadrantu a pořád mírně emoji lebka (P2 — z R2 F5 neuděláno). |
| marsh | FAIL | PASS | **PASS** | Nejmalířštější scéna: mlžné pásy, plot z kůlů v perspektivní křivce (variované výšky/náklony, sněhové čepice), strom s plody v popředí, dopis s pečetí a prasklinami čitelný. Horní třetina už žije mraky a hejnem. |
| old_town | FAIL | FAIL (těsně) | **PASS (těsně)** | Killer flaw z R2 opraven: kaluže světla = měkké teplé elipsy s rozpadlou hranou, výloha Bendy září do sněhu. Jirka u světla má teplé hrany. Zbývá: růžové mraky pořád elipsovité bloby, žlutý „oko" štít na chalupě čte divně (P2). |
| river_bank | FAIL | FAIL | **PASS (těsně)** | Kompoziční skelet opraven: lávka tmavá silueta na diagonále, sloupky variované, foreground vrstva (loďka, rákosí, kůl, balvany), město v oparu s mlýnským kolem, hejno ptáků. Zbývá: ledová „záclona" pod lávkou je nejsvětlejší plocha snímku a bije se o pozornost s lístečkem, který je pořád malý (P2). |
| title | FAIL | FAIL | **PASS (těsně)** | Typografie titulku integrovaná do ilustrace (zlatý nápis s halem), souhvězdí Cassiopeia s linkami (Brahe!), boží paprsky přes celé nebe, měsíc s krátery. Spawn obra byl artefakt harnessu. Zbývá: položky menu jsou holý bílý text bez výtvarného zpracování (P2). |
| square | FAIL | FAIL | **FAIL (těsně)** | Barevné fasády, sluneční halo, modré diagonální stíny, pranýř — vše pomohlo. Ale pořád čistě frontální papírové divadlo: arkády a okna klonované, žádná foreground vrstva, ploché polední světlo. A hlavně trhovkyně: symetrická póza, ruce-palčáky sepnuté, kulatá hlava, nulový rim — jediná postava, která zůstala „dětská aplikace". Vedle CoMI stále prohrává jasně. |
| castle_yard | FAIL | FAIL | **FAIL (těsně)** | Sluneční hodiny s mottem, sáně na diagonále, bouda se psem, dlouhé modré stíny — hustota OK. Ale obří béžová fasáda s uniformním sgrafitovým rastrem drží ~60 % plátna, 5 arkád má identické oblouky/sloupy/výšky (liší se jen obsah), foreground vrstva chybí. Scéna je výtvarně „prázdná zeď s dekoracemi". |

## Zbývající findings (prioritně)

### F1 (P1) — square: poslední scéna bez redesignu + trhovkyně
Jediná scéna, kde slepý test selže na první pohled.
- **Kde:** `src/20_backgrounds.js` (square), `src/30_characters.js` (drawTrhovkyne + postava u kašny).
- **Recept:** (a) trhovkyně dostane stejný balík jako Jirka: asymetrie (ruka v bok / rovná zboží), větší nos, rim-light, fazetovaná sukně; (b) foreground vrstva zleva/zprava (roh stánku, pytle, sud s parallaxou > 1); (c) rozbít klony: jedna arkáda zazděná, jiná s vraty, okna variovat okenicemi/květináči; (d) protáhnout stíny arkád do náměstí, ať polední světlo není ploché.

### F2 (P1) — castle_yard: modulace fasády a arkád
- **Kde:** `src/20_backgrounds.js` (castle_yard).
- **Recept:** (a) sgrafito rastr přerušit 2–3 velkými plochami opadané omítky s jiným valérem + zateklinami pod římsou; (b) arkády: jednu zazdít cihlami, jednu snížit, sloupy variovat patkami; (c) foreground prvek zprava (vůz/káď/hromada dřeva s parallaxou); (d) teplý odlesk z brány protáhnout po sněhu doprostřed dvora.

### F3 (P2) — Valérové a detailové drobky, které srážejí hotové scény
- river_bank: ledovou záclonu pod lávkou ztmavit o 2 valéry (ať nejsvětlejší zůstane sníh a kaluž s lístečkem) a lísteček zvětšit ~1.5× nebo přidat jiskru/ripples výrazněji.
- observatory: stick-figure na kvadrantu → rytecký diagram se šrafami; lebka protáhnout, očnice stínem (trvá z R2 F5).
- title: menu položky výtvarně (pergamenový pás / řezaný serif se stínem místo holého bílého textu).
- old_town: růžové mraky rozbít měkkým okrajem, prověřit žlutý štít „oko".

## Co je z R2 hotovo (potvrzeno na snímcích a výřezech)
- F1 postavy: karikatura, asymetrická póza, fazetovaná silueta, rim-light (studený venku, teplý u světla) — Jirka ✔, Brahe ✔, trhovkyně ✘ (=F1 výše).
- F2 river_bank redesign: diagonála, tmavá lávka, variované sloupky, foreground, oživené nebe ✔.
- F3 měkké světelné kaluže ✔ (old_town); prázdné horní poloviny zaplněné v marsh/title ✔, river_bank z větší části ✔.
- F4 klony: river_bank sloupky ✔; castle_yard arkády jen obsahem ✘ (=F2 výše); square ✘ (=F1 výše).
- F5: title spawn = artefakt harnessu, ve hře OK ✔; observatory stick-figure/lebka ✘ (=F3).

## Doporučené pořadí prací
1. F1 square (trhovkyně + foreground + de-klonování) — poslední jasný FAIL na první pohled
2. F2 castle_yard (fasáda + arkády + foreground)
3. F3 drobky (river_bank valér ledu, observatory kvadrant, title menu)
