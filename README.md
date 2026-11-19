# gta6-cover-art-maker

[![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/sddjqzy/gta6-cover-art-maker/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/sddjqzy/gta6-cover-art-maker/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Vice Cover is a multi-panel GTA 6 style cover art maker. Pick two photos, type a title and a tagline, choose a panel layout, a colour grade and a size, and export a bold neon cover as a PNG — right in the browser, no upload needed. Everything runs locally: your photos never leave your device, and the big condensed Anton headline is bundled with the app.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in your browser.

Layouts: `trio` (three panels), `quad` (four panels) and `duo` (two panels). Grades: `sunset`, `neon` and `teal`. Sizes: square 1080×1080, portrait 1024×1280 and wide 1280×720. You can also drive the editor from the URL, for example `?caption=VICE%20CITY&layout=quad&grade=neon&size=square`, and `?shot=cover` renders a bare cover for screenshots.

Made with [make.fun](https://make.fun/?ref=663520p3).
