import { useEffect, useState, type ReactNode } from 'react'
import { fmtTime, fmtDate, shiftOf } from './clock'

/** 1920×1080 看板舞台：等比缩放居中适配任意屏幕 */
export function BoardStage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#030a18] text-slate-100">
      {/* 背景网格装饰 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(56,189,248,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.35) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[1080px] w-[1920px] origin-center"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  )
}

/** 大屏顶部通栏：左侧品牌 + 中央标题 + 右侧时钟/插槽（科技风描边） */
export function BoardHeader({
  title,
  subtitle,
  children,
  now,
}: {
  title: string
  subtitle?: string
  children?: ReactNode
  now: Date
}) {
  return (
    <div className="relative flex h-[88px] flex-none items-center px-8">
      {/* 顶部霓虹横线 */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      <div className="flex w-[420px] items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-500/15 text-lg font-bold text-cyan-300 ring-1 ring-cyan-400/40">
          E
        </span>
        <div className="leading-tight">
          <div className="text-lg font-bold tracking-wide text-cyan-200">EAIP 智能制造</div>
          <div className="text-xs text-slate-400">工业边缘采控与集成平台</div>
        </div>
      </div>
      <div className="flex flex-1 justify-center">
        <div className="relative px-16 py-2 text-center">
          <div className="absolute inset-x-6 -inset-y-1 rounded-b-2xl border border-t-0 border-cyan-400/30 bg-cyan-400/5" />
          <h1 className="relative text-[34px] font-bold tracking-[6px] text-white [text-shadow:0_0_18px_rgba(34,211,238,.65)]">
            {title}
          </h1>
          {subtitle && <div className="relative mt-0.5 text-xs tracking-widest text-cyan-300/70">{subtitle}</div>}
        </div>
      </div>
      <div className="flex w-[420px] items-center justify-end gap-4">
        {children}
        <div className="text-right">
          <div className="num text-[30px] font-bold leading-none text-cyan-100">{fmtTime(now)}</div>
          <div className="mt-1 text-xs text-slate-400">
            {fmtDate(now)} · {shiftOf(now)}
          </div>
        </div>
      </div>
    </div>
  )
}
