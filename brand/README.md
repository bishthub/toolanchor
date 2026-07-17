# ToolAnchor brand assets

The white anchor mark on an indigo→purple gradient. Same mark as the site favicon
(`app/icon.svg`) and iOS icon, productionized into files for directory listings, social
profiles, and press.

## Files

- `toolanchor-icon.svg` — master square icon (source of truth)
- `toolanchor-icon-{64,128,240,256,512,1024}.png` — square icon, transparent-free (has its own rounded gradient tile)
- `toolanchor-lockup.svg` / `-light.png` / `-light@2x.png` — icon + wordmark, dark text for light backgrounds
- `toolanchor-lockup-dark.svg` / `-dark@2x.png` — icon + wordmark, white text for dark backgrounds
- `toolanchor-cover.svg` / `-1200x630.png` / `-1270x760.png` — cover / OG banner

## Screenshots & demo

- `screenshots/*.png` — retina (2560×1600) captures of the live site, dark mode
- `toolanchor-demo.mp4` / `toolanchor-demo.gif` — ~6s walkthrough (homepage → QR generator rendering live)

Regenerate by re-running the capture scripts (they drive headless Chrome against the live
site). See the session scratchpad `shots.js` / `demo.js` if you need to tweak pages or timing.

## Colors

- Gradient: `#5b6dff` → `#b59bff` (indigo → lavender)
- Wordmark accent: `#5b6dff`
- Ink (light bg): `#0f1115`

## Regenerating PNGs

Requires `rsvg-convert` (`brew install librsvg`). Example:

```bash
rsvg-convert -w 512 -h 512 toolanchor-icon.svg -o toolanchor-icon-512.png
rsvg-convert -w 1200 -h 630 toolanchor-cover.svg -o toolanchor-cover-1200x630.png
```

Wordmark renders in Helvetica Neue (the SVG falls back through Inter → Helvetica Neue →
Arial). Install Inter for a slightly tighter look, or convert the text to paths if you need
pixel-identical rendering on machines without it.
