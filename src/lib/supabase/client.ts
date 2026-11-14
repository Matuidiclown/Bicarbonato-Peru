
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()

  // Compatible con Publishable Key y Anon Key
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Configuración incompleta: verifica NEXT_PUBLIC_SUPABASE_URL y tu clave pública de Supabase en .env.local'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
