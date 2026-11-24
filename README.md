# Rising Sun · Scroll of Honor

A fan-made stats page for our *Rising Sun* board game nights: Elo ratings, rank titles, clan stats,
head-to-head records, a battle replay, and more. It's a single file (`index.html`) that runs entirely in
the browser, with no server or account needed.

**Live page:** https://tomfilbey.github.io/rising-sun/

## Recording a new battle

1. Open the page and go to **⚔ Record a Battle**. Fill in each warlord's name, points and clan, plus the
   4 Kami, monster packs, any betrayals (tap 🗡), an optional board photo, and notes.
2. Press **Record battle**. The battle shows up everywhere right away, but only in *your* browser.
3. A yellow banner then offers **⬇ Download updated page**. That saves a new `index.html` with the
   battle built in.
4. Upload that file here to replace the old one (on GitHub: **Add file → Upload files**, drag it in,
   **Commit changes**). The live page updates in about a minute.

### When someone sends Tom a backup

Friends can press **⬇ Download backup for Tom** (on Record a Battle or the Ledger) and send the
`rising-sun-battles-<date>.json` file. To publish it:

1. Open the live page → **📒 Ledger** → **Load backup**, pick the file, confirm.
2. Check the battles look right, then press **⬇ Download updated page** in the yellow banner.
3. Upload that `index.html` to this repo as above.

Each battle card (and each Ledger row) also has **📋 Copy as text**, and **📋 Copy all battles as
text** copies the whole history, handy for pasting into the group chat.

Mistakes can be fixed on the **📒 Ledger** screen, which shows every battle as an editable table. Then
download and upload the page the same way.

## Checking the file

```
node tools/check.mjs              # checks index.html
node tools/check.mjs some-copy.html
```

It validates every battle (names, points, clans, Kami, betrayals) and makes sure the page's scripts
compile.

---
Fan-made, not affiliated with CMON or the publishers of *Rising Sun*. Clan emblems and artwork on the
page are original drawings.
