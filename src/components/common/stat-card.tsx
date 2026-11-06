import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  /** 指标名称（卡顶） */
  label: string
  /** 指标大数字 */
  value: ReactNode
  /** 副信息（颜色受 tone 控制） */
  sub?: ReactNode
  /** 大数字配色：默认中性 slate，强正 / 警告 / 危险 / 主题强调 */
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'accent'
  /** 右上角图标（默认灰，tone 生效时跟随） */
  icon?: LucideIcon
  /** 大数字下方一段细分指标行（如「成功 3 / 失败 0」） */
  subStats?: { label: string; value: ReactNode; tone?: 'success' | 'warning' | 'danger' | 'muted' | 'accent' }[]
  /** 是否高亮（cursor + 边框 + 阴影） */
  highlight?: boolean
  onClick?: () => void
}

const TONE_CLASS: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'text-slate-700',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-red-500',
  accent: 'text-indigo-600',
}

const SUBSTAT_TONE: Record<NonNullable<NonNullable<StatCardProps['subStats']>[number]['tone']>, string> = {
  success: 'text-emerald-600',
  warning: 'text-amber-500',
  danger: 'text-red-500',
  muted: 'text-slate-400',
  accent: 'text-blue-500',
}

const ICON_TONE: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'text-slate-300',
  success: 'text-emerald-300',
  warning: 'text-amber-400',
  danger: 'text-red-300',
  accent: 'text-indigo-300',
}

/**
 * 统一统计卡：大数字 + 副信息 + 可选细分行 / 高亮点击。
 * 用于 Flows 顶部 4 卡、RunDetail 概要 4 卡、TemplateDetail 数据 4 卡。
 */
export function StatCard({ label, value, sub, tone = 'default', icon: Icon, subStats, highlight, onClick }: StatCardProps) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-xl border bg-white p-5 text-left transition-shadow ${
        highlight ? 'cursor-pointer border-amber-300 ring-1 ring-amber-100 hover:shadow-md' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{label}</span>
        {Icon && <Icon className={`h-4 w-4 ${ICON_TONE[tone]}`} />}
      </div>
      <div className={`mt-1 text-3xl font-semibold tabular-nums ${TONE_CLASS[tone]}`}>{value}</div>
      {sub != null && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
      {subStats && subStats.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-2.5 gap-y-0.5 text-xs">
          {subStats.map((s) => (
            <span key={s.label} className={SUBSTAT_TONE[s.tone ?? 'muted']}>
              {s.label} {s.value}
            </span>
          ))}
        </div>
      )}
    </Wrapper>
  )
}
