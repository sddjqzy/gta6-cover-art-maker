# gta6-cover-art-maker

[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/sddjqzy/gta6-cover-art-maker/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/sddjqzy/gta6-cover-art-maker/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Vice Cover is a multi-panel GTA 6 style cover art maker. Pick two photos (the included boulevard and pier samples, or your own uploads), write a title and a tagline, then choose a layout (trio, quad or duo), a colour grade (sunset, neon or teal) and a size (square 1080x1080, portrait 1024x1280 or wide 1280x720). The preview redraws live as you change anything, and one click exports the finished cover as a PNG. It runs entirely offline in the browser — your photos never leave your device.

What you get:

- Three panel layouts: trio (three upright panels), quad (a 2x2 grid) and duo (two wide panels).
- Three colour grades with an adjustable strength slider, from a bare photo to a full wash.
- Big Anton display type for the title and tagline, with a white frame around every cover.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in your browser.

Share a cover with URL parameters, for example `?shot=cover&caption=VICE%20CITY&layout=trio&grade=sunset&size=square&mix=35`. The `shot` parameter picks the cover view or the full editor. Every parameter has a matching control in the editor, so a shared link always opens exactly the cover it describes.

The Anton typeface is bundled under `app/fonts/` (SIL Open Font License 1.1, see `OFL.txt`), so the cover renders identically with no network access.

---

Made for the make.fun bounty — try it yourself: https://make.fun/?ref=663520p3
