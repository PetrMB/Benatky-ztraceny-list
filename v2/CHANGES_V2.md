# Ztracený list — verze 2

Originál (`../src`, `../dist/index.html`) zůstává beze změny. V2 je samostatná
kopie: hrát `v2/dist/index.html`, vyvíjet přes `v2/index.html` (načítá `v2/src`).

## Build
Stejný postup jako v1 (HANDOFF.md §2), jen spustit ve složce `v2/`.
Kontrola syntaxe bez Node: `/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc -e "checkSyntax('src/00_engine.js')"`.
Snímky: `tools/shot.sh out.png "scéna,camX,grid,px,py,čas,ui"` (ui: `hs`, `hint`, `settings`, `menu`, `dlg:<id>`).

## Nové moduly
- `25_atmosphere.js` — světlo a atmosféra: automatická záře oken/ohňů/svící
  vytažená z vrstev, ruční světla s blikáním, světelné paprsky, prach,
  mlha ve vrstvách, bloom, gradování, viněta, zrno, vločky v popředí,
  třpyt sněhu, jiskry; světlo a vržené stíny postav. Profily scén v `BNJ.atmos`.
- `65_ambience.js` — procedurální okolní ruchy každé scény, UI zvuky, kroky po dřevě.
- `70_hints.js` — nápověda „Co dál?" (H / sova) podle stavu hry.

## Engine (00_engine.js)
- Audio: kompresor, konvoluční dozvuk dle scény, sběrnice ambience, hlasitosti, panorama.
- Iris přechod, stopy ve sněhu, pára od úst, létající předměty do inventáře, oznámení se symbolem.
- Hratelnost: Mezerník/Tab = zvýraznění hotspotů, dvojklik = běh / okamžitý odchod,
  1–5 = volby, F5/F9 = rychlé uložení/načtení, kurzor-šipka u východů, dotykové ovládání.
- UI: portréty v dialozích, horní lišta (menu, místa, nápověda, Kronika, jazyk), nastavení
  (hlasitosti, kvalita efektů, rychlost titulků) — `localStorage bnj2_settings`. Uložené hry z v1 jdou načíst.

## Opravy scén (audit návazností)
- **Mokřady:** rovná vodorovná hrana mezi rákosovými tůněmi a břehem → přirozený břeh;
  hatě dřív běžely za okraj scény → viditelný konec (propadlé kuláče, oko vody, věcha)
  + hotspot „Konec hatí".
- **Náměstí:** kolemjdoucí měšťka měla díru v těle (sukně nedosahovala k živůtku),
  byla o polovinu menší a zjevovala se uprostřed scény → přepsána, zakrývají ji kašna,
  pranýř a stánek. Vrána visela ~45 px nad střechou → posazena na hřeben;
  přelet na kostel má i návrat (dřív teleport).
- **Břeh Jizery:** lávka končila ve vzduchu nad řekou a jez měl useknuté konce →
  kamenné opěry (na pravou dosedá lávka).
- **Nádvoří:** hlavní věž s bání se u dveří observatoře kryla se schodišťovou věžičkou
  („dvojitá střecha") → posunuta. Vrabci po odletu přiletí zpět (dřív se objevili).
- **Observatoř:** Brahova hlava byla přesně v prstenci armilární sféry → posunut.
- **Staré Benátky:** netopýr v lednu → sova.
- Statická „letící" hejna na nebi (titulka, nádvoří, řeka, mokřady) nyní skutečně letí.
