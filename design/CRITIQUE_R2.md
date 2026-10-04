# CRITIQUE R2 — „Ztracený list" vs. Monkey Island (slepý test, kolo 2)

Kritik: nemilosrdný AAA art review, 2026-08-07 (po opravách pozadí a postav).
Benchmark: stejný jako kolo 1 — RtMI (Steam screenshot, lokálně `critic/ref_rtmi_1.jpg`), CoMI (in-game, `critic/ref_comi_1.png`). Pozn.: `ref_comi_wiki.jpg` je poškozený (uložená chybová stránka, ne obrázek).
Metoda: 7 scén přes `shots.html` + headless Chrome (rAF shim z R1 funguje, snímky jsou plně vysvícené), snímky v `scratchpad/critic_r2/`.

## Celkový verdikt

**2/7 PASS (observatory, marsh — obě těsně). 5/7 FAIL.** Oproti kolu 1 (0/7) skok o třídu: scumble/grain je konečně vidět, modré vržené stíny kotví objekty, mlha už není fillRect, světlo z oken se propisuje na sníh, klony dostaly variace. Hra už nevypadá jako infografika — vypadá jako pěkná stylizovaná indie adventura. Ale slepé srovnání s MI stále prohrává na třech frontách: **postavy** (pořád storybook, žádný rim-light, málo karikatury), **kompozice** (frontální kulisy bez foreground vrstvy, prázdné horní poloviny plátna) a **tvrdé geometrické světlo** (kaluže z oken jako ostré lichoběžníky).

Pořadí od nejsilnější: observatory > marsh > old_town > castle_yard > square > title > river_bank.

## Tabulka scén

| Scéna | R1 | R2 | Co se zlepšilo | Proč (ne)prošla |
|---|---|---|---|---|
| observatory | FAIL (nejblíž) | **PASS (těsně)** | Vinětace rohů, měsíční kaluž na podlaze, kaluže pod svíčkami, scumble na stěnách, koberec, Brahe s okružím/řetězem/mosazným nosem — hustota i světlo už MI-úrovně. | Obstojí; sráží ji jen stick-figure na kvadrantu a emoji lebka (P2, viz níže). |
| marsh | FAIL | **PASS (těsně)** | Mlha z měkkých vrstev místo fillRectů, rákosí se sněhovými čepicemi, strom v popředí s plody a dutinou, variované ledové tůně, dopis pod ledem větší + praskliny ukazují k němu. | Prochází o vlas — atmosféricky nejmalířštější scéna; horních ~40 % plátna je ale pořád skoro prázdný gradient (viz F3). |
| old_town | FAIL | FAIL (těsně) | Světelné kaluže z oken na sněhu, chalupy odlišené (vikýř, výloha, rampouchy), pozadí variované, oheň u Bendy, zvon ve zvonici. | Kaluže světla jsou tvrdé žluté lichoběžníky — geometrie zabíjí iluzi; růžové mraky pořád elipsovité bloby. |
| castle_yard | FAIL | FAIL | Sgrafito přerušené opadanou omítkou, scumble na fasádě, dlouhé modré vržené stíny, arkády zaplněné (žebřík, prkna), psí bouda, teplé světlo v bráně. | 5 arkád pořád skoro identických, žádný foreground prvek, Jirka vedle CoMI postav stále „dětská aplikace"; fasáda zůstává obří a málo modulovaná. |
| square | FAIL | FAIL | Slunce prosvěcuje mrak (halo místo disku), koš s ohněm vlevo, modré stíny, kašna s ledovou glazurou, girlandy, prapory, ptáci už nejsou čárky. | Kompozice čistě frontální kulisa; arkády klonované; obě postavy ve scéně flat; ve slepém testu vedle CoMI stále čte jako vektor. |
| title | FAIL (těsně) | FAIL | Měsíc s kráterovým stínováním a halem, boží paprsky, kouř z komínů, variované siluety, artefakt „podtržítka" pryč. | Postava stojí v měřítku obra „na střechách" vesnice (pravděpodobně spawn hráče v shots.html — ověřit; pokud je to i ve hře, je to P0); nebe z poloviny prázdné, menu/typografie ve snímku chybí — nelze hodnotit integraci titulku. |
| river_bank | FAIL (nejhůř) | FAIL | Trsy trávy na sněhu, loďka s dírou v ledu a stínem, siluety města variované (kostel), ptáci, dvoutónové mraky, ripples + jiskra u lístku. | Pořád nejslabší: lávka = dlouhý bledý pás, který splývá s ledem, ~30 identických sloupků; horní polovina plátna prázdná; kompozice beze změny. |

## Zbývající findings (prioritně)

