"use client"

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"

import { useIsDemoMode } from "@/core/demo/demo-mode-context"

const DEMO_STORAGE_PREFIX = "nuptia:demo:"

function readStoredValue<T>(namespace: string, fallback: T): T {
  const raw = window.sessionStorage.getItem(DEMO_STORAGE_PREFIX + namespace)

  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function useDemoState<T>(
  namespace: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const isDemo = useIsDemoMode()
  // First render must match the server-rendered HTML exactly (no localStorage
  // read here), or React throws a hydration mismatch. The stored override is
  // swapped in after mount instead, once client and server have already
  // agreed on the initial markup.
  const [value, setValue] = useState<T>(initialValue)
  const hasHydratedFromStorage = useRef(false)

  useEffect(() => {
    if (isDemo && !hasHydratedFromStorage.current) {
      hasHydratedFromStorage.current = true
      setValue(readStoredValue(namespace, initialValue))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, namespace])

  function setPersistedValue(next: SetStateAction<T>) {
    setValue((current) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: T) => T)(current)
          : next

      if (isDemo && typeof window !== "undefined") {
        window.sessionStorage.setItem(
          DEMO_STORAGE_PREFIX + namespace,
          JSON.stringify(resolved),
        )
      }

      return resolved
    })
  }

  return [value, setPersistedValue, isDemo]
}
