'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface PrivacyContextType {
  isPrivate: boolean
  toggle: () => void
  mask: (value: string) => string
}

const PrivacyContext = createContext<PrivacyContextType>({
  isPrivate: false,
  toggle: () => {},
  mask: (v) => v,
})

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('privacy-mode')
    if (stored === 'true') setIsPrivate(true)
  }, [])

  const toggle = () => {
    setIsPrivate((prev) => {
      localStorage.setItem('privacy-mode', String(!prev))
      return !prev
    })
  }

  const mask = (value: string) => (isPrivate ? '••••••' : value)

  return (
    <PrivacyContext.Provider value={{ isPrivate, toggle, mask }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacyMode() {
  return useContext(PrivacyContext)
}
