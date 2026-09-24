# `components/header-scene.tsx` — annotated walkthrough

The full-screen WebGL header. It renders the name and tagline as **textured
geometry** rather than DOM text, floats a field of shapes and dust behind them,
and warps the letters around the cursor.

Stack: [`three`](https://threejs.org) + [`@react-three/fiber`](https://r3f.docs.pmnd.rs)
(React renderer for three.js). No `drei` helpers are used in this file.

---

## 1. The layer stack

Everything sits in one perspective camera at `z = 5`, `fov: 45`. Depth does the
compositing — there is no manual render ordering.

| Layer | z range | What it is |
|---|---|---|
| `<Backdrop>` | — | Scene background texture (a radial wash, not geometry) |
| `<Dust>` | `-34 … -3` | 700 additive points, slow drift |
| `<Clutter>` | `-22 … -1` | 78 lit meshes, spin + bob + parallax |
| `<HeroText>` | `0` | Two textured planes, warped in a fragment shader |

`<fog args={[background, 16, 36]} />` fades anything past ~16 units into the
page background, so the far end of the clutter field dissolves instead of
ending at a visible edge.

The whole thing is `aria-hidden="true"` — [app/page.tsx:27](../app/page.tsx#L27)
carries an `sr-only` `<h1>`/`<p>` with the same words, because a canvas is
invisible to screen readers and crawlers.

---

## 2. Text is a bitmap, not a mesh

The single most important idea in this file: **the name is drawn to a 2D canvas
with `fillText`, uploaded as a texture, and pasted onto a plane.**

Why not `troika-three-text` or extruded geometry?

- The site already loads Meutas as a webfont — reusing it costs zero extra bytes.
- A texture is trivially cheap to warp per-pixel in a fragment shader.
- Two triangles of geometry, whatever the text.

### `drawNameCanvas()` — [header-scene.tsx:212](../components/header-scene.tsx#L212)

Four subtleties, all of them load-bearing:

**a. Measure with the font already set.**

```ts
ctx.font = font;                    // before measureText, not after
const metrics = ctx.measureText(text);
```

A fresh 2D context defaults to `10px sans-serif`. Measuring first would size the
bitmap for the wrong font entirely.

**b. Use *ink* extents, not the advance width.**

```ts
const inkLeft   = metrics.actualBoundingBoxLeft;
const inkWidth  = inkLeft + metrics.actualBoundingBoxRight;
const inkHeight = ascent + descent;
```

`metrics.width` is the advance width — where the *next* glyph would start. Real
letterforms overhang it (italic tails, the left sidebearing of a `T`). The
`actualBoundingBox*` family gives the true painted rectangle, which is what has
to fit in the bitmap and what the layout later aligns against.

**c. Assigning `width`/`height` resets the context.**

```ts
el.width  = Math.ceil(inkWidth  + padding * 2);
el.height = Math.ceil(inkHeight + padding * 2);

ctx.font = font;                    // ...so set everything again
ctx.textAlign = "left";
ctx.textBaseline = "alphabetic";
```

This is a genuine canvas API footgun. Resizing a canvas — even to the same
value — wipes every context property back to its default.

**d. The pen offset makes the padding exact.**

```ts
ctx.fillText(text, padding + inkLeft, padding + ascent);
```

`fillText`'s x is the origin of the advance, and its y is the *baseline*.
Adding `inkLeft` and `ascent` lands the ink's top-left corner precisely at
`(padding, padding)` — which is what makes the returned ratios trustworthy:

```ts
insetX: padding / el.width,           // where the ink starts, as a fraction
insetY: padding / el.height,
inkHeightRatio: inkHeight / el.height,
```

### The gradient fill

```ts
const tinted = new Color(color).lerp(new Color(ACCENT), tintStrength);
gradient.addColorStop(0, color);             // foreground at the cap height
gradient.addColorStop(1, tinted.getStyle()); // accent-shifted at the baseline
```

Opaque top to bottom — this shifts **hue**, not alpha. Pulling the bottom of the
letters toward `ACCENT` (`#8b7fd4`) is what stops the name reading as a flat
white sticker sitting on top of an unrelated 3D scene. The name and the point
light behind it share one colour.

The subtitle uses a stronger tint (`0.6` vs `0.42`) and weight 300 instead of
700, so it recedes.

---

## 3. Laying the two lines out — [header-scene.tsx:695](../components/header-scene.tsx#L695)

Each bitmap has transparent padding around its ink, and — because the padding is
a constant number of texture pixels but the bitmaps are different sizes — that
padding is a **different fraction** of each bitmap. Positioning the planes by
their edges would leave the two lines visibly misaligned.

So the layout works in ink space:

```ts
const left = -viewport.width / 2 + viewport.width * MARGIN_X;
const top  =  viewport.height / 2 - viewport.height * MARGIN_Y;

const width  = viewport.width * LINES[i].fillRatio;   // 0.60 / 0.42
const height = width / bitmap.aspect;                 // aspect preserved

inkOffsetX = bitmap.insetX * width;       // the padding, in world units
inkOffsetY = bitmap.insetY * height;
inkHeight  = bitmap.inkHeightRatio * height;
```

Then the vertical stack is a prefix sum over the ink heights:

```ts
const above = sizes.slice(0, i)
  .reduce((sum, previous) => sum + previous.inkHeight + LINE_GAP, 0);

const position = [
  left - inkOffsetX + width / 2,         // plane pos is its centre...
  top - above - inkOffsetY - height / 2, // ...hence the half-size terms
];
```

`viewport` comes from `useThree`, so a window resize re-renders `HeroText` and
the whole layout recomputes. The **textures are not rebuilt on resize** — they're
authored at `FONT_SIZE = 256` px, which leaves plenty of headroom to scale up.

---

## 4. The warp shader — [header-scene.tsx:109](../components/header-scene.tsx#L109)

The vertex shader is a pass-through: it forwards `uv` and does the standard
`projectionMatrix * modelViewMatrix * position`. **All the distortion is
per-pixel**, which is why `planeGeometry` needs no subdivision.

### Circular, not elliptical

```glsl
vec2 p = vec2(vUv.x     * uAspect, vUv.y);
vec2 c = vec2(uCursor.x * uAspect, uCursor.y);
```

UV space is `0..1` on both axes, but the name's plane is roughly 8x wider than it
is tall. Without scaling x by the aspect ratio, a "radius" of `0.1` would trace a
long thin ellipse.

### Falloff

```glsl
float falloff = smoothstep(uRadius, 0.0, d);
```

The edges are **reversed** (`edge0 > edge1`), so this reads `1.0` at the cursor
easing to `0.0` at `uRadius`. Beyond the radius the pixel is untouched.

`uRadius` is set per-line:

```ts
uRadius: { value: WARP_RADIUS / height }
```

`WARP_RADIUS` is in world units; dividing by the plane's world height converts it
into that plane's UV units. This is why the effect covers the **same amount of
screen** on the tall name and the short subtitle, instead of scaling with each
plane's geometry.

### Displacement

```glsl
float ripple = sin(d * 28.0 - uTime * 4.0);
float amount = uAmplitude * uStrength * falloff * (0.8 + 0.2 * ripple);

vec2 offset = vec2(dir.x / uAspect, dir.y) * amount;
vec4 tex = texture2D(uMap, vUv - offset);
```

- `dir` is deliberately **left unnormalised**. Displacement therefore falls to
  exactly zero at the cursor centre, and there is no `d == 0` divide to guard.
- `dir.x / uAspect` undoes the aspect correction, converting back to raw UV.
- `vUv - offset` samples *toward* the cursor and paints it further out — a bulge,
  like a magnifying glass, pushing the letters outward.
- The ripple factor stays in `[0.6, 1.0]`, so the wobble modulates the strength of
  the bulge and never inverts it.

### Iridescence (currently off)

```glsl
vec3 sheen = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + d * 2.6 - uTime * 0.25));
vec3 color = mix(tex.rgb, sheen, falloff * uStrength * uIridescence);
```

A cosine palette — three cosines phase-offset by a third each, sweeping a smooth
spectrum for almost no instructions. `IRIDESCENCE = 0` disables it; try
`0.2`–`0.4` for a subtle oil-slick sheen near the cursor.

`#include <colorspace_fragment>` is a three.js shader chunk. Because the texture
is tagged `SRGBColorSpace`, `texture2D` hands back linear values; this chunk
converts the result into the renderer's output colour space. Omitting it produces
a visibly washed-out name.

---

## 5. Cursor tracking — [header-scene.tsx:572](../components/header-scene.tsx#L572)

```ts
const worldX = (state.pointer.x * state.viewport.width) / 2;
const worldY = (state.pointer.y * state.viewport.height) / 2;

cursor.x = damp(cursor.x, (worldX - position[0]) / width  + 0.5, CURSOR_DAMPING, delta);
cursor.y = damp(cursor.y, (worldY - position[1]) / height + 0.5, CURSOR_DAMPING, delta);
```

Three coordinate systems in four lines:

1. `state.pointer` is **NDC** — `-1..1` across the canvas.
2. Multiplying by `viewport` (world units visible at `z = 0`, half each way)
   gives **world** coordinates.
3. Subtracting the plane's own offset, dividing by its size and adding `0.5` maps
   into that plane's **UV** space.

Step 3 is why each plane needs its own uniform: the two sit at different offsets,
so a single shared cursor value would land the warp in the wrong place on one of
them. Off-plane cursor positions are fine — they produce UVs outside `0..1`, and
the falloff simply yields `0`.

### Damping, not lerping

```ts
MathUtils.damp(current, target, lambda, delta)
```

Exponential smoothing that accounts for `delta`, so the feel is identical at
60 Hz and 144 Hz. A plain `lerp(a, b, 0.1)` per frame would move twice as fast on
a 120 Hz display. Two independent rates:

- `CURSOR_DAMPING = 8` — how quickly the warp centre chases the pointer.
- `STRENGTH_DAMPING = 5` — how quickly `uStrength` fades `0 → 1` on pointer enter
  and back on leave. This is what makes the effect *arrive* rather than snap on.

---

## 6. `Clutter` — the floating shapes

### Deterministic layout

```ts
const random = mulberry32(20260823);
```

`mulberry32` is a seeded PRNG, so the arrangement is **byte-identical on every
load and on every machine**. That matters twice over: the composition can be
hand-tuned against the text, and server and client agree.

### The keep-out zone

The hard part is keeping shapes out of the name. Doing it in world units is
wrong — a shape at `z = -2` and one at `z = -22` cover wildly different amounts of
screen for the same world size. So the test divides by distance from camera:

```ts
const distance = CAMERA_Z - z;
const radius   = (scale * 1.25) / distance;   // 1.25 pads the bounding sphere

const driftX = 1.15 / distance;   // parallax + bob headroom
const driftY = 1.3  / distance;

if (Math.abs(x / distance - CLEAR_CENTER[0]) < CLEAR_HALF[0] + radius + driftX &&
    Math.abs(y / distance - CLEAR_CENTER[1]) < CLEAR_HALF[1] + radius + driftY) {
  continue;                        // reject and resample
}
```

`x / distance` is a small-angle proxy for screen position. The `drift` terms
matter: shapes **move** after they spawn (cursor parallax, vertical bob), so a
zone padded only by the bounding radius would let them wander into the letters at
runtime.

It is rejection sampling inside a `while` loop — rejected candidates are thrown
away and a fresh one drawn, so the final count is always exactly `CLUTTER_COUNT`.

### Distant shapes run larger

```ts
const depth = MathUtils.mapLinear(z, -22, -1, 0.25, 1);
const scale = MathUtils.lerp(0.35, 1.5, random()) * MathUtils.lerp(1.6, 0.7, depth);
```

This partially cancels perspective foreshortening. Without it the far field is a
haze of specks and the depth reads as noise rather than as space.

### Per-frame work

```ts
useFrame((state, delta) => {
  group.position.x = damp(group.position.x, -state.pointer.x * 1.1, 2.5, delta);
  // ...
  for (let i = 0; i < meshRefs.current.length; i++) {
    mesh.rotation.x += delta * item.spin[0];
    mesh.position.y = item.position[1] + Math.sin(time * 0.5 + item.phase) * item.bob;
  }
});
```

The group drifts **against** the cursor (note the minus), which is what sells the
parallax, and it reuses the same input as the text warp so the whole header feels
like one object. Each mesh carries its own `phase`, so the bob never syncs up
into a visible wave.

Every mutation here writes straight to the three.js object through a ref. **No
React state is touched in the frame loop** — 78 meshes at 60 fps through
`setState` would be a reconciliation disaster.

---

## 7. `Dust`

700 points in a single `bufferGeometry`, so one draw call.

```tsx
<pointsMaterial
  size={0.06} sizeAttenuation color={ACCENT}
  transparent opacity={0.7}
  blending={AdditiveBlending}
  depthWrite={false}
/>
```

- `sizeAttenuation` — distant motes shrink, reinforcing depth.
- `AdditiveBlending` — motes *add* light rather than occluding.
- `depthWrite={false}` — pairs with the above. If they wrote depth, a near mote
  would punch a hole in whatever sits behind it despite being translucent.

It drifts at damping `2` against the clutter's `2.5`, and at a smaller amplitude
(`0.4 / 0.25` vs `1.1 / 0.7`), which gives the field a second, slower parallax
layer.

---

## 8. Lighting and background

```tsx
<ambientLight intensity={0.75} />
<directionalLight position={[5, 6, 8]}   intensity={2.4} />                 // key
<directionalLight position={[-7, -3, 2]} intensity={1.1} color="#9b8cf0" /> // cool fill
<pointLight position={[-2, 1.5, 1.5]} intensity={18} distance={16} color={ACCENT} />
```

A standard three-point-ish setup. The `pointLight` sits just behind the name, so
shapes near the letters catch the same violet the letters are tinted with —
another thread stitching the text into the scene. Its `distance={16}` limits the
falloff so it doesn't wash out the whole field.

`makeBackdrop()` paints a 512×512 radial gradient — the background colour lerped
22% toward the accent at its centre, positioned at `(190, 150)`, up and to the
left, behind the name — and attaches it as the scene background:

```tsx
<primitive attach="background" object={texture} />
```

`attach="background"` is the R3F escape hatch for assigning to a property that
isn't a child node. The texture is disposed on unmount.

---

## 9. Theme and reduced motion

```ts
function useThemeColors() {
  const read = () => {
    const style = getComputedStyle(document.body);
    setColors({ foreground: style.color, background: style.backgroundColor });
  };
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", read);
}
```

Rather than duplicating the palette in JS, this reads the **computed** `body`
colours — so `--foreground` / `--background` in
[app/globals.css:3](../app/globals.css#L3) stay the single source of truth. A
`change` on the colour-scheme query re-reads them, and because `color` is a
dependency of the texture effect, the name's bitmap is regenerated and the old
one disposed.

> **Note:** this listens to the **media query only**. The site's theme is
> currently media-query driven, so that is complete today — but if a manual
> light/dark toggle is ever added, this hook will also need a `MutationObserver`
> on the toggled attribute, or the 3D name will keep the old colour.

`useReducedMotion` gates the *decorative* motion:

| Under `prefers-reduced-motion: reduce` | |
|---|---|
| Shape spin, bob, dust rotation | **off** |
| Text warp (`uStrength` target) | **0** |
| Cursor parallax on clutter and dust | still active |

The parallax survives because the `if (reducedMotion) return` sits *after* the
`damp` calls. That is defensible — it is direct response to input rather than
ambient animation — but it is a deliberate line worth being aware of.

---

## 10. Resource lifecycle

GPU memory is not garbage collected, so both texture owners clean up explicitly:

```ts
// HeroText
return () => {
  cancelled = true;
  created.forEach((texture) => texture.dispose());
};

// Backdrop
useEffect(() => () => texture?.dispose(), [texture]);
```

The `cancelled` flag guards the async gap: `document.fonts.ready` is a promise,
and the component can unmount before it settles.

That await is essential rather than defensive — webfonts load asynchronously, and
drawing before `fonts.ready` would silently bake the **fallback** font into the
texture. The bug would only ever show up on a cold cache.

`uniforms` is built inside `useMemo(..., [bitmap, height])`, so the uniform
objects survive re-renders. Rebuilding them per frame would force three.js to
re-upload and recompile.

---

## 11. Tuning reference

| Constant | Line | Effect |
|---|---|---|
| `FONT_SIZE` | 24 | Texture resolution. Higher is crisper, at the cost of VRAM |
| `FILL_RATIO` / `SUBTITLE_FILL_RATIO` | 30 / 33 | Fraction of viewport width each line spans |
| `LINE_GAP` | 36 | Vertical gap between lines, world units |
| `MARGIN_X` / `MARGIN_Y` | 39 / 40 | Inset from the top-left, as a viewport fraction |
| `CLEAR_CENTER` / `CLEAR_HALF` | 48 / 49 | Keep-out box, **screen** units. Re-tune when the text layout moves |
| `WARP_RADIUS` | 56 | Reach of the bulge, world units |
| `AMPLITUDE` | 59 | Peak displacement |
| `IRIDESCENCE` | 62 | Colour shimmer. `0` = off; try `0.25` |
| `CURSOR_DAMPING` | 65 | Higher = snappier cursor follow |
| `STRENGTH_DAMPING` | 68 | Higher = faster fade in/out on enter and leave |
| `CLUTTER_COUNT` | 71 | Lit meshes — the main draw-call cost |
| `DUST_COUNT` | 74 | Points. One draw call regardless |
| `TINT_STRENGTH` | 83 | How far the name shifts toward `ACCENT` |
| `ACCENT` | 80 | Must be kept in sync with `--accent` in `globals.css` |

---

## 12. Gotchas worth remembering

1. **`CLEAR_CENTER` / `CLEAR_HALF` are hand-tuned to the current text layout.**
   They are not derived from `MARGIN_*` or `FILL_RATIO`. Change the margins, the
   fill ratios, or the wording, and shapes will start colliding with the letters
   until these are re-tuned.
2. **`ACCENT` is duplicated** here and as `--accent` in `globals.css`. The CSS
   carries a comment saying so; nothing enforces the pairing.
3. **Reversed-edge `smoothstep`** (`smoothstep(uRadius, 0.0, d)`) is undefined per
   the GLSL spec when `edge0 >= edge1`. Every real driver computes the obvious
   clamped ramp and it works fine, but `1.0 - smoothstep(0.0, uRadius, d)` is the
   spec-clean spelling if it ever misbehaves.
4. **`CLUTTER_COUNT` is 78 individual draw calls.** If mobile frame rate ever
   becomes a concern, that is the first number to cut — or convert to instanced
   meshes grouped by geometry.
5. **`sheen` is computed even when `IRIDESCENCE` is `0`.** Negligible, but it is
   dead math in the current configuration.
6. **The bitmaps are not regenerated on resize** — only the plane sizes change.
   Extreme upscaling on a very large display would soften the name; raise
   `FONT_SIZE` if that ever shows.
