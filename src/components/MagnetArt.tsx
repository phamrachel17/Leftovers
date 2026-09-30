import { useId, type ReactNode } from 'react';

/**
 * Magnets drawn as materials rather than pictures: glazed ceramic, stitched felt,
 * frayed denim, jelly resin, halftone print, plastic buttons, printed paper, enamel.
 * SVG lighting and noise filters do the "tactile" work, so every magnet is original,
 * recolorable and crisp at any size.
 */

export type ArtShape = 'star' | 'flower' | 'fish' | 'citrus' | 'heart' | 'circle' | 'drop' | 'pear' | 'moon';
export type ArtMaterial = 'ceramic' | 'felt' | 'denim' | 'jelly' | 'glass' | 'halftone' | 'button' | 'spiral' | 'paper' | 'enamel';

export interface ArtSpec {
  shape: ArtShape;
  material: ArtMaterial;
  color: string;
  /** Secondary color: pattern ink, inner layer, citrus flesh… */
  color2?: string;
}

// ── Geometry (100×100 box; the fish uses 160×80) ─────────────────────────────

function starPath(cx = 50, cy = 50, outer = 44, inner = 21): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a) + 3).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}

function flowerPath(cx = 50, cy = 52, petals = 6, ring = 23, petal = 20): string {
  // Where neighbouring petal circles cross on the outside, measured from the center.
  const half = Math.PI / petals;
  const chordHalf = ring * Math.sin(half);
  const outer = ring * Math.cos(half) + Math.sqrt(petal * petal - chordHalf * chordHalf);
  const at = (a: number) => `${(cx + outer * Math.cos(a)).toFixed(2)} ${(cy + outer * Math.sin(a)).toFixed(2)}`;
  let d = `M${at(-Math.PI / 2 - half)}`;
  for (let i = 0; i < petals; i++) {
    const mid = -Math.PI / 2 + (i * 2 * Math.PI) / petals;
    d += ` A${petal} ${petal} 0 0 1 ${at(mid + half)}`;
  }
  return d + ' Z';
}

const HEART = 'M50 88 C 20 66, 6 48, 8 30 C 10 14, 28 6, 40 14 C 45 17, 48 21, 50 25 C 52 21, 55 17, 60 14 C 72 6, 90 14, 92 30 C 94 48, 80 66, 50 88 Z';

const DROP = 'M50 6 C 60 26, 82 44, 82 64 C 82 82, 67 94, 50 94 C 33 94, 18 82, 18 64 C 18 44, 40 26, 50 6 Z';
const PEAR =
  'M50 16 C 57 16, 60 25, 60 33 C 60 43, 77 50, 79 67 C 81 84, 67 95, 50 95 C 33 95, 19 84, 21 67 C 23 50, 40 43, 40 33 C 40 25, 43 16, 50 16 Z';
// A crescent: the outer circle's arc, back along a smaller, offset inner arc.
const MOON = 'M58 8 A42 42 0 1 0 93 64 A33 33 0 0 1 58 8 Z';

const FISH_BODY =
  'M6 42 C 16 24, 48 13, 88 17 C 106 19, 120 26, 130 35 L 150 18 C 146 32, 146 50, 153 64 L 130 47 C 120 56, 104 63, 86 65 C 50 69, 18 60, 6 42 Z';
const FISH_FINS = 'M62 17 C 70 6, 86 4, 98 8 L 92 19 Z M70 64 C 76 74, 86 77, 94 74 L 88 63 Z';

