import { useCallback, useEffect, useRef, useState } from 'react';

const isBrowser = typeof window !== 'undefined';

function resolveInitial(initialValue) {
  return typeof initialValue === 'function' ? initialValue() : initialValue;
}

export function usePersistentState(key, initialValue, options = {}) {
  const { serialize = JSON.stringify, deserialize = JSON.parse } = options;
  const serializeRef = useRef(serialize);
  const deserializeRef = useRef(deserialize);

  serializeRef.current = serialize;
  deserializeRef.current = deserialize;

  const initializer = useCallback(() => {
    if (!isBrowser) {
      return resolveInitial(initialValue);
    }

    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue == null) {
        return resolveInitial(initialValue);
      }
      return deserializeRef.current(storedValue);
    } catch (error) {
      console.warn(`Failed to read persistent state for "${key}":`, error);
      return resolveInitial(initialValue);
    }
  }, [initialValue, key]);

  const [state, setState] = useState(initializer);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    try {
      if (state === undefined) {
        window.localStorage.removeItem(key);
      } else {
        const value = serializeRef.current(state);
        window.localStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn(`Failed to persist state for "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
}

export function stringStorage() {
  return {
    serialize: (value) => (value ?? '').toString(),
    deserialize: (value) => value,
  };
}

export function booleanStorage() {
  return {
    serialize: (value) => (value ? 'true' : 'false'),
    deserialize: (value) => value === 'true',
  };
}

export function jsonStorage() {
  return {
    serialize: (value) => JSON.stringify(value ?? {}),
    deserialize: (value) => {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    },
  };
}
