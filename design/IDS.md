# IDS.md — KÁNON ID (jediný zdroj pravdy)
Hra „Ztracený list". Nikdo nevymýšlí ID mimo tento seznam. Detaily viz `GAME_DESIGN.md`.

## Scény (`BNJ.registerScene`)
| ID | Popis |
|----|-------|
| `title` | Titulní obrazovka — noční nebe nad siluetou zámku, menu, CZ/EN |
| `castle_yard` | Zámecké nádvoří, pozdní zimní odpoledne (šířka 2600) |
| `observatory` | Brahova observatoř + laboratoř ve 2. patře, noc (šířka 2200) |
| `river_bank` | Břeh Jizery pod jezem, mrazivé ráno, převozník a husa (šířka 2800) |
| `square` | Náměstí Nové Benátky, dopoledne, trh (šířka 2600) |
| `old_town` | Staré Benátky, modrá hodinka, šumař Benda u zvonice (šířka 2400) |
| `marsh` | Obodř — zamrzlé mokřady, mlha, bludičky, starý dub (šířka 2600) |

## Postavy (`BNJ.registerCharacter`)
| ID | textColor | Popis |
|----|-----------|-------|
| `jirka` | `#ffe9a8` | Jiřík, 14letý posel, hrdina; zrzavý, červená šála, brašna |
| `brahe` | `#d9b8ff` | Tycho Brahe; hřmotný cholerik, okruží, blýskavý mosazný nos |
| `kepler` | `#b8e0ff` | Johannes Kepler; útlý, brýle, přijíždí ve finále 4. 2. 1600 |
| `benda` | `#ff9e64` | Matěj Benda, fiktivní „předek Bendů", šumař-tkadlec se skřipkami |
| `prevoznik` | `#9fd8c0` | Vávra, flegmatický převozník s fajfkou, majitel husy Markyty |
| `trhovkyne` | `#ffa8c8` | Bětka, srdečná trhovkyně na náměstí, platí se jí drby |

## Předměty (`BNJ.registerItem`)
| ID | Popis |
|----|-------|
| `mokry_list` | Rozmočený cár císařského listu s kouskem pečeti (z intra) |
| `frag_a` | Fragment listu vylovený podběrákem z víru pod jezem |
| `frag_b` | Fragment listu z hnízda husy Markyty |
| `frag_c` | Fragment listu vytavený z ledu obodřské tůně |
| `cednik` | Děravý cedník od Bětky (půlka podběráku) |
| `bidlo` | Vávrovo převoznické bidlo (druhá půlka podběráku) |
| `podberak` | „Astronomický podběrák" = cednik + bidlo (absurdní kombinace) |
| `zrno` | Pytlík zrní na vylákání husy |
| `svicka` | Lojová svíčka; taje led (H5) i kape vosk na pečeť (H10b), nespotřebovává se |
| `dubenky` | Hrst duběnek ze starého dubu v mokřadech |
| `skalice` | Zelená skalice (síran železnatý) z police laboratoře |
| `inkoust` | Duběnkový inkoust utřený v hmoždíři (dubenky + skalice) |
| `brk` | Husí brk od Markyty |
| `pergamen` | Čistý pergamen od Braha (po zkoušce H9) |
| `pecetidlo` | Brahovo pečetidlo (po zkoušce H9) |
| `prepis` | Hotový přepis listu (psací pult, H10a) |
| `zapeceteny_list` | Zapečetěný přepis — finální předmět pro Braha/Keplera |

