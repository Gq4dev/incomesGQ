import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { createClient } from '@/lib/supabase/client'

export function AuthGuard() {
  const supabase = createClient()
  const [checked, setChecked] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthed(!!session)
      setChecked(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthed(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!checked) return null
  if (!isAuthed) return <Navigate to="/login" replace />
  return <Outlet />
}
