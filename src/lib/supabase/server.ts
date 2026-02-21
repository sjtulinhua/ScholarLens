/**
 * Supabase 服务端客户端配置
 * 用于 Server Components 和 Server Actions
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { cookies } from "next/headers";

export async function createClient() {
  const isLocalFirst = process.env.NEXT_PUBLIC_LOCAL_FIRST === 'true';

  // Local-First 模式：使用纯 JS 客户端 + service_role key
  // 完全绕过 cookie/JWT/RLS，直接以超级管理员身份访问数据库
  if (isLocalFirst) {
    // 直接复用 createAdminClient 的模式（已验证在 DashboardMetrics 中可工作）
    const client = createAdminClient();

    const defaultUserId = process.env.NEXT_PUBLIC_DEFAULT_USER_ID!;
    const mockUser = {
      id: defaultUserId,
      email: 'local@scholar-lens.dev',
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {},
      user_metadata: { display_name: 'Local User' },
      created_at: new Date().toISOString()
    };

    client.auth.getUser = async () => {
      return { data: { user: mockUser }, error: null } as any;
    };

    client.auth.getSession = async () => {
      return { 
        data: { 
          session: { 
            user: mockUser, 
            access_token: process.env.SUPABASE_SERVICE_ROLE_KEY!, 
            refresh_token: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            expires_in: 3600,
            token_type: 'bearer'
          } 
        }, 
        error: null 
      } as any;
    };

    return client;
  }

  // 正常模式：使用 SSR 客户端 + cookie 管理
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 在 Server Component 中设置 cookie 会失败，这是预期行为
          }
        },
      },
    }
  );
}

/**
 * 创建管理员客户端（使用 service_role key）
 * 仅用于需要绕过 RLS 的后台操作
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}
