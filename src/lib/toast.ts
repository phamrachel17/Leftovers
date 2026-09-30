import { useSyncExternalStore } from 'react';

export interface Toast {
  id: number;
  message: string;
  actionLabel?: string;
  action?: () => void;
}

let current: Toast | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function showToast(message: string, actionLabel?: string, action?: () => void) {
  clearTimeout(timer);
  current = { id: nextId++, message, actionLabel, action };
  emit();
  timer = setTimeout(dismissToast, 8000);
}

export function dismissToast() {
  clearTimeout(timer);
  current = null;
  emit();
}

export function useToast(): Toast | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}
