import type { MouseEvent } from 'react'
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink,
} from '@/components/ui/pagination'

interface PagerProps {
  /** 当前页（从 1 起） */
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  className?: string
}

/** 计算页码序列：总页数 ≤ 7 全显，否则首尾 + 当前页窗口，间隙用省略号（null 表示）。 */
function pageNumbers(current: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const window = new Set<number>([1, totalPages, current - 1, current, current + 1])
  const sorted = [...window].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  const out: (number | null)[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push(null)
    out.push(p)
    prev = p
  }
  return out
}

/** 通用分页条：左侧「共 N 条」，右侧 上一页 / 页码 / 下一页（基于 shadcn Pagination 封装）。 */
export function Pager({ page, pageSize, total, onPageChange, className }: PagerProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const go = (p: number) => (e: MouseEvent) => {
    e.preventDefault()
    if (p >= 1 && p <= totalPages && p !== page) onPageChange(p)
  }
  return (
    <div className={`flex items-center justify-between gap-4 ${className ?? ''}`}>
      <span className="text-xs text-slate-400">共 {total} 条</span>
      {totalPages > 1 && (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationLink
                href="#" size="default" aria-label="上一页"
                className={`gap-1 px-2.5 ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`}
                onClick={go(page - 1)}
              >
                上一页
              </PaginationLink>
            </PaginationItem>
            {pageNumbers(page, totalPages).map((p, i) => (
              <PaginationItem key={p ?? `e-${i}`}>
                {p === null ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink href="#" isActive={p === page} onClick={go(p)}>
                    {p}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationLink
                href="#" size="default" aria-label="下一页"
                className={`gap-1 px-2.5 ${page >= totalPages ? 'pointer-events-none opacity-40' : ''}`}
                onClick={go(page + 1)}
              >
                下一页
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
