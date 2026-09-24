"use client";

import { meutas } from "@/app/fonts";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  Group,
  MathUtils,
  Mesh,
  Points,
  SRGBColorSpace,
  ShaderMaterial,
  Vector2,
} from "three";

const NAME = "Rey Cezar Tigley";

const SUBTITLE = "Shaping websites, apps, and the systems behind them";

/** Font size in *texture* pixels. Bigger = crisper, at the cost of VRAM. */
const FONT_SIZE = 256;

/** Meutas Bold. Must be a weight registered in app/fonts.ts. */
const FONT_WEIGHT = 700;

/** Fraction of the visible width the name should span. */
const FILL_RATIO = 0.6;

/** Same, for the subtitle. Smaller so it reads as secondary. */
const SUBTITLE_FILL_RATIO = 0.42;

/** Vertical space between the two lines, in world units. */
const LINE_GAP = 0.2;

/** Inset from the top-left corner, as a fraction of the viewport. */
const MARGIN_X = 0.04;
const MARGIN_Y = 0.12;

/**
 * The name's keep-out zone, measured in *screen* terms (world units divided
 * by distance from camera) rather than world units - otherwise a shape close
 * to the camera and one far away get judged by the same yardstick despite
 * covering wildly different amounts of screen.
 */
const CLEAR_CENTER: [number, number] = [-0.08, 0.21];
const CLEAR_HALF: [number, number] = [0.52, 0.17];

/**
 * Warp reach in *world* units. Each line converts this into its own UV space,
 * so the effect covers the same amount of screen on the tall name and the
 * short subtitle rather than scaling with each plane's height.
 */
const WARP_RADIUS = 0.3;

/** How far UVs get pulled at the peak. Small on purpose. */
const AMPLITUDE = 0.35;

/** Strength of the colour shimmer that follows the cursor. 0 disables it. */
const IRIDESCENCE = 0;

/** Higher = snappier cursor follow. */
const CURSOR_DAMPING = 8;

/** Higher = faster fade in/out when the pointer enters or leaves. */
const STRENGTH_DAMPING = 5;

/** How many floating shapes fill the space behind the name. */
const CLUTTER_COUNT = 78;

/** Far-off motes that give the empty regions some texture. */
const DUST_COUNT = 700;

/** Muted palette - reads as designed rather than as a colour test. */
const PALETTE = ["#8b7fd4", "#e0a458", "#6fb3a8", "#9aa4b8", "#c98b9b"];

/** Lead colour of the scene. The name is tinted toward it to tie them together. */
const ACCENT = "#8b7fd4";

/** How far the name's colour shifts toward ACCENT along its baseline. */
const TINT_STRENGTH = 0.42;

/** Camera sits here, so distance from camera is CAMERA_Z - z. */
const CAMERA_Z = 5;

const SHAPES = [
  "sphere",
  "box",
  "torus",
  "icosahedron",
  "octahedron",
  "capsule",
  "torusKnot",
] as const;

type Shape = (typeof SHAPES)[number];

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2  uCursor;       // cursor in UV space (0..1)
  uniform float uAspect;       // plane width / height
  uniform float uRadius;       // reach of the effect
  uniform float uAmplitude;    // peak displacement
  uniform float uIridescence;  // colour shimmer amount
  uniform float uStrength;     // 0..1 master fade
  uniform float uTime;

  varying vec2 vUv;

  void main() {
    // UV space is 0..1 on both axes, but the plane is much wider than it is
    // tall, so scale x by the aspect ratio. Without this the "radius" would
    // be an ellipse instead of a circle.
    vec2 p   = vec2(vUv.x     * uAspect, vUv.y);
    vec2 c   = vec2(uCursor.x * uAspect, uCursor.y);
    vec2 dir = p - c;
    float d  = length(dir);

    // 1.0 at the cursor, easing to 0.0 at uRadius. Nothing beyond is touched.
    float falloff = smoothstep(uRadius, 0.0, d);

    // Gentle liquid wobble, windowed by the same falloff.
    float ripple = sin(d * 28.0 - uTime * 4.0);

    float amount = uAmplitude * uStrength * falloff * (0.8 + 0.2 * ripple);

    // dir is unnormalised, so displacement fades to zero at the exact centre
    // and there is no divide-by-zero to guard against.
    vec2 offset = vec2(dir.x / uAspect, dir.y) * amount;

    vec4 tex = texture2D(uMap, vUv - offset);

    // Cosine palette - a cheap way to get a smooth spectrum. Localised by the
    // same falloff, so the letters only pick up colour near the cursor.
    vec3 sheen = 0.5 + 0.5 * cos(
      6.28318 * (vec3(0.0, 0.33, 0.67) + d * 2.6 - uTime * 0.25)
    );

    vec3 color = mix(tex.rgb, sheen, falloff * uStrength * uIridescence);

    gl_FragColor = vec4(color, tex.a);

    #include <colorspace_fragment>
  }
