import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Guardia de rutas (Pasos 5 y 6):
//  - /admin/*      exige sesion con app_metadata.role = 'admin'
//  - /vendedora/*  exige sesion con app_metadata.role = 'seller'
// Es una capa de comodidad: la proteccion real de los datos son las politicas RLS.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/')
  const isSellerArea = pathname === '/vendedora' || pathname.startsWith('/vendedora/')

  if (!isAdminArea && !isSellerArea) {
    return NextResponse.next()
  }

  // Las paginas de login deben poder abrirse sin sesion.
  if (pathname === '/admin/login' || pathname === '/vendedora/login') {
    return NextResponse.next()
  }

  const requiredRole = isAdminArea ? 'admin' : 'seller'
  const loginUrl = new URL(isAdminArea ? '/admin/login' : '/vendedora/login', request.url)

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

  // getUser() valida la sesion contra el servidor de Supabase (no confia solo en la cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const hasAccess = !!user && user.app_metadata?.role === requiredRole

  if (!hasAccess) {
    const redirect = NextResponse.redirect(loginUrl)
    // Conserva cualquier cookie de sesion refrescada.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/vendedora/:path*'],
}