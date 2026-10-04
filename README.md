# Ztracený list — Benátky nad Jizerou, L.P. 1600

Point-and-click adventura ve stylu *Curse of Monkey Island* — čistý HTML/JS/canvas + WebAudio, žádné externí soubory.

- **Hrát online:** https://bnj.honeger.com (verze 2) · https://bnj.honeger.com/v1/ (původní verze)
- **Hrát lokálně:** otevřít `v2/dist/index.html` (nebo `dist/index.html` pro v1)

| Složka | Obsah |
|---|---|
| `src/`, `dist/` | původní verze 1 (beze změn) |
| `v2/` | verze 2 — světlo a atmosféra, zvukové ambienty, nápověda, opravy scén — viz `v2/CHANGES_V2.md` |
| `design/` | design dokumenty, kánon ID, walkthrough |
| `HANDOFF.md` | kompletní předávací dokument (build, test, herní bible) |

Nasazení: GitHub Pages z větve `gh-pages` (`index.html` = `v2/dist/index.html`, `v1/index.html` = `dist/index.html`, `CNAME` = bnj.honeger.com). Po změně buildu stačí spustit `./deploy.sh`.
