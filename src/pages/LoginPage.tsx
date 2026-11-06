import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Boxes } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginByAccount } from '@/services/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      await loginByAccount(username.trim(), password)
      navigate(redirect.startsWith('/') ? redirect : '/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* 左侧品牌视觉区（大图） */}
      <div className="relative hidden w-[55%] overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-800 lg:block">
        {/* 装饰网格 */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* 装饰光斑 */}
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" />

        {/* 文字可读性遮罩：左侧压暗、向右渐透明 */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/80 via-indigo-950/20 to-transparent" />

        {/* 品牌文案 */}
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Boxes className="h-5 w-5 text-indigo-200" />
            </div>
            <span className="text-lg font-semibold tracking-wide text-white">EAIP</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold leading-snug text-white">
              工业边缘采控
              <br />
              与集成平台
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-indigo-200/90">
              面向自动化产线的数据采集、业务指令编排与对上集成，
              关键操作全程留痕，让产线数据可信流转。
            </p>
            <div className="mt-8 flex gap-6 text-xs text-indigo-200/80">
              <span>产线采控</span>
              <span>·</span>
              <span>角色权限</span>
              <span>·</span>
              <span>系统集成</span>
            </div>
          </div>
          <p className="text-[11px] text-indigo-300/60">© 2026 EAIP</p>
        </div>
      </div>

      {/* 右侧登录表单区 */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md lg:max-w-lg">
          {/* 小屏品牌头（大屏由左侧承担） */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Boxes className="h-6 w-6" />
            </div>
            <h1 className="mt-3 text-lg font-semibold">EAIP</h1>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">欢迎登录</h1>
            <p className="mt-1.5 text-sm text-slate-400">EAIP 管理平台</p>

            <form className="mt-9 space-y-5" onSubmit={onSubmit}>
              <div>
                <Label className="text-sm text-slate-500">账号</Label>
                <Input
                  className="mt-2 h-11"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="用户名（演示任意）"
                  autoFocus
                />
              </div>
              <div>
                <Label className="text-sm text-slate-500">密码</Label>
                <Input
                  className="mt-2 h-11"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密码"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                className="h-11 w-full bg-indigo-600 text-sm hover:bg-indigo-700"
                disabled={submitting || !username || !password}
              >
                {submitting ? '登录中…' : '登 录'}
              </Button>
            </form>
          </div>

          <p className="mt-7 text-center text-xs text-slate-400">
            登录即代表同意平台使用规范（演示模式任意账号密码可登录）
          </p>
        </div>
      </div>
    </div>
  )
}