`;

/** Deterministic PRNG, so the layout is identical on every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Reads the live CSS colours so the scene follows light/dark mode. */
function useThemeColors() {
  const [colors, setColors] = useState({
    foreground: "#171717",
    background: "#ffffff",
  });

  useEffect(() => {
    const read = () => {
      const style = getComputedStyle(document.body);
      setColors({
        foreground: style.color,
        background: style.backgroundColor,
      });
    };
    read();

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  return colors;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

/**
 * Draws `text` onto an offscreen 2D canvas and returns it.
 * Plain DOM work - no React, no Three.js.
 */
function drawNameCanvas(
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: number,
  color: string,
  tintStrength: number,
) {
  const el = document.createElement("canvas");
  const ctx = el.getContext("2d");
  if (!ctx) return null;

  const font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const padding = fontSize * 0.2;

  // Set the font *before* measuring, or we'd measure 10px sans-serif.
  ctx.font = font;
  const metrics = ctx.measureText(text);

  const ascent = metrics.actualBoundingBoxAscent;
  const descent = metrics.actualBoundingBoxDescent;

  // True ink extent, which is not the same as the advance width - glyphs can
  // overhang their advance on either side.
  const inkLeft = metrics.actualBoundingBoxLeft;
  const inkWidth = inkLeft + metrics.actualBoundingBoxRight;
  const inkHeight = ascent + descent;

  // Assigning width/height resets the whole 2D context to defaults.
  el.width = Math.ceil(inkWidth + padding * 2);
  el.height = Math.ceil(inkHeight + padding * 2);

  // ...so every context property has to be set again, font included.
  ctx.font = font;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Fully opaque throughout - this shifts hue, not alpha. Sliding the letters
  // toward the scene's accent colour is what stops the name reading as a flat
  // white sticker pasted over the 3D.
  const tinted = new Color(color).lerp(new Color(ACCENT), tintStrength);
  const gradient = ctx.createLinearGradient(0, padding, 0, padding + inkHeight);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, tinted.getStyle());
  ctx.fillStyle = gradient;

  // Offsetting the pen by inkLeft/ascent lands the ink's top-left corner at
  // exactly (padding, padding), which is what makes the ratios below exact.
  ctx.fillText(text, padding + inkLeft, padding + ascent);

  return {
    canvas: el,
    // Where the ink sits inside the bitmap, as fractions. Layout uses these to
    // align lines by their letterforms rather than by their canvas edges.
    insetX: padding / el.width,
    insetY: padding / el.height,
    inkHeightRatio: inkHeight / el.height,
  };
}

/**
 * A radial wash used as the scene background, brightest behind the name.
 * Flat black reads as "nothing here"; a gradient reads as depth and light.
 */
function makeBackdrop(background: string, accent: string) {
  const el = document.createElement("canvas");
  el.width = 512;
  el.height = 512;

  const ctx = el.getContext("2d");
  if (!ctx) return null;

  const base = new Color(background);
  const glow = base.clone().lerp(new Color(accent), 0.22);

  // Centred on the name, up and to the left.
  const gradient = ctx.createRadialGradient(190, 150, 0, 190, 150, 620);
  gradient.addColorStop(0, glow.getStyle());
  gradient.addColorStop(0.45, base.clone().lerp(glow, 0.35).getStyle());
  gradient.addColorStop(1, base.getStyle());

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, el.width, el.height);

  const texture = new CanvasTexture(el);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function Backdrop({ background }: { background: string }) {
  const texture = useMemo(() => makeBackdrop(background, ACCENT), [background]);

  useEffect(() => () => texture?.dispose(), [texture]);

  if (!texture) return null;
  return <primitive attach="background" object={texture} />;
}

/**
 * Slow-drifting motes. A cheap depth cue that keeps the empty regions from
 * reading as dead space.
 */
function Dust({ reducedMotion }: { reducedMotion: boolean }) {
  const pointsRef = useRef<Points>(null);

  const positions = useMemo(() => {
    const random = mulberry32(77);
    const array = new Float32Array(DUST_COUNT * 3);

    for (let i = 0; i < DUST_COUNT; i++) {
      array[i * 3] = MathUtils.lerp(-24, 24, random());
      array[i * 3 + 1] = MathUtils.lerp(-15, 15, random());
      array[i * 3 + 2] = MathUtils.lerp(-34, -3, random());
    }

    return array;
  }, []);

  useFrame((state, delta) => {
    const points = pointsRef.current;
    if (!points) return;

    // Drifts slower than the clutter, giving the field a second depth layer.
    points.position.x = MathUtils.damp(
      points.position.x,
      -state.pointer.x * 0.4,
      2,
      delta,
    );
    points.position.y = MathUtils.damp(
      points.position.y,
      -state.pointer.y * 0.25,
      2,
      delta,
    );

    if (!reducedMotion) points.rotation.z += delta * 0.01;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        sizeAttenuation
        color={ACCENT}
        transparent
        opacity={0.7}
        // Motes should add light, never punch holes in what is behind them.
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

type ClutterItem = {
  shape: Shape;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  spin: [number, number];
  phase: number;
  bob: number;
  roughness: number;
  metalness: number;
};

function buildClutter(count: number): ClutterItem[] {
  const random = mulberry32(20260823);
  const items: ClutterItem[] = [];

  while (items.length < count) {
    const z = -22 + random() * 21;
    const depth = MathUtils.mapLinear(z, -22, -1, 0.25, 1);
    const x = MathUtils.lerp(-20, 20, random());
    const y = MathUtils.lerp(-12, 12, random());

    // Distant shapes run larger so they don't shrink into specks.
    const scale =
      MathUtils.lerp(0.35, 1.5, random()) * MathUtils.lerp(1.6, 0.7, depth);

    // Judge the keep-out in screen terms, not world units.
    const distance = CAMERA_Z - z;
    const radius = (scale * 1.25) / distance;

    // Shapes drift after they spawn - cursor parallax plus the bob - so pad
    // the zone by the most they can travel. Without this they spawn clear and
    // then wander into the letters at runtime.
    const driftX = 1.15 / distance;
    const driftY = 1.3 / distance;

    if (
      Math.abs(x / distance - CLEAR_CENTER[0]) <
        CLEAR_HALF[0] + radius + driftX &&
      Math.abs(y / distance - CLEAR_CENTER[1]) < CLEAR_HALF[1] + radius + driftY
    ) {
      continue;
    }

    items.push({
      shape: SHAPES[Math.floor(random() * SHAPES.length)],
      position: [x, y, z],
      rotation: [random() * Math.PI, random() * Math.PI, random() * Math.PI],
      scale,
      color: PALETTE[Math.floor(random() * PALETTE.length)],
      spin: [(random() - 0.5) * 0.35, (random() - 0.5) * 0.35],
      phase: random() * Math.PI * 2,
      bob: 0.15 + random() * 0.4,
      roughness: 0.2 + random() * 0.5,
      metalness: random() < 0.3 ? 0.7 : 0.05,
    });
  }

  return items;
}

function ShapeGeometry({ shape }: { shape: Shape }) {
  switch (shape) {
    case "box":
      return <boxGeometry args={[1, 1, 1]} />;
    case "torus":
      return <torusGeometry args={[0.6, 0.25, 16, 48]} />;
    case "icosahedron":
      return <icosahedronGeometry args={[0.75, 0]} />;
    case "octahedron":
      return <octahedronGeometry args={[0.8, 0]} />;
    case "capsule":
      return <capsuleGeometry args={[0.35, 0.7, 8, 20]} />;
    case "torusKnot":
      return <torusKnotGeometry args={[0.5, 0.18, 90, 14]} />;
    default:
      return <sphereGeometry args={[0.7, 32, 32]} />;
  }
}

function Clutter({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<Group>(null);
  const meshRefs = useRef<(Mesh | null)[]>([]);
  const items = useMemo(() => buildClutter(CLUTTER_COUNT), []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Parallax: the field drifts against the cursor, which sells the depth
    // and ties the background to the same input as the text warp.
    group.position.x = MathUtils.damp(
      group.position.x,
      -state.pointer.x * 1.1,
      2.5,
      delta,
    );
    group.position.y = MathUtils.damp(
      group.position.y,
      -state.pointer.y * 0.7,
      2.5,
      delta,
    );
    group.rotation.y = MathUtils.damp(
      group.rotation.y,
      state.pointer.x * 0.08,
      2.5,
      delta,
    );

    if (reducedMotion) return;

    const time = state.clock.elapsedTime;
    for (let i = 0; i < meshRefs.current.length; i++) {
      const mesh = meshRefs.current[i];
      const item = items[i];
      if (!mesh || !item) continue;

      mesh.rotation.x += delta * item.spin[0];
      mesh.rotation.y += delta * item.spin[1];
      mesh.position.y =
        item.position[1] + Math.sin(time * 0.5 + item.phase) * item.bob;
    }
  });

  return (
    <group ref={groupRef}>
      {items.map((item, i) => (
        <mesh
          key={i}
          ref={(node) => {
            meshRefs.current[i] = node;
          }}
          position={item.position}
          rotation={item.rotation}
          scale={item.scale}
        >
          <ShapeGeometry shape={item.shape} />
          <meshStandardMaterial
            color={item.color}
            roughness={item.roughness}
            metalness={item.metalness}
          />
        </mesh>
      ))}
    </group>
  );
}

type Line = {
  text: string;
  weight: number;
  fillRatio: number;
  tint: number;
};

const LINES: Line[] = [
  {
    text: NAME,
    weight: FONT_WEIGHT,
    fillRatio: FILL_RATIO,
    tint: TINT_STRENGTH,
  },
  { text: SUBTITLE, weight: 300, fillRatio: SUBTITLE_FILL_RATIO, tint: 0.6 },
];

/** One warped line of text. Owns its own material and cursor uniform. */
function WarpedLine({
  bitmap,
  width,
  height,
  position,
  active,
  reducedMotion,
}: {
  bitmap: { texture: CanvasTexture; aspect: number };
  width: number;
  height: number;
  position: [number, number];
  active: boolean;
  reducedMotion: boolean;
}) {
  const materialRef = useRef<ShaderMaterial>(null);

  // Rebuilt only when the texture changes, never per frame. uRadius is derived
  // from height so both lines get the same on-screen reach despite the
  // subtitle's plane being far shorter than the name's.
  const uniforms = useMemo(
    () => ({
      uMap: { value: bitmap.texture },
      uCursor: { value: new Vector2(0.5, 0.5) },
      uAspect: { value: bitmap.aspect },
      uRadius: { value: WARP_RADIUS / height },
      uAmplitude: { value: AMPLITUDE },
      uIridescence: { value: IRIDESCENCE },
      uStrength: { value: 0 },
      uTime: { value: 0 },
    }),
    [bitmap, height],
  );

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;

    // state.pointer is NDC (-1..1) across the canvas. Convert to world units
    // at z=0, then into this plane's 0..1 UV space. Works even when the
    // cursor is off the plane - the falloff handles that for us.
    const worldX = (state.pointer.x * state.viewport.width) / 2;
    const worldY = (state.pointer.y * state.viewport.height) / 2;

    // Each plane sits at its own offset, so subtract that before mapping into
    // local UV space - otherwise the warp lands away from the cursor.
    const cursor = material.uniforms.uCursor.value as Vector2;
    cursor.x = MathUtils.damp(
      cursor.x,
      (worldX - position[0]) / width + 0.5,
      CURSOR_DAMPING,
      delta,
    );
    cursor.y = MathUtils.damp(
      cursor.y,
      (worldY - position[1]) / height + 0.5,
      CURSOR_DAMPING,
      delta,
    );

    // Raw pointer input feels jittery; damping is what makes it feel alive.
    material.uniforms.uStrength.value = MathUtils.damp(
      material.uniforms.uStrength.value,
      active && !reducedMotion ? 1 : 0,
      STRENGTH_DAMPING,
      delta,
    );

    material.uniforms.uTime.value += delta;
  });

  return (
    <mesh position={[position[0], position[1], 0]}>
      {/* Warping happens per-pixel in the fragment shader, so the geometry
          needs no subdivision - two triangles is enough. */}
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
      />
    </mesh>
  );
}

type Bitmap = {
  texture: CanvasTexture;
  aspect: number;
  insetX: number;
  insetY: number;
  inkHeightRatio: number;
};

function HeroText({
  active,
  color,
  reducedMotion,
}: {
  active: boolean;
  color: string;
  reducedMotion: boolean;
}) {
  const gl = useThree((state) => state.gl);
  const viewport = useThree((state) => state.viewport);

  const [bitmaps, setBitmaps] = useState<Bitmap[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: CanvasTexture[] = [];

    // Fonts load async. Drawing early would silently bake the fallback font.
    document.fonts.ready.then(() => {
      if (cancelled) return;

      const built: Bitmap[] = [];

      for (const line of LINES) {
        const drawn = drawNameCanvas(
          line.text,
          meutas.style.fontFamily,
          FONT_SIZE,
          line.weight,
          color,
          line.tint,
        );
        if (!drawn) return;

        const texture = new CanvasTexture(drawn.canvas);
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = gl.capabilities.getMaxAnisotropy();
        texture.needsUpdate = true;

        built.push({
          texture,
          aspect: drawn.canvas.width / drawn.canvas.height,
          insetX: drawn.insetX,
          insetY: drawn.insetY,
          inkHeightRatio: drawn.inkHeightRatio,
        });
      }

      created = built.map((entry) => entry.texture);
      setBitmaps(built);
    });

    return () => {
      cancelled = true;
      // GPU memory isn't garbage collected - hand it back explicitly.
      created.forEach((texture) => texture.dispose());
    };
  }, [gl, color]);

  if (!bitmaps) return null;

  const left = -viewport.width / 2 + viewport.width * MARGIN_X;
  const top = viewport.height / 2 - viewport.height * MARGIN_Y;

  // Each plane carries transparent padding whose size, as a fraction of the
  // bitmap, differs per line. Measuring the ink inside each plane is what lets
  // the lines align to each other instead of to their canvas edges.
  const sizes = bitmaps.map((bitmap, i) => {
    const width = viewport.width * LINES[i].fillRatio;
    const height = width / bitmap.aspect;

    return {
      bitmap,
      width,
      height,
      inkOffsetX: bitmap.insetX * width,
      inkOffsetY: bitmap.insetY * height,
      inkHeight: bitmap.inkHeightRatio * height,
    };
  });

  const laidOut = sizes.map((size, i) => {
    // Ink stacked above this line. A prefix sum rather than a running total,
    // so the layout stays a pure expression.
    const above = sizes
      .slice(0, i)
      .reduce((sum, previous) => sum + previous.inkHeight + LINE_GAP, 0);

    // Shift the plane so its *ink* - not its bitmap - starts at the margin.
    const position: [number, number] = [
      left - size.inkOffsetX + size.width / 2,
      top - above - size.inkOffsetY - size.height / 2,
    ];

    return { ...size, position };
  });

  return (
    <>
      {laidOut.map((line, i) => (
        <WarpedLine
          key={i}
          bitmap={line.bitmap}
          width={line.width}
          height={line.height}
          position={line.position}
          active={active}
          reducedMotion={reducedMotion}
        />
      ))}
    </>
  );
}

export default function HeaderScene() {
  const [active, setActive] = useState(false);
  const { foreground, background } = useThemeColors();
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="absolute inset-0"
      aria-hidden="true"
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
    >
      <Canvas camera={{ position: [0, 0, CAMERA_Z], fov: 45 }} dpr={[1, 2]}>
        {/* A radial wash instead of flat colour. Fog still uses the page
            colour so distant shapes melt out rather than ending at an edge. */}
        <Backdrop background={background} />
        <fog attach="fog" args={[background, 16, 36]} />

        <ambientLight intensity={0.75} />
        <directionalLight position={[5, 6, 8]} intensity={2.4} />
        <directionalLight
          position={[-7, -3, 2]}
          intensity={1.1}
          color="#9b8cf0"
        />
        {/* Sits just behind the name, so shapes near it catch the same accent
            the letters are tinted with. */}
        <pointLight
          position={[-2, 1.5, 1.5]}
          intensity={18}
          distance={16}
          color={ACCENT}
        />

        <Dust reducedMotion={reducedMotion} />
        <Clutter reducedMotion={reducedMotion} />
        <HeroText
          active={active}
          color={foreground}
          reducedMotion={reducedMotion}
        />
      </Canvas>
    </div>
  );
}
