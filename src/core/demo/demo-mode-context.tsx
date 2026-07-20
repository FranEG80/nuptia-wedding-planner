"use client"

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

const DEMO_STORAGE_PREFIX = "nuptia:demo:"
const DEMO_RESET_PARAM = "demo"

const DemoModeContext = createContext(false)

function clearDemoStorage() {
  const keysToRemove: string[] = []

  for (let i = 0; i < window.sessionStorage.length; i += 1) {
    const key = window.sessionStorage.key(i)
    if (key?.startsWith(DEMO_STORAGE_PREFIX)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => window.sessionStorage.removeItem(key))
}

export function DemoModeProvider({
  isDemo,
  children,
}: {
  isDemo: boolean
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const shouldReset = isDemo && searchParams.get(DEMO_RESET_PARAM) === "1"

  useEffect(() => {
    if (!shouldReset) {
      return
    }

    clearDemoStorage()

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete(DEMO_RESET_PARAM)
    const query = nextParams.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }, [shouldReset, pathname, router, searchParams])

  return (
    <DemoModeContext.Provider value={isDemo}>
      {children}
    </DemoModeContext.Provider>
  )
}

export function useIsDemoMode(): boolean {
  return useContext(DemoModeContext)
}
