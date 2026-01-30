import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Lazy initialization to avoid crashes when env vars are missing
let _supabase: SupabaseClient | null = null

export const getSupabase = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase client not configured - missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return null
  }
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
}

// Legacy export for backwards compatibility (may be null)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as unknown as SupabaseClient

// For server-side operations requiring elevated privileges
export const createServerSupabaseClient = (): SupabaseClient | null => {
  // Support both old (SERVICE_ROLE_KEY) and new (SECRET_KEY) naming
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !secretKey) {
    console.warn('Server Supabase client not configured')
    return null
  }
  return createClient(supabaseUrl, secretKey)
}
