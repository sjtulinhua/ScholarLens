import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          
          // 一次性创建响应对象，而不是在循环里重复创建
          supabaseResponse = NextResponse.next({
            request,
          })
          
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }

  )

  // 刷新 Session (在 Middleware 中，getSession 通常比 getUser 快，因为它可能不经过网络验证)
  // 虽然 getUser 更安全，但对于每一步路由跳转的性能来说，getSession 是更常见的权平衡点
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user


  // 路由保护逻辑
  const path = request.nextUrl.pathname
  
  // 1. 如果未登录且访问受保护页面，重定向到登录页
  if (!user && !path.startsWith('/auth') && path !== '/') {
    // 允许访问 / (首页) 和 /auth/*
    // 其他页面都需要登录
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // 2. 如果已登录且访问认证页面，重定向到首页
  if (user && path.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
