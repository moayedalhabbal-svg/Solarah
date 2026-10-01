import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setIsAdmin(false)
          setLoading(false)
          return
        }

        // Use dedicated RPC function — bypasses all RLS issues
        const { data, error: rpcError } = await supabase.rpc('check_is_admin')

        if (rpcError) {
          // Fallback: query profiles table directly (for backwards compat)
          console.warn('check_is_admin RPC failed, falling back to direct query:', rpcError.message)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

          if (profileError) throw profileError
          setIsAdmin(profile?.role === 'admin')
        } else {
          setIsAdmin(data === true)
        }
      } catch (err) {
        console.error('Admin check error:', err)
        setError(err)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [])

  return { isAdmin, loading, error }
}