## Hotspoty (`BNJ.registerHotspot`, prefix dle scény)
| ID | Scéna | Popis |
|----|-------|-------|
| `hs_cy_sundial` | castle_yard | Sluneční hodiny (v zimě vtipně k ničemu) |
| `hs_cy_well` | castle_yard | Zamrzlá studna |
| `hs_cy_sled` | castle_yard | Saně u zdi |
| `hs_cy_dog` | castle_yard | Pes Ryšák u boudy |
| `hs_cy_snow_pile` | castle_yard | Hromada sněhu → sněhulák (easter egg) |
| `hs_cy_tower_door` | castle_yard | Dveře věže — exit do observatory |
| `hs_cy_gate` | castle_yard | Brána — exit na square |
| `hs_ob_sextant` | observatory | Velký sextant — hádanka H6 (čtení fragmentů) |
| `hs_ob_quadrant` | observatory | Zední kvadrant (lore) |
| `hs_ob_globe` | observatory | Mosazný nebeský glóbus (lore) |
| `hs_ob_mortar` | observatory | Hmoždíř — výroba inkoustu (H7) |
| `hs_ob_alembic` | observatory | Křivule, destilace (dynamika, lore) |
| `hs_ob_shelf_vitriol` | observatory | Police se skalicí → `skalice` |
| `hs_ob_desk` | observatory | Psací pult — přepis (H10a) |
| `hs_ob_candle` | observatory | Svícen — pečetění (H10b) |
| `hs_ob_fireplace` | observatory | Krb s jiskrami |
| `hs_ob_marsnotes` | observatory | Brahova pozorování Marsu → fact_kepler_mars |
| `hs_rb_weir` | river_bank | Jez s vírem — `podberak` → `frag_a` |
| `hs_rb_boat` | river_bank | Vytažená pramice („spí do jara") |
| `hs_rb_goose` | river_bank | Husa Markyta — `zrno` → goose_lured |
| `hs_rb_nest` | river_bank | Hnízdo → `frag_b` + `brk` |
| `hs_rb_reeds` | river_bank | Rákosí u břehu |
| `hs_rb_fire` | river_bank | Vávrovo ohniště |
| `hs_rb_ice_path` | river_bank | Cesta po ledu — exit old_town (po H1) |
| `hs_sq_stall` | square | Bětčin stánek (cedník, zrní, svíčky) |
| `hs_sq_fountain` | square | Zamrzlá kašna |
| `hs_sq_pillory` | square | Pranýř (lore, vtipy) |
| `hs_sq_firebasket` | square | Železný koš s ohněm |
| `hs_sq_church_door` | square | Dveře kostela (zavřeno, lore) |
| `hs_sq_castle_road` | square | Cesta vzhůru — exit castle_yard |
| `hs_sq_river_lane` | square | Ulička k řece — exit river_bank |
| `hs_ot_benda` | old_town | Bendův plácek s ohýnkem (postava benda) |
| `hs_ot_belfry` | old_town | Stará zvonice → fact_first_mention_1259 |
| `hs_ot_loom_house` | old_town | Tkalcovna → fact_benda_family |
| `hs_ot_tavern_door` | old_town | Dveře krčmy (zavřeno, hlasy zevnitř) |
| `hs_ot_marsh_path` | old_town | Pěšina — exit marsh |
| `hs_ot_ice_path` | old_town | Cesta po ledu — exit river_bank |
| `hs_ma_oak` | marsh | Starý dub → `dubenky` |
| `hs_ma_ice_pool` | marsh | Zamrzlá tůň — `svicka` → `frag_c` |
| `hs_ma_wisps` | marsh | Bludičky (lore, fact_name_venice vazba) |
| `hs_ma_heron` | marsh | Volavka |
| `hs_ma_reeds` | marsh | Rákosové ostrovy |
| `hs_ma_causeway` | marsh | Hatě — exit old_town |

## Dialogy (`BNJ.registerDialog`)
| ID | Popis |
|----|-------|
| `dlg_intro` | Úvodní cutscéna-dialog: prasklý led, ztráta listu, monolog Jiříka |
| `brahe_intro` | První setkání s Brahem: zadání úkolu, dovolení brát ze zásob; fact_brahe_arrival |
| `brahe_test` | H9 — Brahova zkouška (3 otázky, chyták s nosem); dává pecetidlo+pergamen |
| `prevoznik_intro` | H1 — Vávra: bidlo, cesta po ledu, fact_name_venice |
| `trhovkyne_intro` | Seznámení s Bětkou; fact_nove_benatky_1343 |
| `trhovkyne_trade` | H2 — drby za cedník, zrní a svíčku (vyžaduje brahe_intro) |
| `benda_intro` | Seznámení s Matějem Bendou, proroctví o rodu; fact_benda_family |
| `benda_song` | H8 — dialogová hádanka: skládání veršů císařské formule |
| `kepler_arrival` | Finální cutscéna-dialog: příjezd Keplera 4. 2. 1600, předání listu |
| `epilog` | Epilogové titulky: fact_brahe_prague, fact_kepler_mars, fact_merger_1944 |

## Flagy (`BNJ.flag`)
| ID | Popis |
|----|-------|
| `knows_quest` | Jiřík dostal od Braha úkol (po brahe_intro) |
| `met_prevoznik` | Proběhl prevoznik_intro (odemyká cestu po ledu) |
| `gossip_told` | Drby předány Bětce → obdržel cedník/zrno/svíčku |
| `goose_lured` | Markyta vylákána zrním z hnízda |
| `letter_read` | H6 hotová — text fragmentů přečten sextantem |
| `formule_known` | H8 hotová — úvodní formule složena z Bendovy písně |
| `brahe_test_passed` | H9 hotová — Brahe půjčil pečetidlo a dal pergamen |
| `prepis_done` | H10a hotová — přepis existuje |
| `letter_sealed` | H10b hotová — list zapečetěn |
| `finale_started` | Spuštěna cutscéna příjezdu Keplera |
| `snowman_built` | Easter egg: sněhulák s rampouchovým nosem na nádvoří |

## Fakta Kroniky (`BNJ.fact`)
| ID | Popis |
|----|-------|
| `fact_brahe_arrival` | Brahe přijel na Benátky 20. 8. 1599 na pozvání Rudolfa II. |
| `fact_three_castles` | Nabídka tří zámků (Lysá, Brandýs, Benátky); vybral Benátky kvůli návrší |
| `fact_observatory_rooms` | Observatoř+laboratoř ve 2. patře, přístroje ve 13 místnostech |
| `fact_brahe_nose` | Nos ztracen 1566 v souboji s Parsbergem; pověst stříbro, exhumace 2010 → mosaz |
| `fact_kepler_arrival` | Kepler přijel 4. 2. 1600 (dle některých pramenů 3. 2.) |
| `fact_kepler_mars` | Z Brahových dat o Marsu Kepler odvodil eliptické dráhy planet |
| `fact_brahe_prague` | Červen 1600 přesun do Prahy; Brahe zemřel 1601 |
| `fact_name_venice` | Benátky = z ital. Venetia přes slovinské Benetke; „mokré místo u vody" |
| `fact_first_mention_1259` | První zmínka 1259, osada na levém břehu Jizery (Staré Benátky) |
| `fact_nove_benatky_1343` | Kolem 1340 Jan z Dražic založil Nové Benátky; k 1343 město |
| `fact_merger_1944` | 1944 sloučení Nových Benátek, Starých Benátek a Obodře |
| `fact_benda_family` | Rod Bendů ze Starých Benátek (Jan Jiří 1682–1757, František *1709); víc muzikantů než Bachů |
| `fact_gall_ink` | Železoduběnkový inkoust: duběnky + zelená skalice |

## Hudební tracky (`BNJ.audio.registerTrack`)
| ID | Popis |
|----|-------|
| `title_theme` | Jiříkův motiv (d dorský), flétna + loutna nad hvězdným drone — scéna title |
| `castle_theme` | Slavnostní D dur se zvony — castle_yard |
| `observatory_theme` | Mystický e frygický, viola drone + zvonkohra — observatory |
| `river_theme` | Loutnové perpetuum arpeggio (G mixolydický) — river_bank |
| `square_theme` | Trhová skočná C dur, flétna — square |
| `oldtown_theme` | Bendův motiv, skřipky (a moll) — old_town, diegeticky sílí u Bendy |
| `marsh_theme` | Nízký drone + váhavá flétna (d moll) — marsh |
| `finale_theme` | Jiříkův motiv v D dur + Brahovy zvony — finální cutscéna a epilog |

## SFX (`BNJ.audio.registerSfx`)
| ID | Popis |
|----|-------|
| `sfx_splash` | Šplouchnutí (lovení u jezu) |
| `sfx_ice_crack` | Praskání ledu (intro, mokřady) |
| `sfx_goose` | Zasyčení/kejhání husy Markyty |
| `sfx_bell` | Zámecký/kostelní zvon (i ohlášení Keplera) |
| `sfx_crow` | Krákání vran na náměstí |
| `sfx_dog` | Ryšákovo štěknutí/funění |
| `sfx_grind` | Tření hmoždíře (výroba inkoustu) |
| `sfx_quill` | Škrábání brku po pergamenu (přepis) |
| `sfx_seal` | Přitisknutí pečetidla do vosku |
| `sfx_snow_step` | Kroky ve sněhu (vázané na walk cycle v exteriérech) |
| `sfx_door` | Otevření/zavření dveří (přechody interiér) |
| `sfx_pickup` | Sebrání předmětu do inventáře |
| `sfx_sleigh` | Rolničky saní — Keplerův příjezd |

## Save klíče (engine, informativně)
`bnj_save_1`, `bnj_save_2`, `bnj_save_3`, `bnj_save_auto` — dle CONTRACT.md.
