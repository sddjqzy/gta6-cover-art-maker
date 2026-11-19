# gta6-cover-art-maker

[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/sddjqzy/gta6-cover-art-maker/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/sddjqzy/gta6-cover-art-maker/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Vice Cover is a multi-panel GTA 6 style cover art maker. Pick two photos, type a title and a tagline, choose a panel layout (trio, quad or duo), a colour grade (sunset, neon or teal) and a size, then preview the cover live and export it as a PNG. Photos can be the two built-in Vice City samples or your own uploads. It runs entirely in the browser with no build step.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in your browser. The editor shows a live preview on the left and controls on the right; "Export PNG" downloads the finished cover at full size.

You can also deep-link a cover straight from a URL, for example `/?shot=cover&caption=VICE%20CITY&tagline=WELCOME%20BACK&layout=trio&grade=sunset&size=square` — every control (photo, photo2, caption, tagline, layout, grade, size, mix) is a URL parameter.

Made with [make.fun](https://make.fun/?ref=663520p3).
