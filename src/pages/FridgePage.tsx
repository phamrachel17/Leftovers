import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Fridge } from '../components/Fridge';
import { ItemPanel } from '../components/ItemPanel';
import { ItemThumb } from '../components/ItemThumb';
import { Shelves } from '../components/Shelves';
import { freshnessLabel, isEatSoon, shortDate } from '../lib/dates';
import { quantityLabel } from '../lib/food';
import { useLeaving } from '../lib/motion';
import { actions, activeItems, eatSoon, selectItems, selectSettings, useStore } from '../lib/store';
import type { InventoryItem } from '../lib/types';

export function FridgePage({ onAdd }: { onAdd: () => void }) {
  const items = useStore(selectItems);
  const settings = useStore(selectSettings);
  const [params, setParams] = useSearchParams();
  const active = useMemo(() => activeItems(items), [items]);
  const soon = eatSoon(items);
  const shared = settings.mode === 'shared';

  const [open, setOpen] = useState(params.get('open') === '1' || params.has('item'));
  const [selectedId, setSelectedId] = useState<string | null>(params.get('item'));
  const view = settings.fridgeView;

  // Follow search / eat-soon links: select the item and open the door.
  useEffect(() => {
    const id = params.get('item');
    if (id) {
      setSelectedId(id);
      setOpen(true);
    }
  }, [params]);

  const selected = active.find((i) => i.id === selectedId) ?? null;

  const select = (id: string) => {
    setSelectedId(id);
    setParams({ item: id }, { replace: true });
  };

  const afterClose = () => {
    setSelectedId(null);
    setParams({}, { replace: true });
  };

  return (
    <div className="fridge-page">
      <section className="stage" aria-label="Your fridge">
        <div className="stage__bar">
          <div className="stage__bar-left">
            <div className="segmented">
              <button type="button" aria-pressed={view === 'fridge'} onClick={() => actions.updateSettings({ fridgeView: 'fridge' })}>
                Fridge view
              </button>
              <button type="button" aria-pressed={view === 'list'} onClick={() => actions.updateSettings({ fridgeView: 'list' })}>
                List view
              </button>
            </div>
            <span className="mono meta">
              {active.length} {active.length === 1 ? 'thing' : 'things'}
            </span>
          </div>
          <div className="stage__bar-right">
            {view === 'fridge' && (
              <button type="button" className="link-button mono" onClick={() => setOpen((o) => !o)}>
                {open ? 'Close door' : 'Open door'}
              </button>
            )}
            <Link to="/fridge/customize" className="link-button mono">
              Customize
            </Link>
          </div>
        </div>

        {view === 'fridge' ? (
          <div className="stage__fridge">
            <Fridge
              settings={settings}
              eatSoon={soon}
              open={open}
              onToggleDoor={() => setOpen((o) => !o)}
              onEatSoonClick={(id) => {
                select(id);
                setOpen(true);
              }}
              interior={<Shelves items={active} selectedId={selectedId} onSelect={select} />}
            />
            {!open && <p className="mono meta stage__hint">Pull the handle to look inside</p>}
          </div>
        ) : (
          <ListView items={active} selectedId={selectedId} onSelect={select} shared={shared} onAdd={onAdd} />
        )}
      </section>

      <aside className="side">
        <div className="side__soon">
          <div className="section-head">
            <h2 className="serif">eat soon</h2>
          </div>
          {soon.length === 0 && <p className="meta soft-note">Nothing pressing.</p>}
          {soon.map((i) => (
            <button key={i.id} type="button" className={`list-row list-row--compact ${i.id === selectedId ? 'is-selected' : ''}`} onClick={() => select(i.id)}>
              <ItemThumb item={i} size={36} />
              <span className="list-row__text">
                <span>{i.name}</span>
              </span>
              <span className={`mono ${freshnessLabel(i.estimatedExpiration) === 'today' ? 'is-soon' : 'meta'}`}>{freshnessLabel(i.estimatedExpiration)}</span>
            </button>
          ))}
        </div>
        {selected ? (
          <ItemPanel item={selected} shared={shared} onClosed={afterClose} />
        ) : (
          <div className="side__empty">
            <p className="serif side__empty-title">pick something.</p>
            <p className="meta">Click any item on a shelf to see how much is left, change it, or mark it finished.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

interface ListProps {
  items: InventoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  shared: boolean;
  onAdd: () => void;
}

function ListView({ items, selectedId, onSelect, shared, onAdd }: ListProps) {
  const leaving = useLeaving();
  const sorted = [...items].sort((a, b) => a.estimatedExpiration.localeCompare(b.estimatedExpiration));
  if (sorted.length === 0) {
    return (
      <div className="list-empty">
        <p className="serif">nothing left here.</p>
        <button type="button" className="btn btn--primary" onClick={onAdd}>
          Add food
        </button>
      </div>
    );
  }
  return (
    <div className="list-view" role="table" aria-label="Everything in your fridge">
      <div className={`list-view__row list-view__head mono ${shared ? 'has-whose' : ''}`} role="row">
        <span role="columnheader">Item</span>
        <span role="columnheader">Category</span>
        <span role="columnheader">Left</span>
        <span role="columnheader">Best by</span>
        {shared && <span role="columnheader">Whose</span>}
      </div>
      {sorted.map((i, n) => (
        <button
          key={i.id}
          type="button"
          role="row"
          style={{ '--i': n } as CSSProperties}
          className={`list-view__row ${shared ? 'has-whose' : ''} ${i.id === selectedId ? 'is-selected' : ''} ${leaving.has(i.id) ? 'is-leaving' : ''}`}
          onClick={() => onSelect(i.id)}
        >
          <span className="list-view__item" role="cell">
            <ItemThumb item={i} size={30} />
            {i.name}
          </span>
          <span className="meta" role="cell">
            {i.category}
          </span>
          <span className="mono" role="cell">
            {quantityLabel(i.quantity, i.unit)}
          </span>
          <span className={`mono ${isEatSoon(i.estimatedExpiration) ? 'is-soon' : ''}`} role="cell">
            ~{shortDate(i.estimatedExpiration)}
          </span>
          {shared && (
            <span className="meta" role="cell">
              {i.visibility === 'shared' ? 'Shared' : 'Mine'}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
