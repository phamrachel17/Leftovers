import type { CSSProperties } from 'react';
import { isEatSoon } from '../lib/dates';
import { useLeaving } from '../lib/motion';
import { SHELF_LABELS, shelfFor } from '../lib/food';
import type { InventoryItem } from '../lib/types';
import { ItemThumb } from './ItemThumb';

interface Props {
  items: InventoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** The inside of the fridge: three glass shelves and a crisper drawer. */
export function Shelves({ items, selectedId, onSelect }: Props) {
  const leaving = useLeaving();
  const byShelf = [0, 1, 2, 3].map((s) => items.filter((i) => shelfFor(i.category) === s));
  let order = 0;
  return (
    <div className="shelves">
      <span className="shelves__light" aria-hidden="true" />
      {byShelf.map((shelfItems, s) => (
        <section key={s} className={`shelf ${s === 3 ? 'shelf--crisper' : ''}`} aria-label={SHELF_LABELS[s]}>
          <span className="mono shelf__label">
            {SHELF_LABELS[s]} · {shelfItems.length}
          </span>
          <div className="shelf__row">
            {shelfItems.length === 0 && <span className="serif shelf__empty">nothing left here</span>}
            {shelfItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`shelf__item ${item.id === selectedId ? 'is-selected' : ''} ${leaving.has(item.id) ? 'is-leaving' : ''}`}
                style={{ '--i': order++ } as CSSProperties}
                onClick={() => onSelect(item.id)}
                title={item.name}
              >
                <ItemThumb item={item} size={s === 3 ? 48 : 56} round={s === 3} />
                {isEatSoon(item.estimatedExpiration) && <span className="soon-dot" aria-label="eat soon" />}
                <span className={`shelf__name ${isEatSoon(item.estimatedExpiration) ? 'is-soon' : ''}`}>{item.name}</span>
              </button>
            ))}
          </div>
          {s < 3 && <span className="shelf__glass" aria-hidden="true" />}
        </section>
      ))}
    </div>
  );
}
