import { categoryPhoto, monogram, photoFor } from '../lib/food';
import type { InventoryItem } from '../lib/types';

interface Props {
  item: Pick<InventoryItem, 'name' | 'imageUrl' | 'category'>;
  /** Pixel size; omit to let CSS size it (e.g. the detail hero). */
  size?: number;
  round?: boolean;
  /** Override the image, e.g. the larger hero crop. */
  src?: string | null;
  className?: string;
}

/**
 * The item's own photo or a library photo. With neither, its category's photo sits
 * softened behind the initials, so it reads as "no picture of this yet" — never an emoji.
 */
export function ItemThumb({ item, size, round, src, className = '' }: Props) {
  const url = src ?? photoFor(item);
  const style = size == null ? undefined : { width: size, height: size, borderRadius: round ? '50%' : Math.max(3, size / 16) };
  if (url) {
    return <img className={`thumb ${className}`} src={url} alt="" style={style} draggable={false} />;
  }
  return (
    <span className={`thumb thumb--empty ${className}`} style={{ ...style, backgroundImage: `url(${categoryPhoto(item.category)})` }} aria-hidden="true">
      <span className="serif" style={{ fontSize: size == null ? undefined : Math.max(12, size * 0.34) }}>
        {monogram(item.name)}
      </span>
    </span>
  );
}
