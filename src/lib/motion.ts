import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

/**
 * Small motion helpers. Everything here respects prefers-reduced-motion:
 * with it on, numbers jump straight to their value and exits happen instantly.
 */

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// ── Items leaving the fridge ────────────────────────────────────────────────
// A finished item plays a short "leaving" animation before it's actually removed.

const LEAVE_MS = 380;
let leaving = new Set<string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function useLeaving(): Set<string> {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => leaving,
  );
}

/** Animate the item out, then run `commit` (which removes it for real). */
export function leaveThen(id: string, commit: () => void) {
  if (reducedMotion()) return commit();
  leaving = new Set(leaving).add(id);
  emit();
  setTimeout(() => {
    commit();
    const next = new Set(leaving);
    next.delete(id);
    leaving = next;
    emit();
  }, LEAVE_MS);
}

// ── Numbers that roll to their new value ────────────────────────────────────

export function useCountUp(target: number, ms = 650): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reducedMotion() || from.current === target) {
      from.current = target;
      setShown(target);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(a + (target - a) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return shown;
}

// ── A class that's on briefly after a value changes (for one-shot effects) ──

export function usePulse(value: unknown, ms = 450): boolean {
  const [on, setOn] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setOn(true);
    const t = setTimeout(() => setOn(false), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return on;
}