function spiralPath(cx: number, cy: number, turns: number, spacing: number): string {
  const pts: string[] = [];
  const steps = turns * 48;
  for (let i = 0; i <= steps; i++) {
    const t = (i / 48) * 2 * Math.PI;
    const r = (spacing * t) / (2 * Math.PI);
    pts.push(`${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join(' L')}`;
}

function outline(shape: ArtShape): string {
  switch (shape) {
    case 'star':
      return starPath();
    case 'flower':
      return flowerPath();
    case 'heart':
      return HEART;
    case 'citrus':
      return 'M4 50 a46 46 0 1 0 92 0 a46 46 0 1 0 -92 0 Z';
    case 'fish':
      return FISH_BODY;
    case 'circle':
      return 'M6 52 a44 44 0 1 0 88 0 a44 44 0 1 0 -88 0 Z';
    case 'drop':
      return DROP;
    case 'pear':
      return PEAR;
    case 'moon':
      return MOON;
  }
}

/** Same outline, shrunk around its center — for inner layers, stitching, button rims. */
function Inset({ shape, scale, children }: { shape: ArtShape; scale: number; children: (d: string) => ReactNode }) {
  const [cx, cy] = shape === 'fish' ? [80, 40] : [50, 52];
  return <g transform={`translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`}>{children(outline(shape))}</g>;
}

// ── Materials ───────────────────────────────────────────────────────────────

export function MagnetArt({ spec, width }: { spec: ArtSpec; width: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (name: string) => `${name}-${uid}`;
  const ref = (name: string) => `url(#${id(name)})`;
  const { shape, material, color } = spec;
  const color2 = spec.color2 ?? '#F7F1E3';
  const d = outline(shape);
  const box = shape === 'fish' ? '0 0 160 80' : '0 0 100 100';
  const height = shape === 'fish' ? width / 2 : width;
  // Rounded corners: stroke the shape in its own paint with round joins.
  const round = (paint: string, w = 6) => ({ fill: paint, stroke: paint, strokeWidth: w, strokeLinejoin: 'round' as const });

  let art: ReactNode;
  switch (material) {
    case 'ceramic':
      art = (
        <g filter={ref('bevel')}>
          {shape === 'pear' && (
            <>
              <path d="M50 17 C 50 11, 52 6, 55 3" fill="none" stroke="#6B4A2B" strokeWidth={3.2} strokeLinecap="round" />
              <path d="M54 9 C 60 2, 70 2, 74 6 C 68 12, 60 13, 54 9 Z" fill={color2} />
            </>
          )}
          <path d={d} {...round(color, 8)} />
          {shape === 'pear' ? (
            <path d="M34 62 C 34 54, 38 48, 42 45" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={3} strokeLinecap="round" />
          ) : (
            <>
              <path d={spiralPath(50, 53, 3, 5.2)} fill="none" stroke="rgba(20,20,60,0.45)" strokeWidth={3.4} strokeLinecap="round" />
              <path d={spiralPath(49.4, 52.2, 3, 5.2)} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} strokeLinecap="round" />
            </>
          )}
        </g>
      );
      break;

    case 'button':
      art = (
        <g filter={ref('bevel')}>
          <path d={d} {...round(color, 10)} />
          <Inset shape={shape} scale={0.72}>
            {(inner) => <path d={inner} {...round(color2, 6)} />}
          </Inset>
          {[
            [44, 46],
            [56, 46],
            [44, 58],
            [56, 58],
          ].map(([x, y]) => (
            <g key={`${x}${y}`}>
              <circle cx={x} cy={y} r={4.2} fill="rgba(90,70,20,0.35)" />
              <circle cx={x + 0.6} cy={y + 0.8} r={3.2} fill="rgba(60,45,10,0.45)" />
            </g>
          ))}
        </g>
      );
      break;

    case 'felt':
      art = (
        <>
          <g filter={ref('grain')}>
            <path d={d} {...round(color, 8)} />
          </g>
          <Inset shape={shape} scale={0.8}>
            {(inner) => (
              <path d={inner} fill="none" stroke="rgba(255,255,250,0.85)" strokeWidth={1.7} strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </Inset>
        </>
      );
      break;

    case 'denim':
      art = (
        <g filter={ref('fray')}>
          <path d={d} {...round(ref('twill'), 10)} />
          <Inset shape={shape} scale={0.66}>
            {(inner) => <path d={inner} {...round(ref('twill-dark'), 6)} />}
          </Inset>
        </g>
      );
      break;

    case 'jelly':
      art = (
        <>
          <path d={d} {...round('#FFFFFF', 16)} />
          <g filter={ref('bevel-soft')}>
            <path d={d} {...round(ref('iris'), 8)} opacity={0.92} />
          </g>
          <path d={shape === 'heart' ? 'M22 30 C 24 22, 32 18, 38 20' : 'M30 34 C 36 26, 46 24, 52 26'} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth={4} strokeLinecap="round" />
          <ellipse cx="62" cy="64" rx="7" ry="3.5" fill="rgba(255,255,255,0.55)" transform="rotate(-30 62 64)" />
        </>
      );
      break;

    case 'glass':
      art = (
        <>
          <g filter={ref('bevel')}>
            <path d={d} {...round(ref('glass'), 10)} />
          </g>
          {shape === 'drop' ? (
            <>
              <path d="M32 62 C 32 50, 38 40, 44 33" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={4} strokeLinecap="round" />
              <circle cx="64" cy="76" r="3" fill="rgba(255,255,255,0.6)" />
            </>
          ) : (
            <>
              <path d="M34 36 C 40 28, 50 26, 56 29" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={3.5} strokeLinecap="round" />
              <path d="M60 62 L 68 56" stroke="rgba(255,255,255,0.6)" strokeWidth={2.5} strokeLinecap="round" />
            </>
          )}
        </>
      );
      break;

    case 'halftone':
      art = (
        <>
          <path d={d} {...round('#FFFFFF', 12)} />
          <path d={d} {...round(ref('dots'), 4)} />
          <Inset shape={shape} scale={0.64}>
            {(inner) => <path d={inner} {...round('#FFFFFF', 4)} />}
          </Inset>
          <Inset shape={shape} scale={0.34}>
            {(inner) => <path d={inner} {...round(ref('dots-dense'), 3)} />}
          </Inset>
        </>
      );
      break;

    case 'spiral':
      art = (
        <>
          <path d={d} {...round('#FFFFFF', 14)} />
          <clipPath id={id('clip')}>
            <path d={d} />
          </clipPath>
          <g clipPath={ref('clip')}>
            <rect width="100" height="100" fill={color2} />
            <path d={spiralPath(50, 54, 9, 5.4)} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
          </g>
        </>
      );
      break;

    case 'paper':
      art = (
        <g filter={ref('print')}>
          <path d={FISH_FINS} fill={color} />
          <path d={FISH_FINS} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth={0.8} strokeDasharray="0.8 2.2" />
          <path d={d} fill={ref('vintage')} />
          {/* Head in a solid ink, like a block print. */}
          <path d="M6 42 C 12 30, 26 22, 42 19 C 48 32, 48 52, 42 64 C 24 62, 12 54, 6 42 Z" fill={color} />
          <path d="M42 19 C 48 32, 48 52, 42 64" fill="none" stroke="rgba(0,0,0,0.38)" strokeWidth={1.3} />
          <path d="M36 24 C 41 34, 41 50, 36 59" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={1} />
          <circle cx="21" cy="37" r="4.2" fill="rgba(255,255,255,0.3)" />
          <circle cx="21" cy="37" r="3" fill="#F2E6CF" />
          <circle cx="21.4" cy="37.2" r="1.6" fill="#1E1C19" />
          <path d="M6 43 L 13 44" stroke="rgba(0,0,0,0.45)" strokeWidth={1.1} strokeLinecap="round" />
          <path d="M134 36 L 150 22 M 134 46 L 150 60 M 134 41 L 152 41" stroke="rgba(0,0,0,0.22)" strokeWidth={0.9} />
        </g>
      );
      break;

    case 'enamel':
      art = (
        <g filter={ref('bevel')}>
          <circle cx="50" cy="50" r="46" fill={ref('rind')} />
          <circle cx="50" cy="50" r="46" fill={ref('pores')} opacity={0.5} />
          <circle cx="50" cy="50" r="40" fill="#FBF6E6" />
          {Array.from({ length: 10 }, (_, i) => {
            const a0 = (i * 36 + 3) * (Math.PI / 180);
            const a1 = ((i + 1) * 36 - 3) * (Math.PI / 180);
            const r = 36;
            const p = (a: number, rr: number) => `${(50 + rr * Math.cos(a)).toFixed(2)} ${(50 + rr * Math.sin(a)).toFixed(2)}`;
            return <path key={i} d={`M${p((a0 + a1) / 2, 5)} L${p(a0, r)} A${r} ${r} 0 0 1 ${p(a1, r)} Z`} fill={ref('flesh')} />;
          })}
          <circle cx="50" cy="50" r="36" fill={ref('pores')} opacity={0.35} />
          <circle cx="50" cy="50" r="3.5" fill="#FBF6E6" />
        </g>
      );
      break;
  }

  return (
    <svg className="mg-art" width={width} height={height} viewBox={box} overflow="visible" aria-hidden="true">
      <defs>
        {/* Raised, lit surface: glaze, plastic, enamel, glass. */}
        <filter id={id('bevel')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
          <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.9" specularExponent="24" lightingColor="#fff" result="spec">
            <feDistantLight azimuth="225" elevation="50" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn" />
          <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.75" k4="0" />
        </filter>
        <filter id={id('bevel-soft')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
          <feSpecularLighting in="blur" surfaceScale="3" specularConstant="0.7" specularExponent="16" lightingColor="#fff" result="spec">
            <feDistantLight azimuth="225" elevation="55" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn" />
          <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.6" k4="0" />
        </filter>
        {/* Fabric: fine fiber noise. */}
        <filter id={id('grain')} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="3" result="fuzz" />
          <feDisplacementMap in="SourceGraphic" in2="fuzz" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="soft-edge" />
          <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="9" result="noise" />
          <feColorMatrix in="noise" type="saturate" values="0" result="gray" />
          <feComponentTransfer in="gray" result="fibers">
            <feFuncR type="linear" slope="0.7" intercept="0.48" />
            <feFuncG type="linear" slope="0.7" intercept="0.48" />
            <feFuncB type="linear" slope="0.7" intercept="0.48" />
          </feComponentTransfer>
          <feBlend in="soft-edge" in2="fibers" mode="multiply" result="woven" />
          <feComposite in="woven" in2="soft-edge" operator="in" />
        </filter>
        {/* Denim: fibers plus a frayed, uneven edge. */}
        <filter id={id('fray')} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="edge" />
          <feDisplacementMap in="SourceGraphic" in2="edge" scale="5" xChannelSelector="R" yChannelSelector="G" result="frayed" />
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="11" result="fiber" />
          <feColorMatrix in="fiber" type="saturate" values="0" result="fiberGray" />
          <feComponentTransfer in="fiberGray" result="fiberSoft">
            <feFuncR type="linear" slope="0.5" intercept="0.65" />
            <feFuncG type="linear" slope="0.5" intercept="0.65" />
            <feFuncB type="linear" slope="0.5" intercept="0.65" />
          </feComponentTransfer>
          <feBlend in="frayed" in2="fiberSoft" mode="multiply" result="woven" />
          <feComposite in="woven" in2="frayed" operator="in" />
        </filter>
        {/* Printed paper: slightly uneven ink. */}
        <filter id={id('print')} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="5" result="noise" />
          <feColorMatrix in="noise" type="saturate" values="0" result="gray" />
          <feComponentTransfer in="gray" result="soft">
            <feFuncR type="linear" slope="0.3" intercept="0.78" />
            <feFuncG type="linear" slope="0.3" intercept="0.78" />
            <feFuncB type="linear" slope="0.3" intercept="0.78" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" in2="soft" mode="multiply" result="inked" />
          <feComposite in="inked" in2="SourceAlpha" operator="in" />
        </filter>

        <pattern id={id('twill')} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
          <rect width="3" height="3" fill={color} />
          <rect width="1.1" height="3" fill="rgba(255,255,255,0.22)" />
        </pattern>
        <pattern id={id('twill-dark')} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
          <rect width="3" height="3" fill={color2} />
          <rect width="1.1" height="3" fill="rgba(255,255,255,0.14)" />
        </pattern>
        <pattern id={id('dots')} width="2.6" height="2.6" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
          <circle cx="1.3" cy="1.3" r="0.95" fill={color} />
        </pattern>
        <pattern id={id('dots-dense')} width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
          <circle cx="1" cy="1" r="0.95" fill={color} />
        </pattern>
        <pattern id={id('vintage')} width="18" height="18" patternUnits="userSpaceOnUse">
          <rect width="18" height="18" fill={color} />
          <circle cx="9" cy="9" r="7" fill="none" stroke={color2} strokeWidth="1.6" />
          <circle cx="9" cy="9" r="3.6" fill="none" stroke={color2} strokeWidth="1.6" />
          <circle cx="0" cy="0" r="2" fill={color2} />
          <circle cx="18" cy="18" r="2" fill={color2} />
        </pattern>
        <linearGradient id={id('iris')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFDF0" />
          <stop offset="0.35" stopColor="#E7F3FF" />
          <stop offset="0.65" stopColor="#FBE6F4" />
          <stop offset="1" stopColor={color} />
        </linearGradient>
        <radialGradient id={id('rind')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.8" stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity="0.8" />
        </radialGradient>
        <radialGradient id={id('flesh')} cx="50" cy="50" r="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF8E6" />
          <stop offset="0.45" stopColor={color2} stopOpacity="0.75" />
          <stop offset="1" stopColor={color2} />
        </radialGradient>
        <pattern id={id('pores')} width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
          <circle cx="1.6" cy="1.6" r="0.55" fill="rgba(255,255,255,0.6)" />
        </pattern>
        <radialGradient id={id('glass')} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor={color2} />
          <stop offset="0.55" stopColor={color} />
          <stop offset="1" stopColor="#0B3F38" />
        </radialGradient>
      </defs>
      {art}
    </svg>
  );
}
