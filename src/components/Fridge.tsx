import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { usePulse } from '../lib/motion';
import { MAGNETS, paintById, type PlacedMagnet } from '../lib/decor';
import type { Settings } from '../lib/store';
import type { InventoryItem } from '../lib/types';
import { EatSoonMagnet, Magnet } from './Magnet';

interface Props {
  settings: Pick<Settings, 'paint' | 'finish' | 'magnets'>;
  eatSoon: InventoryItem[];
  open?: boolean;
  onToggleDoor?: () => void;
  onEatSoonClick?: (id: string) => void;
  /** What's inside the main compartment (shelves). */
  interior?: ReactNode;
  /** Customize mode: magnets can be dragged around the door. */
  editable?: boolean;
  onMagnetsChange?: (magnets: PlacedMagnet[]) => void;
}

const ROTATIONS = [-5, 4, -3];

export function Fridge({ settings, eatSoon, open = false, onToggleDoor, onEatSoonClick, interior, editable, onMagnetsChange }: Props) {
  const paint = paintById(settings.paint);
  const style = {
    '--paint': paint.hex,
    '--door-ink': paint.light ? 'rgba(30, 50, 45, 0.75)' : 'rgba(255, 255, 255, 0.9)',
    '--badge': paint.light ? 'rgba(40, 60, 55, 0.55)' : '#f4f3ef',
  } as CSSProperties;
  const finish = settings.finish === 'matte' ? 'is-matte' : 'is-gloss';
  // One-shot effects while the door swings: light + cold air on open, a soft thud on close.
  const swinging = usePulse(open, 1300);
  const motion = `${open ? 'is-open' : ''} ${swinging && open ? 'is-opening' : ''} ${swinging && !open ? 'is-closing' : ''}`;

  return (
    <div className={`fridge ${finish} ${motion}`} style={style}>
      <div className="fridge__freezer door-face">
        <span className="door-badge serif">leftovers</span>
        {eatSoon.length > 0 ? (
          <div className="door-soon">
            <span className="mono door-soon__label">On the door · eat soon</span>
            <div className="door-soon__row">
              {eatSoon.slice(0, 3).map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  className="door-soon__item"
                  style={{ transform: `rotate(${ROTATIONS[i]}deg)`, '--i': i } as CSSProperties}
                  onClick={() => onEatSoonClick?.(item.id)}
                  aria-label={`${item.name}, eat soon`}
                >
                  <EatSoonMagnet item={item} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <span className="mono door-soon__label door-soon__label--empty">Nothing urgent. Nice.</span>
        )}
        <span className="door-handle door-handle--freezer" aria-hidden="true" />
      </div>

      <div className="fridge__main">
        <div className="fridge__interior">
          {interior}
          <span className="fridge__chill" aria-hidden="true" />
        </div>
        <div className={`fridge__door ${open ? 'is-open' : ''}`}>
          <div className="door-front door-face">
            <DecorMagnets magnets={settings.magnets} editable={editable} onChange={onMagnetsChange} />
            {onToggleDoor && (
              <button type="button" className="door-handle-hit" onClick={onToggleDoor} aria-label={open ? 'Close the fridge' : 'Open the fridge'}>
                <span className="door-handle" />
              </button>
            )}
            {!onToggleDoor && <span className="door-handle door-handle--static" aria-hidden="true" />}
          </div>
          <div className="door-back" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}

interface DecorProps {
  magnets: PlacedMagnet[];
  editable?: boolean;
  onChange?: (magnets: PlacedMagnet[]) => void;
}

function DecorMagnets({ magnets, editable, onChange }: DecorProps) {
  const layer = useRef<HTMLDivElement>(null);
  // While dragging, positions live in a ref (pointer events can outrun renders)
  // and are mirrored to state for display; we commit once on release.
  const [draft, setDraft] = useState<PlacedMagnet[] | null>(null);
  const draftRef = useRef<PlacedMagnet[] | null>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; lastX: number } | null>(null);
  const [tilt, setTilt] = useState(0);
  const [dropped, setDropped] = useState<string | null>(null);
  const shown = draft ?? magnets;

  // Magnets that just arrived get a "snap onto the door" entrance.
  const seen = useRef(new Set(magnets.map((m) => m.id)));
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  useEffect(() => {
    const added = magnets.filter((m) => !seen.current.has(m.id)).map((m) => m.id);
    magnets.forEach((m) => seen.current.add(m.id));
    if (added.length === 0) return;
    setFresh(new Set(added));
    const t = setTimeout(() => setFresh(new Set()), 700);
    return () => clearTimeout(t);
  }, [magnets]);

  const setBoth = (next: PlacedMagnet[] | null) => {
    draftRef.current = next;
    setDraft(next);
  };

  const toFraction = (e: PointerEvent) => {
    const rect = layer.current!.getBoundingClientRect();
    return { fx: (e.clientX - rect.left) / rect.width, fy: (e.clientY - rect.top) / rect.height };
  };

  const onDown = (id: string) => (e: PointerEvent<HTMLDivElement>) => {
    if (!editable) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const m = shown.find((p) => p.id === id)!;
    const { fx, fy } = toFraction(e);
    drag.current = { id, dx: fx - m.x, dy: fy - m.y, lastX: e.clientX };
    setTilt(0);
    // Bring the picked-up magnet to the front.
    setBoth([...shown.filter((p) => p.id !== id), m]);
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const current = draftRef.current;
    if (!d || !current) return;
    const { fx, fy } = toFraction(e);
    const x = clamp(fx - d.dx, -0.05, 0.85);
    const y = clamp(fy - d.dy, -0.02, 0.9);
    setBoth(current.map((p) => (p.id === d.id ? { ...p, x, y } : p)));
    // Lean into the direction of travel, like something heavy being slid.
    const vx = e.clientX - d.lastX;
    d.lastX = e.clientX;
    setTilt((t) => clamp(t * 0.6 + vx * 0.5, -14, 14));
  };

  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    onMove(e);
    const id = drag.current.id;
    drag.current = null;
    setTilt(0);
    setDropped(id);
    setTimeout(() => setDropped((cur) => (cur === id ? null : cur)), 400);
    if (draftRef.current) onChange?.(draftRef.current);
    setBoth(null);
  };

  return (
    <div ref={layer} className={`decor ${editable ? 'is-editable' : ''}`}>
      {shown.map((p) => {
        const def = MAGNETS.find((m) => m.id === p.id);
        if (!def) return null;
        const lifted = drag.current?.id === p.id;
        const state = lifted ? 'is-lifted' : dropped === p.id ? 'is-dropped' : fresh.has(p.id) ? 'is-new' : '';
        return (
          <div
            key={p.id}
            className={`decor__item ${state}`}
            style={{
              left: `${p.x * 100}%`,
              top: `${p.y * 100}%`,
              transform: `rotate(${p.r + (lifted ? tilt : 0)}deg)${lifted ? ' scale(1.07)' : ''}`,
              '--r': `${p.r}deg`,
            } as CSSProperties}
            onPointerDown={onDown(p.id)}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <Magnet def={def} />
          </div>
        );
      })}
    </div>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
