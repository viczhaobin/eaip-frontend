import type { ReactNode } from 'react'

/**
 * 吸顶页头：包裹 PageHeader 与查询/筛选区，页面滚动时保持可见。
 * 依赖外层容器为 px-8 py-8（用负边距抵消并铺满背景）。
 */
export function StickyPageHead({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-0 z-20 -mx-8 -mt-8 bg-slate-50/95 px-8 pb-3 pt-4 backdrop-blur">
      {children}
    </div>
  )
}
