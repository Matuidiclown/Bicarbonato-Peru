import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Guardia de rutas /admin/* (Paso 5.2).
// Next.js 16: este archivo reemplaza al antiguo "middleware".
// Es una capa de comodidad: la protección real de los datos son las políticas RLS.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // La página de login debe poder abrirse sin sesión.
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  const loginUrl = new URL('/admin/login', request.url)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  // Mismo criterio que src/lib/supabase/client.ts: acepta Publishable Key o Anon Key.
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  // Si faltan las variables, se deniega el acceso (falla cerrado).
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(loginUrl)
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // getUser() valida la sesión contra el servidor de Supabase (no confía solo en la cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdmin = user?.app_metadata?.role === 'admin'

  if (!user || !isAdmin) {
    const redirect = NextResponse.redirect(loginUrl)
    // Conserva cualquier cookie de sesión refrescada.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