### F1 (P0) — Postavy: kontura a 2-tón nestačí, chybí rim-light a karikatura
Jirka má konturu a náznak stínování na kabátu, Brahe dostal okruží a řetěz — dobrý směr. Ale vedle Guybrushe je to pořád storybook: kruhová hlava, tenké symetrické končetiny, nulová póza, žádný rim-light (v old_town stojí Jirka u ohně a nemá na sobě jediný teplý pixel). Postava je první, co oko ve slepém testu přečte — a první, co selže.
- **Kde:** `src/30_characters.js` — všechny draw* funkce.
- **Recept:** (a) rim-light 1–2 px podle světla scény: teplý u ohně/oken (old_town, observatory), studený venku (river_bank, marsh) — stačí světlá hrana na návětrné straně torza+hlavy; (b) zvětšit boty a ruce o ~30 %, brada/nos do profilu; (c) asymetrická póza (váha na jedné noze, ruka v kapse); (d) fazetovat siluetu kabátu (rovné seky místo oblouků, à la RtMI).

### F2 (P0) — river_bank potřebuje kompoziční redesign, ne další dekorace
Jediná scéna, kde opravy nezabraly, protože problém je ve skeletu: lávka je vodorovný bledý pás přes celé plátno, hodnotově totožný s ledem pod ní, s ~30 klonovanými sloupky; nad ní 50 % prázdného nebe.
- **Kde:** `src/20_backgrounds.js`, sekce river_bank (~2082+).
- **Recept:** (a) lávku ztmavit na siluetu (mokré dřevo, 2–3 hodnoty) + sněhová čepice na zábradlí, sloupky prořídit a variovat výškou/náklonem; (b) diagonála: lávka ať klesá k pravému břehu, ne rovnoběžně s okrajem; (c) foreground zprava: rákosí + kotvící kůl s lanem (parallax > 1); (d) nebe: sněhová přeháňka v jednom pásu + hejno vran, aby horní polovina žila.

### F3 (P1) — Tvrdé geometrické světlo a prázdné horní poloviny
Old_town: kaluže z oken = ostré žluté lichoběžníky na sněhu (geometrie viditelná na první pohled). Marsh/river_bank/title: horní 40–50 % plátna je gradient s pár tečkami. MI nikdy nenechá půlku obrazu bez informace.
- **Recept:** (a) kaluže světla kreslit jako 2–3 překryté elipsy s `globalAlpha` 0.06/0.10/0.14 a `screen`-ovým nádechem, hrany nechat rozpadnout scumblem — žádný přímý polygon; (b) do prázdných ober: marsh — vzdálená vížka/komín v mlze + větší hejno vran; title — protáhnout paprsky a mraky výš, vrátit typografii do ilustrace (pergamenový pás?); river_bank viz F2d.

### F4 (P1) — Klony druhé vlny
Castle_yard: 5 arkád pořád jeden asset (žebřík/prkna uvnitř pomohly, ale oblouky, sloupy i výšky jsou identické) — jednu zazdít, do jedné vrata, jiná výška. Square: arkády podloubí totéž; okna domů jeden asset. River_bank: sloupky lávky (F2).

### F5 (P2) — Detaily, které srazily jinak hotové scény
- observatory: stick-figure na kvadrantu předělat na rytecký diagram (šrafy), lebka na poličce míň „emoji" (protáhnout, očnice stínem).
- title: prověřit měřítko/pozici postavy (obr na střechách) — pokud jde jen o shots.html spawn, doplnit do shots.html per-scénu spawn point; pokud je to ve hře, P0.
- square: trhovkyně a postava u kašny potřebují F1 stejně jako Jirka.
- UI beze změny od R1 (rounded-rect tlačítka, verb coin) — P2-5 z R1 trvá.

## Co je hotovo z R1 (potvrzeno na snímcích)
- P0-1 textura/grain: scumble viditelný na fasádách, stěnách i sněhu, globální zrno přítomné. ✔ (z 80 %)
- P0-2 stíny: modré vržené + kontaktní stíny pod sáněmi, studnou, kašnou, loďkou, pranýřem. ✔
- P1-1 mlha/mraky: mistPuff místo fillRectů, dvoutónové mraky, teplé nádechy. ✔
- P1-4 světlo do okolí: kaluže existují (kvalita hran = F3). ✔ napůl
- P1-3 de-klonování: první vlna hotová (chalupy, siluety), druhá vlna zbývá (F4).
- P1-5 čitelnost: dopis v marsh s prasklinami ✔; lísteček v river_bank pořád malý.
- P0-3 postavy: kontura + náznak 2-tónu ✔, zbytek = F1.

## Doporučené pořadí prací
1. F1 postavy (rim + proporce + póza) — největší zbývající rozdíl ve slepém testu
2. F2 river_bank redesign lávky + foreground
3. F3 měkké kaluže světla (old_town) + zaplnění nebes
4. F5 title spawn/měřítko (rychlé ověření, možná jen harness)
5. F4 arkády a okna — průběžně
