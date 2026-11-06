import { Badge } from '@/components/ui/badge'

interface StatusMeta {
  label: string
  badge: string
}

/** 通用状态徽章：从 lib/status 的状态映射表取样式，颜色+文字同时呈现 */
export function StatusBadge({ meta, className }: { meta: StatusMeta; className?: string }) {
  return (
    <Badge variant="outline" className={`${meta.badge} ${className ?? ''}`}>
      {meta.label}
    </Badge>
  )
}

/** 质量码小圆点 + 文字 */
export function Dot({ className }: { className?: string }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${className ?? 'bg-slate-400'}`} />
}
