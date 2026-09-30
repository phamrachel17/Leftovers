import type { MagnetDef } from '../lib/decor';
import { freshnessLabel } from '../lib/dates';
import { photoFor } from '../lib/food';
import type { InventoryItem } from '../lib/types';
import { ItemThumb } from './ItemThumb';
import { MagnetArt } from './MagnetArt';

/** Decorative magnets: real photos cut like real objects. */
export function Magnet({ def }: { def: MagnetDef }) {
  switch (def.kind) {
    case 'sticker':
      return <img className="mg-sticker" src={def.img} alt={def.name} draggable={false} />;
    case 'polaroid':
      return (
        <div className="mg-polaroid">
          <img src={def.img} alt={def.name} draggable={false} />
          <span className="serif">{def.caption}</span>
        </div>
      );
    case 'stamp':
      return (
        <div className="mg-stamp">
          <div>
            <img src={def.img} alt={def.name} draggable={false} />
          </div>
        </div>
      );
    case 'tape':
      return (
        <div className="mg-tape">
          <img src={def.img} alt={def.name} draggable={false} style={{ width: def.w, height: def.h }} />
          <span className="mg-tape__strip" />
        </div>
      );
    case 'art':
      return def.art ? <MagnetArt spec={def.art} width={def.w ?? 90} /> : null;
    case 'ticket':
      return (
        <div className="mg-ticket">
          <span className="mono mg-ticket__no">No. 000927 · admit one</span>
          <span className="serif mg-ticket__big">good things</span>
          <span className="mono">are coming</span>
        </div>
      );
  }
}

/**
 * Eat-soon items pinned to the door. A photo becomes a sticker with a paper tag;
 * something due today (or without a photo) becomes an "eat today" ticket.
 */
export function EatSoonMagnet({ item }: { item: InventoryItem }) {
  const label = freshnessLabel(item.estimatedExpiration);
  if (!photoFor(item) || label === 'today' || label === 'past its best?') {
    return (
      <div className="mg-ticket mg-ticket--due">
        <span className="mono mg-ticket__no">{label === 'today' ? 'Eat today' : `Eat ${label}`}</span>
        <span className="serif mg-ticket__big">{item.name.toLowerCase()}</span>
      </div>
    );
  }
  return (
    <div className="mg-soon">
      <ItemThumb item={item} size={84} round className="mg-sticker mg-sticker--flat" />
      <span className="mg-soon__tag">
        <span>{item.name}</span>
        <span className="mono">{label}</span>
      </span>
    </div>
  );
}
