'use client'

import { useActionState } from 'react'
import { register, type AuthState } from '../actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from 'next/link'

const initialState: AuthState = {}

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, initialState)

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FBFBFB] p-4 font-sans selection:bg-zinc-200">
      <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      <Card className="w-full max-w-md bg-white border border-zinc-200 shadow-sm rounded-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-50/[0.01] pointer-events-none transition-colors" />
        <CardHeader className="space-y-2 pb-8 pt-8">
          <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <div className="w-6 h-6 bg-zinc-900 rounded-md flex items-center justify-center text-white text-xs">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" x2="20" y1="8" y2="14"/><line x1="23" x2="17" y1="11" y2="11"/></svg>
            </div>
            创建账号
          </CardTitle>
          <CardDescription className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest pl-9">
            Valid invite code required for access
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="invitationCode" className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-medium">Invite Code</Label>
              <Input 
                id="invitationCode" 
                name="invitationCode" 
                placeholder="INV_XXXX" 
                className="bg-zinc-50/50 border-zinc-200 text-zinc-900 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 rounded-lg h-11 placeholder:text-zinc-400 font-medium"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-medium">Display Name</Label>
              <Input 
                id="displayName" 
                name="displayName" 
                placeholder="User_123" 
                className="bg-zinc-50/50 border-zinc-200 text-zinc-900 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 rounded-lg h-11 placeholder:text-zinc-400 font-medium"
                required 
              />
            </div>
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
              <Label htmlFor="password" className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-medium">Security Key</Label>
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
                ! REG_FAILURE: {state.error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2 pb-8">
            <Button type="submit" className="w-full h-11 bg-zinc-900 text-white hover:bg-zinc-800 transition-all font-medium tracking-tight rounded-lg shadow-sm border border-zinc-900" disabled={isPending}>
              {isPending ? 'Processing...' : 'Initialize Account'}
            </Button>
            <div className="text-[10px] font-mono text-center text-zinc-500 uppercase tracking-widest">
              Already joined?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 underline underline-offset-4 decoration-blue-200 transition-all font-semibold">
                Back_to_Login &rarr;
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
