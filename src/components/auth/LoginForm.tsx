import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
// 注意：这里需要稍后将组件改为 Client Component 才能使用 useActionState (React 19) 
// 但 Next.js 15 可能仍推荐使用 useFormState (如果是 canary) 或者直接 form action
// 为了由于 Next.js 15 和 React 19 的过渡期，我们使用传统的 form action 配合 useActionState (如果可用) 或者简单的 onSubmit
// 这里我们构建一个 Client Component 包装器来处理表单状态

export function LoginForm({ action }: { action: any }) {
  // 简化的 UI 展示，实际逻辑在 page.tsx 中组装
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <Input id="email" name="email" type="email" placeholder="student@example.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <Button type="submit" className="w-full">
        登录
      </Button>
    </form>
  )
}
