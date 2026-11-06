import type { ReactNode } from 'react'

interface PageHeaderProps {
  /** 页面标题；可传 ReactNode 以嵌套徽章等 */
  title: ReactNode
  /** 标题上方的返回链接等，吸顶时随标题一起固定 */
  leading?: ReactNode
  /** 副标题（一行说明） */
  description?: ReactNode
  /** 右侧操作区（按钮 / 搜索 / 状态徽章等） */
  actions?: ReactNode
  /** 右侧操作与标题的对齐。start 贴着标题，center 在标题和说明的中间 */
  align?: 'start' | 'center'
  /** 标题区与下方内容的间距，默认 mt-6；吸顶时建议 mt-4 */
  contentSpacing?: 'mt-0' | 'mt-2' | 'mt-4' | 'mt-6' | 'mt-8' | 'mt-10'
  /**
   * 吸顶：长表单页滚动时标题与右侧操作按钮始终可见。
   * 依赖页面容器为 px-8 py-8（用负边距抵消顶距并铺满背景），滚动容器为 AppLayout 的 main。
   */
  sticky?: boolean
}

/**
 * 统一页面顶部：左侧标题 + 副标题，右侧操作区。
 * 替代各页内 `<div className="flex items-center justify-between"><div><h1…/><p…/></div>…</div>`。
 */
export function PageHeader({
  title, leading, description, actions, align = 'center', contentSpacing = 'mt-4', sticky,
}: PageHeaderProps) {
  const bar = (
    <div className={`flex flex-wrap justify-between gap-y-2 ${align === 'start' ? 'items-start' : 'items-center'}`}>
      <div className="min-w-0">
        {leading && <div className="mb-2">{leading}</div>}
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )

  return (
    <>
      {sticky ? (
        // -mt-8 / pt-5：抵消页面 py-8 顶距，避免吸顶条上方再空出一截
        <div className="sticky top-0 z-20 -mx-8 -mt-8 border-b border-slate-200/80 bg-slate-50/95 px-8 pb-3 pt-5 backdrop-blur">
          {bar}
        </div>
      ) : (
        bar
      )}
      <div className={contentSpacing} />
    </>
  )
}
