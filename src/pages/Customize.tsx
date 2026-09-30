import { Link } from 'react-router-dom';
import { Fridge } from '../components/Fridge';
import { MagnetArt } from '../components/MagnetArt';
import { DEFAULT_MAGNETS, MAGNETS, MAX_MAGNETS, PAINTS, paintById } from '../lib/decor';
import { actions, eatSoon, selectItems, selectSettings, useStore } from '../lib/store';

// Where a newly added magnet lands, cycling so they don't stack exactly.
const DROP_SPOTS = [
  { x: 0.35, y: 0.35 },
  { x: 0.05, y: 0.3 },
  { x: 0.6, y: 0.4 },
  { x: 0.3, y: 0.65 },
  { x: 0.65, y: 0.05 },
  { x: 0.05, y: 0.05 },
  { x: 0.1, y: 0.1 },
  { x: 0.5, y: 0.2 },
  { x: 0.2, y: 0.45 },
  { x: 0.55, y: 0.55 },
  { x: 0.15, y: 0.75 },
  { x: 0.6, y: 0.8 },
];

export function Customize() {
  const settings = useStore(selectSettings);
  const items = useStore(selectItems);
  const placed = settings.magnets;
  const placedIds = new Set(placed.map((m) => m.id));

  const toggle = (id: string) => {
    if (placedIds.has(id)) {
      actions.updateSettings({ magnets: placed.filter((m) => m.id !== id) });
    } else if (placed.length < MAX_MAGNETS) {
      const spot = DROP_SPOTS[placed.length % DROP_SPOTS.length];
      actions.updateSettings({ magnets: [...placed, { id, ...spot, r: placed.length % 2 ? 5 : -5 }] });
    }
  };

  return (
    <div className="customize">
      <section className="customize__stage">
        <Fridge settings={settings} eatSoon={eatSoon(items)} editable onMagnetsChange={(magnets) => actions.updateSettings({ magnets })} />
      </section>

      <aside className="customize__panel">
        <div className="section-head">
          <h1 className="serif">your fridge</h1>
          <Link to="/fridge" className="btn btn--primary">
            Done
          </Link>
        </div>

        <div className="control">
          <div className="control__head">
            <span className="mono meta">Paint</span>
            <span className="serif control__value">{paintById(settings.paint).name}</span>
          </div>
          <div className="swatches">
            {PAINTS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`swatch ${settings.paint === p.id ? 'is-selected' : ''}`}
                style={{ background: p.hex }}
                aria-label={p.name}
                aria-pressed={settings.paint === p.id}
                onClick={() => actions.updateSettings({ paint: p.id })}
              />
            ))}
          </div>
        </div>

        <div className="control control--row">
          <span className="mono meta">Finish</span>
          <div className="segmented">
            <button type="button" aria-pressed={settings.finish === 'gloss'} onClick={() => actions.updateSettings({ finish: 'gloss' })}>
              Gloss
            </button>
            <button type="button" aria-pressed={settings.finish === 'matte'} onClick={() => actions.updateSettings({ finish: 'matte' })}>
              Matte
            </button>
          </div>
        </div>

        <div className="control">
          <div className="control__head">
            <span className="mono meta">Magnets · click to add, drag on the door to arrange</span>
            <span className="mono meta">
              {placed.length} / {MAX_MAGNETS}
            </span>
          </div>
          <div className="tray">
            {MAGNETS.map((m) => {
              const on = placedIds.has(m.id);
              const full = !on && placed.length >= MAX_MAGNETS;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`tray__item ${on ? 'is-on' : ''}`}
                  aria-pressed={on}
                  aria-label={m.name}
                  title={full ? 'The door’s full — take one off first' : m.name}
                  disabled={full}
                  onClick={() => toggle(m.id)}
                >
                  {m.art ? (
                    <MagnetArt spec={m.art} width={m.art.shape === 'fish' ? 58 : 44} />
                  ) : m.img ? (
                    <img src={m.img} alt="" className={m.kind === 'sticker' ? 'is-round' : ''} />
                  ) : (
                    <span className="serif tray__ticket">good things</span>
                  )}
                  {on && <span className="tray__check" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <p className="meta soft-note">Your eat-soon items pin themselves to the top door automatically.</p>
          <button type="button" className="link-button" onClick={() => actions.updateSettings({ magnets: DEFAULT_MAGNETS })}>
            Reset magnets
          </button>
        </div>
      </aside>
    </div>
  );
}
