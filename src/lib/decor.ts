import type { ArtSpec } from '../components/MagnetArt';

export interface Paint {
  id: string;
  name: string;
  hex: string;
  /** Light paints need dark text on the door. */
  light: boolean;
}

export const PAINTS: Paint[] = [
  { id: 'teal', name: 'Teal', hex: '#B4DDD3', light: true },
  { id: 'olive', name: 'Olive', hex: '#8A9530', light: false },
  { id: 'butter', name: 'Butter', hex: '#EAD9A0', light: true },
  { id: 'tomato', name: 'Tomato', hex: '#B9442E', light: false },
  { id: 'sage', name: 'Sage', hex: '#A9B89A', light: true },
  { id: 'powder', name: 'Powder', hex: '#AFC4D2', light: true },
  { id: 'cream', name: 'Cream', hex: '#EFE8D8', light: true },
  { id: 'espresso', name: 'Espresso', hex: '#3A2E28', light: false },
];

export function paintById(id: string): Paint {
  return PAINTS.find((p) => p.id === id) ?? PAINTS[0];
}

export type MagnetKind = 'sticker' | 'polaroid' | 'stamp' | 'tape' | 'ticket' | 'art';

export interface MagnetDef {
  id: string;
  name: string;
  kind: MagnetKind;
  img?: string;
  caption?: string;
  w?: number;
  h?: number;
  /** For 'art' magnets: the shape and material to draw. */
  art?: ArtSpec;
}

export const MAGNETS: MagnetDef[] = [
  // Drawn as materials (see MagnetArt) — one of each shape, each in a different material.
  { id: 'star-ceramic', name: 'Glazed ceramic star', kind: 'art', w: 96, art: { shape: 'star', material: 'ceramic', color: '#7C82C9' } },
  { id: 'star-halftone', name: 'Halftone print star', kind: 'art', w: 94, art: { shape: 'star', material: 'halftone', color: '#B8322B' } },
  { id: 'pear-ceramic', name: 'Glazed ceramic pear', kind: 'art', w: 74, art: { shape: 'pear', material: 'ceramic', color: '#9DB35A', color2: '#5E7A34' } },
  { id: 'flower-denim', name: 'Stitched flower patch', kind: 'art', w: 80, art: { shape: 'flower', material: 'felt', color: '#6B8DB8' } },
  { id: 'moon-denim', name: 'Frayed denim moon', kind: 'art', w: 84, art: { shape: 'moon', material: 'denim', color: '#8FAACB', color2: '#4F6D99' } },
  { id: 'heart-jelly', name: 'Iridescent jelly heart', kind: 'art', w: 80, art: { shape: 'heart', material: 'jelly', color: '#F2C9D9' } },
  { id: 'heart-ceramic', name: 'Tomato button heart', kind: 'art', w: 74, art: { shape: 'heart', material: 'button', color: '#C4432E', color2: '#D9644B' } },
  { id: 'drop-glass', name: 'Green glass star', kind: 'art', w: 62, art: { shape: 'star', material: 'glass', color: '#1F8F7E', color2: '#9FE3D2' } },
  { id: 'button-round', name: 'Butter button', kind: 'art', w: 70, art: { shape: 'circle', material: 'button', color: '#EEDC84', color2: '#F8F0C4' } },
  { id: 'disc-spiral', name: 'Spiral sticker', kind: 'art', w: 78, art: { shape: 'circle', material: 'spiral', color: '#1E1C19', color2: '#F7F1E3' } },
  { id: 'fish-red', name: 'Printed paper fish', kind: 'art', w: 150, art: { shape: 'fish', material: 'paper', color: '#C9472F', color2: '#E8A083' } },
  { id: 'fish-green', name: 'Printed paper fish (green)', kind: 'art', w: 138, art: { shape: 'fish', material: 'paper', color: '#5D7A3C', color2: '#D9C27A' } },
  { id: 'lemon', name: 'Enamel lemon slice', kind: 'art', w: 84, art: { shape: 'citrus', material: 'enamel', color: '#E3B92C', color2: '#F4D766' } },
  { id: 'grapefruit', name: 'Enamel grapefruit slice', kind: 'art', w: 90, art: { shape: 'citrus', material: 'enamel', color: '#E3875B', color2: '#EC6F62' } },

  // Real photos, cut like real objects.
  { id: 'strawberry', name: 'Strawberry sticker', kind: 'sticker', img: '/food/strawberry.jpg' },
  { id: 'peach', name: 'Peach polaroid', kind: 'polaroid', img: '/food/peach.jpg', caption: 'farmers mkt, aug' },
  { id: 'stamp', name: 'Fruit stamp', kind: 'stamp', img: '/food/stamp.jpg' },
  { id: 'sardines', name: 'Sardine tin print', kind: 'tape', img: '/food/sardines.jpg', w: 78, h: 106 },
  { id: 'ticket', name: 'Admit-one ticket', kind: 'ticket' },
  { id: 'lemons', name: 'Lemon sticker', kind: 'sticker', img: '/food/lemons.jpg' },
  { id: 'cherries', name: 'Cherry sticker', kind: 'sticker', img: '/food/cherries.jpg' },
  { id: 'grocer', name: 'Old grocer’s bill', kind: 'tape', img: '/food/grocer-bill.jpg', w: 124, h: 70 },
  { id: 'tomato', name: 'Tomato sticker', kind: 'sticker', img: '/food/tomato.jpg' },
];

export const MAX_MAGNETS = 12;

export interface PlacedMagnet {
  id: string;
  /** Position as a fraction of the door (0–1) so it survives resizing. */
  x: number;
  y: number;
  r: number;
}

export const DEFAULT_MAGNETS: PlacedMagnet[] = [
  { id: 'stamp', x: 0.64, y: 0.05, r: 7 },
  { id: 'star-ceramic', x: 0.12, y: 0.2, r: -10 },
  { id: 'fish-red', x: 0.36, y: 0.42, r: -4 },
  { id: 'lemon', x: 0.1, y: 0.66, r: 0 },
  { id: 'moon-denim', x: 0.62, y: 0.68, r: 12 },
];
