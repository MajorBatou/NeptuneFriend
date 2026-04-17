import { useEffect, useCallback } from 'react';

type KeyHandler = (e: KeyboardEvent) => void;
type KeyMap = Record<string, KeyHandler>;

export function useKeyboard(keyMap: KeyMap, enabled = true) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = [
        e.ctrlKey ? 'ctrl' : '',
        e.metaKey ? 'meta' : '',
        e.shiftKey ? 'shift' : '',
        e.altKey ? 'alt' : '',
        e.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join('+');

      const handler = keyMap[key] ?? keyMap[e.key];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    },
    [keyMap, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// App-wide navigation shortcuts
export function useNavShortcuts() {
  const keyMap: KeyMap = {
    g: () => {
      window.location.href = '/dashboard';
    },
    m: () => {
      window.location.href = '/map';
    },
    r: () => {
      window.location.href = '/planner';
    },
    a: () => {
      window.location.href = '/alerts';
    },
    '?': () => {
      console.info('NeptuneFriend keyboard shortcuts: g=dashboard, m=map, r=planner, a=alerts');
    },
  };

  useKeyboard(keyMap);
}
