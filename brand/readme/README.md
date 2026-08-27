# README assets

Two clips cut from `media/launch/cairnkit-loop`, for the top of the package
pages on npm.

| File              | Source          | Shows                                                           |
| ----------------- | --------------- | --------------------------------------------------------------- |
| `check-fails.gif` | loop, 20s–26s   | A rename, the type error it causes, `cairnkit check` exiting 1  |
| `tour.gif`        | loop, 33s–39.5s | All three steps of a tour, including the route change at step 3 |

Referenced from the READMEs by absolute `raw.githubusercontent.com` URL, not by
relative path. Relative paths resolve against the repository root on GitHub and
against nothing at all on npm, and every one of these files is read on npm
first.

They live under `brand/` and not under `media/`, which is where they were cut
from: `media/` is gitignored in full, so a GIF placed beside its source film
never reaches GitHub and every README that pointed at it would render a broken
image on npm forever. `brand/` is tracked and already holds the published
assets.

They ship in no package either: `files` in each `package.json` is
`["dist", "README.md"]`, so nothing in this directory enters a tarball and the
published sizes stay what the badges claim.

Regenerating, after re-rendering the loop:

```bash
V=media/launch/cairnkit-loop/renders/cairnkit-loop_2026mp4.mp4
ffmpeg -ss 20 -t 6 -i $V \
  -vf "fps=12,scale=720:-1:flags=lanczos,palettegen=max_colors=128:stats_mode=diff" -y /tmp/pal.png
ffmpeg -ss 20 -t 6 -i $V -i /tmp/pal.png \
  -lavfi "fps=12,scale=720:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
  -y brand/readme/check-fails.gif
```

`stats_mode=diff` and `diff_mode=rectangle` are what keep these at ~150 kb
rather than the 2–4 MB a naive `fps,scale` GIF of the same clip produces: the
source is flat UI on a static background, so only the changed rectangle of each
frame needs new palette entries.
