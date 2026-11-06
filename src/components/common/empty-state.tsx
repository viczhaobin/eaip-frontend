import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  /** 主图标（48px / 40px 圈） */
  icon?: LucideIcon
  /** 一句话主标题（可包含 code/徽章 等富文本） */
  title: ReactNode
  /** 次级说明文本（可选） */
  description?: string | ReactNode
  /** 底部行动区（按钮 / 链接） */
  action?: ReactNode
  /** 容器边距，默认 py-16（与原各页一致） */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * 统一空态：替代散落在各页的 `flex flex-col items-center gap-3 rounded-xl border border-dashed…`。
 * 形态：虚线圆角白底 + 大图标 + 标题 + 描述 + 可选行动。
 */
export function EmptyState({ icon: Icon, title, description, action, size = 'lg' }: EmptyStateProps) {
  const pad = size === 'sm' ? 'py-10' : size === 'md' ? 'py-12' : 'py-16'
  const iconSize = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  return (
    <div className={`mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-8 ${pad} text-sm text-slate-500`}>
      {Icon && <Icon className={`${iconSize} text-slate-300`} />}
      <p>{title}</p>
      {description && <p className="text-xs text-slate-400">{description}</p>}
      {action && <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  )
}
