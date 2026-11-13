import { createBrowserClient } from '@supabase/ssr'

let hasWarnedMissingEnv = false

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if ((!rawUrl || !rawAnonKey) && !hasWarnedMissingEnv) {
    hasWarnedMissingEnv = true
    console.warn(
      '[Supabase] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Usando valores de respaldo para compilación.'
    )
  }

  const supabaseUrl = rawUrl || 'https://placeholder.supabase.co'
  const supabaseAnonKey = rawAnonKey || 'placeholder-anon-key'

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}