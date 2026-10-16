"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Modern hydration-safe mount hook for React 18/19.
 * Avoids cascading re-renders and eliminates react-hooks/set-state-in-effect lint errors.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
