'use client'

import { useActionState, useEffect } from 'react'
import { login, type AuthState } from '../actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from 'next/link'

const initialState: AuthState = {}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState)

  // 处理登录成功，客户端跳转
  useEffect(() => {
    if (state.success) {
       // 强制刷新以确保 Cookie 生效
       window.location.href = '/'
    }
  }, [state.success])

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FBFBFB] p-4 font-sans selection:bg-zinc-200">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
      <Card className="w-full max-w-md bg-white border border-zinc-200 shadow-sm rounded-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-zinc-50/[0.01] pointer-events-none transition-colors" />
        <CardHeader className="space-y-2 pb-8 pt-8">
          <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <div className="w-6 h-6 bg-zinc-900 rounded-md flex items-center justify-center text-white text-xs">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
            </div>
            登录
          </CardTitle>
          <CardDescription className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest pl-9">
            Enter your credentials to access system
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-medium">Email Address</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="name@example.com" 
                className="bg-zinc-50/50 border-zinc-200 text-zinc-900 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 rounded-lg h-11 placeholder:text-zinc-400 font-medium"
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-medium">Password</Label>
              </div>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                className="bg-zinc-50/50 border-zinc-200 text-zinc-900 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 rounded-lg h-11"
                required 
              />
            </div>
            {state.error && (
              <div className="text-[10px] font-mono text-red-600 uppercase tracking-wider p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Error: {state.error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2 pb-8">
            <Button type="submit" className="w-full h-11 bg-zinc-900 text-white hover:bg-zinc-800 transition-all font-medium tracking-tight rounded-lg shadow-sm border border-zinc-900" disabled={isPending}>
              {isPending ? 'Authenticating...' : 'Sign In'}
            </Button>
            <div className="text-[10px] font-mono text-center text-zinc-500 uppercase tracking-widest">
              No account?{' '}
              <Link href="/auth/register" className="text-zinc-900 hover:text-zinc-700 underline underline-offset-4 decoration-zinc-300 transition-all font-semibold">
                Register_Now &rarr;
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
