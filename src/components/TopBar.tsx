import { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { freshnessLabel } from '../lib/dates';
import { activeItems, selectItems, useStore } from '../lib/store';
import { ItemThumb } from './ItemThumb';

export function TopBar({ onAdd }: { onAdd: () => void }) {
  const items = useStore(selectItems);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return activeItems(items)
      .filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || (q === 'shared' && i.visibility === 'shared') || (q === 'mine' && i.visibility === 'mine'))
      .slice(0, 8);
  }, [items, query]);

  const go = (id: string) => {
    navigate(`/fridge?item=${id}`);
    setQuery('');
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <NavLink to="/" className="wordmark serif">
          leftovers
        </NavLink>
        <nav className="topbar__nav" aria-label="Main">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/fridge">Fridge</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
      </div>
      <div className="topbar__right">
        <div className="search">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="M13 13l4.5 4.5" />
          </svg>
          <input
            type="search"
            placeholder="what’s in the fridge?"
            aria-label="Search your food"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) go(results[0].id);
              if (e.key === 'Escape') setQuery('');
            }}
          />
          {focused && query.trim() && (
            <div className="search__results">
              {results.length === 0 && <span className="search__empty serif">nothing like that in here</span>}
              {results.map((r) => (
                <button key={r.id} type="button" className="search__result" onMouseDown={(e) => e.preventDefault()} onClick={() => go(r.id)}>
                  <ItemThumb item={r} size={32} />
                  <span className="search__name">{r.name}</span>
                  <span className="mono meta">{freshnessLabel(r.estimatedExpiration)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="btn btn--primary" onClick={onAdd}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M8 2v12M2 8h12" />
          </svg>
          Add food
        </button>
      </div>
    </header>
  );
}
