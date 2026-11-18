# The World in One Day — Tuesday 17 November 2026

[![make.fun · news-image-20261117](https://make.fun/badge/news-image-20261117.svg)](https://make.fun/bounty/news-image-20261117?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261117)
[![rank](https://make.fun/badge/news-image-20261117/casg7322-ui/news-image-20261117/rank.svg)](https://make.fun/bounty/news-image-20261117/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261117)
[![reward](https://make.fun/badge/news-image-20261117/casg7322-ui/news-image-20261117/reward.svg)](https://make.fun/bounty/news-image-20261117?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261117)

An entry for the [make.fun news-image-20261117 bounty](https://make.fun/bounty/news-image-20261117): a one-page newspaper front page summing up the world's news of
Tuesday 17 November 2026, drawn entirely in code.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/entry.png (1024x1024, ~23 KB)
```

`main.ts` is pure Node standard library: a tiny raster canvas, a 5x7 bitmap
font, and a hand-rolled PNG encoder. No network, no fonts, no image assets —
every pixel is drawn by the program, so two runs write identical bytes.

## Stories (researched 18 Nov 2026 WIB)

- **Hero — Ukraine hits the Crimea Bridge again:** second strike in two
  days shuts the Kerch crossing; Zelenskyy hails an "unprecedented
  operation" as Russia hits Kyiv's bridges in reply.
  (Reuters via Just Security Early Edition; Al Jazeera via Algenom)
- **Iran drones hit a US radar base in Bahrain:** drones fired at the
  Sheikh Isa base are intercepted, no casualties; US intelligence warns of
  an Iranian "dirty bomb" plot in Washington. (Reuters; CNN via Just Security)
- **Tankers hit by mines off Hormuz:** two tankers struck mines and caught
  fire south of the Strait; 21 Indian crew of the LPG tanker MT Tara Gas
  brought ashore. (Al Jazeera; Reuters via Algenom)
- **Trump lands in Manila for ASEAN:** Xi–Trump–Putin meeting confirmed
  for Thursday in Shenzhen on the APEC sidelines. (NPR News Now; Outlook India)
- **Japan scrambles jets at Russian planes:** Tokyo protests after two
  suspected Russian aircraft enter its airspace at dawn. (Just Security; NPR)
- **UK sanctions Israeli settlement firms:** eight builders blacklisted
  over settlements; allies urge Gaza aid access. (Just Security; asaspress)

## Design

Newspaper front page: masthead + date, one hero story with a drawn bridge
illustration, five story panels with small code-drawn illustrations, sources
in the footer. Palette follows the 21st.dev pattern — neutral paper with a
single strong accent (red) and navy.

## Entry

- Competition: `news-image-20261117` (make.fun) — "Sum up 17 November's
  world news in one image". Entry $0, deadline 19 Nov 2026 07:00 WIB.
- License: MIT. Claim file `.makefun/owner.json` names the bounty wallet.

Entered on [make.fun](https://make.fun/?ref=e0ar5hn0).
