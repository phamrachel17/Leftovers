import type { Category, InventoryItem, Unit } from './types';

const L = (name: string) => `/food/lib/${name}.jpg`;

/**
 * Library photos in public/food, matched by keywords in the item name.
 * First match wins, so more specific names come before general ones
 * ("pineapple" before "apple", "peanut butter" before "butter").
 * Items with no match show their category photo behind their initials.
 */
const PHOTO_MATCHES: Array<[RegExp, string | null]> = [
  // Specific names that would otherwise be caught by a shorter word below.
  [/pineapple/i, L('pineapple')],
  [/peanut butter|almond butter|buttermilk/i, null],
  [/sweet potato|yam/i, null],
  [/egg ?plant|aubergine/i, null],
  [/orange juice|apple juice|juice/i, L('cat-drinks')],
  [/cream cheese|ice cream|sour cream|cream/i, null],
  [/spring onion|green onion|scallion/i, L('spring-onions')],
  [/green bean|string bean/i, L('green-beans')],
  [/parmesan|parmigiano|pecorino/i, L('parmesan')],
  [/watermelon/i, null],
  [/popcorn/i, null],
  [/black pepper|peppercorn|pepper flakes|cayenne|chilli powder/i, null],

  // Produce
  [/strawberr/i, '/food/strawberry.jpg'],
  [/raspberr/i, L('raspberries')],
  [/blueberr/i, L('blueberries')],
  [/cherr(y|ies)(?! tomato)/i, '/food/cherries.jpg'],
  [/grape(?!fruit)/i, L('grapes')],
  [/apple/i, L('apple')],
  [/pear\b|pears/i, L('pear')],
  [/peach|nectarine/i, '/food/peach.jpg'],
  [/mango/i, L('mango')],
  [/kiwi/i, L('kiwi')],
  [/banana/i, '/food/bananas.jpg'],
  [/orange|clementine|mandarin|tangerine/i, L('orange')],
  [/lemon/i, '/food/lemons.jpg'],
  [/lime/i, L('limes')],
  [/avocado/i, '/food/avocado.jpg'],
  [/tomato/i, '/food/tomato.jpg'],
  [/spinach|greens|kale|chard|arugula|rocket/i, '/food/spinach.jpg'],
  [/lettuce|romaine|little gem/i, L('lettuce')],
  [/salad/i, L('salad')],
  [/broccoli/i, L('broccoli')],
  [/cauliflower/i, L('cauliflower')],
  [/cabbage|bok choy/i, L('cabbage')],
  [/carrot/i, L('carrots')],
  [/celery/i, L('celery')],
  [/cucumber/i, L('cucumber')],
  [/pepper|capsicum/i, L('bell-pepper')],
  [/onion|shallot/i, L('onion')],
  [/garlic/i, L('garlic')],
  [/ginger/i, L('ginger')],
  [/potato/i, L('potatoes')],
  [/mushroom/i, L('mushrooms')],
  [/corn\b|sweetcorn|corn on/i, L('corn')],
  [/\bpeas?\b|edamame/i, L('peas')],
  [/parsley|cilantro|coriander|basil|dill|mint|herb/i, L('herbs')],

  // Dairy & eggs
  [/egg/i, '/food/eggs.jpg'],
  [/yog(h)?urt|skyr|kefir/i, '/food/yogurt.jpg'],
  [/butter/i, '/food/butter.jpg'],
  [/milk/i, L('milk')],
  [/cheese|cheddar|brie|gouda|feta|halloumi|mozzarella|camembert/i, L('cheese')],

  // Protein
  [/salmon|trout/i, '/food/salmon.jpg'],
  [/sardine|anchov|tuna can|tinned fish/i, '/food/sardines.jpg'],
  [/shrimp|prawn/i, L('shrimp')],
  [/sausage|chorizo|bratwurst|hot dog/i, L('sausages')],
  [/pork|bacon|ham\b/i, L('pork')],
  [/beef|steak|mince|ground/i, L('beef')],
  [/tofu|tempeh/i, '/food/tofu.jpg'],

  // Everything else
  [/bread|loaf|baguette|sourdough|bagel|\bbuns?\b|\brolls?\b/i, L('bread')],
  [/tortilla|wrap|quesadilla/i, L('tortillas')],
  [/pasta|penne|spaghetti|noodle|macaroni|fusilli|lasagn/i, L('pasta')],
];

const CATEGORY_PHOTOS: Record<Category, string> = {
  Produce: L('cat-produce'),
  'Dairy & eggs': '/food/eggs.jpg',
  Protein: L('cat-protein'),
  Leftovers: L('cat-leftovers'),
  Drinks: L('cat-drinks'),
  Pantry: L('cat-pantry'),
  Other: L('cat-other'),
};

/** Larger, more editorial crops for the detail view where we have them. */
const HERO_PHOTOS: Record<string, string> = {
  '/food/strawberry.jpg': '/food/strawberries-hands.jpg',
};

export function stockPhotoFor(name: string): string | null {
  // A null entry means "we know this food but have no good photo" — stop, don't fall through.
  for (const [re, url] of PHOTO_MATCHES) if (re.test(name)) return url;
  return null;
}

type Photographable = Pick<InventoryItem, 'name' | 'imageUrl'>;

/**
 * The picture to show for an item: your own photo first, then the library.
 * Stock photos are looked up at display time (never stored), so every item
 * benefits when the library grows.
 */
export function photoFor(item: Photographable): string | null {
  return item.imageUrl ?? stockPhotoFor(item.name);
}

export function heroPhotoFor(item: Photographable): string | null {
  const url = photoFor(item);
  return url ? (HERO_PHOTOS[url] ?? url) : null;
}

/** Soft background for items with no photo of their own, so every tile is still a photograph. */
export function categoryPhoto(category: Category): string {
  return CATEGORY_PHOTOS[category];
}

export function monogram(name: string): string {
  const words = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2);
  return words[0][0] + words[1][0];
}

/** Fallback shelf life (days) when a person adds food by hand. */
export const DEFAULT_SHELF_LIFE: Record<Category, number> = {
  Produce: 5,
  'Dairy & eggs': 10,
  Protein: 3,
  Leftovers: 4,
  Drinks: 10,
  Pantry: 90,
  Other: 7,
};

/** Where things live in the fridge view. 3 = crisper drawer. */
export function shelfFor(category: Category): number {
  switch (category) {
    case 'Dairy & eggs':
    case 'Drinks':
      return 0;
    case 'Protein':
      return 1;
    case 'Produce':
      return 3;
    default:
      return 2;
  }
}

export const SHELF_LABELS = ['Dairy, eggs & drinks', 'Protein', 'Leftovers & everything else', 'Crisper · produce'];

export function quantityLabel(qty: number, unit: Unit): string {
  if (unit === 'percent') return `~${Math.round(qty)}% left`;
  if (unit === 'package') return qty === 1 ? '1 pack' : `${qty} packs`;
  return `${qty} left`;
}

export function stepFor(unit: Unit): number {
  return unit === 'percent' ? 10 : 1;
}

export function maxFor(unit: Unit): number {
  return unit === 'percent' ? 100 : 999;
}
