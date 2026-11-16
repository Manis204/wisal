import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type Profile = {
  id: string
  display_name: string
  status: 'pending' | 'active' | 'rejected' | 'suspended' | 'disabled'
}

type Ctx = {
  loading: boolean
  session: Session | null
  profile: Profile | null
  refreshProfile: () => Promise<void>
}

const AuthCtx = createContext<Ctx>({
  loading: true,
  session: null,
  profile: null,
  refreshProfile: async () => {},
})

export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileUid, setProfileUid] = useState<string | null>(null)
  const uid = session?.user.id ?? null

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const load = useCallback(async (id: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id,display_name,status')
      .eq('id', id)
      .maybeSingle()
    setProfile((data as Profile | null) ?? null)
    setProfileUid(id)
  }, [])

  useEffect(() => {
    if (!uid) {
      setProfile(null)
      setProfileUid(null)
      return
    }
    void load(uid)
  }, [uid, load])

  const refreshProfile = useCallback(async () => {
    if (uid) await load(uid)
  }, [uid, load])

  const loading = !ready || (uid !== null && profileUid !== uid)

  return (
    <AuthCtx.Provider value={{ loading, session, profile, refreshProfile }}>
      {children}
    </AuthCtx.Provider>
  )
}
